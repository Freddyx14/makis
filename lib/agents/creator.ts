/**
 * Agente Creador — Acto CONSTRUIR (parte 2).
 *
 * Toma la estrategia del Estratega y genera contenido concreto:
 *   - Posts para redes sociales
 *   - Emails
 *   - Anuncios (mock)
 *   - Artículos
 *
 * Cada pieza es un `ContentPiece` con approval="draft".
 */

import { randomUUID } from "node:crypto";

import { generateText } from "../llm";
import { saveStep, saveContentPiece, now, newId } from "../db";
import type { AgentStep, ContentPiece, ContentKind, Strategy } from "../types";
import type { PipelineContext, AgentResult } from "./types";

const CONTENT_PLAN: Array<{ kind: ContentKind; channel: string; count: number }> = [
  { kind: "post", channel: "instagram", count: 3 },
  { kind: "post", channel: "linkedin", count: 2 },
  { kind: "email", channel: "email", count: 2 },
  { kind: "ad", channel: "google_ads", count: 2 },
  { kind: "article", channel: "blog", count: 1 },
];

export async function creator(
  ctx: PipelineContext,
  prev?: AgentResult,
): Promise<AgentResult> {
  const wsId = ctx.workspace.id;

  const step: AgentStep = {
    id: newId("step"),
    workspace_id: wsId,
    act: "construir",
    agent: "creator",
    name: "Generación de contenido",
    status: "running",
    detail: "Creando piezas de contenido...",
    sources: [],
    tokens_in: 0,
    tokens_out: 0,
    started_at: now(),
  };
  await saveStep(step);

  const strategy = prev?.data as Strategy | undefined;
  if (!strategy) {
    step.status = "failed";
    step.detail = "No hay estrategia previa para generar contenido";
    step.finished_at = now();
    await saveStep(step);
    throw new Error("No hay estrategia previa");
  }

  // Contexto completo del negocio para generar contenido relevante
  const brandName = ctx.brief.profile.brand_name;
  const offer = ctx.brief.profile.offer;
  const categories = ctx.brief.profile.categories ?? [];
  const audience = ctx.brief.profile.audience_signals ?? [];
  const siteText = (prev?.data as any)?.siteText?.slice(0, 2000) ?? "";
  const findings = (prev?.data as any)?.findings ?? [];
  const competitors = (prev?.data as any)?.competitors ?? [];

  const businessContext = `
## Negocio: ${brandName}
- Oferta principal: ${offer}
- Categorías: ${categories.join(", ")}
- Audiencia objetivo: ${audience.join(", ")}
- URL: ${ctx.workspace.url}

## Contenido del sitio
${siteText}

## Hallazgos clave del mercado
${findings.slice(0, 5).map((f: any) => `- ${f.claim}`).join("\n")}

## Competidores
${competitors.slice(0, 3).map((c: any) => `- ${c.name}: ${c.positioning}`).join("\n")}
`.trim();

  const pieces: ContentPiece[] = [];
  let totalTokensIn = 0;
  let totalTokensOut = 0;

  try {
    for (const plan of CONTENT_PLAN) {
      for (let i = 0; i < plan.count; i++) {
        const pieceStep: AgentStep = {
          id: newId("step"),
          workspace_id: wsId,
          act: "construir",
          agent: "creator",
          name: `Contenido: ${plan.kind} (${plan.channel})`,
          status: "running",
          detail: `Generando ${plan.kind} para ${plan.channel}...`,
          sources: [],
          tokens_in: 0,
          tokens_out: 0,
          started_at: now(),
        };
        await saveStep(pieceStep);

        try {
          const result = await generateText({
            task: "synthesize",
            system: `Eres el copywriter de ${brandName}. Creas contenido de marketing específico para ESTE negocio, no genérico.
Reglas CRÍTICAS:
- Escribe SOLO sobre ${brandName} y su oferta: ${offer}
- Menciona la marca por nombre en el contenido
- Adapta el tono al canal (Instagram: casual, LinkedIn: profesional, Email: directo)
- Incluye un CTA claro
- Para anuncios de Google/Meta, indica que es MOCK/DEMO
- NUNCA uses textos genéricos como "nuestros servicios" sin contexto
- Responde en español`,
            prompt: `${businessContext}

## Estrategia
- Campaña: ${strategy.campaign}
- Oferta: ${strategy.offer}
- Canal: ${plan.channel}
- Tipo de pieza: ${plan.kind}
- Buyer personas: ${(strategy.personas ?? []).map((p: any) => `${p.name}: ${p.description}`).join("; ")}

Genera UNA pieza de contenido ESPECÍFICA para ${brandName} en el canal ${plan.channel}.`,
            temperature: 0.7,
          });

          totalTokensIn += result.usage.tokens_in;
          totalTokensOut += result.usage.tokens_out;

          const piece: ContentPiece = {
            id: newId("cnt"),
            workspace_id: wsId,
            kind: plan.kind,
            channel: plan.channel,
            title: `${plan.kind.toUpperCase()} — ${plan.channel} #${i + 1}`,
            body: result.data,
            approval: "draft",
          };

          await saveContentPiece(piece);
          pieces.push(piece);

          pieceStep.status = "done";
          pieceStep.tokens_in = result.usage.tokens_in;
          pieceStep.tokens_out = result.usage.tokens_out;
          pieceStep.model = result.usage.model;
          pieceStep.detail = `Pieza generada: ${piece.title}`;
          pieceStep.finished_at = now();
          await saveStep(pieceStep);
        } catch (e) {
          pieceStep.status = "failed";
          pieceStep.detail = `Error: ${(e as Error).message}`;
          pieceStep.finished_at = now();
          await saveStep(pieceStep);
        }
      }
    }

    step.status = "done";
    step.tokens_in = totalTokensIn;
    step.tokens_out = totalTokensOut;
    step.detail = `${pieces.length} piezas de contenido generadas`;
    step.finished_at = now();
    await saveStep(step);

    return {
      act: "construir",
      agent: "creator",
      name: "Contenido generado",
      step,
      data: pieces,
    };
  } catch (e) {
    step.status = "failed";
    step.detail = `Error general: ${(e as Error).message}`;
    step.finished_at = now();
    await saveStep(step);
    throw e;
  }
}
