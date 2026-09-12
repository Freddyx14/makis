# Makis · Laboratorio de campañas

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
