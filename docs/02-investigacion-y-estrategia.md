# Etapa 2 — Investigación y estrategia

> **Entrada:** brief maestro aprobado (etapa 1) + aprendizajes previos (etapa 5)
> **Salida:** dossier de investigación + dos estrategias + análisis del rector
> **Herramientas:** Exa Search · Exa `/contents` · scraping propio · OpenAI API
>
> **Estado: decisiones cerradas.** Listo para codificar.

## 1. Qué resuelve esta etapa

El brief dice qué quiere el cliente y qué **no** sabemos de él (campo `huecos`).
Esta etapa sale a averiguarlo y convierte el resultado en un plan de acción.

Dos mitades bien separadas:

- **2A — Investigación:** recolectar hechos verificables con fuente.
- **2B — Estrategia:** tres agentes debaten sobre esos hechos y producen dos
  estrategias contrastadas más un análisis de arbitraje.

La separación es deliberada. La investigación se cachea y se reutiliza; el
debate se puede relanzar con distinto enfoque sin volver a pagar las búsquedas.

## 2. Proveedor LLM

**OpenAI API**, decidido en esta etapa y ya recogido como transversal en el
doc 00 §1. La interfaz `LLMProvider` se mantiene para no atar el código a un SDK
concreto.

Las claves se declaran **vacías** en `.env_example`; no se hardcodea ninguna.

```env
EXA_API_KEY=
OPENAI_API_KEY=
```

---

# Parte 2A — Investigación

## 3. Ejes de investigación

Alcance amplio, acordado. Cinco ejes:

| Eje | Fuente principal | Qué produce |
|---|---|---|
| Competidores | Exa Search + scraping de sus webs | 5-8 competidores con propuesta, tono, oferta |
| Precios | Scraping de páginas de pricing | Rangos detectados, modelo de cobro |
| Audiencia | Exa Search | Segmentos, dolores, dónde están |
| Canales | Exa Search | Qué canales funcionan en el sector |
| Tendencias | Exa Search con filtro de fecha | Señales recientes, estacionalidad |

**Cerrado — ventana de 6 meses** vía `startPublishedDate`.

Más corta de lo que propuse inicialmente. Favorece señales inmediatas sobre
contexto amplio, que es lo apropiado cuando el objetivo es lanzar una campaña
ahora y no escribir un informe de sector. Riesgo asumido: en sectores lentos
puede devolver poco material; si un eje queda vacío, se marca como hueco.

## 4. Cómo se identifican los competidores

Tres señales que se cruzan, en vez de fiarse de una:

1. **Búsqueda por categoría** — Exa con el sector y la propuesta del brief.
2. **Búsqueda por similitud** — `find_similar` sobre la URL del cliente. Es lo
   que mejor funciona en Exa para esto y es la señal más fuerte.
3. **Búsqueda por problema** — qué encuentra alguien que busca resolver el dolor
   que el cliente resuelve.

Se deduplica por dominio y se puntúa por número de señales que coinciden. Un
dominio que aparece en las tres es competidor directo; en una sola, probablemente
ruido.

**Cerrado — sí, filtro por mercado.** El campo país/idioma se añadió al
formulario de la etapa 1 (doc 00 §5).

Cuando está presente, se usa de dos formas: sesgando las consultas de búsqueda
hacia ese mercado y penalizando en la puntuación los dominios que claramente
operan en otro. Cuando está vacío, se juzga solo por similitud, como antes.

No se filtra de forma dura por TLD: un `.com` puede operar en España y un `.es`
puede ser irrelevante. La señal es orientativa, no eliminatoria.

## 5. Exa frente a scraping: quién hace qué

No compiten, se reparten el trabajo:

| Tarea | Herramienta | Por qué |
|---|---|---|
| Descubrir quién existe | Exa Search | Es búsqueda, no extracción |
| Leer contenido general de una web | Exa `/contents` | Ya parseado y limpio |
| Extraer precios de una página concreta | Scraping propio | Los precios viven en tablas y markup específico que el texto plano pierde |
| Detectar stack / pixels de tracking | Scraping propio | Requiere ver el HTML crudo |

Regla: **Exa para descubrir y leer; scraping para extraer estructura**. El
scraping solo se lanza contra URLs que Exa ya devolvió, nunca crawleando a ciegas.

**Cerrado — degradar sin fallar.** Si no se pueden extraer los precios de un
competidor, el dossier lo marca como `no_disponible` y los agentes de estrategia
lo tratan como **hueco, nunca como cero**.

La diferencia no es cosmética: un agente que lee "precio: 0" concluye que el
competidor es gratuito y construye una estrategia sobre una falsedad.

Los fallos de infraestructura (timeout, rate limit) sí se reintentan dos veces
antes de darse por perdidos, según el doc 00 §3.

## 6. Coste y latencia

El riesgo real de esta etapa es que tarde tres minutos delante de un cliente.

- Las búsquedas de los cinco ejes se lanzan **en paralelo**.
- El scraping de competidores va en paralelo con límite de concurrencia.
- Presupuesto de llamadas: **tope duro de 20 búsquedas Exa y 15 páginas
  scrapeadas** por campaña, configurable por entorno (doc 00 §7). Al alcanzarlo,
  la investigación se cierra con lo que tenga en lugar de seguir gastando.
- Todo el dossier se cachea por campaña; relanzar el debate no repite búsquedas.

**Supuesto:** `type="auto"` para la mayoría de búsquedas. Solo el eje de
tendencias justifica `deep`, que es donde la síntesis multi-fuente aporta.

## 7. El dossier de investigación

Salida de la parte 2A. Estructura persistida:

```
dossier
├── competidores[]     — nombre, url, propuesta, tono, oferta, precios, señales
├── precios            — rangos por segmento, modelo de cobro dominante
├── audiencia[]        — segmentos con dolores y dónde se informan
├── canales[]          — canal, evidencia de que funciona en el sector
├── tendencias[]       — señal, fecha, fuente
├── huecos_resueltos[] — qué preguntas del brief quedaron contestadas
└── fuentes[]          — toda URL usada, para trazabilidad
```

**Cada afirmación del dossier lleva su fuente.** Es lo que separa esta demo de
un chatbot que inventa competidores. Sin URL, el dato no entra.

---

# Parte 2B — Estrategia multiagente

## 8. Los tres agentes

| Agente | Rol | Sesgo deliberado |
|---|---|---|
| **Conservador** | Propone la estrategia de bajo riesgo | Canales probados, mensaje alineado con lo que ya funciona en el sector, presupuesto repartido para minimizar varianza |
| **Arriesgado** | Propone la estrategia de alto techo | Ángulos diferenciales, canales infrautilizados, apuesta concentrada, asume que el promedio del sector es el suelo a batir |
| **Rector** | Arbitra | No propone estrategia propia: critica ambas, detecta supuestos sin respaldo en el dossier y recomienda |

Los sesgos son **explícitos en el prompt**, no emergentes. Un agente al que se le
pide "sé creativo" produce lo mismo que uno al que no se le pide nada; uno al que
se le dice "concentra el 70% del presupuesto en un solo canal y justifícalo"
produce algo genuinamente distinto.

## 9. El debate en rondas

Acordado: debate con réplica. Tres rondas:

```
Ronda 1 — Propuesta
  Conservador y Arriesgado proponen en paralelo, sin verse.
  Ambos leen el mismo dossier.

Ronda 2 — Réplica
  Cada uno lee la propuesta del otro.
  Critica sus puntos débiles y refina la suya en respuesta.
  No puede copiar al otro: debe defender su enfoque o ceder explícitamente.

Ronda 3 — Arbitraje
  El Rector lee el dossier, ambas propuestas y ambas réplicas.
  Produce: crítica de cada una, supuestos sin respaldo, recomendación razonada.
```

Que la ronda 1 sea en paralelo importa: si el arriesgado viera antes la propuesta
conservadora, construiría "lo contrario" en lugar de su mejor idea. La réplica
llega después, cuando ya tiene una posición propia que defender.

**Cerrado — el rector siempre recomienda una de las dos.** No puede rechazar
ambas ni forzar una ronda extra. El número de rondas es fijo: tres, siempre.

Propuse lo contrario y se decidió en contra, con razón de peso: una ronda extra
sorpresa en mitad de una demo delante de un cliente es exactamente lo que no
quieres. La latencia deja de ser predecible justo cuando más importa que lo sea.

**Contrapartida asumida y cómo se mitiga.** Un árbitro obligado a elegir siempre
puede acabar respaldando una estrategia mala por no tener alternativa. Para que
eso no se disfrace de aprobación:

- El rector debe emitir un **veredicto de confianza** (`alta` / `media` / `baja`)
  junto a la recomendación. "Recomiendo la conservadora con confianza baja" es
  información honesta y accionable.
- Cuando la confianza es baja, la interfaz lo muestra de forma destacada y sugiere
  al usuario usar la **fusión** con instrucciones, que es la vía de escape.
- El rector siempre lista los supuestos sin respaldo, recomiende lo que recomiende.

Así el usuario conserva la señal de "ninguna de las dos convence" sin que el
sistema se salga del flujo previsible.

**Cerrado — una sola ronda de réplica.** Dos rondas casi doblan coste y latencia
para un retorno que no está demostrado. El parámetro queda configurable por si
más adelante se quiere experimentar.

## 10. Razonamiento compartido

Lo que ve cada agente, y lo que no:

- **Todos** ven el dossier íntegro y el brief maestro.
- **Todos** ven los aprendizajes de la etapa 5 de campañas anteriores, si existen.
- En ronda 2, cada proponente ve la propuesta del otro **pero no su propio
  razonamiento interno reformulado** — solo la propuesta estructurada.
- El rector ve absolutamente todo.

Cada intervención se persiste en `agent_runs` con su input y output. La demo
puede enseñar el debate completo a un cliente, que es probablemente lo más
vendible de todo el sistema.

## 11. Estructura de una estrategia

Ambos proponentes devuelven el mismo esquema, para que sean comparables:

```
estrategia
├── nombre            — etiqueta corta y memorable
├── tesis             — en una frase, por qué esto funciona
├── publico_objetivo  — segmento priorizado del dossier
├── posicionamiento   — ángulo frente a los competidores encontrados
├── mensaje_clave     — el argumento central
├── canales[]         — canal, % de presupuesto, justificación
├── kpis[]            — métrica, meta numérica, cómo se mide
├── riesgos[]         — qué puede salir mal
├── supuestos[]       — en qué se apoya que no está en el dossier
└── perfil_riesgo     — conservador | arriesgado
```

El campo `supuestos` es el que el rector audita. Una estrategia que se apoya en
cinco supuestos sin respaldo es peor que una con dos, aunque suene mejor.

El rector devuelve su propio esquema:

```
arbitraje
├── recomendacion      — cuál de las dos (obligatorio: siempre elige)
├── confianza          — alta | media | baja
├── justificacion      — por qué esa y no la otra
├── critica_conservadora — puntos débiles detectados
├── critica_arriesgada   — puntos débiles detectados
├── supuestos_sin_respaldo[] — por estrategia, qué no sostiene el dossier
└── sugerencia_fusion  — qué combinaría, si la confianza es media o baja
```

`confianza` es el campo que compensa la obligación de recomendar siempre.

Los **KPIs numéricos se fijan aquí**, como quedó acordado en la etapa 1: es ahora
cuando hay benchmarks del sector para ponerles número.

## 12. Presentación al usuario

Se muestran las dos estrategias en paralelo, comparables campo a campo, con el
análisis del rector debajo y el debate disponible desplegable.

El usuario puede:

1. **Elegir una** → pasa a la etapa 3.
2. **Editarla** → cualquier campo, igual que el brief.
3. **Pedir fusión** → acordado. El rector combina ambas siguiendo instrucciones
   del usuario ("la audiencia de la conservadora con los canales de la
   arriesgada"). Produce una tercera estrategia marcada como `fusionada`.

**Cerrado — la fusión se puede iterar hasta 3 veces**, versionada igual que el
brief. Cada iteración recibe instrucciones nuevas del usuario y produce una
versión más; no se sobrescribe la anterior.

El tope de 3 acota el coste y, en la práctica, si tres intentos de fusión no dan
con algo convincente, el problema está en el dossier o en el brief, no en la
fusión.

## 13. Superficie de API

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/campaigns/{id}/research` | Lanza la investigación (async) |
| `GET` | `/api/campaigns/{id}/research` | Devuelve el dossier |
| `POST` | `/api/campaigns/{id}/strategies` | Lanza el debate (async) |
| `GET` | `/api/campaigns/{id}/strategies` | Dos estrategias + arbitraje |
| `GET` | `/api/campaigns/{id}/debate` | Transcripción completa del debate |
| `POST` | `/api/campaigns/{id}/strategies/merge` | Fusión con instrucciones |
| `PATCH` | `/api/strategies/{id}` | Edición del usuario |
| `POST` | `/api/strategies/{id}/select` | Selecciona y habilita etapa 3 |

Ambos procesos son asíncronos vía la tabla `jobs` de la etapa 1. La investigación
puede tardar 1-3 min y el debate otro tanto; el progreso por eje y por ronda se
reporta para que la espera sea legible.

## 14. Datos

```
research
  id, campaign_id, dossier (JSON), fuentes (JSON),
  coste_busquedas, created_at

strategies
  id, campaign_id, contenido (JSON), perfil_riesgo,
  origen (propuesta|fusionada|editada), version,
  iteracion_fusion (0-3), instrucciones_fusion,
  seleccionada (bool), created_at

arbitrations
  id, campaign_id, recomendacion_strategy_id, confianza,
  contenido (JSON), created_at

debate_turns
  id, campaign_id, ronda, agente, input (JSON),
  output (JSON), modelo, tokens, duracion_ms
```

`debate_turns` es lo que permite reconstruir y mostrar el debate. Es tabla de
producto, no solo de auditoría.

## 15. Criterios de aceptación

1. Los competidores devueltos son competidores reales, no empresas del mismo
   sector sin relación.
2. Toda afirmación del dossier tiene URL de origen.
3. Una web que bloquea scraping degrada el dossier, no rompe la etapa.
4. Las dos estrategias son **genuinamente distintas** en canales y mensaje, no
   dos redacciones de lo mismo.
5. El rector detecta al menos un supuesto sin respaldo cuando lo hay.
6. El debate completo es reconstruible desde base de datos.
7. La fusión respeta las instrucciones del usuario.
8. Etapa completa por debajo del tope de llamadas acordado.

## 16. Riesgos

| Riesgo | Mitigación |
|---|---|
| Las dos estrategias salen casi idénticas | Sesgos explícitos y cuantificados en prompt; criterio de aceptación 4 lo verifica |
| El rector siempre prefiere la conservadora | Evaluar por supuestos sin respaldo, no por prudencia percibida |
| El rector respalda una mala estrategia por estar obligado a elegir | Campo `confianza`; confianza baja destaca en interfaz y empuja a la fusión |
| Coste y latencia se disparan | Topes duros, paralelismo, caché del dossier |
| Exa devuelve competidores irrelevantes | Cruce de tres señales con puntuación |
| Los agentes inventan datos de mercado | Solo pueden citar el dossier; lo demás va a `supuestos` |

## 17. Decisiones cerradas

| # | Pregunta | Resultado |
|---|---|---|
| 1 | ¿Ventana de tendencias? | **6 meses** |
| 2 | ¿Filtro geográfico? | **Sí**, campo mercado; orientativo, no eliminatorio |
| 3 | ¿Webs que bloquean scraping? | **Degradar** a `no_disponible`, tratado como hueco |
| 4 | ¿Topes por campaña? | **20 búsquedas / 15 páginas**, configurable |
| 5 | ¿Puede el rector rechazar ambas? | **No**, siempre recomienda + `confianza` |
| 6 | ¿Rondas de réplica? | **Una** (3 rondas totales, fijas) |
| 7 | ¿Iterar la fusión? | **Sí, hasta 3 veces**, versionada |

Heredadas del doc 00: proveedor OpenAI (§1), ejecución asíncrona (§2), reintentos
(§3), idioma según mercado (§4).

**No quedan decisiones abiertas. La etapa está lista para codificar.**
