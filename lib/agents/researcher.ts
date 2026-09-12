/**
 * Agente Investigador — Acto INVESTIGAR.
 *
 * Tres fases:
 *   1. readSite() → lectura del sitio del negocio
 *   2. findCompetitors() → identificación de competidores
 *   3. investigate() → hallazgos de mercado con evidencia
 *
 * Cada fase es un paso en `agent_steps` para que el cockpit pinte el
 * progreso en vivo.
 */

import { randomUUID } from "node:crypto";

import { readSite, findCompetitors, investigate } from "../exa";
import { saveStep, now, newId } from "../db";
import type { AgentStep, Finding, Competitor, Source } from "../types";
import type { PipelineContext, AgentResult } from "./types";

export async function researcher(
  ctx: PipelineContext,
): Promise<AgentResult> {
  const wsId = ctx.workspace.id;
  const baseUrl = ctx.workspace.url;

  // Paso 1: Leer sitio
  const step1: AgentStep = {
    id: newId("step"),
    workspace_id: wsId,
    act: "investigar",
    agent: "researcher",
    name: "Lectura del sitio",
    status: "running",
    detail: `Leyendo ${baseUrl}`,
    sources: [],
    tokens_in: 0,
    tokens_out: 0,
    started_at: now(),
  };
  await saveStep(step1);

  let siteText: string;
  let siteSources: Source[];
  try {
    const result = await readSite(baseUrl);
    siteText = result.text;
    siteSources = result.sources;
    step1.status = "done";
    step1.sources = siteSources;
    step1.detail = `Leído: ${siteText.length} caracteres`;
  } catch (e) {
    step1.status = "failed";
    step1.detail = `Error leyendo sitio: ${(e as Error).message}`;
    siteText = "";
    siteSources = [];
  }
  step1.finished_at = now();
  await saveStep(step1);

  // Paso 2: Buscar competidores
  const step2: AgentStep = {
    id: newId("step"),
    workspace_id: wsId,
    act: "investigar",
    agent: "researcher",
    name: "Búsqueda de competidores",
    status: "running",
    detail: "Buscando empresas similares...",
    sources: [],
    tokens_in: 0,
    tokens_out: 0,
    started_at: now(),
  };
  await saveStep(step2);

  let competitors: Competitor[];
  let competitorSources: Source[];
  try {
    const desc = `${ctx.brief.profile.offer} — ${ctx.brief.profile.categories.join(", ")}`;
    const result = await findCompetitors(desc, {
      market: ctx.workspace.market,
      numResults: 5,
    });
    competitors = result.competitors;
    competitorSources = result.sources;
    step2.status = "done";
    step2.sources = competitorSources;
    step2.detail = `${competitors.length} competidores encontrados`;
  } catch (e) {
    step2.status = "failed";
    step2.detail = `Error buscando competidores: ${(e as Error).message}`;
    competitors = [];
    competitorSources = [];
  }
  step2.finished_at = now();
  await saveStep(step2);

  // Paso 3: Hallazgos de mercado
  const step3: AgentStep = {
    id: newId("step"),
    workspace_id: wsId,
    act: "investigar",
    agent: "researcher",
    name: "Análisis de mercado",
    status: "running",
    detail: "Investigando tendencias y audiencia...",
    sources: [],
    tokens_in: 0,
    tokens_out: 0,
    started_at: now(),
  };
  await saveStep(step3);

  let findings: Finding[] = [];
  let findingSources: Source[] = [];
  try {
    const topics = [
      `Tendencias del mercado de ${ctx.brief.profile.categories.join(", ")} en ${ctx.workspace.market || "general"}`,
      `Audiencia objetivo para ${ctx.brief.profile.offer}`,
      `Canales de marketing más efectivos para ${ctx.brief.profile.categories.join(", ")}`,
    ];

    for (const topic of topics) {
      const result = await investigate(topic, {
        category: topic.includes("Tendencias") ? "tendencias" :
                  topic.includes("Audiencia") ? "audiencia" : "contenido",
      });
      findings = [...findings, ...result];
    }

    findingSources = [...siteSources, ...competitorSources];
    step3.status = "done";
    step3.sources = findingSources;
    step3.detail = `${findings.length} hallazgos identificados`;
  } catch (e) {
    step3.status = "failed";
    step3.detail = `Error investigando: ${(e as Error).message}`;
  }
  step3.finished_at = now();
  await saveStep(step3);

  return {
    act: "investigar",
    agent: "researcher",
    name: "Investigación completa",
    step: step3,
    data: { findings, competitors, siteText, siteSources: findingSources },
  };
}
