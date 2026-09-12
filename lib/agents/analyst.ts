/**
 * Agente Analista — Acto APRENDER.
 *
 * Genera métricas simuladas (mock) y aprendizajes para el siguiente ciclo.
 * En v1, las métricas son simuladas y claramente etiquetadas como mock.
 * En v2, se conectarían a APIs reales de Google Ads / Meta.
 */

import { generateObject } from "../llm";
import { saveStep, saveMetrics, saveLearning, now, newId } from "../db";
import { z } from "zod";
import type { AgentStep, Metric, Learning, ContentPiece } from "../types";
import type { PipelineContext, AgentResult } from "./types";

const MetricsSchema = z.object({
  metrics: z.array(z.object({
    channel: z.string(),
    leads: z.number(),
    conversions: z.number(),
    cpl: z.number(),
    cac: z.number(),
    roas: z.number(),
  })).describe("Métricas simuladas por canal"),
  learnings: z.array(z.object({
    insight: z.string(),
    next_experiment: z.string(),
  })).describe("Aprendizajes y experimentos sugeridos"),
});

export async function analyst(
  ctx: PipelineContext,
  prev?: AgentResult,
): Promise<AgentResult> {
  const wsId = ctx.workspace.id;

  const step: AgentStep = {
    id: newId("step"),
    workspace_id: wsId,
    act: "aprender",
    agent: "analyst",
    name: "Análisis de resultados",
    status: "running",
    detail: "Generando métricas simuladas...",
    sources: [],
    tokens_in: 0,
    tokens_out: 0,
    started_at: now(),
  };
  await saveStep(step);

  const content = prev?.data as ContentPiece[] | undefined;

  try {
    const result = await generateObject({
      task: "synthesize",
      schema: MetricsSchema,
      schemaName: "MetricsAnalysis",
      system: `Eres un analista de marketing. Generas métricas simuladas realistas para una campaña.
IMPORTANTE: estas métricas son SIMULADAS para demostración. Indica siempre que son mock.`,
      prompt: `Campaña: ${ctx.brief.objective}
Canales usados: ${(content ?? []).map((c) => c.channel).join(", ") || "sin contenido aún"}

Genera métricas simuladas realistas para cada canal y aprendizajes para el siguiente ciclo.`,
      temperature: 0.5,
    });

    // Guardar métricas (marcadas como mock)
    const metricsWithMode: Metric[] = result.data.metrics.map((m) => ({
      ...m,
      mode: "mock" as const,
    }));
    await saveMetrics(wsId, metricsWithMode);

    // Guardar aprendizajes
    const learnings: Learning[] = [];
    for (const l of result.data.learnings) {
      const learning: Learning = {
        id: newId("lrn"),
        workspace_id: wsId,
        insight: l.insight,
        evidence: metricsWithMode,
        next_experiment: l.next_experiment,
        created_at: now(),
      };
      await saveLearning(learning);
      learnings.push(learning);
    }

    step.status = "done";
    step.tokens_in = result.usage.tokens_in;
    step.tokens_out = result.usage.tokens_out;
    step.model = result.usage.model;
    step.detail = `${metricsWithMode.length} canales analizados, ${learnings.length} aprendizajes`;
    step.finished_at = now();
    await saveStep(step);

    return {
      act: "aprender",
      agent: "analyst",
      name: "Análisis completado",
      step,
      data: { metrics: metricsWithMode, learnings },
    };
  } catch (e) {
    step.status = "failed";
    step.detail = `Error generando análisis: ${(e as Error).message}`;
    step.finished_at = now();
    await saveStep(step);
    throw e;
  }
}
