# Mark AI · Next.js campaign laboratory

The campaign laboratory now lives at `/laboratorio` in the existing Next.js app.
The teammate's `/nueva` and `/workspace/[id]` Supabase workflow remains separate
and unchanged. The laboratory keeps the existing private SQLite campaigns and
FastAPI API; this is a frontend migration, not a database migration.

## Start the Next.js laboratory (PowerShell)

Run from `makis`, in two terminals:

```powershell
# Terminal 1 — private laboratory API, single worker
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn webapp.app:app --host 127.0.0.1 --port 8000 --no-proxy-headers
```

```powershell
# Terminal 2 — shared Next.js frontend
npm.cmd ci
npm.cmd run dev -- --hostname 127.0.0.1
```

Open [the laboratory](http://127.0.0.1:3000/laboratorio). The example is fictional
and does not call any external API. Restart both servers after changing `.env`.
`LAB_API_URL` defaults to `http://127.0.0.1:8000` and is server-only. Never place
LLM, Exa, Meta, or service-role credentials in `NEXT_PUBLIC_*` variables.

## Current coverage and limits

Use **Cargar demo KFC completa** in `/laboratorio` to create a private, prefilled
scenario, or open `/nueva`, where the KFC mockup is preselected and the primary
button opens `/laboratorio?campaign=<id>` with that exact campaign. Unchecking
the mockup option preserves the original real Supabase workspace creation flow.
The mock inputs are read-only to avoid implying edits change the fixed fixture.
The laboratory URL parameter is checked by server-side campaign ownership.

The KFC button creates a private, prefilled
five-stage scenario. It invents all campaign inputs except the reference URL:
S/12,000, four weeks, Lima, a fictional offer and audience. Nine copy pieces,
three visual placeholders/prompts, a landing draft, three mock executions and
112 daily channel rows are loaded without network/API calls. Approval records
are simulated, not actual human approvals. The KFC site returned 403 during
reference lookup; no menu, price, benchmark or result is presented as verified.

- Stage 1: website/manual input, editable and versioned brief, explicit approval.
- Stage 2: cached five-axis research; parallel strategy proposals and replies,
  Rector arbitration, human selection/editing, up to three fusions per debate.
- Stage 3: channel-specific copy batches, bounded Editor/Director reviews,
  individual edits/regeneration and a structured landing **draft**.
- Stage 4: per-piece approval, immediate **mock** execution, idempotency, and
  a local mock scheduler checking every 60 seconds while FastAPI is running.
- Stage 5: deterministic daily funnel simulation, manual channel overrides,
  CPL/CAC/ROAS calculations, reports with data-origin warnings, new iterations.

The demo uses rules, not an LLM: regeneration and fusion do not semantically
apply instructions. Real structured generation requires the compatible LLM
configuration below; real research requires Exa. There are at most 20 reserved
search calls per campaign and no automatic search retries. Competitor discovery
with three signals, deduplication/scoring, price/pixel scraping, image generation,
public landing/lead capture, Resend sending, OAuth social publishing, detailed
piece-level analytics and Chart.js visualizations are **not implemented yet**.
Social/ad executions are always mocks; email execution is blocked, not faked.
`META_MCP_URL` and `META_ACCESS_TOKEN` are reserved placeholders, not an active
connector. A teammate's token alone is insufficient: we still need the MCP URL,
authentication contract, tools and permissions. No changes are pushed by setup.

Once research exists, its brief is immutable to prevent downstream stale results;
create another campaign to change the brief. Workflow writes require an expected
state version; old-tab edits return conflict rather than overwriting new results.
Use one Uvicorn worker and persistent `data/`. For remote use, configure the same
`DEMO_PASSWORD` in both servers, plus production API security described below.
The teammate's existing endpoints have their own access model; these laboratory
controls do not claim to secure or replace them.

## Verification

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
npx.cmd tsc --noEmit
# With both development servers running:
.\.venv\Scripts\python.exe tests/browser_lab.py
```

Do not run `next build` against the same `.next` directory while `next dev` is
running. See [the change record](docs/changes/2026-09-12-next-campaign-laboratory.md)
for verification and follow-ups.

---

## Legacy Python frontend and stage-1 configuration

The following section documents the retained legacy UI on port 8000. The new
five-stage Next.js laboratory is described above.

Web de la demo para explorar la etapa 1: entrada, contexto del negocio, Director,
brief maestro, revisión humana, versiones y aprobación. Las etapas 2–5 aparecen
en el mapa del proyecto y todavía no ejecutan agentes.

## Iniciar la web (PowerShell)

Desde la carpeta `makis`:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn webapp.app:app --host 127.0.0.1 --port 8000 --no-proxy-headers
```

Abre `http://127.0.0.1:8000`. No necesitas activar el entorno virtual.
El botón **Explorar con un ejemplo** recorre el flujo con un negocio ficticio y
sin consumir APIs. Para probar tu negocio, introduce URL, objetivo, presupuesto
total y duración; opcionalmente añade público y restricciones.

### Qué funciona

- Campañas independientes por sesión de navegador y datos persistidos en SQLite.
- Extracción de páginas del mismo dominio, con Exa si existe una clave válida y
  HTML como respaldo. Si no hay contexto, se solicita una descripción manual.
- Generación en segundo plano, progreso visible y recuperación explícita de errores.
- Brief validado con Pydantic: datos del usuario, afirmaciones web e hipótesis con
  confianza y fuentes; sin inventar metas numéricas de la etapa 2.
- Edición campo a campo, versiones inmutables de contenido, comparación antes/después,
  descarga JSON, aprobación de la versión actual y trazas de entrada/salida.
- Prevención de sobrescrituras desde pestañas que editan una versión antigua.

### Conectar el Director a un modelo

La clave Exa sirve para extraer información, **no para generar el brief con un LLM**.
El modo inicial `LLM_PROVIDER=demo` produce una plantilla por reglas, etiquetada
como simulación; no evalúa semánticamente tu negocio ni aplica instrucciones de
regeneración: las registra como pendientes. No se presenta como análisis de IA.

La interfaz `LLMProvider` permite otros adaptadores. Se incluye uno configurable
para servidores compatibles con Chat Completions y JSON mode:

```dotenv
LLM_PROVIDER=compatible
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=nombre-del-modelo-disponible-en-tu-proveedor
LLM_API_KEY=tu_clave_local
```

Añade estas variables a tu `.env` existente y reinicia. El modelo debe admitir
`response_format: {"type":"json_object"}`. No se selecciona ni se paga un modelo
automáticamente. Los errores de modelo se muestran como errores, sin sustituirlos
silenciosamente por una simulación. La respuesta se valida en el servidor.

El adaptador sigue el contrato documentado de
[Chat Completions](https://developers.openai.com/api/reference/resources/chat).
La extracción consulta [Exa Contents](https://exa.ai/docs/reference/get-contents)
con `maxAgeHours=24`; su disponibilidad se comprueba al ejecutar una extracción.

### Cobertura del sitio

La decisión «todas las páginas» se implementa como exploración de enlaces HTML
internos, no como una garantía de exhaustividad. Por defecto hay un máximo de
20 páginas y 90 segundos (configurables con `CRAWL_MAX_PAGES`, hasta 100, y
`CRAWL_MAX_SECONDS`, hasta 300). Una solicitud en curso puede superar ligeramente
el límite temporal. Fuentes muestra páginas leídas, URLs descubiertas y límites.
No ejecuta JavaScript, no lee PDFs ni descubre páginas huérfanas o todas las URLs
de un sitemap. Respeta las exclusiones de robots.txt, limita el tamaño de respuesta
y rechaza direcciones locales, privadas, puertos especiales y redirecciones a
otro dominio. El scraping fija la IP pública resuelta para evitar DNS rebinding.
Sitios que redirigen de `dominio.com` a `www.dominio.com` deben introducirse con
su URL canónica. El texto puede estar truncado a 10.000 caracteres por página.

### Acceso y despliegue de la demo

En desarrollo, sin contraseña, solo se acepta acceso local. Para compartir la demo
configura `APP_ENV=production`, una `DEMO_PASSWORD` fuerte y un `APP_SECRET`
aleatorio estable de al menos 32 caracteres, y sirve la aplicación detrás de HTTPS.
La contraseña es compartida, pero cada navegador tiene una sesión aislada; no hay
cuentas de usuario ni acceso cruzado a campañas. La sesión dura 7 días. Borrar sus
cookies impide recuperar esas campañas desde la interfaz.

Usa **un solo proceso de Uvicorn**, con almacenamiento persistente para `data/`.
Si se reinicia durante un trabajo, se marca como error y el usuario puede reintentar.
No es una cola distribuida ni un despliegue con múltiples workers. Para preservar
las campañas y sesiones locales, respalda `data/`, incluido `.session-secret`.
En producción usa `APP_SECRET` del gestor de secretos del alojamiento.

`DATABASE_PATH` permite cambiar la ubicación de SQLite. La carpeta `data/`,
`.env`, sus variantes y `.venv/` están excluidos de Git. `.env.example` es una
plantilla sin secretos. No expongas el directorio del repositorio como servidor
estático: la app solo sirve `webapp/static/`.

### Verificación

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -p test_*.py -v
```

Las pruebas no llaman a Exa ni al modelo; verifican edición, aprobación, recuperación
manual, versiones, sesiones concurrentes, conflictos, errores y bloqueo de redes privadas.
`tests/browser_smoke.py` comprueba el recorrido en Chromium y guarda capturas en
`.artifacts/`. Requiere `requirements-dev.txt`, `python -m playwright install chromium`
y un servidor de prueba separado en `127.0.0.1:8011`, con `DATABASE_PATH` apuntando a
una base de pruebas. Sus campañas son solo de prueba.

## CLI de búsqueda existente

Exa-powered product search for e-commerce research.

## Setup

```bash
python -m venv .venv && .venv/Scripts/activate   # Windows
pip install -r requirements.txt
cp .env_example .env                              # then add your key
```

Get an API key at https://dashboard.exa.ai.

## Usage

```bash
python main.py "best wireless earbuds with strong battery life"
python main.py --compare "budget mechanical keyboards under $100"
python main.py "running shoes" --include-domains nike.com adidas.com
```

As a library:

```python
from exa_shop import ProductSearch

client = ProductSearch()
for product in client.search("noise cancelling headphones", num_results=5):
    print(product.title, product.url)
```

## Layout

- `exa_shop/client.py` — `ProductSearch`: `search()` for raw hits with highlights,
  `compare()` for structured synthesis via `outputSchema`, `fetch()` for known URLs.
- `main.py` — CLI entry point.
