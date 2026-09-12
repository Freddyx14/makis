const $ = (q, root = document) => root.querySelector(q);
const $$ = (q, root = document) => [...root.querySelectorAll(q)];
const state = {
  id: null,
  data: null,
  campaigns: [],
  tab: "brief",
  version: null,
  busy: false,
  dirty: false,
  session: null,
  timer: null,
};
const initialEmpty = $("#tab-content").innerHTML;
const statuses = {
  draft: "Borrador",
  generating: "En proceso",
  review: "Por revisar",
  ready_for_research: "Aprobado",
  error: "Error · reintentar",
  needs_description: "Necesita contexto",
};
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const date = (value) =>
  new Date(value).toLocaleString("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const money = (b) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: b.moneda,
  }).format(Number(b.importe));
let toastTimer;
function toast(text, error = false) {
  const el = $("#toast");
  el.textContent = text;
  el.className = "toast" + (error ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 6500);
}
async function api(path, options = {}) {
  const response = await fetch("/api" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const body = await response.json();
  if (!response.ok) {
    if (response.status === 401 && !$("#login-dialog").open)
      $("#login-dialog").showModal();
    const message = Array.isArray(body.detail)
      ? body.detail.map((e) => `${e.loc.at(-1)}: ${e.msg}`).join(" · ")
      : body.detail;
    throw new Error(
      message || "No pudimos completar la solicitud. Inténtalo otra vez.",
    );
  }
  return body;
}
function post(path, body) {
  return api(path, { method: "POST", body: JSON.stringify(body) });
}
function activeVersion() {
  return (
    state.data?.versions.find((v) => v.version === state.version) ||
    state.data?.versions[0]
  );
}
function currentVersion() {
  return state.data?.versions[0]?.version || 0;
}
function notice(text) {
  $("#action-notice").textContent = text;
  $("#action-notice").classList.toggle("hidden", !text);
}
function dialog(title, html) {
  $("#dialog-title").textContent = title;
  $("#dialog-body").innerHTML = html;
  $("#info-dialog").showModal();
}
function safeUrl(url) {
  try {
    const p = new URL(url);
    return ["https:", "http:"].includes(p.protocol) ? p.href : null;
  } catch {
    return null;
  }
}
function campaignTitle(c) {
  try {
    return new URL(c.input.url).hostname.replace(/^www\./, "");
  } catch {
    return "Campaña";
  }
}
function listHtml() {
  return (
    state.campaigns
      .map(
        (c) =>
          `<button class="campaign-item ${c.id === state.id ? "selected" : ""}" data-campaign="${esc(c.id)}"><span class="campaign-symbol">${esc(campaignTitle(c)[0].toUpperCase())}</span><span><strong>${esc(campaignTitle(c))}</strong><small>${esc(statuses[c.status] || c.status)}</small></span></button>`,
      )
      .join("") ||
    '<p class="sidebar-empty">Tus ideas empiezan aquí.<br>Crea tu primera campaña.</p>'
  );
}
async function loadCampaigns() {
  state.campaigns = await api("/campaigns");
  $("#campaign-list").innerHTML = listHtml();
  $("#count-campaigns").textContent = state.campaigns.length;
  $("#count-approved").textContent = state.campaigns.filter(
    (c) => c.status === "ready_for_research",
  ).length;
}
function allowLeave() {
  return (
    !state.dirty ||
    window.confirm("Tienes correcciones sin guardar. ¿Quieres descartarlas?")
  );
}
function newCampaign() {
  if (!allowLeave()) return;
  clearTimeout(state.timer);
  Object.assign(state, {
    id: null,
    data: null,
    tab: "brief",
    version: null,
    dirty: false,
    busy: false,
  });
  $("#campaign-form").reset();
  $$("input,textarea,select", $("#campaign-form")).forEach(
    (el) => (el.disabled = false),
  );
  $("#manual").required = false;
  $(".manual-details").open = false;
  $("#generate-button").textContent = "Generar brief maestro →";
  $("#generate-button").disabled = false;
  $("#job-box").classList.add("hidden");
  notice("");
  $("#status-badge").className = "badge neutral";
  $("#status-badge").textContent = "Por empezar";
  $("#count-versions").textContent = "0";
  $("#count-gaps").textContent = "—";
  $("#version-count").textContent = "0";
  $("#source-count").textContent = "0";
  render();
  $("#campaign-list").innerHTML = listHtml();
  $("#url").focus();
  history.replaceState(null, "", "/");
}
function fillInput(input) {
  for (const [key, value] of Object.entries(input)) {
    if (key === "objetivo")
      $$('[name="objetivo"]').forEach(
        (el) => (el.checked = el.value === value),
      );
    else {
      const el = $(`[name="${key}"]`);
      if (el) el.value = value;
    }
  }
}
async function openCampaign(id) {
  if (id !== state.id && !allowLeave()) return;
  clearTimeout(state.timer);
  state.id = id;
  state.dirty = false;
  state.version = null;
  state.tab = "brief";
  history.replaceState(null, "", "/?campaign=" + encodeURIComponent(id));
  $("#manual").value = "";
  await refresh();
  fillInput(state.data.campaign.input);
  $("#campaign-list").innerHTML = listHtml();
}
async function refresh() {
  const id = state.id;
  if (!id) return;
  const result = await api(`/campaigns/${id}/brief`);
  if (state.id !== id) return;
  state.data = result;
  state.busy = result.campaign.status === "generating";
  const status = result.campaign.status;
  $("#status-badge").textContent = statuses[status] || status;
  $("#status-badge").className =
    "badge " +
    (status === "ready_for_research"
      ? "approved"
      : status === "error"
        ? "error"
        : status === "review"
          ? "review"
          : "neutral");
  $("#count-versions").textContent = result.versions.length;
  $("#version-count").textContent = result.versions.length;
  $("#count-gaps").textContent =
    result.versions[0]?.contenido.huecos.length ?? "—";
  const run = result.runs.find((r) => r.input.extraction);
  $("#source-count").textContent = run?.input?.extraction?.pages?.length || 0;
  const job = result.jobs[0];
  $("#job-box").classList.toggle("hidden", !state.busy);
  if (job) {
    $("#job-message").textContent = job.message;
    $("#job-progress").value = job.progress;
  }
  $$("input,textarea,select", $("#campaign-form")).forEach(
    (el) => (el.disabled = true),
  );
  $("#manual").disabled = state.busy;
  $("#generate-button").disabled = state.busy || !!result.versions.length;
  $("#generate-button").textContent = state.busy
    ? "Analizando tu negocio…"
    : result.versions.length
      ? "Brief generado · revisa a la derecha"
      : "Reintentar generación →";
  if (status === "needs_description") {
    notice(job.message);
    $(".manual-details").open = true;
    $("#manual").required = true;
  } else {
    $("#manual").required = false;
    notice(status === "error" ? job?.message : "");
  }
  render();
  if (state.busy)
    state.timer = setTimeout(
      () =>
        refresh().catch((error) => {
          notice(error.message + " Intentaremos reconectar.");
          state.timer = setTimeout(
            () => refresh().catch((e) => toast(e.message, true)),
            5000,
          );
        }),
      1800,
    );
  else await loadCampaigns();
}
function options(values, selected) {
  return Object.entries(values)
    .map(
      ([v, label]) =>
        `<option value="${v}" ${selected === v ? "selected" : ""}>${label}</option>`,
    )
    .join("");
}
function claimField(key, label, claim, readOnly) {
  const off = readOnly ? "disabled" : "";
  return `<section class="brief-section"><h4>${label}</h4><textarea data-path="${key}.texto" rows="3" maxlength="6000" ${off}>${esc(claim.texto)}</textarea><div class="evidence-row"><label>Origen<select data-path="${key}.origen" ${off}>${options({ web: "Fuente web", usuario: "Dato del usuario", hipotesis: "Hipótesis · por validar" }, claim.origen)}</select></label><label>Confianza<select data-path="${key}.confianza" ${off}>${options({ alta: "Alta", media: "Media", baja: "Baja" }, claim.confianza)}</select></label></div><input class="source-input" data-path="${key}.fuentes" data-list="true" aria-label="Fuentes de ${label}" value="${esc(claim.fuentes.join(", "))}" placeholder="URLs de respaldo, separadas por comas" ${off}></section>`;
}
function briefHtml() {
  const version = activeVersion();
  if (!version) return initialEmpty;
  const b = version.contenido,
    historic = version.version !== currentVersion(),
    readOnly = historic || state.busy;
  const off = readOnly ? "disabled" : "";
  const source = {
    demo: "Simulación por reglas · sin generación con IA",
    ia: "Generado por el Director IA",
    humano: "Revisión humana",
  }[version.source];
  return `<div class="brief-intro"><h3>Una dirección para tu idea.</h3><span class="version-label">VERSIÓN ${version.version}</span></div><small>${esc(source)} · ${date(version.created_at)}</small>
  ${historic ? '<div class="notice">Estás consultando una versión histórica. <button class="button secondary" data-latest>Volver a la actual</button></div>' : ""}
  ${version.aprobado_at ? `<div class="approval-banner"><strong>✓ Versión aprobada</strong>${historic ? "Esta aprobación pertenece a una versión anterior." : "Brief preparado para Investigación. La etapa 2 se incorporará con la siguiente funcionalidad."}</div>` : ""}
  ${state.data.versions.some((v) => v.source === "demo") && !state.data.runs.some((r) => r.model && !r.model.startsWith("demo-") && r.status === "completed") ? '<p class="analysis-note">Este brief es una plantilla de demostración, no un análisis de IA. Úsalo para evaluar el flujo y sus campos.</p>' : '<p class="analysis-note">Revisa cada afirmación. Una fuente respalda el contexto, pero no garantiza que todas las inferencias sean correctas.</p>'}
  <div class="budget-summary"><strong>${money(b.presupuesto)}</strong><span>Presupuesto total<br>${b.presupuesto.duracion_semanas} semanas · metas numéricas en etapa 2</span></div>
  <form id="brief-form">
  ${claimField("negocio", "01 · Negocio y oferta", b.negocio, readOnly)}
  ${claimField("publico_objetivo", "02 · Público objetivo", b.publico_objetivo, readOnly)}
  ${claimField("propuesta_valor", "03 · Propuesta de valor", b.propuesta_valor, readOnly)}
  <section class="brief-section"><h4>04 · Objetivo de campaña</h4><label>Tipo<select data-path="objetivo.tipo" ${off}>${options({ leads: "Leads", ventas: "Ventas", awareness: "Reconocimiento de marca", trafico: "Tráfico" }, b.objetivo.tipo)}</select></label><label>Métrica principal<input data-path="objetivo.metrica_principal" required maxlength="500" value="${esc(b.objetivo.metrica_principal)}" ${off}></label><label>Enfoque<textarea data-path="objetivo.enfoque" maxlength="3000" required ${off}>${esc(b.objetivo.enfoque)}</textarea></label><p class="field-hint">La meta numérica se define con benchmarks en la etapa 2.</p></section>
  <section class="brief-section"><h4>05 · Presupuesto y duración</h4><div class="form-row"><label>Importe total<input data-path="presupuesto.importe" type="number" step="0.01" min="0.01" max="100000000" required value="${b.presupuesto.importe}" ${off}></label><label>Moneda<select data-path="presupuesto.moneda" ${off}>${options({ PEN: "PEN", USD: "USD", EUR: "EUR" }, b.presupuesto.moneda)}</select></label></div><label>Duración (semanas)<input data-path="presupuesto.duracion_semanas" type="number" min="1" max="104" required value="${b.presupuesto.duracion_semanas}" ${off}></label><label>Reparto sugerido<textarea data-path="presupuesto.reparto_sugerido" maxlength="2000" required ${off}>${esc(b.presupuesto.reparto_sugerido)}</textarea></label></section>
  ${claimField("tono", "06 · Voz y tono", b.tono, readOnly)}
  <section class="brief-section"><h4>07 · Restricciones</h4><textarea data-path="restricciones" maxlength="3000" ${off}>${esc(b.restricciones)}</textarea></section>
  <section class="brief-section"><h4>08 · Pendientes para investigar</h4><textarea data-path="huecos" rows="5" data-lines="true" required ${off}>${esc(b.huecos.join("\n"))}</textarea><p class="field-hint">Un pendiente por línea. Será la entrada de la etapa 2.</p></section>
  <div class="brief-actions"><button type="submit" class="button secondary" ${off}>Guardar nueva versión</button><button type="button" id="approve-brief" class="button primary" ${off} ${version.aprobado_at ? "disabled" : ""}>Aprobar brief <span>→</span></button></div>
  </form>
  <button class="json-export" id="export-brief">↓ Descargar esta versión en JSON</button>
  ${!historic ? `<details class="regenerate"><summary>Regenerar con nuevas instrucciones</summary><p class="field-hint">Partirá del input original y conservará las versiones anteriores. En modo demo, las instrucciones se registran como pendientes de revisión.</p><textarea id="regenerate-instructions" maxlength="3000" placeholder="Por ejemplo: enfócate en B2B y evita un tono demasiado informal." ${off}></textarea><button id="regenerate-brief" class="button secondary" ${off}>Generar otra versión ↻</button></details>` : ""}`;
}
function sourcesHtml() {
  const extraction = state.data?.runs.find((r) => r.input.extraction)?.input
    .extraction;
  if (!extraction)
    return '<div class="empty-tab">Las fuentes aparecerán cuando se analice tu negocio.</div>';
  const pages = extraction.pages || [];
  return `<h3 class="small-heading">El contexto detrás del brief</h3><p class="analysis-note">${pages.length} páginas leídas de ${extraction.discovered ?? 0} URLs descubiertas. ${extraction.attempted ?? 0} exploradas. Cobertura ${extraction.limited ? "parcial por límite" : "de enlaces accesibles; puede haber páginas no descubiertas"}.<br>Estos datos corresponden a la última ejecución.</p>
  ${(extraction.warnings || []).map((w) => `<div class="source-card">${esc(w)}</div>`).join("")}
  ${extraction.manual ? `<article class="source-card"><h4>Descripción aportada</h4><p>Fuente: usuario o ejemplo ficticio indicado en la ejecución.</p><pre>${esc(extraction.manual)}</pre></article>` : ""}
  ${pages.map((p) => `<article class="source-card"><div class="mini-meta"><span>${esc(p.method)}</span><span>CONTEXTO WEB</span></div><h4>${esc(p.title)}</h4>${safeUrl(p.url) ? `<a href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener noreferrer">${esc(p.url)} ↗</a>` : esc(p.url)}<details><summary>Ver texto extraído</summary><pre>${esc(p.text)}</pre></details></article>`).join("")}`;
}
function historyHtml() {
  const versions = state.data?.versions || [];
  if (!versions.length)
    return '<div class="empty-tab">Cada generación y cada corrección se conservarán aquí.<br>Podrás comparar cómo evoluciona tu idea.</div>';
  return (
    '<h3 class="small-heading">La evolución de tu brief</h3><p class="analysis-note">Las versiones anteriores se conservan completas. Aprobar siempre se aplica a la versión actual.</p>' +
    versions
      .map((v, i) => {
        const previous = versions[i + 1];
        const changes = previous
          ? Object.keys(v.contenido).filter(
              (k) =>
                JSON.stringify(v.contenido[k]) !==
                JSON.stringify(previous.contenido[k]),
            )
          : [];
        return `<article class="history-card"><div class="mini-meta"><span>${date(v.created_at)}</span><span>${v.aprobado_at ? "✓ APROBADA" : v.source.toUpperCase()}</span></div><h4>Versión ${v.version} ${i === 0 ? "· actual" : ""}</h4><div>${previous ? changes.length + " apartados modificados respecto a v" + previous.version : "Primera propuesta del brief"}</div><button class="button secondary" data-version="${v.version}">Ver versión</button>${previous ? `<button class="button secondary" data-compare="${v.version}">Comparar cambios</button>` : ""}</article>`;
      })
      .join("")
  );
}
function traceHtml() {
  const runs = state.data?.runs || [];
  if (!runs.length)
    return '<div class="empty-tab">Las ejecuciones del Director aparecerán aquí:<br>entrada, salida, modelo, tokens y duración.</div>';
  return (
    '<h3 class="small-heading">Cada decisión, con contexto</h3><p class="analysis-note">Datos de ejecución persistidos para inspeccionar el trabajo del Director.</p>' +
    runs
      .map(
        (r) =>
          `<article class="trace-card"><div class="mini-meta"><span>${date(r.created_at)}</span><span>${esc(r.status)}</span></div><h4>Director · Entrada y dirección</h4><p>${esc(r.model)}<br>${r.duration} s · ${r.tokens == null ? "Tokens no reportados" : r.tokens + " tokens"}</p><details><summary>Inspeccionar entrada y salida JSON</summary><pre>${esc(JSON.stringify({ input: r.input, output: r.output }, null, 2))}</pre></details></article>`,
      )
      .join("")
  );
}
function render() {
  $$(".tab").forEach((el) =>
    el.classList.toggle("active", el.dataset.tab === state.tab),
  );
  $("#tab-content").innerHTML = {
    brief: briefHtml,
    sources: sourcesHtml,
    history: historyHtml,
    trace: traceHtml,
  }[state.tab]();
  const example = $("#try-example");
  if (example) example.disabled = state.busy;
}
function readBrief() {
  const brief = structuredClone(activeVersion().contenido);
  $$("[data-path]", $("#brief-form")).forEach((el) => {
    const parts = el.dataset.path.split("."),
      key = parts.pop();
    let target = brief;
    parts.forEach((p) => (target = target[p]));
    target[key] = el.dataset.list
      ? el.value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : el.dataset.lines
        ? el.value
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : el.type === "number" && key !== "importe"
          ? Number(el.value)
          : el.value;
  });
  return brief;
}
async function saveBrief() {
  if (!$("#brief-form").reportValidity()) return false;
  const result = await api(`/campaigns/${state.id}/brief`, {
    method: "PATCH",
    body: JSON.stringify({
      expected_version: currentVersion(),
      contenido: readBrief(),
    }),
  });
  state.dirty = false;
  state.version = result.version;
  await refresh();
  toast("Nueva versión guardada. El historial anterior se conserva.");
  return true;
}
async function generate(example = false, instructions = "") {
  if (state.busy) return;
  if (state.dirty && !allowLeave()) return;
  state.busy = true;
  $("#generate-button").disabled = true;
  try {
    if (!state.id) {
      const input = Object.fromEntries(new FormData($("#campaign-form")));
      input.duracion_semanas = Number(input.duracion_semanas);
      const created = await post("/campaigns", input);
      state.id = created.id;
      history.replaceState(
        null,
        "",
        "/?campaign=" + encodeURIComponent(state.id),
      );
    }
    await post(`/campaigns/${state.id}/brief`, {
      expected_version: currentVersion(),
      ejemplo: example,
      descripcion_manual: $("#manual").value,
      instrucciones: instructions,
    });
    state.dirty = false;
    state.version = null;
    state.tab = "brief";
    await refresh();
  } catch (error) {
    state.busy = false;
    $("#generate-button").disabled = false;
    toast(error.message, true);
    if (state.id) await refresh().catch(() => {});
  }
}
async function tryExample() {
  if (!allowLeave()) return;
  state.dirty = false;
  newCampaign();
  fillInput({
    url: "https://kintu.example",
    objetivo: "ventas",
    detalle:
      "Aumentar las suscripciones mensuales de café de especialidad en Lima.",
    presupuesto: "2500",
    moneda: "PEN",
    duracion_semanas: 4,
    publico:
      "Personas de Lima que disfrutan preparar café de especialidad en casa.",
    notas: "Tono cercano. Evitar descuentos agresivos y promesas de salud.",
  });
  await generate(true);
}
function compare(version) {
  const versions = state.data.versions,
    at = versions.findIndex((v) => v.version === version),
    a = versions[at + 1],
    b = versions[at];
  const changes = Object.keys(b.contenido).filter(
    (k) => JSON.stringify(a.contenido[k]) !== JSON.stringify(b.contenido[k]),
  );
  dialog(
    `Comparación · v${a.version} → v${b.version}`,
    changes.length
      ? changes
          .map(
            (k) =>
              `<h4>${esc(k.replaceAll("_", " "))}</h4><div class="difference"><div><small>ANTES</small><pre class="diff-value">${esc(JSON.stringify(a.contenido[k], null, 2))}</pre></div><div><small>DESPUÉS</small><pre class="diff-value">${esc(JSON.stringify(b.contenido[k], null, 2))}</pre></div></div>`,
          )
          .join("")
      : "<p>No hay cambios en el contenido de estas dos versiones.</p>",
  );
}
$("#campaign-form").addEventListener("submit", (e) => {
  e.preventDefault();
  generate();
});
$("#tab-content").addEventListener("input", (e) => {
  if (e.target.closest("#brief-form")) state.dirty = true;
});
$("#tab-content").addEventListener("submit", async (e) => {
  if (e.target.id === "brief-form") {
    e.preventDefault();
    const btn = e.submitter;
    btn.disabled = true;
    try {
      await saveBrief();
    } catch (error) {
      toast(error.message, true);
      btn.disabled = false;
    }
  }
});
document.addEventListener("click", async (e) => {
  const button = e.target.closest("button");
  if (!button || button.disabled) return;
  try {
    if (button.dataset.campaign) {
      if ($("#info-dialog").open) $("#info-dialog").close();
      await openCampaign(button.dataset.campaign);
    }
    if (button.dataset.tab) {
      if (button.dataset.tab !== state.tab && !allowLeave()) return;
      state.dirty = false;
      state.tab = button.dataset.tab;
      render();
    }
    if (button.dataset.version) {
      state.version = Number(button.dataset.version);
      state.tab = "brief";
      render();
    }
    if (button.hasAttribute("data-latest")) {
      state.version = null;
      render();
    }
    if (button.dataset.compare) compare(Number(button.dataset.compare));
    if (["new-campaign", "sidebar-new"].includes(button.id)) newCampaign();
    if (button.id === "workspace-nav")
      window.scrollTo({ top: 0, behavior: "smooth" });
    if (button.id === "try-example") await tryExample();
    if (button.id === "all-campaigns") {
      await loadCampaigns();
      dialog("Mis campañas", listHtml());
    }
    if (button.id === "approve-brief") {
      button.disabled = true;
      if (state.dirty && !(await saveBrief())) {
        button.disabled = false;
        return;
      }
      await post(`/campaigns/${state.id}/brief/approve`, {
        expected_version: currentVersion(),
      });
      await refresh();
      toast("Brief aprobado y preparado para la etapa 2.");
    }
    if (button.id === "regenerate-brief") {
      const last = state.data.runs[0];
      const example =
        state.data.campaign.input.url === "https://kintu.example/";
      if (last?.input?.extraction?.manual && !example)
        $("#manual").value = last.input.extraction.manual;
      await generate(example, $("#regenerate-instructions").value);
    }
    if (button.id === "export-brief") {
      const v = activeVersion();
      const blob = new Blob([JSON.stringify(v, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `makis-brief-v${v.version}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    if (button.id === "dialog-close") $("#info-dialog").close();
    if (button.id === "architecture-open")
      dialog(
        "Una campaña, cinco etapas",
        [
          [
            "01",
            "Entrada y dirección",
            "URL + objetivo + presupuesto → brief maestro. Director, fuentes, revisión y aprobación humana. Disponible.",
          ],
          [
            "02",
            "Investigación y estrategia",
            "Brief aprobado + investigación → estrategia. Pendiente del siguiente documento.",
          ],
          [
            "03",
            "Generación de contenido",
            "Estrategia → piezas de contenido. Pendiente.",
          ],
          [
            "04",
            "Ejecución",
            "Piezas aprobadas → acciones y envíos. Pendiente.",
          ],
          [
            "05",
            "Métricas y aprendizaje",
            "Resultados → aprendizaje que alimenta nuevas estrategias. Pendiente.",
          ],
        ]
          .map(
            ([n, title, text]) =>
              `<div class="architecture-step"><span>${n}</span><div><strong>${title}</strong><p>${text}</p></div></div>`,
          )
          .join(""),
      );
    if (button.id === "config-open")
      dialog(
        "Conexiones y acceso",
        `<p><strong>Director:</strong> ${esc(state.session.provider)}.</p><p>La extracción usa Exa cuando hay una clave configurada y lectura HTML como respaldo. Se recorren hasta ${state.session.crawl_limit} páginas internas, dentro del tiempo configurado. La cobertura se muestra en Fuentes.</p><p>Para conectar un modelo, configura en el archivo local <code>.env</code>: <code>LLM_PROVIDER=compatible</code>, <code>LLM_BASE_URL</code>, <code>LLM_MODEL</code> y <code>LLM_API_KEY</code>. Reinicia el servidor. No se muestran claves en esta pantalla.</p><p>Acceso: ${state.session.password_required ? "protegido con contraseña" : "local en este equipo"}. Tus campañas pertenecen a la sesión de este navegador. Para conservar sesiones tras reiniciar, configura <code>APP_SECRET</code>.</p>`,
      );
  } catch (error) {
    toast(error.message, true);
    button.disabled = false;
  }
});
$("#login-dialog").addEventListener("cancel", (e) => e.preventDefault());
$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await post("/login", { password: $("#password").value });
    $("#password").value = "";
    $("#login-dialog").close();
    await init();
  } catch (error) {
    $("#login-error").textContent = error.message;
  }
});
window.addEventListener("beforeunload", (e) => {
  if (state.dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
async function init() {
  state.session = await api("/session");
  $("#provider-label").textContent = state.session.provider;
  if (!state.session.authenticated) {
    $("#login-dialog").showModal();
    return;
  }
  await loadCampaigns();
  const cid = new URL(location.href).searchParams.get("campaign");
  if (cid) await openCampaign(cid);
}
init().catch((error) => toast(error.message, true));
