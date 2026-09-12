# Documentación de planificación

Sistema agéntico de marketing — demo local, preparada para desplegar sin refactor.

## Cómo leer estos documentos

Cada etapa del flujo tiene su propio documento de planificación. Antes de
escribir código de una etapa, su `.md` debe estar cerrado y acordado.

| Documento | Estado |
|---|---|
| [00-arquitectura-global.md](00-arquitectura-global.md) — stack, contratos entre agentes, decisiones transversales | **Cerrado** |
| [01-entrada-y-direccion.md](01-entrada-y-direccion.md) — captura del brief y Director IA | **Cerrado — listo para codificar** |
| [02-investigacion-y-estrategia.md](02-investigacion-y-estrategia.md) — research con Exa + debate multiagente | **Cerrado — listo para codificar** |
| [03-contenido-y-creatividades.md](03-contenido-y-creatividades.md) — generación de piezas con Redactor/Editor/Director | **Cerrado — listo para codificar** |
| [04-aprobacion-y-ejecucion.md](04-aprobacion-y-ejecucion.md) — revisión, programación y publicación | **Cerrado** — ver §3 |
| [05-analitica-y-optimizacion.md](05-analitica-y-optimizacion.md) — métricas, informe y bucle de aprendizaje | **Cerrado — listo para codificar** |

## Convenciones

- **Decisión abierta** marca un punto que requiere respuesta antes de codificar.
- **Cerrado** marca una decisión ya tomada, con su razón.
- **Supuesto** marca algo que asumimos y que puede invalidarse más adelante.
- Las etapas se numeran igual que en el diagrama de arquitectura.

## Decisiones transversales cerradas

Resumen; el detalle y el porqué están en el doc 00 §12.

| Tema | Resultado |
|---|---|
| Proveedor LLM | OpenAI, tras interfaz `LLMProvider` |
| Ejecución | Asíncrona, tabla `jobs` + polling |
| Fallos | Degradar datos ausentes; 2 reintentos en infraestructura |
| Idioma | Interfaz ES/EN; contenido según mercado objetivo |
| Acceso | Token por campaña, sin usuarios |
| Coste | 20 búsquedas Exa / 15 páginas por campaña |
| Despliegue | Local; código 12-factor para desplegar sin refactor |
| Ejecución externa | Email real; social real tras despliegue; ads mock |
| Métricas | Simulador determinista + entrada manual; leads reales |
