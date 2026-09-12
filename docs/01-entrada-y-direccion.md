# Etapa 1 — Entrada y dirección

> **Entrada:** URL + objetivo + presupuesto
> **Salida:** brief maestro
> **Herramientas:** FastAPI · HTML/CSS/JS · Exa `/contents` · OpenAI API
>
> **Estado: decisiones cerradas.** Listo para codificar.

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
| `presupuesto_total` | decimal + moneda | Sí | **Total**, no mensual |
| `duracion_semanas` | entero | Sí | Junto al presupuesto permite calcular CPL y CAC en la etapa 5 |
| `mercado` | país / idioma | No | Filtra competidores (etapa 2) y fija el idioma del contenido |
| `publico_objetivo` | texto libre | No | Si se rellena, el Director IA lo respeta; si no, lo infiere |
| `notas` | texto libre | No | Restricciones, tono, cosas a evitar |

**Cerrado — presupuesto total + duración en semanas.** El importe mensual se
deriva; al revés no, porque sin duración no hay forma de calcular coste por lead
al final del flujo.

**Cerrado — público objetivo opcional.** Es el punto medio entre demo
impresionante y campaña precisa: quien ya sabe a quién vende lo dice y se
respeta; quien no, lo deja vacío y el Director IA lo infiere. En ambos casos es
corregible en la pantalla de revisión.

**Cerrado — campo de mercado.** Decidido como transversal (doc 00 §5). Es
opcional, pero cuando está presente condiciona tres etapas posteriores.

## 4. Extracción desde la URL

Antes de invocar al Director IA hay que darle material. Necesitamos de la web
del cliente: a qué se dedica, qué vende, a quién, con qué tono y qué señales de
propuesta de valor da.

**Cerrado — Exa `/contents`, home + hasta 3 páginas internas.**

Sin scraping propio en esta etapa: el scraping entra en la etapa 2, y solo para
extraer estructura (precios, pixels) que el texto plano pierde. Aquí basta con
contenido limpio y parseado.

Se leen la home y hasta 3 páginas internas del mismo dominio. La home sola da el
tono y la propuesta de valor, pero se queda corta para el catálogo y los precios
del propio cliente.

Parámetros: `maxAgeHours` por defecto (caché si existe, livecrawl si no).

**Fallo de lectura → descripción manual.** Si Exa no puede leer la web, el
formulario pide al usuario una descripción del negocio en lugar de fallar. Es la
regla de degradación del doc 00 §3 aplicada aquí: dato ausente es información,
no error.

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

**Cerrado — sin KPIs numéricos en esta etapa.** El brief fija únicamente la
*métrica principal* (qué se va a medir). Los números los pone la etapa 2, que es
cuando ya hay benchmarks de competencia para fundamentarlos. Una cifra inventada
aquí se arrastraría como si fuera un objetivo acordado.

## 7. Revisión humana

El brief generado **no** pasa automáticamente a la etapa 2. El usuario lo ve,
lo edita campo a campo y lo aprueba.

Razón: es el punto más barato del flujo para corregir un error. Un público mal
inferido aquí contamina investigación, contenido y anuncios.

**Cerrado — regeneración con instrucciones.** No es un botón de reintentar: el
usuario escribe qué quiere distinto ("enfócate en B2B, no en consumidor final") y
el Director IA rehace el brief con esa dirección. Cada regeneración crea una
versión nueva; no se pierde la anterior.

Un reintento sin instrucciones produce una variación aleatoria del mismo error.

## 8. Superficie de API

| Método | Ruta | Qué hace |
|---|---|---|
| `POST` | `/api/campaigns` | Crea campaña con el input inicial |
| `POST` | `/api/campaigns/{id}/brief` | Lanza al Director IA |
| `GET` | `/api/campaigns/{id}/brief` | Devuelve el brief para revisión |
| `PATCH` | `/api/campaigns/{id}/brief` | Guarda las correcciones del usuario |
| `POST` | `/api/campaigns/{id}/brief/approve` | Aprueba y habilita la etapa 2 |

**Cerrado — asíncrono con tabla `jobs` y polling**, según el doc 00 §2.

Extraer la web y generar el brief tarda 20–60 s. Aunque sea la etapa más corta
del flujo, se monta asíncrona desde el principio: la infraestructura de `jobs` se
escribe una vez y la reutilizan las etapas 2 y 3, donde es imprescindible.

`POST /api/campaigns/{id}/brief` devuelve un `job_id`; el frontend consulta
`GET /api/jobs/{job_id}` y muestra progreso (leyendo web → generando brief).

## 9. Datos

```
campaigns
  id, url, objetivo, objetivo_detalle,
  presupuesto_total, moneda, duracion_semanas,
  mercado, publico_objetivo_usuario, notas,
  access_token, status, created_at

briefs
  id, campaign_id, contenido (JSON), version,
  origen (ia|editado|regenerado), instrucciones_regeneracion,
  aprobado_at, created_at

jobs
  id, campaign_id, tipo, estado, progreso (JSON),
  error, intentos, created_at, updated_at
```

`access_token` implementa el acceso por enlace del doc 00 §6:
`secrets.token_urlsafe(32)`, generado al crear la campaña.

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
| Latencia alta en la demo delante de un cliente | Generación asíncrona con progreso visible por fase |
| Fallo transitorio de Exa u OpenAI en mitad de una demo | 2 reintentos automáticos con espera (doc 00 §3) |
| Enlace de campaña filtrado | Token largo aleatorio, `noindex`, regenerable |

## 12. Decisiones pendientes antes de escribir código

1. ¿Presupuesto total o mensual? ¿Pedimos duración? Total,  si ducracion
2. ¿Público objetivo: lo pide el formulario o lo infiere la IA, pida y en caso no lo tengo busque pubblicos objeetivos?
3. ¿Extracción vía Exa, scraping propio o ambos?,  ambos
4. ¿Cuántas páginas leemos del sitio del cliente?, todas las que tenga
5. ¿KPIs numéricos en etapa 1 o etapa 2, 2?
6. ¿Regeneración del brief con instrucciones, okey, pero con historial de versiones?
7. ¿Generación síncrona o asíncrona con `jobs`, asincrona?
