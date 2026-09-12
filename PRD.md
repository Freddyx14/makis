# Makis - Product Requirements Document
## Sistema operativo agéntico para el back-office del fundador

> **Versión:** 6.0.0 · **Hackathon:** Agents, Everywhere (AI Tinkerers 2026)  
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
├── 00-perfil-empresa.md        # negocio, personas, prioridades y supuestos
├── 01-pulso-semanal.md         # señales, riesgos y decisiones necesarias
├── 02-clientes-y-compromisos.md# acuerdos, responsables y próximos pasos
├── 03-caja-y-cobros.md         # facturas, caja, alertas y seguimiento
├── 04-reuniones-y-operacion.md # agenda, preparación y tareas derivadas
├── 05-documentos-clave.md      # contratos, propuestas y enlaces relevantes
├── 06-decisiones.md            # decisiones aprobadas y razón
└── 07-aprendizajes.md          # patrones para la próxima iteración
~~~

SQLite indexa artefactos, versiones, fuentes, aprobaciones y eventos. No reemplaza los documentos: permite que Makis recupere el contexto correcto y explique de dónde salió cada recomendación.

### 3.4 Documentación que se ve como producto

La experiencia principal no es un explorador de archivos. Makis renderiza cada documento según su propósito:

| Documento fuente | Vista de la UI | Acción humana |
|---|---|---|
| Perfil | Ficha de empresa y contexto confirmado | corregir supuestos |
| Pulso semanal | Panel de prioridades, riesgos y oportunidades | ordenar la semana |
| Clientes y compromisos | Cola de seguimientos y responsables | aprobar seguimiento |
| Caja y cobros | Tarjetas de vencimientos y movimiento | aprobar recordatorio |
| Reuniones | Agenda con preparación y próximos pasos | preparar o bloquear tiempo |
| Documentos clave | Buscador con resumen y vínculos | abrir, compartir o crear |
| Decisiones | Registro de decisión, motivo y resultado | confirmar criterio |

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
