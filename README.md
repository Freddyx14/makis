# Makis OS — Sistema Agéntico Autónomo de Marketing

> **Hackathon 2026:** *"Agents, Everywhere"* (AI Tinkerers)  
> **Equipo:** Maki Acevichado (Joel Espinoza · Diego Celis · Miluska R. · Freddy Ñañez)  
> **Documentos Clave:**
> - 📊 [**`RESUMEN_VISUAL.md`**](./RESUMEN_VISUAL.md) — Guía rápida de 2 minutos para el equipo (diagramas, roles y demo).
> - 📄 [**`PRD.md`**](./PRD.md) — Especificación técnica y requerimientos completos (v4.0.0).
> - 📋 [**`HACKATHON_RUBRIC.md`**](./HACKATHON_RUBRIC.md) — Rúbrica oficial 20/20 y criterios de los jueces.
> - 🛠️ [**`TECH_GUIDE.md`**](./TECH_GUIDE.md) — Snippets de código y arquitectura de integración.

---

## 🚀 La Visión: "Agents Leaving the Chatbox"

Makis saca a los agentes de IA de la típica cajita de chat para convertirlos en un **pipeline autónomo de 5 fases** con un **bucle de aprendizaje continuo**:
1. **Entrada y dirección:** URL + Objetivo + Presupuesto (FastAPI + OpenAI Agents SDK).
2. **Investigación y estrategia:** Análisis competitivo en vivo (Exa Search + Web Scraping).
3. **Contenido y creatividades:** Fábrica multimodal de copies, guiones e imágenes (OpenAI API + DALL-E 3).
4. **Aprobación y ejecución:** Espacio *Human-in-the-Loop* para editar in-line y enviar correos reales vía **Resend**.
5. **Analítica y optimización:** Medición interactiva en **Chart.js** y retroalimentación de los aprendizajes a la Fase 2.

```
 [ 1. ENTRADA ] ───► [ 2. INVESTIGACIÓN ] ───► [ 3. CREATIVIDAD ] ───► [ 4. APROBACIÓN ] ───► [ 5. ANALÍTICA ]
  Director IA          Exa Search + Web         OpenAI + DALL-E         Human-in-the-Loop       Chart.js Metrics
  URL + Objetivo       Competidores & KPIs      Posts, Ads, Landing     Revisar/Editar/Resend   ROAS, CPL, Leads
        ▲                                                                                              │
        └─────────────────────────── 🔁 APRENDIZAJE CONTINUO ──────────────────────────────────────────┘
```

---

## 👥 Quién Hace Qué en el Equipo

- **Joel Espinoza (Lead):** Orquestación general con OpenAI Agents SDK, persistencia en SQLite, analítica con Chart.js (Fase 5) y loop de aprendizaje.
- **Diego Celis:** Backend en FastAPI, integración de Exa Search API (Fase 2), scraper web y formateo de briefs (Fase 1).
- **Miluska (Milu):** Frontend interactivo, visor de creatividades, modal de revisión y edición in-line (Fase 4), y conexión con Resend.
- **Freddy Ñañez:** Lógica de negocio, prompts de copies e imágenes DALL-E (Fase 3), diseño de plantillas visuales y pitch.

---

## 🛠️ Ejecución Local

```bash
# Clonar el repositorio
git clone https://github.com/Freddyx14/makis.git
cd makis

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build
```
