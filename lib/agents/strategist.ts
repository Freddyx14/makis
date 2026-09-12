/**
 * Agente Estratega — Acto CONSTRUIR (parte 1).
 *
 * Toma los hallazgos del Investigador y produce:
 *   - Buyer Personas
 *   - Plan de canales con distribución de presupuesto
 *   - KPIs
 *   - Nombre de campaña y oferta
 *
 * Todo validado con Zod vía `generateObject`.
 */

import { z } from "zod";

import { generateObject } from "../llm";
import { saveStep, now, newId } from "../db";
import type { AgentStep, Strategy, BuyerPersona, ChannelPlan, Kpi } from "../types";
import type { PipelineContext, AgentResult } from "./types";

const StrategySchema = z.object({
  campaign: z.string().describe("Nombre creativo de la campaña"),
  offer: z.string().describe("Propuesta de valor clara y concisa"),
  personas: z.array(z.object({
    name: z.string().describe("Nombre de la persona"),
    description: z.string().describe("Descripción breve"),
    pains: z.array(z.string()).describe("Dolores principales"),
    triggers: z.array(z.string()).describe("Triggers de compra"),
  })).describe("Buyer personas principal(es)"),
  channels: z.array(z.object({
    channel: z.string().describe("Canal de marketing"),
    rationale: z.string().describe("Por qué este canal"),
    budget_share: z.number().describe("Fracción del presupuesto 0-1"),
  })).describe("Plan de canales"),
  kpis: z.array(z.object({
    name: z.string().describe("Nombre del KPI"),
    target: z.string().describe("Meta concreta"),
    why: z.string().describe("Por qué este KPI importa"),
  })).describe("KPIs principales"),
  grounded_in: z.array(z.string()).describe("Referencias a hallazgos que respaldan la estrategia"),
});

export async function strategist(
  ctx: PipelineContext,
  prev?: AgentResult,
): Promise<AgentResult> {
  const wsId = ctx.workspace.id;

  const step: AgentStep = {
    id: newId("step"),
    workspace_id: wsId,
    act: "construir",
    agent: "strategist",
    name: "Diseño de estrategia",
    status: "running",
    detail: "Generando estrategia...",
    sources: [],
    tokens_in: 0,
    tokens_out: 0,
    started_at: now(),
  };
  await saveStep(step);

  // Contexto del investigador
  const researchData = prev?.data as {
    findings?: Array<{ claim: string; category: string }>;
    competitors?: Array<{ name: string; positioning: string }>;
    siteText?: string;
  } | undefined;

  const findingsContext = researchData?.findings
    ?.map((f) => `- [${f.category}] ${f.claim}`)
    .join("\n") ?? "Sin hallazgos previos";

  const competitorsContext = researchData?.competitors
    ?.map((c) => `- ${c.name}: ${c.positioning}`)
    .join("\n") ?? "Sin competidores identificados";

  const siteContext = researchData?.siteText?.slice(0, 3000) ?? "";

  try {
    const result = await generateObject({
      task: "synthesize",
      schema: StrategySchema,
      schemaName: "Strategy",
      system: `Eres un estratega de marketing senior. Diseñas campañas basadas en datos reales, no suposiciones.
Tono: directo, profesional, orientado a resultados. Responde en español.`,
      prompt: `## Brief del negocio
- Marca: ${ctx.brief.profile.brand_name}
- Oferta: ${ctx.brief.profile.offer}
- Categorías: ${ctx.brief.profile.categories.join(", ")}
- Público: ${ctx.brief.profile.audience_signals.join(", ")}
- Objetivo: ${ctx.brief.objective}
- Presupuesto: ${ctx.brief.budget ?? "No especificado"}
- Mercado: ${ctx.workspace.market ?? "General"}

## Sitio del negocio
${siteContext}

## Hallazgos de mercado
${findingsContext}

## Competidores
${competitorsContext}

Diseña una estrategia completa: campaña, personas, canales con distribución de presupuesto, y KPIs medibles.`,
      temperature: 0.6,
    });

    step.status = "done";
    step.tokens_in = result.usage.tokens_in;
    step.tokens_out = result.usage.tokens_out;
    step.model = result.usage.model;
    step.detail = `Estrategia generada: ${result.data.campaign}`;
    step.finished_at = now();
    await saveStep(step);

    const strategy: Strategy = {
      workspace_id: wsId,
      campaign: result.data.campaign,
      offer: result.data.offer,
      personas: result.data.personas as BuyerPersona[],
      channels: result.data.channels as ChannelPlan[],
      kpis: result.data.kpis as Kpi[],
      grounded_in: result.data.grounded_in,
    };

    return {
      act: "construir",
      agent: "strategist",
      name: "Estrategia diseñada",
      step,
      data: strategy,
    };
  } catch (e) {
    step.status = "failed";
    step.detail = `Error generando estrategia: ${(e as Error).message}`;
    step.finished_at = now();
    await saveStep(step);
    throw e;
  }
}
