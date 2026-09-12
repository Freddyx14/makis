/**
 * Director — Orquestador del pipeline completo.
 *
 * Ejecuta los 4 actos en secuencia:
 *   1. ENTRADA → extracción del perfil (ya hecho antes de llegar aquí)
 *   2. INVESTIGAR → researcher (se salta si ya existe)
 *   3. CONSTRUIR → strategist + creator
 *   4. GOBERNAR → aprobación del usuario (pausa, no agente)
 *   5. APRENDER → analyst
 *
 * SOPORTE PARA REANUDACIÓN: si el research ya existe en BD, se reutiliza
 * y se salta directamente al construir. Esto permite retries sin repetir
 * llamadas costosas a Exa.
 */

import {
  createWorkspace,
  updateWorkspace,
  setAct,
  saveBrief,
  saveStrategy,
  saveResearch,
  getResearch,
  saveArtifact,
  now,
  newId,
} from "../db";
import {
  ensureWorkspaceFolder,
  createDoc,
  appendText,
  createSheet,
  writeData,
} from "../google";
import type { Workspace, Brief, Research, Strategy, ContentPiece, Artifact, Act, RunStatus } from "../types";
import type { PipelineContext, AgentResult } from "./types";
import { researcher } from "./researcher";
import { strategist } from "./strategist";
import { creator } from "./creator";
import { analyst } from "./analyst";

// ---------------------------------------------------------------------------
// Helper: persistir artefacto en Google Workspace
// ---------------------------------------------------------------------------

async function createArtifact(
  accessToken: string,
  folderId: string,
  wsId: string,
  slot: Artifact["slot"],
  title: string,
  kind: Artifact["kind"],
  writeFn?: (token: string, docId: string) => Promise<void>,
): Promise<Artifact> {
  let url: string | null = null;

  try {
    if (kind === "google_doc") {
      const doc = await createDoc(accessToken, title, folderId);
      url = doc.docUrl;
      if (writeFn) await writeFn(accessToken, doc.docId);
    } else if (kind === "google_sheet") {
      const sheet = await createSheet(accessToken, title, folderId);
      url = sheet.sheetUrl;
    }
  } catch (e) {
    console.error(`[director] Error creando artefacto ${slot}:`, e);
  }

  const artifact: Artifact = {
    id: newId("art"),
    workspace_id: wsId,
    slot,
    kind,
    title,
    url,
    mode: url ? "real" : "mock",
    updated_at: now(),
  };

  await saveArtifact(artifact);
  return artifact;
}

// ---------------------------------------------------------------------------
// Pipeline principal
// ---------------------------------------------------------------------------

export async function runPipeline(
  workspace: Workspace,
  brief: Brief,
  accessToken: string,
): Promise<void> {
  const wsId = workspace.id;

  try {
    // ── Preparar Google Drive ──────────────────────────────────────────
    let folderId: string | null = null;
    let folderUrl: string | null = null;

    try {
      const folder = await ensureWorkspaceFolder(accessToken, workspace.name);
      folderId = folder.folderId;
      folderUrl = folder.folderUrl;
      await updateWorkspace(wsId, { drive_folder_url: folderUrl });
    } catch (e) {
      console.error("[director] Error creando carpeta Drive:", e);
    }

    // ── Acto 1: INVESTIGAR ─────────────────────────────────────────────
    // Si ya existe investigación (reanudación), se reutiliza
    let research = await getResearch(wsId);
    let researchResult;

    if (research && research.findings.length > 0) {
      console.log(`[director] Investigación existente: ${research.findings.length} hallazgos, ${research.competitors.length} competidores`);
      // Crear un researchResult virtual para pasar al strategist
      researchResult = {
        act: "investigar" as Act,
        agent: "researcher" as const,
        name: "Investigación (previa)",
        step: { id: "prev", workspace_id: wsId, act: "investigar" as Act, agent: "researcher" as const, name: "Investigación previa", status: "done" as const, sources: [], tokens_in: 0, tokens_out: 0 },
        data: { findings: research.findings, competitors: research.competitors, siteText: "", siteSources: [] },
      } as AgentResult;
    } else {
      await setAct(wsId, "investigar", "running");
      researchResult = await researcher({
        workspace,
        brief,
        accessToken,
        redirectUrl: "",
      });

      research = {
        workspace_id: wsId,
        findings: (researchResult.data as any).findings,
        competitors: (researchResult.data as any).competitors,
      };
      await saveResearch(research);
    }

    // Artefacto: Doc de investigación
    if (folderId) {
      await createArtifact(
        accessToken, folderId, wsId,
        "01-investigacion", "01 · Investigación", "google_doc",
        async (token, docId) => {
          const lines = [
            "# Investigación de Mercado",
            "",
            "## Hallazgos",
            ...research.findings.map((f) =>
              `- **[${f.confidence}]** ${f.claim}`
            ),
            "",
            "## Competidores",
            ...research.competitors.map((c) =>
              `- **${c.name}**: ${c.positioning}`
            ),
          ];
          await appendText(token, docId, lines);
        },
      );
    }

    // ── Acto 2: CONSTRUIR ──────────────────────────────────────────────
    await setAct(wsId, "construir", "running");

    // Estrategia
    const strategyResult = await strategist(
      { workspace, brief, accessToken, redirectUrl: "" },
      researchResult,
    );

    const strategy = strategyResult.data as Strategy;
    await saveStrategy(strategy);

    // Artefacto: Doc de estrategia
    if (folderId) {
      await createArtifact(
        accessToken, folderId, wsId,
        "02-estrategia", "02 · Estrategia", "google_doc",
        async (token, docId) => {
          const lines = [
            "# Estrategia de Marketing",
            "",
            `## Campaña: ${strategy.campaign}`,
            `**Oferta:** ${strategy.offer}`,
            "",
            "## Buyer Personas",
            ...strategy.personas.map((p) =>
              `### ${p.name}\n${p.description}\nDolores: ${p.pains.join(", ")}`
            ),
            "",
            "## Canales",
            ...strategy.channels.map((c) =>
              `- **${c.channel}** (${Math.round(c.budget_share * 100)}%): ${c.rationale}`
            ),
            "",
            "## KPIs",
            ...strategy.kpis.map((k) =>
              `- **${k.name}**: ${k.target} — ${k.why}`
            ),
          ];
          await appendText(token, docId, lines);
        },
      );
    }

    // Contenido
    const contentResult = await creator(
      { workspace, brief, accessToken, redirectUrl: "" },
      strategyResult,
    );

    const contentPieces = contentResult.data as ContentPiece[];

    // Artefacto: Doc de creatividades
    if (folderId) {
      await createArtifact(
        accessToken, folderId, wsId,
        "04-creatividades", "04 · Creatividades", "google_doc",
        async (token, docId) => {
          const lines = [
            "# Creatividades y Copies",
            "",
            ...contentPieces.map((p) =>
              `## ${p.title}\n**Canal:** ${p.channel} | **Tipo:** ${p.kind}\n\n${p.body}`
            ),
          ];
          await appendText(token, docId, lines);
        },
      );
    }

    // Artefacto: Sheet de calendario
    if (folderId) {
      const sheetArtifact = await createArtifact(
        accessToken, folderId, wsId,
        "03-calendario", "03 · Calendario", "google_sheet",
      );
      if (sheetArtifact.url) {
        const sheetId = sheetArtifact.url.split("/d/")[1]?.split("/")[0];
        if (sheetId) {
          try {
            await writeData(accessToken, sheetId, [
              ["Pieza", "Canal", "Tipo", "Estado"],
              ...contentPieces.map((p) => [
                p.title, p.channel, p.kind, p.approval,
              ]),
            ]);
          } catch (e) {
            console.error("[director] Error escribiendo calendario:", e);
          }
        }
      }
    }

    // ── Acto 3: GOBERNAR ───────────────────────────────────────────────
    // Pausa: espera aprobación del usuario. El cockpit muestra los
    // contenidos y el botón de aprobar/rechazar.
    await setAct(wsId, "gobernar", "awaiting_approval");

    // ── Acto 4: APRENDER ───────────────────────────────────────────────
    // Se ejecuta después de que el usuario apruebe (o directamente en demo)
    await setAct(wsId, "aprender", "running");

    const analysisResult = await analyst(
      { workspace, brief, accessToken, redirectUrl: "" },
      contentResult,
    );

    // Artefacto: Sheet de resultados
    if (folderId) {
      const analysisData = analysisResult.data as { metrics: Array<{ channel: string; leads: number; conversions: number; cpl: number; cac: number; roas: number }> };
      await createArtifact(
        accessToken, folderId, wsId,
        "05-resultados", "05 · Resultados (Mock)", "google_sheet",
      );
    }

    // Artefacto: Doc de brief (resumen)
    if (folderId) {
      await createArtifact(
        accessToken, folderId, wsId,
        "00-brief", "00 · Brief", "google_doc",
        async (token, docId) => {
          const lines = [
            "# Brief del Proyecto",
            "",
            `**Marca:** ${brief.profile.brand_name}`,
            `**Oferta:** ${brief.profile.offer}`,
            `**Categorías:** ${brief.profile.categories.join(", ")}`,
            `**Objetivo:** ${brief.objective}`,
            `**Presupuesto:** ${brief.budget ?? "No especificado"}`,
            `**Mercado:** ${workspace.market ?? "General"}`,
            "",
            "## Fuentes",
            ...brief.profile.sources.map((s) =>
              `- [${s.title}](${s.url})`
            ),
          ];
          await appendText(token, docId, lines);
        },
      );
    }

    // ── Completar ──────────────────────────────────────────────────────
    await updateWorkspace(wsId, { status: "completed" });
    await setAct(wsId, "aprender", "completed");

  } catch (e) {
    console.error("[director] Pipeline falló:", e);
    await updateWorkspace(wsId, { status: "failed" });
    throw e;
  }
}
