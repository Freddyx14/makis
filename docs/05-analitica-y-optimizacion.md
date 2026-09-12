# Etapa 5 — Analítica y optimización

> **Entrada:** ejecuciones y leads (etapa 4) + estrategia y KPIs (etapa 2)
> **Salida:** métricas, informe, aprendizajes y siguiente experimento
> **Herramientas:** SQLite · Chart.js · simulador de métricas · OpenAI API
>
> **Estado: decisiones cerradas.** Listo para codificar.

## 1. Qué resuelve esta etapa

Responde a "¿funcionó?" y, más importante, a "¿qué hacemos distinto la próxima
vez?". Es la etapa que cierra el bucle: sus aprendizajes los lee la etapa 2 en la
siguiente iteración de la campaña.

Sin esta etapa el sistema es un generador de contenido. Con ella es un sistema
que mejora.

## 2. Origen de las métricas

**Cerrado — simulador realista + entrada manual de datos reales.**

Tres orígenes conviven, y **cada métrica registra cuál es el suyo**:

| Origen | Qué cubre | Marcado como |
|---|---|---|
| **Real** | Leads de la landing, aperturas y clics de Resend | `real` |
| **Simulado** | Impresiones, clics y conversiones de ads y social mockeados | `simulado` |
| **Manual** | Lo que el usuario introduce de campañas que lanzó por su cuenta | `manual` |

La distinción no es cosmética. Un informe que mezcla datos reales y simulados sin
señalarlo es engañoso — sobre todo si se lo enseñas a un cliente. La interfaz
marca visualmente el origen en cada gráfica, y el informe lo indica en texto.

Es la continuación del campo `publisher_usado` de la etapa 4: lo que se ejecutó
con un mock solo puede producir métricas simuladas.

## 3. El simulador

No es un generador de números aleatorios. Produce series **coherentes** con lo
que el sistema ya sabe:

```
Entradas del simulador
├── presupuesto por canal      (de la estrategia)
├── benchmarks del sector      (del dossier de la etapa 2)
├── duración de la campaña     (del brief)
├── tipo de pieza y canal      (de la etapa 3)
└── semilla determinista       (por campaña)
```

Reglas que respeta:

- **Coherencia de embudo:** impresiones > clics > conversiones, con ratios
  plausibles por canal. Un CTR del 40% no aparece nunca.
- **Coherencia de presupuesto:** más inversión produce más impresiones, con
  rendimientos decrecientes.
- **Variación entre piezas:** las variantes de anuncio A/B/C rinden distinto, que
  es lo que hace que la etapa 5 tenga algo que analizar.
- **Variación temporal:** curva de días, no una línea plana.
- **Semilla determinista por campaña:** la misma campaña produce los mismos
  números en cada ensayo. Imprescindible para ensayar una demo sin sorpresas.

**Supuesto:** los benchmarks del dossier son el ancla. Si el dossier no encontró
benchmarks para un canal, el simulador usa rangos genéricos por tipo de canal y
lo marca en el informe.

## 4. Entrada manual de datos reales

El usuario puede introducir métricas de campañas que lanzó por su cuenta, por
canal y por periodo. Casos de uso: ya tiene Google Ads corriendo, o quiere usar
la etapa 5 con datos auténticos sin pasar por la ejecución simulada.

Cuando existen datos manuales para un canal, **sustituyen a los simulados** en
ese canal; no se promedian. Mezclar ambos produciría un número que no significa
nada.

Formato: formulario por canal, o CSV con columnas fijas.

## 5. Métricas calculadas

Las del diagrama, más las que hacen falta para calcularlas:

| Métrica | Fórmula | Nota |
|---|---|---|
| **Leads** | Conteo de tabla `leads` + conversiones | Los de landing son reales |
| **CPL** | Inversión / leads | Coste por lead |
| **CAC** | Inversión / clientes | Requiere definir qué es "cliente" (§6) |
| **ROAS** | Ingresos / inversión | Requiere valor por conversión (§6) |
| CTR | Clics / impresiones | Por pieza y por canal |
| Tasa de conversión | Conversiones / clics | Por pieza |
| Apertura / clic email | De Resend | Reales cuando el envío fue real |

### Comparación contra objetivo

Cada métrica se contrasta con el **KPI que fijó la etapa 2**. Esto es lo que
convierte una gráfica en información: no "conseguimos 47 leads" sino
"conseguimos 47 leads frente a un objetivo de 60, un 78% del target".

## 6. Dos datos que el sistema no puede inventar

**CAC y ROAS requieren información que no está en ninguna etapa anterior:**

- **CAC** necesita saber cuántos leads se convirtieron en clientes. El sistema
  captura leads, no ventas.
- **ROAS** necesita el valor monetario de una conversión.

**Cerrado — se piden al usuario, con valor por defecto derivado del brief.** Dos
campos en la configuración de la campaña:

```
valor_conversion   — cuánto vale un cliente (por defecto: ticket medio si el
                     dossier lo detectó; si no, lo pide)
tasa_lead_cliente  — qué % de leads se convierte (por defecto: 20%, editable)
```

Ambos se marcan como **supuesto** en el informe cuando son valores por defecto.
Un ROAS calculado sobre un ticket medio inventado es un número bonito y falso, y
el informe debe decirlo.

## 7. El informe

Generado por un agente a partir de las métricas, no una plantilla rellenada.
Estructura:

```
informe
├── resumen            — qué pasó, en tres frases
├── vs_objetivo[]      — cada KPI de la etapa 2 con su resultado y % de target
├── por_canal[]        — rendimiento e inversión por canal
├── mejores_piezas[]   — qué funcionó y la hipótesis de por qué
├── peores_piezas[]    — qué no funcionó y la hipótesis de por qué
├── origen_datos       — qué parte es real, simulada o manual
└── advertencias[]     — supuestos que afectan a la lectura (§6)
```

El campo `origen_datos` es obligatorio y aparece destacado, no en una nota al pie.

## 8. Aprendizajes y siguiente experimento

Lo que cierra el bucle del diagrama. Un agente analiza los resultados y produce:

```
aprendizaje
├── observacion     — qué se vio en los datos
├── hipotesis       — por qué pudo ocurrir
├── confianza       — alta | media | baja
├── aplicable_a     — canal, tipo de pieza, audiencia o mensaje
└── accion_sugerida — qué hacer distinto
```

Y un **siguiente experimento** concreto:

```
experimento
├── hipotesis        — qué creemos que mejorará
├── cambio_propuesto — qué se modifica respecto a la campaña actual
├── metrica_objetivo — qué mediría el éxito
└── duracion_sugerida
```

### Honestidad sobre datos simulados

Un aprendizaje extraído de métricas simuladas **no es un aprendizaje sobre el
mercado**: es una observación sobre el simulador. El agente recibe el origen de
cada dato y tiene instrucción explícita de marcar la confianza como `baja` cuando
la observación se apoya en datos simulados.

Esto es lo que evita que el bucle de aprendizaje continuo se convierta en un
sistema que aprende de sus propias invenciones.

## 9. Cómo se cierra el bucle

Los aprendizajes se guardan en `learnings` y la **etapa 2 los lee** al generar
estrategias para una nueva iteración de la campaña (doc 00 §9).

```
Etapa 5 escribe learnings
        ↓
Etapa 2, siguiente iteración: Conservador, Arriesgado y Rector
los reciben junto al dossier
```

Los agentes de estrategia los tratan como una fuente más, con su nivel de
confianza. Un aprendizaje de confianza baja pesa menos que un benchmark del
dossier con fuente.

**No hay reentrenamiento de modelos.** El aprendizaje es contexto acumulado, no
ajuste de pesos.

## 10. Visualización

Chart.js, como indica el diagrama. Gráficas previstas:

| Gráfica | Tipo | Qué muestra |
|---|---|---|
| Embudo | Barras | Impresiones → clics → leads → clientes |
| Evolución temporal | Línea | Leads y coste por día |
| Comparativa de canales | Barras agrupadas | Inversión vs. leads por canal |
| KPI vs. objetivo | Barras con línea de meta | Cada KPI frente a su target |
| Ranking de piezas | Barras horizontales | Mejores y peores por conversión |

Toda gráfica que incluya datos simulados lo indica en su título o leyenda.

## 11. Superficie de API

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/campaigns/{id}/metrics/simulate` | Genera métricas simuladas |
| `POST` | `/api/campaigns/{id}/metrics/manual` | Introduce datos reales |
| `GET` | `/api/campaigns/{id}/metrics` | Métricas con su origen |
| `GET` | `/api/campaigns/{id}/dashboard` | Datos listos para Chart.js |
| `POST` | `/api/campaigns/{id}/report` | Genera el informe (async) |
| `GET` | `/api/campaigns/{id}/report` | Devuelve el informe |
| `GET` | `/api/campaigns/{id}/learnings` | Aprendizajes y experimento |
| `POST` | `/api/campaigns/{id}/iterate` | Nueva iteración con los aprendizajes |

`iterate` es el endpoint que cierra el ciclo: crea una campaña derivada que
arranca en la etapa 2 con los aprendizajes ya cargados.

## 12. Datos

```
metrics
  id, campaign_id, piece_id, canal, fecha,
  impresiones, clics, conversiones, inversion,
  origen (real|simulado|manual), created_at

reports
  id, campaign_id, contenido (JSON), origen_datos (JSON), created_at

learnings
  id, campaign_id, observacion, hipotesis, confianza,
  aplicable_a, accion_sugerida, basado_en_simulados (bool), created_at

experiments
  id, campaign_id, hipotesis, cambio_propuesto,
  metrica_objetivo, duracion_sugerida, created_at
```

`basado_en_simulados` permite que la etapa 2 pondere correctamente lo que lee.

## 13. Criterios de aceptación

1. Toda métrica registra su origen y la interfaz lo muestra.
2. El simulador produce embudos coherentes: nunca más clics que impresiones.
3. La misma campaña simulada dos veces produce los mismos números.
4. Los datos manuales sustituyen a los simulados en su canal, no se promedian.
5. CAC y ROAS se marcan como estimados cuando usan valores por defecto.
6. Los aprendizajes de datos simulados salen con confianza `baja`.
7. La etapa 2 recibe los aprendizajes en una iteración nueva.
8. El informe indica de forma destacada qué parte de los datos es simulada.

## 14. Riesgos

| Riesgo | Mitigación |
|---|---|
| **Confundir datos simulados con reales ante un cliente** | Origen en cada métrica, marcado en gráficas e informe |
| El sistema aprende de sus propias invenciones | Confianza `baja` forzada en aprendizajes simulados; `basado_en_simulados` |
| ROAS y CAC sobre supuestos inventados | Marcados como estimados; advertencia en el informe |
| Métricas simuladas poco creíbles | Anclaje en benchmarks del dossier y coherencia de embudo |
| Demo irrepetible por números cambiantes | Semilla determinista por campaña |

## 15. Decisiones cerradas

| # | Pregunta | Resultado |
|---|---|---|
| 1 | ¿De dónde salen las métricas? | **Simulador realista + entrada manual**; leads de landing y email son reales |
| 2 | ¿Cómo se distingue lo real de lo simulado? | Campo `origen` por métrica, visible en toda la interfaz |
| 3 | ¿Cómo se calculan CAC y ROAS? | Valor de conversión y tasa lead→cliente pedidos al usuario, con defaults marcados como supuesto |
| 4 | ¿El simulador es determinista? | **Sí**, semilla por campaña |
| 5 | ¿Datos manuales y simulados se mezclan? | **No**, los manuales sustituyen por canal |
| 6 | ¿Cómo se cierra el bucle? | `learnings` → leídos por la etapa 2 vía `/iterate` |

Heredadas del doc 00: proveedor OpenAI (§1), ejecución asíncrona (§2), idioma
según mercado (§4).

**No quedan decisiones abiertas. La etapa está lista para codificar.**
