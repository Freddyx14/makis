# Etapa 1 — Entrada y dirección

> **Entrada:** URL + objetivo + presupuesto
> **Salida:** brief maestro
> **Herramientas:** FastAPI · HTML/CSS/JS · capa LLM agnóstica

## 1. Qué resuelve esta etapa

El usuario llega con muy poco: una web, una idea de objetivo y un presupuesto.
Esta etapa convierte ese input mínimo en un **brief maestro** estructurado y
suficientemente rico como para que las cuatro etapas siguientes trabajen sin
volver a preguntarle nada al usuario.

Es la etapa que define la calidad de todo lo demás. Un brief pobre produce
investigación irrelevante y contenido genérico.

## 2. Alcance

### Dentro

- Formulario de entrada mínimo (URL, objetivo, presupuesto).
- Extracción automática de información desde la URL del cliente.
- Agente "Director IA" que redacta el brief maestro.
- Pantalla de revisión donde el usuario corrige el brief antes de continuar.
- Persistencia de campaña y brief.
- Arranque del flujo hacia la etapa 2.

### Fuera

- Investigación de competidores (etapa 2).
- Cualquier generación de contenido (etapa 3).
- Gestión de usuarios más allá de la auth mínima acordada.

## 3. Input del usuario

| Campo | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `url` | URL | Sí | Web del cliente; de aquí se extrae el contexto |
| `objetivo` | enum + texto libre | Sí | Leads / ventas / awareness / tráfico + matiz |
| `presupuesto` | decimal + moneda | Sí | Condiciona canales en la etapa 2 |
| `duracion` | semanas | **Decisión abierta** | Sin esto, "presupuesto" es ambiguo |
| `notas` | texto libre | No | Restricciones, tono, cosas a evitar |

**Decisión abierta 1 — ¿presupuesto total o mensual?** Cambia el cálculo de CPL
y CAC en la etapa 5. Propongo: total + duración en semanas.

**Decisión abierta 2 — ¿pedimos el público objetivo al usuario o lo infiere el
Director IA?** Inferirlo hace la demo más impresionante; pedirlo la hace más
precisa. Propongo inferirlo y dejar que el usuario lo corrija en la pantalla de
revisión.

## 4. Extracción desde la URL

Antes de invocar al Director IA hay que darle material. Necesitamos de la web
del cliente: a qué se dedica, qué vende, a quién, con qué tono y qué señales de
propuesta de valor da.

**Decisión abierta 3 — ¿cómo leemos la URL?** Tres opciones, con trade-off real:

| Opción | A favor | En contra |
|---|---|---|
| Exa `/contents` | Ya tenemos la key; contenido limpio y parseado | Depende de que Exa tenga la página cacheada o pueda crawlearla |
| Scraping propio (`httpx` + parser) | Control total, sin coste por llamada | Hay que mantenerlo; rompe con SPAs y con webs que bloquean bots |
| Exa con fallback a scraping | Cubre los dos casos | Dos caminos de código que mantener |

Recomiendo **Exa `/contents` con `maxAgeHours` por defecto**, y tratar el fallo
como un caso explícito: si no se puede leer la web, el formulario pide al usuario
una descripción manual del negocio en lugar de fallar.

**Decisión abierta 4 — ¿una sola página o varias?** La home sola suele bastar
para el tono, pero no para el catálogo. Propongo: home + hasta 3 páginas
internas que Exa devuelva del mismo dominio.

## 5. El agente Director IA

Único agente de esta etapa. Recibe el input del usuario más el contenido
extraído de la web, y produce el brief maestro.

Responsabilidades:

1. Resumir a qué se dedica el negocio y qué vende.
2. Inferir público objetivo y propuesta de valor.
3. Traducir el objetivo declarado en objetivos de campaña concretos y medibles.
4. Señalar lo que **no** sabe, para que la etapa 2 lo investigue.

Ese último punto importa: el brief debe distinguir entre lo que se sabe con
fundamento y lo que es suposición. Si no, la etapa 2 hereda alucinaciones como
si fueran hechos.

**Supuesto:** el Director IA no busca en la web. Solo interpreta lo que se le da.
Toda búsqueda pertenece a la etapa 2.

## 6. El brief maestro

Estructura propuesta (Pydantic, persistida como JSON):

```
brief_maestro
├── negocio          — qué hace, qué vende, sector
├── publico_objetivo — segmentos inferidos, con nivel de confianza
├── propuesta_valor  — diferenciadores detectados
├── objetivo         — tipo, métrica principal, meta numérica
├── presupuesto      — importe, moneda, duración, reparto sugerido
├── tono             — voz de marca detectada en la web
├── restricciones    — lo que el usuario pidió evitar
└── huecos           — qué falta averiguar (input directo para la etapa 2)
```

**Decisión abierta 5 — ¿el brief lleva ya KPIs numéricos?** El diagrama pone los
KPIs en la etapa 2. Propongo que la etapa 1 fije solo la *métrica principal* y
que la etapa 2 ponga los números, que es cuando ya hay benchmarks de competencia.

## 7. Revisión humana

El brief generado **no** pasa automáticamente a la etapa 2. El usuario lo ve,
lo edita campo a campo y lo aprueba.

Razón: es el punto más barato del flujo para corregir un error. Un público mal
inferido aquí contamina investigación, contenido y anuncios.

**Decisión abierta 6 — ¿se puede regenerar el brief entero?** Propongo sí, con
un campo de instrucciones ("enfócate en B2B, no en consumidor final") en lugar
de solo un botón de reintentar.

## 8. Superficie de API

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/campaigns` | Crea campaña con el input inicial |
| `POST` | `/api/campaigns/{id}/brief` | Lanza al Director IA |
| `GET` | `/api/campaigns/{id}/brief` | Devuelve el brief para revisión |
| `PATCH` | `/api/campaigns/{id}/brief` | Guarda las correcciones del usuario |
| `POST` | `/api/campaigns/{id}/brief/approve` | Aprueba y habilita la etapa 2 |

**Decisión abierta 7 — ¿generación síncrona o asíncrona?** Extraer la web y
generar el brief puede tardar 20–60 s. Síncrono es más simple; asíncrono con
polling no deja al navegador colgado y es lo que se va a necesitar igualmente en
las etapas 2 y 3. Propongo asíncrono desde el principio, con una tabla `jobs`.

## 9. Datos

```
campaigns
  id, url, objetivo, presupuesto, moneda, duracion_semanas,
  notas, status, created_at

briefs
  id, campaign_id, contenido (JSON), version,
  generado_por_ia (bool), aprobado_at
```

Guardamos **versiones** del brief en lugar de sobrescribir: se puede enseñar a
un cliente qué propuso la IA frente a qué corrigió la persona. Es material de
demo, no solo de auditoría.

## 10. Criterios de aceptación

La etapa 1 está terminada cuando:

1. Se introduce una URL real y se obtiene un brief coherente sin tocar nada más.
2. Una web ilegible no rompe el flujo: pide descripción manual.
3. El brief distingue lo fundamentado de lo supuesto.
4. El usuario puede editar cualquier campo y su edición persiste.
5. Existe una campaña aprobada en base de datos lista para la etapa 2.
6. Dos usuarios simultáneos no se pisan las campañas.

## 11. Riesgos

| Riesgo | Mitigación |
|---|---|
| Webs que bloquean crawling | Fallback a descripción manual |
| El Director IA inventa datos del negocio | Campo `huecos` + nivel de confianza + revisión humana |
| Latencia alta en la demo delante de un cliente | Generación asíncrona con progreso visible |
| Presupuesto ambiguo rompe cálculos en la etapa 5 | Cerrar la decisión abierta 1 antes de codificar |

## 12. Decisiones pendientes antes de escribir código

1. ¿Presupuesto total o mensual? ¿Pedimos duración?
2. ¿Público objetivo: lo pide el formulario o lo infiere la IA?
3. ¿Extracción vía Exa, scraping propio o ambos?
4. ¿Cuántas páginas leemos del sitio del cliente?
5. ¿KPIs numéricos en etapa 1 o etapa 2?
6. ¿Regeneración del brief con instrucciones?
7. ¿Generación síncrona o asíncrona con `jobs`?
