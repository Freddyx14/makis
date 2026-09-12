# Etapa 3 — Contenido y creatividades

> **Entrada:** estrategia seleccionada (etapa 2) + brief maestro + dossier
> **Salida:** lote de piezas listas para aprobación
> **Herramientas:** OpenAI API · OpenAI Image API · plantillas HTML
>
> **Estado: decisiones cerradas.** Listo para codificar.

## 1. Qué resuelve esta etapa

La estrategia dice qué hacer. Esta etapa lo hace: convierte un plan en material
concreto que se puede publicar, enviar y anunciar.

Es la etapa con más superficie de todo el sistema —seis tipos de pieza, tres
agentes, generación de imágenes— y la que más fácilmente produce volumen sin
calidad. El diseño se centra en evitar exactamente eso.

## 2. Qué se genera

**Cerrado — los seis tipos del diagrama, con landing e imágenes bajo demanda.**

| Tipo | Cantidad | Cuándo |
|---|---|---|
| Posts sociales | 3-4 | Siempre |
| Emails | 2 | Siempre |
| Artículo SEO | 1 | Siempre |
| Variantes de anuncio | 3-4 | Siempre |
| Imágenes | 2-3 | **Bajo demanda** |
| Landing | 1 | **Bajo demanda** |

El lote base cubre lo que la etapa 4 ejecuta de verdad. La landing y las imágenes
son caras —la landing en código, las imágenes en dinero por llamada— y no toda
campaña las necesita. Generarlas solo cuando se piden abarata la campaña base sin
recortar el alcance del diagrama.

**Los canales de la estrategia mandan sobre estas cantidades.** Si la estrategia
seleccionada no incluye email, no se generan emails. El lote se deriva de
`estrategia.canales[]`, no de una lista fija. La tabla de arriba es el caso por
defecto cuando la estrategia los incluye todos.

## 3. Los tres agentes

**Cerrado — Redactor + Editor + Director de marca.**

| Agente | Ámbito | Responsabilidad |
|---|---|---|
| **Redactor** | Una pieza | Escribe la pieza según su tipo, la estrategia y el tono |
| **Editor** | Una pieza | Revisa contra estrategia, tono y requisitos del formato; devuelve o aprueba |
| **Director de marca** | El lote entero | Coherencia entre piezas: que no suenen a diez autores distintos |

La distinción entre Editor y Director es la razón de ser del tercer agente. El
Editor solo ve una pieza: puede aprobar diez piezas correctas que juntas no
tienen nada que ver entre sí. El Director ve el lote completo y detecta justo eso
—mensaje que deriva, tono que oscila, promesas que se contradicen entre el email
y el anuncio.

### Flujo por pieza

```
Redactor → Editor
             ├── aprueba → la pieza entra en el lote
             └── devuelve → Redactor reescribe (máx. 2 ciclos)
```

**Tope de 2 ciclos de revisión por pieza.** Si tras dos reescrituras el Editor
sigue sin aprobar, la pieza entra en el lote marcada como `revision_pendiente`
con los comentarios del Editor visibles. No se bloquea el flujo: el humano de la
etapa 4 decide.

### Pasada del Director

Ocurre **después** de que todas las piezas tengan el visto bueno del Editor:

```
Lote completo → Director de marca
                  ├── coherente → lote listo para etapa 4
                  └── incoherente → señala qué piezas y por qué
                                    → esas piezas vuelven al Redactor (1 ciclo)
```

El Director **no reescribe**. Diagnostica y devuelve. Un agente que arregla lo
que critica tiende a homogeneizarlo todo hacia su propia voz.

**Coste asumido:** en el peor caso una pieza pasa por Redactor 4 veces (1 inicial
+ 2 del Editor + 1 del Director). El caso típico es 1-2. Se controla con los
topes y se mide en `agent_runs`.

## 4. Generación en paralelo

Las piezas son independientes entre sí hasta la pasada del Director. Se generan
en paralelo con límite de concurrencia.

```
Fase 1 (paralelo)  → Redactor + Editor por cada pieza
Fase 2 (secuencial) → Director sobre el lote completo
Fase 3 (paralelo)  → reescrituras que pida el Director
```

Sin esto, un lote de diez piezas con dos agentes cada una serían veinte llamadas
en serie: varios minutos de espera. El progreso se reporta por pieza vía `jobs`
(doc 00 §2), de forma que el usuario ve el lote llenarse.

## 5. Imágenes

**Cerrado — un agente visual escribe el prompt.**

```
Pieza + estrategia + tono de marca
        ↓
   Agente visual  → prompt de imagen (estilo, composición, paleta, qué evitar)
        ↓
  OpenAI Image API → imagen
```

Un prompt construido por plantilla a partir del texto de la pieza produce
imágenes genéricas: el modelo recibe "post sobre zapatillas de running" y
devuelve un stock photo. El agente visual traduce además el posicionamiento y el
tono —qué debe transmitir, qué paleta, qué evitar— que es lo que hace que la
imagen parezca de esa marca y no de cualquiera.

**El prompt visual se persiste junto a la imagen.** Sirve para regenerar
variaciones sin volver a razonar, y para que el usuario entienda por qué salió lo
que salió.

**Decisiones de implementación:**

- Las imágenes se generan **solo bajo demanda**, por pieza o por lote.
- Se guardan en disco con ruta configurable (`MEDIA_PATH`), mismo criterio
  12-factor que la base de datos (doc 00 §8).
- Regenerar una imagen crea una versión nueva; no se sobrescribe.
- El texto dentro de imágenes generadas por IA sale mal con frecuencia. El
  agente visual tiene instrucción explícita de **no pedir texto en la imagen**;
  los titulares se superponen en la plantilla HTML, no se generan.

## 6. Landing

**Cerrado — bajo demanda, con plantillas HTML.**

No se genera HTML libre con el modelo. El agente rellena una **estructura
definida** que una plantilla convierte en página:

```
landing
├── hero          — titular, subtitular, CTA
├── propuesta     — 3 bloques de valor
├── prueba        — testimonios o señales de confianza (si el dossier los tiene)
├── objeciones    — 3-4 preguntas frecuentes
└── cierre        — CTA final
```

Razón: HTML generado libremente por un modelo es impredecible de mantener, rompe
en móvil y no respeta el sistema visual. Una plantilla con datos estructurados da
resultado consistente y editable.

**Decisión de implementación:** una sola plantilla base, responsive, con la
paleta derivada del tono del brief. No hay selector de plantillas en la demo.

## 7. Estructura de una pieza

Esquema común a todos los tipos, con un campo `contenido` que varía por tipo:

```
pieza
├── tipo              — post | email | seo | anuncio | imagen | landing
├── canal             — el canal de la estrategia al que sirve
├── contenido         — estructura propia del tipo (ver abajo)
├── justificacion     — por qué esta pieza sirve a la estrategia
├── estado            — borrador | revision_pendiente | lista | aprobada | descartada
├── comentarios_editor[] — qué pidió cambiar y si se aplicó
├── version           — se incrementa en cada reescritura
└── metricas_previstas — a qué KPI de la estrategia contribuye
```

Contenido por tipo:

| Tipo | Campos |
|---|---|
| Post | texto, hashtags, cta, formato sugerido |
| Email | asunto, preheader, cuerpo, cta |
| SEO | título, meta descripción, h2s, cuerpo, palabra clave objetivo |
| Anuncio | titular, descripción, cta, variante (A/B/C) |
| Imagen | prompt visual, ruta del archivo, pieza asociada |
| Landing | bloques estructurados (§6) |

El campo `justificacion` es el que conecta esta etapa con la anterior. Una pieza
que no puede justificar a qué parte de la estrategia sirve no debería existir.

## 8. Idioma

El contenido se genera en el idioma derivado del **mercado objetivo** del brief
(doc 00 §4), no en el idioma de la interfaz. Una campaña para el mercado
estadounidense genera en inglés aunque el usuario esté usando la app en español.

Si el campo mercado está vacío, se usa el idioma de la web del cliente detectado
en la etapa 1.

## 9. Superficie de API

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/campaigns/{id}/content` | Genera el lote base (async) |
| `GET` | `/api/campaigns/{id}/content` | Devuelve el lote con estados |
| `POST` | `/api/campaigns/{id}/content/landing` | Genera landing bajo demanda |
| `POST` | `/api/pieces/{id}/image` | Genera imagen para una pieza |
| `PATCH` | `/api/pieces/{id}` | Edición manual del usuario |
| `POST` | `/api/pieces/{id}/regenerate` | Reescribe con instrucciones |
| `DELETE` | `/api/pieces/{id}` | Descarta una pieza |
| `GET` | `/api/pieces/{id}/history` | Versiones y comentarios del editor |

`regenerate` acepta instrucciones del usuario, igual que el brief en la etapa 1 y
la fusión en la etapa 2. Es el mismo patrón en las tres etapas: nunca un botón de
reintentar a ciegas.

## 10. Datos

```
content_pieces
  id, campaign_id, strategy_id, tipo, canal,
  contenido (JSON), justificacion, estado, version,
  metricas_previstas (JSON), created_at

piece_revisions
  id, piece_id, version, agente (redactor|editor|director),
  comentarios (JSON), contenido_resultante (JSON), created_at

media_assets
  id, piece_id, campaign_id, prompt_visual,
  ruta_archivo, version, created_at
```

`piece_revisions` cumple aquí el papel que `debate_turns` en la etapa 2: permite
enseñar a un cliente cómo se llegó a la versión final. Es material de demo.

## 11. Criterios de aceptación

1. El lote generado respeta los canales de la estrategia seleccionada, no una
   lista fija.
2. Cada pieza puede justificar a qué parte de la estrategia sirve.
3. El Editor devuelve al menos una pieza cuando hay una que se desvía del tono.
4. El Director detecta incoherencias entre piezas que el Editor aprobó por
   separado.
5. Ninguna pieza queda bloqueada: tras los topes de ciclo entra marcada.
6. Las imágenes no contienen texto generado.
7. La landing renderiza correctamente en móvil.
8. El contenido sale en el idioma del mercado objetivo.
9. El historial de revisiones es reconstruible desde base de datos.

## 12. Riesgos

| Riesgo | Mitigación |
|---|---|
| Diez piezas que suenan a diez autores | Director de marca sobre el lote completo |
| Bucle infinito Redactor ↔ Editor | Tope de 2 ciclos; la pieza entra marcada |
| El Director homogeneiza todo hacia su voz | El Director diagnostica, no reescribe |
| Coste por campaña se dispara | Landing e imágenes bajo demanda; topes de ciclo; medición en `agent_runs` |
| Texto ilegible dentro de las imágenes | Instrucción explícita de no generar texto; titulares por plantilla |
| HTML de landing impredecible | Estructura de datos + plantilla fija, no HTML libre |
| Latencia alta con lotes grandes | Generación paralela con progreso por pieza |

## 13. Decisiones cerradas

| # | Pregunta | Resultado |
|---|---|---|
| 1 | ¿Qué tipos de pieza? | **Los 6**; landing e imágenes **bajo demanda** |
| 2 | ¿Lógica multiagente? | **Redactor + Editor + Director de marca** |
| 3 | ¿Cómo se generan las imágenes? | **Agente visual** escribe el prompt |
| 4 | ¿Cuántos ciclos de revisión? | **2** con el Editor, **1** con el Director |
| 5 | ¿El Director reescribe? | **No**, solo diagnostica |
| 6 | ¿HTML libre en la landing? | **No**, estructura + plantilla fija |
| 7 | ¿Cantidades fijas por tipo? | **No**, se derivan de los canales de la estrategia |

Heredadas del doc 00: proveedor OpenAI (§1), ejecución asíncrona (§2), reintentos
(§3), idioma según mercado (§4), rutas configurables (§8).

**No quedan decisiones abiertas. La etapa está lista para codificar.**
