# 00 — Arquitectura global

Documento transversal. Fija lo que comparten las cinco etapas para que cada
documento de etapa solo describa lo suyo.

## Alcance acordado

Demo **desplegable para mostrar a clientes**. Implicaciones que arrastramos a
todas las etapas:

- Varias personas pueden usarla a la vez → el estado no vive en memoria del proceso.
- Hay auth mínima (no es un producto multi-tenant, pero no está abierto a internet).
- Los secretos no viven en el repo ni en el frontend.
- No es producción: aceptamos SQLite, datos simulados en la etapa 5 y mocks de
  Google Ads / Meta en la etapa 4.

## Stack base

| Capa | Elección | Nota |
|---|---|---|
| API | FastAPI (Python) | Ya fijado en el diagrama |
| Frontend | HTML / CSS / JS servido por FastAPI | Sin framework; la demo no lo justifica |
| Persistencia | SQLite | Un archivo, respaldable, suficiente para la demo |
| Búsqueda web | Exa (`exa-py`) | Ya hay key en el proyecto |
| LLM | **Sin decidir** — ver abajo | Se decide en la etapa 3 |
| Imágenes | OpenAI Image API | Única opción del stack que genera imágenes |
| Email | Resend | Etapa 4 |
| Gráficas | Chart.js | Etapa 5 |

### Capa LLM agnóstica

Decisión tomada: **no atamos el código a un proveedor todavía**. Todas las
llamadas a modelo pasan por una interfaz propia (`LLMProvider`) con
implementaciones intercambiables. La elección real (OpenAI Agents SDK vs.
Anthropic vs. mixto) se cierra en el documento de la etapa 3, cuando sepamos qué
exige la generación de contenido.

Consecuencia para la etapa 1: el Director IA se programa contra esa interfaz,
no contra un SDK concreto.

## Flujo de datos entre etapas

Cada etapa consume el output de la anterior y escribe el suyo. La unidad que
recorre todo el sistema es la **campaña**.

```
Etapa 1 → brief maestro
Etapa 2 → brief + investigación → estrategia
Etapa 3 → estrategia → piezas de contenido
Etapa 4 → piezas aprobadas → ejecución
Etapa 5 → métricas → aprendizaje (realimenta la etapa 2)
```

El bucle de "aprendizaje continuo" del diagrama significa que la etapa 5 escribe
en una tabla que la etapa 2 lee en la siguiente iteración. **No** implica
reentrenamiento de modelos.

## Contrato entre agentes

**Supuesto:** cada agente recibe y devuelve JSON validado con Pydantic, y cada
transición de etapa se persiste. Ventajas para una demo: se puede reanudar,
inspeccionar y mostrar el estado intermedio a un cliente sin volver a pagar
llamadas al modelo.

Cada ejecución de agente registra: campaña, etapa, input, output, modelo usado,
tokens y duración. Esto alimenta la trazabilidad que un cliente querrá ver.

## Modelo de datos (esbozo)

Tablas que se irán detallando en cada etapa:

- `campaigns` — una fila por campaña; estado actual del flujo.
- `briefs` — output de la etapa 1.
- `research`, `strategy` — etapa 2.
- `content_pieces` — etapa 3, con estado de aprobación.
- `executions` — etapa 4.
- `metrics`, `learnings` — etapa 5.
- `agent_runs` — traza transversal de toda ejecución de agente.

## Decisiones abiertas (transversales)

1. **Proveedor LLM** — se cierra en la etapa 3.
2. **Dónde se despliega** — afecta a cómo se gestionan los secretos y si SQLite
   sobrevive a los reinicios. Necesita respuesta antes de la etapa 4.
3. **Qué pasa cuando un agente falla a mitad del flujo** — ¿se reintenta, se
   queda a medias, se avisa al usuario? Afecta al diseño de `campaigns.status`. En es te caso indicar mesnaje de error y sugerir nueeva ejecucion
4. **Idioma de los contenidos generados** — la interfaz es español; ¿los
   contenidos también, o depende de la campaña? ESPAÑOLO
