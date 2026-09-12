/**
 * Capa de modelos — OpenCode Zen + Gemini fallback.
 *
 * Zen es un gateway compatible con la API de OpenAI. Si falla (free tier
 * restringido, sin créditos, etc.), se cae a Google Gemini automáticamente.
 *
 * REGLA: ningún nombre de modelo hardcodeado fuera de este archivo.
 */

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";

const ZEN_BASE_URL = "https://opencode.ai/zen/v1";

let _client: OpenAI | null = null;
let _gemini: GoogleGenAI | null = null;

function client(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENCODE_API_KEY;
  if (!apiKey) throw new Error("OPENCODE_API_KEY no está configurada");
  _client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENCODE_BASE_URL ?? ZEN_BASE_URL,
  });
  return _client;
}

function gemini(): GoogleGenAI {
  if (_gemini) return _gemini;
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_API_KEY no está configurada");
  _gemini = new GoogleGenAI({ apiKey });
  return _gemini;
}

export const MODELS = {
  extract: process.env.MAKIS_MODEL_EXTRACT ?? "mimo-v2.5-free",
  synthesize: process.env.MAKIS_MODEL_SYNTHESIZE ?? "mimo-v2.5-free",
  reason: process.env.MAKIS_MODEL_REASON ?? "mimo-v2.5-free",
} as const;

export type ModelTask = keyof typeof MODELS;

export interface LlmUsage {
  model: string;
  tokens_in: number;
  tokens_out: number;
}

export interface LlmResult<T> {
  data: T;
  usage: LlmUsage;
}

// ---------------------------------------------------------------------------
// Gemini helpers
// ---------------------------------------------------------------------------

async function geminiGenerateObject<T>(opts: {
  schema: z.ZodTypeAny;
  schemaName: string;
  system: string;
  prompt: string;
  temperature?: number;
}): Promise<{ data: T; usage: LlmUsage }> {
  const ai = gemini();
  const model = process.env.MAKIS_GEMINI_MODEL ?? "gemini-2.5-flash";

  const fullPrompt = `${opts.system}\n\n${opts.prompt}`;
  const response = await ai.models.generateContent({
    model,
    contents: fullPrompt,
    config: {
      temperature: opts.temperature ?? 0.4,
      responseMimeType: "application/json",
      responseSchema: opts.schema,
    },
  });

  const text = response.text ?? "";
  const parsed = JSON.parse(text) as T;

  return {
    data: parsed,
    usage: { model: `gemini:${model}`, tokens_in: 0, tokens_out: 0 },
  };
}

async function geminiGenerateText(opts: {
  system: string;
  prompt: string;
  temperature?: number;
}): Promise<LlmResult<string>> {
  const ai = gemini();
  const model = process.env.MAKIS_GEMINI_MODEL ?? "gemini-2.5-flash";

  const fullPrompt = `${opts.system}\n\n${opts.prompt}`;
  const response = await ai.models.generateContent({
    model,
    contents: fullPrompt,
    config: { temperature: opts.temperature ?? 0.7 },
  });

  return {
    data: response.text ?? "",
    usage: { model: `gemini:${model}`, tokens_in: 0, tokens_out: 0 },
  };
}

// ---------------------------------------------------------------------------
// Principal: intenta OpenCode, si falla cae a Gemini
// ---------------------------------------------------------------------------

export async function generateObject<T extends z.ZodTypeAny>(opts: {
  task: ModelTask;
  schema: T;
  schemaName: string;
  system: string;
  prompt: string;
  temperature?: number;
}): Promise<LlmResult<z.infer<T>>> {
  const model = MODELS[opts.task];

  // 1. Intentar OpenCode
  if (process.env.OPENCODE_API_KEY) {
    try {
      const completion = await client().chat.completions.parse({
        model,
        temperature: opts.temperature ?? 0.4,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.prompt },
        ],
        response_format: zodResponseFormat(opts.schema, opts.schemaName),
      });

      const parsed = completion.choices[0]?.message?.parsed;
      if (parsed) {
        return {
          data: parsed as z.infer<T>,
          usage: {
            model,
            tokens_in: completion.usage?.prompt_tokens ?? 0,
            tokens_out: completion.usage?.completion_tokens ?? 0,
          },
        };
      }
    } catch (e) {
      console.error("[llm:opencode] Error, intentando Gemini:", (e as Error).message);
    }
  }

  // 2. Fallback a Gemini
  const result = await geminiGenerateObject<z.infer<T>>(opts);
  return result as LlmResult<z.infer<T>>;
}

export async function generateText(opts: {
  task: ModelTask;
  system: string;
  prompt: string;
  temperature?: number;
}): Promise<LlmResult<string>> {
  const model = MODELS[opts.task];

  // 1. Intentar OpenCode
  if (process.env.OPENCODE_API_KEY) {
    try {
      const completion = await client().chat.completions.create({
        model,
        temperature: opts.temperature ?? 0.7,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.prompt },
        ],
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        return {
          data: content,
          usage: {
            model,
            tokens_in: completion.usage?.prompt_tokens ?? 0,
            tokens_out: completion.usage?.completion_tokens ?? 0,
          },
        };
      }
    } catch (e) {
      console.error("[llm:opencode] Error, intentando Gemini:", (e as Error).message);
    }
  }

  // 2. Fallback a Gemini
  return geminiGenerateText(opts);
}
