# Etapa 4 — Aprobación y ejecución

> **Entrada:** lote de piezas (etapa 3)
> **Salida:** piezas aprobadas, programadas y ejecutadas
> **Herramientas:** SQLite · Resend · APIs sociales · mocks Google Ads / Meta
>
> **Estado: decisiones cerradas, con una tensión señalada en §3.**

## 1. Qué resuelve esta etapa

Es la única etapa donde el sistema actúa sobre el mundo exterior. Todo lo
anterior produce texto en una base de datos; aquí se envía un email, se publica
un post, se lanza una campaña.

Eso cambia el criterio de diseño: en las etapas 1-3 un error se corrige
regenerando. Aquí un error se envía a la bandeja de entrada de alguien y no se
puede deshacer. El documento está escrito alrededor de esa asimetría.

## 2. El doble paso

**Cerrado — revisión y programación separadas.**

```
Paso 1 — Revisión      ¿está bien esta pieza?
Paso 2 — Programación  ¿cuándo sale?
```

Son preguntas distintas y mezclarlas produce errores. Aprobar contenido es un
juicio editorial; programarlo es logístico. Separarlas también permite aprobar
todo un lunes y decidir el calendario el martes.

### Paso 1 — Revisión

El usuario recorre el lote pieza a pieza. Por cada una:

- **Aprobar** → pasa a programación.
- **Editar y aprobar** → edición inline, se guarda como versión nueva.
- **Descartar** → no se ejecuta, queda registrada.
- **Devolver a etapa 3** → regenerar con instrucciones.

Las piezas que llegaron marcadas `revision_pendiente` desde la etapa 3 (los topes
de ciclo del Editor) aparecen destacadas con los comentarios del Editor visibles.

**Nada avanza sin aprobación explícita.** No hay aprobación por defecto ni
por lote completo: es la salvaguarda contra publicar algo que nadie leyó.

### Paso 2 — Programación

Solo con las piezas aprobadas. El usuario asigna a cada una fecha, hora y canal
concreto, sobre un calendario.

El sistema propone un calendario inicial derivado de la estrategia (duración de
campaña, canales, cadencia razonable por canal) que el usuario ajusta. Proponer
un calendario vacío obliga a un trabajo manual que la demo no necesita mostrar.

**Estados de una pieza programada:**

```
programada → en_cola → ejecutando → ejecutada
                           └──────→ fallida → reintento (2) → fallida_definitiva
```

## 3. Qué se ejecuta de verdad

**Decidido: email real + publicación social real.** Esto entra en tensión con la
decisión de despliegue local, y conviene tenerlo claro antes de implementar.

### La tensión

| Requisito de publicar en LinkedIn / X | Estado en local |
|---|---|
| OAuth con callback HTTPS público | `localhost` no se acepta como redirect URI en apps de producción |
| App aprobada por la plataforma | LinkedIn y X tardan días o semanas en aprobar |
| Dominio verificado | No hay dominio en local |

Resend es distinto: **funciona en local sin problema**. Solo necesita una API key
y un dominio verificado para el remitente; el envío sale desde sus servidores, no
del tuyo.

### Cómo lo resolvemos

Una interfaz `Publisher` con dos implementaciones intercambiables por canal:

```
Publisher (interfaz)
├── ResendPublisher      → real, funciona en local
├── LinkedInPublisher    → real, requiere despliegue con HTTPS
├── XPublisher           → real, requiere despliegue con HTTPS
├── MockSocialPublisher  → registra lo que se habría publicado
└── MockAdsPublisher     → Google Ads / Meta, siempre mock
```

Qué backend se usa lo decide una variable de entorno por canal:

```env
PUBLISHER_EMAIL=resend        # real desde el día uno
PUBLISHER_SOCIAL=mock         # cambiar a "linkedin" / "x" al desplegar
PUBLISHER_ADS=mock            # siempre mock en la demo
```

**El código real de LinkedIn y X se escribe igualmente.** No es un stub: implementa
OAuth, refresco de token y publicación. Simplemente no se activa hasta que exista
un despliegue con HTTPS. Así el trabajo no se pospone, solo su activación.

**Recomendación:** empieza el trámite de aprobación de la app de LinkedIn o X
**antes** de necesitarla, porque el tiempo de aprobación es el camino crítico,
no el código.

### Mocks de Google Ads y Meta

Siempre simulados, como indica el diagrama. Un mock aquí no es un `pass`:
registra la campaña que se habría creado (presupuesto, segmentación, creatividades,
pujas) con la estructura que la API real esperaría. Eso permite enseñar a un
cliente exactamente qué se habría lanzado, y sirve de base para la etapa 5.

## 4. Ejecución

Las piezas programadas se ejecutan cuando llega su momento. Sin infraestructura
de colas: un **worker en background** que despierta cada minuto, busca piezas
cuya hora ha llegado y las publica.

```
scheduler (cada 60s)
  ├── busca piezas programadas con fecha <= ahora y estado "programada"
  ├── las marca "en_cola"
  └── las publica vía el Publisher de su canal
```

Suficiente para una demo y sin dependencias externas. En local, el scheduler solo
corre mientras la app esté levantada — otra consecuencia de la decisión de
despliegue que conviene tener presente.

**Ejecución inmediata:** el usuario puede forzar "publicar ahora" sin esperar al
calendario. Es lo que se usará en una demo en vivo.

### Reintentos y fallos

Regla del doc 00 §3: 2 reintentos con espera creciente. Pero aquí con una
salvaguarda adicional:

**Los reintentos deben ser idempotentes.** Un email enviado dos veces por un
reintento mal diseñado es un error visible para el cliente final. Cada ejecución
lleva una clave de idempotencia; antes de publicar se comprueba si esa pieza ya
se ejecutó con éxito.

## 5. Envío de emails con Resend

Único canal real desde el día uno. Requisitos:

- Dominio verificado en Resend para el remitente.
- **Lista de destinatarios:** la demo no tiene CRM. El usuario sube un CSV o
  introduce direcciones manualmente por campaña.
- Enlace de baja obligatorio en el pie, generado por el sistema.

**Salvaguarda de entorno de prueba:** una variable `EMAIL_ALLOWLIST` que, cuando
está presente, restringe los envíos a esas direcciones. Evita que una prueba con
un CSV real acabe en cientos de bandejas de entrada.

```env
RESEND_API_KEY=
EMAIL_FROM=
EMAIL_ALLOWLIST=              # vacío = sin restricción; usar en pruebas
```

## 6. Publicación de la landing

La landing generada en la etapa 3 se publica como página servida por la propia
app, en una ruta con token (`/l/{token}`), sin necesidad de hosting aparte.

Es también la página de destino de los anuncios simulados y de los CTA de los
emails, lo que la convierte en el punto donde se capturan los leads que medirá la
etapa 5.

**Captura de leads:** formulario simple en la landing → tabla `leads`. Es el
único dato **real** que produce la etapa 4 y alimenta la etapa 5 sin simulación.

## 7. Superficie de API

| Método | Ruta | Qué hace |
|---|---|---|
| `GET` | `/api/campaigns/{id}/review` | Lote pendiente de revisión |
| `POST` | `/api/pieces/{id}/approve` | Aprueba una pieza |
| `POST` | `/api/pieces/{id}/discard` | Descarta una pieza |
| `GET` | `/api/campaigns/{id}/schedule` | Calendario propuesto |
| `PUT` | `/api/campaigns/{id}/schedule` | Guarda el calendario ajustado |
| `POST` | `/api/pieces/{id}/publish` | Publicar ahora |
| `GET` | `/api/campaigns/{id}/executions` | Estado de todas las ejecuciones |
| `POST` | `/api/campaigns/{id}/recipients` | Sube CSV de destinatarios |
| `GET` | `/l/{token}` | Landing publicada |
| `POST` | `/l/{token}/lead` | Captura de lead |

## 8. Datos

```
executions
  id, piece_id, campaign_id, canal, publisher_usado,
  programada_para, ejecutada_at, estado,
  clave_idempotencia, respuesta_externa (JSON),
  intentos, error, created_at

recipients
  id, campaign_id, email, nombre, baja (bool), created_at

leads
  id, campaign_id, piece_id, email, nombre,
  origen (landing|email|anuncio), created_at

landings
  id, campaign_id, piece_id, token, publicada_at
```

`publisher_usado` registra si la ejecución fue real o mock. Sin ese campo, en la
etapa 5 no se puede distinguir una métrica auténtica de una simulada.

## 9. Criterios de aceptación

1. Ninguna pieza se ejecuta sin aprobación explícita del usuario.
2. Un reintento nunca produce un envío duplicado.
3. `EMAIL_ALLOWLIST` bloquea efectivamente los envíos fuera de la lista.
4. Cambiar `PUBLISHER_SOCIAL` de `mock` a real no requiere tocar código.
5. Los mocks registran una estructura equivalente a la de la API real.
6. La landing captura leads y quedan asociados a su campaña.
7. El calendario propuesto es coherente con la duración de la estrategia.
8. Una ejecución fallida es visible con su error y relanzable.

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| **Enviar emails reales por error en pruebas** | `EMAIL_ALLOWLIST`; aprobación pieza a pieza |
| Envío duplicado por reintento | Clave de idempotencia comprobada antes de publicar |
| La app de LinkedIn / X no llega aprobada a tiempo | Mock por defecto; el código real ya escrito espera activación |
| El scheduler no corre en local con la app apagada | Documentado; "publicar ahora" cubre la demo en vivo |
| Confundir métricas mock con reales en la etapa 5 | Campo `publisher_usado` en cada ejecución |

## 11. Decisiones cerradas

| # | Pregunta | Resultado |
|---|---|---|
| 1 | ¿Qué se ejecuta de verdad? | **Email real** + social real **cuando haya despliegue**; ads siempre mock |
| 2 | ¿Cómo se aprueba? | **Doble paso**: revisión pieza a pieza, luego programación |
| 3 | ¿Dónde se despliega? | **Local por ahora** (doc 00 §8) |
| 4 | ¿Cómo se programa la ejecución? | Worker en background cada 60 s + "publicar ahora" |
| 5 | ¿Cómo se evitan duplicados? | Clave de idempotencia por ejecución |
| 6 | ¿Dónde vive la landing? | Servida por la app en `/l/{token}` |

**Punto que requiere tu atención:** la publicación social real necesita un
despliegue con HTTPS y una app aprobada por la plataforma. Está diseñado para que
sea un cambio de variable de entorno, pero el trámite de aprobación conviene
iniciarlo pronto.
