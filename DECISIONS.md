# Decisiones cerradas — Makis OS

> **Estado:** cerrado. 48h para la demo. Si un documento del repo contradice esto, gana este archivo.
> Fecha de cierre: 12/09/2026.

---

## 1. Contradicciones que existían en el repo

El repo describía **dos productos distintos** y **tres stacks distintos**. Resueltas así:

| Conflicto | Dónde estaba | Decisión |
|---|---|---|
| Marketing GTM vs. Back-Office Chief of Staff | `PRD.md` vs `HACKATHON_RUBRIC.md` §4-5 + `TECH_GUIDE.md` | **Gana Marketing GTM.** El Chief of Staff, el runway y la factura vencida quedan fuera del pitch y del código. |
| `npm run dev` vs FastAPI vs React+CopilotKit | `README.md:49` vs `PRD.md` §6 vs `TECH_GUIDE.md` | **Monorepo híbrido**: FastAPI + Next.js. Ver §3. |
| "HTML/CSS/JS **sin framework**" | `docs/00-arquitectura-global.md:22` | **ANULADO.** CopilotKit requiere React. Esa línea eliminaba el premio de partner sin que nadie lo notara. |
| Entregables en `workspace/<empresa>/*.md` local | `PRD.md` §3.3 | **Cambiado a Google Docs reales en Drive.** Ver §2. |
| Proveedor LLM "sin decidir" | `docs/00:25` | **OpenAI** (los premios son créditos OpenAI y el PRD ya asume Agents SDK), detrás de `LLMProvider`. |
| PRD v4.0.0 vs v5.0.0 | `README.md:7` vs `PRD.md:4` | La fuente de verdad es este archivo + `PRD.md` v5. |

---

## 2. La decisión que más puntos vale

El criterio 2 de la rúbrica da 5/5 solo si *"el valor central NO podría reproducirse en un chatbox"*.

Escribir markdown en `workspace/<empresa>/*.md` **sí** se puede hacer en un chatbox. ChatGPT
también escribe markdown. Era la decisión más débil del PRD.

**Los seis artefactos se crean como Google Docs reales en el Drive del usuario.**

| Antes | Ahora |
|---|---|
| `00-brief.md` | Google Doc `00 · Brief` en `Drive/Makis/<empresa>/` |
| `01-investigacion.md` | Google Doc `01 · Investigación` |
| `02-estrategia.md` | Google Doc `02 · Estrategia` |
| `03-plan-de-contenido.md` | Google **Sheet** `03 · Calendario` |
| `04-creatividades.md` | Google Doc `04 · Creatividades` |
| `05-resultados.md` | Google Doc `05 · Resultados` |

Ganancia por criterio de la rúbrica:

- **Criterio 2** — el entorno es Google Workspace, donde el trabajo ya ocurre. No reproducible en chat.
- **Criterio 3** — MCP de Drive/Docs deja de ser decorativo y pasa a ser el núcleo.
- **Criterio 4** — el usuario abre su Drive y la carpeta de campaña está montada. Valor tangible.

**Frase del pitch:** *"Makis no te devuelve texto. Te deja la carpeta de campaña montada en tu Drive."*

---

## 3. Stack

**Una sola app Next.js. Un lenguaje, un proceso, un `npm run dev`.**

```
makis/
├── app/          rutas, API y cockpit
├── lib/          types · db · exa · llm · google · agents
└── components/   UI
```

**Por qué todo TypeScript y no un híbrido con Python:**

1. **CopilotKit es React.** El frontend es TypeScript de todas formas; añadir Python es sumar, no repartir.
2. **El SDK de MCP es TypeScript nativo** — `TECH_GUIDE.md` ya lo usa así.
3. **Un solo contrato.** Con dos lenguajes, cada cambio de campo son dos ediciones y un bug esperando.
4. **`README.md:49` ya decía `npm run dev`.** El README tenía razón; el PRD y `docs/00` eran los desalineados.

> El código Python que hubo en el repo (`exa_shop/`, `main.py`) era un *spike* desechable y
> fue eliminado. El patrón bueno que tenía — `type:"deep"` + `outputSchema` + citas desde
> `output.grounding` — sobrevive en `lib/exa.ts`.
>
> El SDK de agentes de OpenAI que pide el PRD existe en JS (`@openai/agents`): no se pierde nada.

### 3.1 Persistencia y despliegue (revisado)

**La demo se presenta en una URL pública.** Eso invalida SQLite y obliga a tres decisiones:

| Decisión | Motivo |
|---|---|
| **Supabase (Postgres)** en vez de SQLite | Un sistema de archivos efímero pierde los datos en cada deploy. Mismo error que ya estaba en el diagrama del PRD. |
| **Supabase Realtime** en vez de SSE | Sobrevive a un refresco del navegador y permite que **varios jueces vean la misma ejecución a la vez**. Menos código que el SSE. |
| **Railway o Cloud Run**, NO Vercel | El pipeline dura minutos; las funciones serverless mueren a los 60s y el agente se cortaría en el escenario. Hace falta un proceso persistente (`output: "standalone"`). |

**Bonus:** Supabase Auth trae Google OAuth integrado y entrega el `provider_token`
con los scopes pedidos. **Login y acceso a Drive/Docs/Sheets pasan a ser la misma pieza.**
Era la parte más arriesgada del proyecto.

Scopes en `lib/supabase.ts`. Se usa `drive.file` (solo los archivos que crea la app),
no acceso a todo el Drive: menos permisos, aprobación más rápida, y es lo correcto.

| Capa | Elección | Archivos | Responsable |
|---|---|---|---|
| App y API | Next.js 15 + React 19 + TS `strict` | `app/` | todos |
| Persistencia | **Supabase (Postgres)** | `lib/db.ts` | Joel |
| Progreso en vivo | **Supabase Realtime** | `lib/supabase.ts` | Joel |
| Búsqueda e investigación | Exa (`exa-js`) | `lib/exa.ts` | Diego |
| LLM | OpenAI (`@openai/agents`) | `lib/llm.ts` | Joel |
| Cockpit y aprobación | Tailwind v4 + tokens del prototipo | `components/` | Milu |
| Agente embebido | CopilotKit (`useCopilotReadable` / `useCopilotAction`) | `app/api/copilotkit/` | Milu |
| **Google Workspace** | Drive · Docs · Sheets vía `provider_token` de Supabase | `lib/google/` | Milu, Freddy |
| Email | Resend | `lib/resend.ts` | Milu |
| Gráficas | Chart.js | acto 4 | Joel |
| **Despliegue** | **GCP Cloud Run** (contenedor, sin límite de 60s) | `Dockerfile` | Freddy |

**Regla de coordinación:** `lib/types.ts` es el contrato compartido. Cambiarlo sin avisar
rompe el trabajo de los otros tres.

---

## 4. Los 4 actos (nomenclatura oficial)

Sustituye a las "5 fases" del README y del PRD. Es la estructura del producto, del código y del pitch.

```
ENTRADA        URL + objetivo + presupuesto        → brief
  ↓
1. INVESTIGAR  Exa: competidores, mercado, audiencia → findings con fuentes
  ↓
2. CONSTRUIR   estrategia, plan, copies, creatividades → artefactos
  ↓
3. GOBERNAR    aprobar / editar / rechazar → ejecución
  ↓
4. APRENDER    métricas → aprendizaje → realimenta INVESTIGAR
```

---

## 5. Qué es mock y qué es real (importante para el criterio 3)

La rúbrica penaliza con 1 punto lo *"principalmente conceptual o simulado"*. Por tanto:

| Componente | Estado en la demo |
|---|---|
| Lectura de la URL del negocio | **Real** (Exa Contents) |
| Investigación de competidores | **Real** (Exa `deep` + `category:company`) |
| Estrategia y copies | **Real** (LLM) |
| Creación de Google Docs / Sheets | **Real** (Drive API) |
| Envío de email | **Real** (Resend) |
| Google Ads / Meta | **Mock explícito**, etiquetado como tal en la UI |
| Métricas del acto 4 | **Dataset simulado**, etiquetado como tal |

**Regla:** nada se presenta como real si no lo es. Un mock etiquetado es honestidad;
un mock disfrazado es lo que los jueces castigan.

**Seed determinista:** existe `apps/api/seed.py` como red de seguridad si falla la red en
el escenario. Es un *fallback*, no el camino principal.

---

## 6. Regla de oro heredada del prototipo

**Ninguna afirmación sin fuente.** Todo `Finding` lleva su `Source[]`. Viene de la promesa
del prototipo: *"Analiza mercado, competidores, tendencias y audiencia con fuentes visibles"*.
Un finding sin evidencia es un bug, no un resultado.
