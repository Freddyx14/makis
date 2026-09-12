# 🍣 Makis OS — Resumen Visual Ejecutivo
> **Guía Rápida de 2 Minutos para el Equipo Maki Acevichado**  
> **Hackathon:** "Agents, Everywhere" (AI Tinkerers 2026)  
> **Documento Maestro:** [`PRD.md`](./PRD.md) · **Rúbrica 20/20:** [`HACKATHON_RUBRIC.md`](./HACKATHON_RUBRIC.md)

---

## 🎯 En Una Sola Frase

> **Makis saca al agente del chatbox para convertirlo en una agencia autónoma de marketing que investiga con Exa, genera piezas multimodales con OpenAI, permite revisión humana in-line y aprende de sus métricas en un bucle cerrado.**

---

## 🗺️ El Pipeline de 5 Fases (De un Vistazo)

```
 [ 1. ENTRADA ] ───► [ 2. INVESTIGACIÓN ] ───► [ 3. CREATIVIDAD ] ───► [ 4. APROBACIÓN ] ───► [ 5. ANALÍTICA ]
  Director IA          Exa Search + Web         OpenAI + DALL-E         Human-in-the-Loop       Chart.js Metrics
  URL + Objetivo       Competidores & KPIs      Posts, Ads, Landing     Revisar/Editar/Resend   ROAS, CPL, Leads
        ▲                                                                                              │
        └─────────────────────────── 🔁 APRENDIZAJE CONTINUO ──────────────────────────────────────────┘
```

---

## 📦 Tarjetas de Cada Fase

### 🟣 FASE 1: Entrada y Dirección
* **Qué hace:** El usuario solo ingresa 3 datos simples.
* **Input:** `URL de la empresa` + `Objetivo de campaña` + `Presupuesto`.
* **Output:** `Brief Maestro JSON` validado y estructurado.
* **Herramientas:** `FastAPI` · `HTML/CSS/JS` · `OpenAI Agents SDK`.
* **Lead:** **Diego / Joel**.

---

### 🔵 FASE 2: Investigación y Estrategia
* **Qué hace:** Escaneo competitivo en tiempo real en la web sin que el usuario busque nada.
* **Input:** Brief Maestro.
* **Output:** Análisis de competidores, arquetipo de cliente, oferta ganadora y canales.
* **Herramientas:** `Exa Search API` (¡puntos para premios Exa!) · `Web Scraping` · `OpenAI API`.
* **Lead:** **Diego**.

---

### 🟠 FASE 3: Contenido y Creatividades
* **Qué hace:** Genera todo el material publicitario visual y escrito en segundos.
* **Input:** Estrategia aprobada.
* **Output:** 
  - 📝 Copies para redes y guiones 9:16.
  - 📧 Secuencia de email marketing.
  - 🎨 Imágenes publicitarias llamativas generadas con IA.
  - 🌐 Plantilla HTML de landing page.
* **Herramientas:** `OpenAI API` · `OpenAI Image API (DALL-E 3)` · `Plantillas HTML`.
* **Lead:** **Freddy**.

---

### 🟢 FASE 4: Aprobación y Ejecución (Human-in-the-Loop)
* **Qué hace:** El humano toma el control: edita in-line o aprueba con 1 clic.
* **Input:** Creatividades de la Fase 3.
* **Features Clave:**
  - ✏️ **Edición en pantalla:** Puedes cambiar un gancho o titular al instante.
  - 🔁 **Segunda Ejecución:** Opción de re-generar con feedback específico.
  - 🚀 **Ejecución Real:** Envío real de correo con **Resend** + Mocks de Google/Meta Ads.
* **Herramientas:** `SQLite` · `Resend API` · `Mocks Google Ads / Meta`.
* **Lead:** **Milu**.

---

### 🔷 FASE 5: Analítica y Optimización (El Bucle Cerrado)
* **Qué hace:** Mide el rendimiento y alimenta el aprendizaje para la siguiente campaña.
* **Input:** Campaña publicada y tráfico simulado.
* **Output:** Gráficos de conversión (Leads, CPL, ROAS) + "Aprendizaje Clave".
* **El Cierre del Loop:** Si el gancho acebichado tuvo mejor ROAS, se guarda en SQLite y la Fase 2 arranca la próxima vez sabiendo qué funciona.
* **Herramientas:** `SQLite` · `Chart.js` · `Dataset simulado`.
* **Lead:** **Joel**.

---

## 👥 Quién Hace Qué en el Equipo

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┬─────────────────────────┐
│     JOEL ESPINOZA       │       DIEGO CELIS       │       MILUSKA R.        │      FREDDY ÑAÑEZ       │
│      (Team Lead)        │     (Backend & Data)    │    (Frontend & UI)      │   (Product & Pitch)     │
├─────────────────────────┼─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ · Orquestación general  │ · API FastAPI backend   │ · Dashboard interactivo │ · Copies, prompts y ads │
│ · OpenAI Agents SDK     │ · Exa Search API        │ · Modal de revisión     │ · Imágenes con DALL-E   │
│ · SQLite & Chart.js     │ · Web scraping de URLs  │ · Edición in-line       │ · Storytelling y pitch  │
│ · Loop de aprendizaje   │ · Formato JSON de briefs│ · Integración Resend    │ · Demo interactiva      │
└─────────────────────────┴─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

## ⏱️ El Demo de 3 Minutos para Ganar el Hackathon

| Tiempo | Qué se ve en pantalla | Qué se dice al jurado |
|---|---|---|
| **0:00 – 0:30** | Portada limpia de Makis | *"Los agentes deben salir del chatbox. Hoy el marketing exige 5 herramientas desconectadas. Makis lo automatiza de punta a punta."* |
| **0:30 – 1:15** | Input de `makis.pe` ➔ Búsqueda en vivo con Exa | *"Solo ingresas la URL. Exa busca competidores y tendencias de sushi en Lima en tiempo real."* |
| **1:15 – 2:00** | Copies + Imágenes generadas + Edición en vivo | *"Aquí están los anuncios y la imagen de DALL-E. El humano edita una frase y aprueba con un clic: el correo sale en vivo vía Resend."* |
| **2:00 – 2:40** | Gráficas con Chart.js ➔ Flecha de aprendizaje | *"El sistema simula conversiones, detecta el gancho ganador y retroalimenta la estrategia para la próxima campaña."* |
| **2:40 – 3:00** | Arquitectura y cierre | *"No es un bot que habla; es un sistema agéntico que ejecuta y aprende."* |

---

## 🏆 Checklist para Asegurar los Premios

- [x] **Tema Oficial cumplido:** 100% fuera del chatbox (UI de dashboard y herramientas reales).
- [x] **Premio OpenAI ($10K créditos):** Usando OpenAI API + OpenAI Agents SDK + Image API.
- [x] **Premio Exa ($1K créditos):** Usando Exa Search en la Fase 2 de investigación.
- [x] **Human-in-the-Loop:** Edición in-line y 1-click execution para máxima confiabilidad.
