/**
 * Cliente de investigación sobre Exa.
 *
 * Exa sustituye tres piezas a la vez: búsqueda web, scraping y grounding.
 *
 *   readSite()         → `getContents()`        lee el sitio sin Playwright ni parsers frágiles
 *   findCompetitors()  → `searchAndContents()`  índice de empresas (`category: "company"`)
 *   investigate()      → `answer()`             síntesis estructurada CON citas
 *
 * Nota sobre la API (verificado contra exa-js 1.10.3):
 * `systemPrompt` y `outputSchema` viven en `answer()`, NO en `search()`.
 * `search()` solo acepta filtros. Usar `outputSchema` en `search()` compila si
 * se fuerza con `as any`, pero falla en runtime.
 *
 * REGLA DE ORO DEL PROYECTO: nada sin fuente. Si una consulta no devuelve
 * citas, se devuelve vacío en lugar de especular.
 */

import Exa from "exa-js";
import { z } from "zod";

import type { Competitor, Confidence, Finding, FindingCategory, Source } from "./types";

let _exa: Exa | null = null;

function exa(): Exa {
  if (_exa) return _exa;
  const key = process.env.EXA_API_KEY;
  if (!key) {
    throw new Error(
      "EXA_API_KEY no está configurada. Copia .env.example a .env.local y añade " +
        "tu key de https://dashboard.exa.ai",
    );
  }
  _exa = new Exa(key);
  return _exa;
}

/** Forma mínima que nos interesa de un resultado de Exa. */
interface ExaResultLike {
  url: string;
  title?: string | null;
  text?: string;
  highlights?: string[];
}

function toSource(result: ExaResultLike): Source {
  const snippet = result.highlights?.[0] ?? result.text?.slice(0, 400) ?? "";
  return {
    url: result.url,
    title: result.title ?? result.url,
    snippet: snippet.slice(0, 400),
    retrieved_at: new Date().toISOString(),
  };
}

function dedupeSources(sources: Source[]): Source[] {
  const seen = new Set<string>();
  return sources.filter((s) => {
    if (seen.has(s.url)) return false;
    seen.add(s.url);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Lectura del sitio del negocio
// ---------------------------------------------------------------------------

export async function readSite(
  url: string,
): Promise<{ text: string; sources: Source[] }> {
  const response = await exa().getContents([url], { text: true, highlights: true });

  const first = response.results?.[0] as ExaResultLike | undefined;
  if (!first) return { text: "", sources: [] };

  const body = first.text || (first.highlights ?? []).join("\n");
  return {
    text: body.slice(0, 20000),
    sources: [toSource(first)],
  };
}

// ---------------------------------------------------------------------------
// Competidores
//
// Se usa el índice de empresas de Exa en vez de pedirle competidores a un LLM.
// Diferencia clave: cada competidor ES su propia fuente (su web oficial), así
// que la evidencia está garantizada por construcción, no por buena voluntad
// del modelo.
// ---------------------------------------------------------------------------

export async function findCompetitors(
  description: string,
  opts: { market?: string | null; numResults?: number } = {},
): Promise<{ competitors: Competitor[]; sources: Source[] }> {
  const { market, numResults = 8 } = opts;

  let query = `empresas que compiten con: ${description}`;
  if (market) query += ` en ${market}`;

  const response = await exa().searchAndContents(query, {
    type: "auto",
    category: "company",
    numResults,
    highlights: true,
    text: true,
  });

  const results = (response.results ?? []) as ExaResultLike[];

  const competitors: Competitor[] = results.map((r) => {
    const source = toSource(r);
    return {
      name: r.title ?? new URL(r.url).hostname,
      url: r.url,
      positioning: (r.highlights?.[0] ?? "").slice(0, 280),
      strengths: [],
      weaknesses: [],
      sources: [source],
    };
  });

  return {
    competitors,
    sources: dedupeSources(results.map(toSource)),
  };
}

// ---------------------------------------------------------------------------
// Hallazgos
//
// `answer()` sintetiza sobre múltiples fuentes y devuelve `citations`.
// El esquema Zod hace que la salida sea tipada de verdad, sin castear.
// ---------------------------------------------------------------------------

const FindingsSchema = z.object({
  findings: z
    .array(
      z.object({
        claim: z
          .string()
          .describe("Afirmación concreta y verificable sobre el mercado o la audiencia"),
        confidence: z
          .enum(["alta", "media", "baja"])
          .describe("Solidez de la evidencia que respalda la afirmación"),
      }),
    )
    .describe("Hallazgos relevantes, el más importante primero"),
});

export async function investigate(
  topic: string,
  opts: { category?: FindingCategory } = {},
): Promise<Finding[]> {
  const { category = "mercado" } = opts;

  const response = await exa().answer(topic, {
    outputSchema: FindingsSchema,
    systemPrompt:
      "Eres un analista de mercado. Responde solo con afirmaciones que puedas respaldar " +
      "con una fuente citada. Si no hay evidencia suficiente, omite la afirmación en " +
      "lugar de especular. Responde en español.",
    text: true,
  });

  const sources = dedupeSources(
    ((response.citations ?? []) as ExaResultLike[]).map(toSource),
  );

  // Sin evidencia no hay hallazgo. Preferimos devolver vacío a inventar.
  if (sources.length === 0) return [];

  return response.answer.findings.map((item, i) => ({
    id: `fnd_${category}_${i}`,
    category,
    claim: item.claim,
    evidence: sources.slice(0, 4),
    confidence: item.confidence as Confidence,
  }));
}
