# Makis - Product Requirements Document
## Sistema operativo agéntico para el back-office del fundador

> **Versión:** 6.1.0 · **Hackathon:** Agents, Everywhere (AI Tinkerers 2026)
> **Equipo:** Maki Acevichado (Joel Espinoza · Diego Celis · Miluska R. · Freddy Ñañez)  
> **Stack:** FastAPI · OpenAI Agents SDK · Google Workspace MCP · Exa Search · Resend · SQLite · Chart.js

---

## 1. La idea

**Makis es el Chief of Staff operativo del fundador.** En lugar de pedirle que persiga correos, contratos, reuniones, cobros, pendientes y documentos dispersos, Makis reúne el contexto de la empresa y le presenta qué necesita una decisión.

El fundador comienza pegando la URL de su empresa. Makis entiende el negocio, construye su workspace y, cuando se conecta a Google Workspace, cruza Gmail, Calendar, Drive y Sheets para convertir señales dispersas en una cola de acciones gobernable.

No reemplaza al fundador ni ejecuta decisiones sensibles por su cuenta. Prepara contexto, propone acciones y conserva una trazabilidad legible de lo que se aprobó.

**Markdown conserva la fuente de verdad; la UI convierte esa verdad en una superficie clara para operar.**

## 2. Problema que resuelve

El back-office de una empresa pequeña suele vivir en fragmentos:

- Gmail contiene solicitudes, cobros y compromisos.
- Calendar contiene reuniones, pero no siempre la preparación ni el seguimiento.
- Drive contiene contratos, propuestas y entregables difíciles de encontrar.
- Sheets contiene ventas, caja o métricas sin una lectura operativa.
- La cabeza del fundador sostiene prioridades que no están en ningún sistema.

El resultado no es falta de información. Es falta de una vista que conecte la información con la siguiente decisión.

Makis reduce el problema a tres primitivas:

1. La empresa ya produce evidencia en su web y herramientas de trabajo.
2. Los agentes pueden convertir esa evidencia en estado operativo estructurado.
3. El fundador debe conservar la revisión y aprobación de cada acción relevante.

No es un chatbox. Es un cockpit contextual que vive junto al trabajo de la empresa.

## 3. Flujo principal: URL a cockpit operativo

~~~mermaid
flowchart LR
    A["1. Pega la URL"] --> B["2. Makis entiende el negocio"]
    B --> C["3. Crea el workspace base"]
    C --> D["4. Conecta contexto de Workspace"]
    D --> E["5. Prioriza señales y propone acciones"]
    E --> F["6. Fundador revisa, edita y aprueba"]
    F --> G["7. Registra resultado y aprende"]
    G -. aprendizaje .-> E
~~~

### 3.1 URL primero

La pantalla inicial tiene un campo dominante: **“Pega el sitio de tu empresa”**. La URL permite crear el perfil inicial sin un formulario largo:

- nombre, oferta y categoría;
- equipo, clientes o mercados visibles;
- tono, activos y llamados a la acción;
- hipótesis iniciales sobre la operación.

El fundador solo confirma o corrige lo que Makis entendió. Después puede conectar fuentes de trabajo autorizadas, empezando por Google Workspace.

### 3.2 Contexto conectado

Makis usa conectores MCP de Google Workspace para leer el contexto necesario:

| Fuente | Señales que Makis organiza | Acción propuesta |
|---|---|---|
| Gmail | correos sin respuesta, facturas vencidas, promesas hechas | preparar borrador o seguimiento |
| Calendar | reuniones próximas, espacios sin preparación, compromisos | preparar agenda o reservar bloque |
| Drive | contratos, propuestas, documentos pendientes | resumir, ubicar o crear estructura |
| Sheets | caja, ventas, pipeline y métricas | señalar cambio, riesgo o decisión |

Las acciones con impacto externo, como enviar un correo o crear un evento, requieren aprobación explícita del fundador.

### 3.3 Workspace autoconfigurado

Makis crea documentos legibles, versionables y auditables:

~~~
workspace/<empresa>/
├── account.md                  # estado actual, dueño, bloqueos y próximo hito
├── operations/                 # pulso, reuniones, tareas y procedimientos
├── clients/<slug>/account.md   # cada cliente, acuerdo y siguiente paso
├── finance/                    # caja, cobros, vencimientos y supuestos
├── documents/                  # contratos, propuestas y archivos clave
├── decisions.md                # decisiones abiertas y cerradas con su razón
├── activity.jsonl              # eventos y cambios cronológicos
└── learnings.md                # patrones para la próxima iteración
~~~

SQLite indexa artefactos, versiones, fuentes, aprobaciones y eventos. No reemplaza los documentos: permite que Makis recupere el contexto correcto y explique de dónde salió cada recomendación.

### 3.4 Patrones operativos que Makis adopta

El producto toma inspiración de una operación documental madura, pero la simplifica para un fundador:

| Patrón | Contrato de Makis | Beneficio |
|---|---|---|
| Un solo hogar canónico | Cada cliente, documento, decisión y métrica tiene una ubicación fuente | Evita copias que divergen |
| Account por entidad | La empresa y cada cliente tienen un account.md con estado actual, responsable, bloqueos y próximo hito | El cockpit puede responder “qué pasa ahora” |
| Decisiones separadas de tareas | decisions.md conserva la pregunta, dueño, opciones, impacto, decisión y razón | No se confunde una decisión pendiente con una tarea |
| Historial de actividad | activity.jsonl registra cambios, aprobaciones y ejecuciones | Se puede explicar qué cambió y cuándo |
| Skills con contrato | Cada skill declara entradas, salidas, permisos y verificación | El agente ejecuta un flujo repetible, no una improvisación |

Una vista puede agrupar información de varios lugares, pero nunca duplica ni se vuelve fuente de verdad. Si un fundador necesita ver el cliente, su contrato y el cobro juntos, Makis muestra una vista derivada con enlaces a los originales.

### 3.5 Documentación que se ve como producto

La experiencia principal no es un explorador de archivos. Makis renderiza cada documento según su propósito:

| Documento fuente | Vista de la UI | Acción humana |
|---|---|---|
| Perfil | Ficha de empresa y contexto confirmado | corregir supuestos |
| Accounts | Estado de la empresa, cliente o proyecto | actualizar hito, dueño o bloqueo |
| Pulso semanal | Panel de prioridades, riesgos y oportunidades | ordenar la semana |
| Clientes y compromisos | Cola de seguimientos y responsables | aprobar seguimiento |
| Caja y cobros | Tarjetas de vencimientos y movimiento | aprobar recordatorio |
| Reuniones | Agenda con preparación y próximos pasos | preparar o bloquear tiempo |
| Documentos clave | Buscador con resumen y vínculos | abrir, compartir o crear |
| Decisiones | Registro de decisión, motivo y resultado | confirmar criterio |
| Actividad | Línea de tiempo de cambios y ejecuciones | auditar o revertir una acción |

Un cambio aprobado desde la UI actualiza el Markdown y deja una nueva versión. No existen dos fuentes de verdad.

## 4. Arquitectura funcional en cinco fases

### Fase 1. Perfil de empresa

**Entrada:** URL y una confirmación breve del fundador.  
**Agente:** Director.  
**Salida:** perfil de empresa con el contexto inicial.

### Fase 2. Ingesta de back-office

**Entrada:** fuentes conectadas y permisos aprobados.  
**Agentes:** conectores y extractor.  
**Salida:** señales estructuradas de Gmail, Calendar, Drive y Sheets con referencia a la fuente.

### Fase 3. Pulso y prioridades

**Entrada:** perfil más señales actuales.  
**Agente:** Chief of Staff.  
**Salida:** pulso semanal, riesgos, compromisos, cobros y una cola priorizada de acciones.

### Fase 4. Revisión y ejecución humana

**Entrada:** acciones propuestas.  
**Experiencia:** contexto, borrador, impacto y controles Aprobar / Editar / Rechazar.  
**Salida:** acción aprobada, por ejemplo un borrador de correo, una estructura de Drive o un bloque de Calendar.

### Fase 5. Resultado y aprendizaje

**Entrada:** resultado de una acción, feedback del fundador o datos operativos.  
**Agente:** analista.  
**Salida:** decisión registrada, regla o aprendizaje que mejora la priorización siguiente.

## 5. Experiencia de interfaz

La experiencia tiene tres momentos:

1. **Onboarding desde URL:** perfil rápido de empresa y conexión opcional de fuentes.
2. **Founder cockpit:** cinco indicadores operativos: caja, clientes, operaciones, calendario y documentos. Una sola cola de prioridades evita que el fundador salte entre pestañas.
3. **Panel de acción:** cada propuesta muestra evidencia, borrador, impacto y control humano.

CopilotKit puede ofrecer una capa conversacional contextual dentro del cockpit, pero no es el producto. El valor principal está en que Makis ve el estado real de la empresa y lleva al fundador a la decisión que requiere su atención.

### 5.1 Biblioteca de skills operativas

Makis presenta sus capacidades como skills visibles y acotadas. Una skill no es un agente misterioso: expone qué lee, qué propone, qué puede ejecutar y qué aprobación necesita.

Ejemplos para el demo:

| Skill | Lee | Propone | Requiere aprobación |
|---|---|---|---|
| Pulso del fundador | accounts, Calendar, Gmail y caja | tres prioridades de la semana | no, si solo lee |
| Cobro pendiente | factura, acuerdo y conversación | borrador de seguimiento | sí, antes de enviar |
| Preparar reunión | Calendar, account y documentos | agenda, contexto y próximos pasos | no, si solo prepara |
| Registrar decisión | pulso y feedback del fundador | entrada estructurada en decisions.md | sí, antes de cerrar |

Este modelo permite que el fundador sepa qué está haciendo Makis y que el equipo agregue nuevas capacidades sin convertir el cockpit en un chat genérico.

### 5.2 Modo de trabajo por cliente o proyecto

Un fundador no opera solo la empresa en abstracto. Opera clientes, proyectos, proveedores y decisiones que no deben contaminarse entre sí. Makis debe ofrecer un modo de enfoque inspirado en el ciclo cargar, trabajar y cerrar:

| Momento | Capacidad de Makis | Regla de producto |
|---|---|---|
| Abrir contexto | El fundador elige un cliente o proyecto. Makis carga primero su account.md y después el plan, la actividad reciente, los compromisos y los documentos más relevantes. | Solo lectura. La pantalla entrega un briefing breve antes de proponer trabajo. |
| Trabajar en foco | Las skills leen únicamente el workspace abierto y sus fuentes autorizadas. | Un contexto activo a la vez para evitar que información o acciones de un cliente aparezcan en otro. |
| Cerrar contexto | Makis resume lo hecho, propone actualizar estado actual, actividad, decisiones, pendientes y siguiente hito. | Nada se escribe ni se ejecuta sin revisión del fundador. |
| Retomar | La siguiente sesión abre el account.md actualizado y el handoff más reciente. | El usuario no debe redescubrir el estado ni explicar otra vez el trabajo anterior. |

La interfaz puede ofrecer estas capacidades como comandos claros:

- **Abrir cliente:** carga un briefing con quién es, estado actual, qué espera esa persona, pendiente interno, bloqueos y archivos clave.
- **Cerrar sesión de cliente:** prepara el snapshot de estado, agrega el registro cronológico y propaga solo los cambios que realmente ocurrieron.
- **Dejar handoff:** escribe un punto de retome breve con pendientes, decisiones, artefactos y los primeros pasos de la próxima sesión.

El diseño separa tres artefactos que suelen mezclarse:

1. **Account:** fotografía actual y corta de una entidad.
2. **Actividad:** historia cronológica de qué pasó.
3. **Handoff:** instrucciones de retome para una persona o sesión futura.

Esta separación es importante para el fundador: puede preguntar “qué está bloqueado hoy” sin leer toda la historia, y luego abrir la evidencia si necesita entender el porqué.

## 6. Límites y guardrails

- Makis puede leer, sintetizar, preparar y recomendar dentro de las fuentes autorizadas.
- Makis nunca envía correos, crea eventos, mueve archivos, paga, firma, publica ni borra sin aprobación explícita.
- Toda recomendación debe conservar una referencia a su evidencia.
- Si la información es incompleta o contradictoria, Makis lo señala como incertidumbre en vez de inventar una respuesta.
- El fundador puede corregir una conclusión y ese feedback actualiza el aprendizaje, no solo la conversación.

## 7. Arquitectura técnica

~~~
makis/
├── main.py                      # API y orquestación del cockpit
├── agents/
│   ├── director.py              # URL a perfil de empresa
│   ├── chief_of_staff.py        # señales a prioridades y acciones
│   ├── documenter.py            # estado a Markdown versionado
│   └── analyst.py               # resultado a aprendizaje
├── integrations/
│   ├── google_workspace_mcp.py  # Gmail, Calendar, Drive y Sheets
│   ├── exa_client.py            # investigación externa cuando aporte contexto
│   └── resend_client.py         # ejecución de correo aprobada
├── services/
│   ├── workspace_store.py       # Markdown, versiones y enlaces
│   └── action_queue.py          # propuestas, aprobaciones y auditoría
├── skills/
│   ├── founder_pulse.py         # prioridades y riesgos de la semana
│   ├── collections.py           # cobros y seguimientos propuestos
│   ├── meeting_prep.py          # preparación contextual de reuniones
│   └── decision_log.py          # registro de decisiones aprobado
├── frontend/
│   ├── onboarding/              # URL, perfil y conexiones
│   ├── cockpit/                 # vista operativa del fundador
│   ├── action-review/           # aprobar, editar o rechazar
│   └── documents/               # Markdown renderizado
├── workspaces/                  # documentos y activos por empresa
└── data/makis.db                # índice, eventos y aprobaciones
~~~

## 8. Criterios de éxito para el demo

- Una URL crea un perfil de empresa y workspace visible en menos de un minuto.
- El cockpit muestra al menos una señal de Gmail, Calendar, Drive y Sheets, o sus equivalentes deterministas de demo.
- El fundador ve una cola priorizada de acciones con evidencia y contexto.
- La vista de una entidad muestra su account.md, decisiones, actividad y documentos sin crear copias.
- El fundador puede abrir un cliente, recibir un briefing read-only y cerrarlo con estado, actividad y handoff propuestos.
- Makis impide que una skill use información de dos clientes o proyectos a la vez salvo que el fundador abra una vista de cartera explícita.
- Una acción se edita y se aprueba; su resultado queda trazado en el Markdown correspondiente.
- El sistema propone un aprendizaje operativo, por ejemplo un patrón de cobro tardío o una reunión que siempre requiere preparación.
- El demo muestra que el valor depende del contexto conectado, no de una conversación aislada.

## 9. Roles del equipo

| Miembro | Responsabilidad |
|---|---|
| Joel Espinoza | Orquestación, SQLite, analítica y aprendizaje |
| Diego Celis | FastAPI, conectores, extracción y contexto estructurado |
| Miluska R. | Onboarding, founder cockpit, renderizado y revisión humana |
| Freddy Ñañez | Arquitectura de producto, prioridades operativas, demo y pitch |

## 10. Guion de demo de tres minutos

1. **0:00-0:25.** “El fundador no necesita otro chat. Necesita saber qué requiere su decisión antes de abrir cinco herramientas.”
2. **0:25-0:50.** Pegar la URL, mostrar el perfil detectado y confirmar el negocio.
3. **0:50-1:20.** Entrar al cockpit: una factura vencida en Gmail, una reunión sin preparación en Calendar y el contrato relacionado en Drive.
4. **1:20-1:55.** Abrir la acción propuesta. Makis muestra evidencia, prepara el borrador de seguimiento y el fundador lo ajusta y aprueba.
5. **1:55-2:30.** Mostrar el registro Markdown actualizado, la decisión guardada y el pulso semanal que cambia.
6. **2:30-3:00.** “Makis no responde desde una caja de chat. Convierte el back-office de la empresa en un sistema que el fundador puede gobernar.”
