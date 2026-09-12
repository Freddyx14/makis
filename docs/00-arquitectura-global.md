# 00 — Arquitectura global

Documento transversal. Fija lo que comparten las cinco etapas para que cada
documento de etapa solo describa lo suyo.

**Estado: todas las decisiones transversales cerradas.**

## Alcance acordado

Demo **local para mostrar a clientes**, escrita para poder desplegarse sin
refactorizar. Implicaciones que arrastramos a todas las etapas:

- Varias personas pueden usarla a la vez → el estado no vive en memoria del proceso.
- El acceso está restringido, pero sin gestión de usuarios (ver §6).
- Los secretos no viven en el repo ni en el frontend.
- No es producción: aceptamos SQLite, datos simulados en la etapa 5 y mocks de
  Google Ads / Meta en la etapa 4.

## 1. Stack base

| Capa | Elección | Nota |
|---|---|---|
| API | FastAPI (Python) | Fijado en el diagrama |
| Frontend | HTML / CSS / JS servido por FastAPI | Sin framework; la demo no lo justifica |
| Persistencia | SQLite | Ruta configurable por entorno (ver §8) |
| Búsqueda web | Exa (`exa-py`) | Etapas 1 y 2 |
| LLM | **OpenAI API** (cerrado en etapa 2) | Detrás de la interfaz `LLMProvider` |
| Imágenes | OpenAI Image API | Etapa 3 |
| Email | Resend | Etapa 4 |
| Gráficas | Chart.js | Etapa 5 |

### Capa LLM

**Decisión cerrada:** el proveedor es **OpenAI**. Se mantiene la interfaz
`LLMProvider` para no atar el código a un SDK concreto, pero ya no esperamos a la
etapa 3 para decidir: la etapa 2 la fijó y las demás la heredan.

Todas las claves se declaran **vacías** en `.env_example`:

```env
EXA_API_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
```

## 2. Ejecución de procesos largos

**Decisión cerrada:** todo proceso que invoque modelos o búsquedas es
**asíncrono con tabla `jobs` y polling** desde el frontend.

Aplica desde la etapa 1, aunque allí el brief tarde menos: montar la
infraestructura una sola vez evita reescribir la etapa 1 cuando llegue la
investigación de la etapa 2.

```
jobs
  id, campaign_id, tipo, estado (pendiente|corriendo|ok|fallido),
  progreso (JSON), error, intentos, created_at, updated_at
```

El campo `progreso` permite reportar avance con granularidad (por eje de
investigación, por ronda de debate) para que la espera sea legible delante de un
cliente.

Descartado SSE/streaming: se ve mejor, pero complica despliegue y reconexión sin
aportar a la funcionalidad.

## 3. Manejo de fallos

**Decisión cerrada:** degradar + **reintento automático (2 intentos)**.

Dos comportamientos distintos según el tipo de fallo:

| Tipo de fallo | Comportamiento |
|---|---|
| Fuente de datos inaccesible (web bloquea scraping, Exa no devuelve nada) | **Degradar:** se marca el dato como "no disponible" y los agentes lo tratan como hueco, nunca como cero |
| Fallo de agente o de API (timeout, rate limit, error 5xx) | **Reintentar** hasta 2 veces con espera creciente; si persiste, el job queda `fallido` con el error visible y el usuario relanza esa etapa |

La distinción importa: un dato ausente es información legítima que los agentes
deben saber manejar; un error de infraestructura no lo es.

## 4. Idioma

**Decisión cerrada:** la **interfaz es bilingüe español / inglés**, con selector
para el usuario.

El **idioma de los contenidos generados** se deriva del campo de mercado objetivo
del brief (§5), no del idioma de la interfaz. Alguien puede usar la app en
español y generar una campaña en inglés para el mercado estadounidense.

Implicación: los textos de interfaz salen a un diccionario de traducciones desde
el principio. Retrofitear i18n después cuesta bastante más.

## 5. Mercado objetivo

**Decisión cerrada:** se añade un campo **país / idioma** al formulario de la
etapa 1 (opcional).

Tiene tres consumidores:

- **Etapa 2:** filtra competidores por mercado real, no por similitud global.
- **Etapas 3 y 4:** determina el idioma de los contenidos generados.
- **Etapa 5:** contextualiza benchmarks de CPL y CAC.

## 6. Acceso

**Decisión cerrada:** **enlaces con token por campaña**. No hay login ni tabla de
usuarios.

Cada campaña genera una URL con un token secreto que se comparte con el cliente.
Quien tiene el enlace ve esa campaña y solo esa.

| Ventaja | Coste |
|---|---|
| Cero gestión de usuarios | Quien filtre el enlace da acceso a la campaña |
| Cómodo para enseñar resultados a un cliente | No hay forma de revocar sin invalidar el enlace |
| Aísla campañas entre sí sin auth real | No sirve si algún día hace falta multi-tenant de verdad |

Requisitos mínimos: token largo y aleatorio (`secrets.token_urlsafe(32)`),
`noindex` en las páginas, y capacidad de revocar un token regenerándolo.

**Supuesto:** hay además una clave de administración por entorno para crear
campañas nuevas. Sin ella, cualquiera que llegue a la raíz podría crear campañas
y gastar tu presupuesto de API.

## 7. Presupuesto de coste por campaña

**Decisión cerrada:** tope duro de **20 búsquedas Exa y 15 páginas scrapeadas**
por campaña, configurable por entorno.

Se cuenta y se persiste por campaña. Al alcanzar el tope, la investigación se da
por cerrada con lo que tenga en lugar de seguir gastando.

## 8. Despliegue

**Decisión cerrada: solo local por ahora.** La demo se enseña desde la máquina de
desarrollo; no se despliega servidor.

Consecuencias que arrastran las etapas 4 y 5:

- **La publicación social real queda inactiva.** LinkedIn y X exigen callback
  OAuth sobre HTTPS público y app aprobada por la plataforma; `localhost` no vale.
  El código se escribe igualmente y se activa con una variable de entorno el día
  que haya despliegue (doc 04 §3).
- **El email sí funciona**: Resend envía desde sus servidores, solo necesita API
  key y dominio verificado.
- **El scheduler solo corre con la app levantada.** Para la demo en vivo existe
  "publicar ahora" (doc 04 §4).

Se mantiene la disciplina 12-factor para que desplegar más adelante no obligue a
refactorizar:

- Toda configuración por variable de entorno, sin valores hardcodeados.
- **Ruta de la base de datos configurable** (`DATABASE_PATH`) — es lo que permite
  mover SQLite a un volumen persistente sin tocar código.
- **Ruta de medios configurable** (`MEDIA_PATH`) — imágenes generadas en la
  etapa 3; mismo criterio.
- Sin dependencias del sistema de archivos local más allá de esa ruta.
- Puerto configurable, `host=0.0.0.0`.

Esta disciplina es la que hace que la decisión se pueda aplazar sin coste. Si se
rompe, elegir destino en la etapa 4 obliga a refactorizar.

## 9. Flujo de datos entre etapas

La unidad que recorre todo el sistema es la **campaña**.

```
Etapa 1 → brief maestro
Etapa 2 → brief + investigación → dos estrategias → una seleccionada
Etapa 3 → estrategia → piezas de contenido
Etapa 4 → piezas aprobadas → ejecución
Etapa 5 → métricas → aprendizaje (realimenta la etapa 2)
```

El bucle de "aprendizaje continuo" del diagrama significa que la etapa 5 escribe
en una tabla que la etapa 2 lee en la siguiente iteración. **No** implica
reentrenamiento de modelos.

## 10. Contrato entre agentes

Cada agente recibe y devuelve JSON validado con Pydantic, y cada transición de
etapa se persiste. Ventajas para una demo: se puede reanudar, inspeccionar y
mostrar el estado intermedio a un cliente sin volver a pagar llamadas al modelo.

Cada ejecución de agente registra: campaña, etapa, input, output, modelo usado,
tokens y duración.

## 11. Modelo de datos consolidado

```
campaigns       — una fila por campaña; estado del flujo; token de acceso
briefs          — etapa 1, versionado
jobs            — procesos asíncronos (§2)
research        — etapa 2, dossier con fuentes
strategies      — etapa 2, versionadas, una seleccionada
arbitrations    — etapa 2, veredicto del rector con nivel de confianza
debate_turns    — etapa 2, transcripción del debate multiagente
content_pieces  — etapa 3, con estado de aprobación
piece_revisions — etapa 3, historial Redactor/Editor/Director
media_assets    — etapa 3, imágenes generadas y su prompt visual
executions      — etapa 4, con clave de idempotencia y publisher usado
recipients      — etapa 4, destinatarios de email por campaña
leads           — etapa 4, capturados en la landing (dato real)
landings        — etapa 4, landing publicada en /l/{token}
metrics         — etapa 5, cada una con su origen (real|simulado|manual)
reports         — etapa 5, informe generado
learnings       — etapa 5, leída por la etapa 2 en iteraciones posteriores
experiments     — etapa 5, siguiente experimento propuesto
agent_runs      — traza transversal de toda ejecución de agente
```

## 12. Registro de decisiones cerradas

| # | Decisión | Resultado |
|---|---|---|
| Proveedor LLM | ¿OpenAI, Anthropic o mixto? | **OpenAI**, tras interfaz `LLMProvider` |
| Ejecución | ¿Síncrono o asíncrono? | **Asíncrono**, tabla `jobs` + polling |
| Fallos | ¿Cómo se recupera el flujo? | **Degradar** datos + **2 reintentos** en infraestructura |
| Idioma | ¿Qué idioma habla la app? | Interfaz **ES/EN**; contenido según mercado |
| Mercado | ¿Se acota geográficamente? | **Sí**, campo país/idioma en etapa 1 |
| Acceso | ¿Cómo se restringe? | **Token por campaña**, sin usuarios |
| Coste | ¿Cuánto gasta una campaña? | **20 búsquedas / 15 páginas** |
| Despliegue | ¿Dónde corre? | **Local**; código 12-factor para desplegar sin refactor |
| Ejecución externa | ¿Qué sale al mundo real? | **Email real**; social real tras despliegue; ads siempre mock |
| Métricas | ¿De dónde salen? | **Simulador determinista + entrada manual**; leads reales |
