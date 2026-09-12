# Makis OS — el equipo de marketing que vive en tu Google Workspace

> **Hackathon 2026:** *"Agents, Everywhere"* (AI Tinkerers)
> **Equipo:** Maki Acevichado (Joel Espinoza · Diego Celis · Miluska R. · Freddy Ñañez)

**Pegas la URL de tu negocio. Makis investiga, construye la campaña y te deja la
carpeta montada en tu Drive. Tú solo gobiernas.**

---

## 📌 Empieza por aquí

| Documento | Para qué |
|---|---|
| **[`DECISIONS.md`](./DECISIONS.md)** | **Léelo primero.** Fuente de verdad. Resuelve las contradicciones que había entre PRD, README y TECH_GUIDE. |
| [`PRD.md`](./PRD.md) | Especificación de producto. Su §3.3 está **superado** por `DECISIONS.md` §2. |
| [`HACKATHON_RUBRIC.md`](./HACKATHON_RUBRIC.md) | Rúbrica del jurado. Su pitch de "Chief of Staff" está **descartado**. |
| [`TECH_GUIDE.md`](./TECH_GUIDE.md) | Snippets de CopilotKit y MCP. Siguen siendo válidos. |

---

## 🎬 Los 4 actos

```
ENTRADA        URL + objetivo + presupuesto          → brief
  ↓
1. INVESTIGAR  Exa: competidores, mercado, audiencia → hallazgos CON FUENTES
  ↓
2. CONSTRUIR   estrategia, plan, copies, creatividades → artefactos
  ↓
3. GOBERNAR    aprobar / editar / rechazar           → ejecución
  ↓
4. APRENDER    métricas → aprendizaje                → realimenta INVESTIGAR
```

**La jugada que gana el criterio 2 de la rúbrica:** los entregables no son archivos
markdown en disco — son **Google Docs y Sheets reales en el Drive del usuario**.
Escribir markdown lo hace cualquier chatbot; montarte la carpeta de campaña en tu
Drive, no.

---

## 🧱 Stack

**Una sola app Next.js. Un lenguaje, un proceso, un `npm run dev`.**

| Capa | Elección |
|---|---|
| App y API | Next.js 15 (App Router) + React 19 + TypeScript `strict` |
| Estilos | Tailwind v4 con los tokens de marca del prototipo |
| Agente embebido | CopilotKit (`useCopilotReadable` / `useCopilotAction`) |
| Investigación | Exa (`deep` + `category:company` + `getContents`) |
| LLM | OpenAI (`@openai/agents`) |
| Google Workspace | Drive · Docs · Sheets con el `provider_token` de Supabase Auth |
| Persistencia | **Supabase (Postgres)** |
| Progreso en vivo | **Supabase Realtime** (sustituye al SSE) |
| Email | Resend |
| Gráficas | Chart.js |
| Despliegue | **GCP Cloud Run** — contenedor con proceso persistente |

> **Por qué Cloud Run y no Vercel:** el pipeline de agentes dura minutos y las
> funciones serverless mueren a los 60 segundos. Se cortaría en el escenario.

> El código Python que hubo en el repo (`exa_shop/`, `main.py`) era un *spike* y
> fue eliminado. El patrón bueno que tenía — `type:"deep"` + `outputSchema` +
> citas de `output.grounding` — sobrevive en [`lib/exa.ts`](./lib/exa.ts).

### Estructura

```
makis/
├── app/
│   ├── page.tsx                    landing
│   ├── nueva/                      ENTRADA · pegas la URL
│   ├── workspace/[id]/             COCKPIT · los 4 actos en vivo
│   └── api/
│       ├── copilotkit/             runtime de CopilotKit
│       └── workspaces/             crear · estado · stream SSE
├── lib/
│   ├── types.ts        ← CONTRATO ÚNICO. Si lo cambias, avisa al equipo.
│   ├── supabase.ts     clientes admin/browser + scopes de Google
│   ├── db.ts           persistencia (único archivo que toca la BD)
│   ├── exa.ts          investigación con fuentes
│   ├── llm.ts          OpenAI
│   ├── google/         Drive · Docs · Sheets
│   └── agents/         director · researcher · strategist · creator · analyst
├── components/         StepCard, cockpit, aprobación
└── supabase/schema.sql ← pégalo en el SQL Editor de Supabase
```

---

## 🚀 Ejecución local

```bash
git clone https://github.com/Freddyx14/makis.git
cd makis

npm install
cp .env.example .env.local
npm run dev                  # http://localhost:3000
```

### Configurar Supabase (una vez, 10 min)

1. Crea un proyecto en [supabase.com/dashboard](https://supabase.com/dashboard).
   Región recomendada: **South America (São Paulo)**.
2. **SQL Editor** → pega `supabase/schema.sql` completo → **Run**.
   Crea tablas, activa Realtime y aplica RLS.
3. **Settings → API** → copia a `.env.local`:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. **Authentication → Providers → Google** → activar, pegar el OAuth Client de GCP
   y añadir los scopes de `lib/supabase.ts` (`drive.file`, `documents`, `spreadsheets`).

```bash
npm run typecheck   # el contrato compila
```

---

## 👥 Quién hace qué

| Miembro | Responsabilidad | Archivos |
|---|---|---|
| **Joel Espinoza** | Orquestación, persistencia, analítica y bucle de aprendizaje | `lib/db.ts`, `lib/agents/analyst.ts`, acto 4 |
| **Diego Celis** | Lectura de URL, Exa e investigación estructurada | `lib/exa.ts`, `lib/agents/{director,researcher}.ts` |
| **Miluska R.** | Cockpit, CopilotKit, revisión humana y Resend | `app/workspace/`, `components/`, acto 3 |
| **Freddy Ñañez** | Estrategia, creatividades, Google Workspace, demo y pitch | `lib/agents/{strategist,creator}.ts`, `lib/google/` |

**Regla de coordinación:** `lib/types.ts` es el contrato compartido. Cambiarlo sin
avisar rompe el trabajo de los otros tres.

---

## ⚖️ Qué es real y qué es simulado

La rúbrica penaliza con 1 punto lo *"principalmente conceptual o simulado"*.
Por eso todo lo simulado se **etiqueta visiblemente** en la UI con `<ModeBadge />`.

| Componente | Estado |
|---|---|
| Lectura del sitio · investigación · estrategia · copies | **Real** |
| Google Docs / Sheets en Drive | **Real** |
| Envío de email (Resend) | **Real** |
| Google Ads / Meta | **Mock etiquetado** |
| Métricas del acto 4 | **Dataset simulado, etiquetado** |

Un mock etiquetado es honestidad. Un mock disfrazado es lo que los jueces castigan.

---

## 🔑 Regla de oro

**Ninguna afirmación sin fuente.** Todo `Finding` lleva su `Source[]`, y la UI
muestra el recuento de fuentes en cada tarjeta. Viene de la promesa del prototipo:
*"analiza mercado, competidores, tendencias y audiencia con fuentes visibles"*.

Un finding sin evidencia es un bug, no un resultado. Es también lo que separa a
Makis de pegarle una URL a ChatGPT.
