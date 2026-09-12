/**
 * Capa de modelos — OpenCode Zen + OpenRouter + Gemini fallback.
 *
 * Cadena de prioridad:
 *   1. OpenCode Zen (mimo-v2.5-free)
 *   2. OpenRouter (modelos gratuitos)
 *   3. Google Gemini (gratis)
 *
 * REGLA: ningún nombre de modelo hardcodeado fuera de este archivo.
 */

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { GoogleGenAI } from "@google/genai";
import type { z } from "zod";

const ZEN_BASE_URL = "https://opencode.ai/zen/v1";
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

let _zenClient: OpenAI | null = null;
let _openrouterClient: OpenAI | null = null;
let _gemini: GoogleGenAI | null = null;

function zenClient(): OpenAI {
  if (_zenClient) return _zenClient;
  const apiKey = process.env.OPENCODE_API_KEY;
  if (!apiKey) throw new Error("OPENCODE_API_KEY no está configurada");
  _zenClient = new OpenAI({ apiKey, baseURL: ZEN_BASE_URL });
  return _zenClient;
}

function openrouterClient(): OpenAI {
  if (_openrouterClient) return _openrouterClient;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY no está configurada");
  _openrouterClient = new OpenAI({ apiKey, baseURL: OPENROUTER_BASE_URL });
  return _openrouterClient;
}

function geminiClient(): GoogleGenAI {
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

/** Modelos para OpenRouter (pagados, baratos) */
export const OPENROUTER_MODELS = {
  extract: "deepseek/deepseek-chat-v3-0324",
  synthesize: "deepseek/deepseek-chat-v3-0324",
  reason: "deepseek/deepseek-chat-v3-0324",
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
  const ai = geminiClient();
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
  const parsed = JSON.parse(response.text ?? "{}") as T;
  return { data: parsed, usage: { model: `gemini:${model}`, tokens_in: 0, tokens_out: 0 } };
}

async function geminiGenerateText(opts: {
  system: string;
  prompt: string;
  temperature?: number;
}): Promise<LlmResult<string>> {
  const ai = geminiClient();
  const model = process.env.MAKIS_GEMINI_MODEL ?? "gemini-2.5-flash";
  const fullPrompt = `${opts.system}\n\n${opts.prompt}`;
  const response = await ai.models.generateContent({
    model,
    contents: fullPrompt,
    config: { temperature: opts.temperature ?? 0.7 },
  });
  return { data: response.text ?? "", usage: { model: `gemini:${model}`, tokens_in: 0, tokens_out: 0 } };
}

// ---------------------------------------------------------------------------
// Cadena de intentos: OpenCode → OpenRouter → Gemini
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

  // 1. Intentar OpenCode Zen
  if (process.env.OPENCODE_API_KEY) {
    try {
      const completion = await zenClient().chat.completions.parse({
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
          usage: { model, tokens_in: completion.usage?.prompt_tokens ?? 0, tokens_out: completion.usage?.completion_tokens ?? 0 },
        };
      }
    } catch (e) {
      console.error("[llm:opencode] Error:", (e as Error).message);
    }
  }

  // 2. Intentar OpenRouter (sin structured outputs, parsing manual)
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const orModel = OPENROUTER_MODELS[opts.task];
      const completion = await openrouterClient().chat.completions.create({
        model: orModel,
        temperature: opts.temperature ?? 0.4,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: `${opts.prompt}\n\nResponde EXCLUSIVAMENTE con un JSON válido.` },
        ],
      });
      const content = completion.choices[0]?.message?.content ?? "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as z.infer<T>;
        return {
          data: parsed,
          usage: { model: `or:${orModel}`, tokens_in: completion.usage?.prompt_tokens ?? 0, tokens_out: completion.usage?.completion_tokens ?? 0 },
        };
      }
    } catch (e) {
      console.error("[llm:openrouter] Error:", (e as Error).message);
    }
  }

  // 3. Fallback a Gemini
  console.error("[llm] Todos los providers fallaron, usando Gemini");
  return geminiGenerateObject<z.infer<T>>(opts) as Promise<LlmResult<z.infer<T>>>;
}

export async function generateText(opts: {
  task: ModelTask;
  system: string;
  prompt: string;
  temperature?: number;
}): Promise<LlmResult<string>> {
  const model = MODELS[opts.task];

  // 1. Intentar OpenCode Zen
  if (process.env.OPENCODE_API_KEY) {
    try {
      const completion = await zenClient().chat.completions.create({
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
          usage: { model, tokens_in: completion.usage?.prompt_tokens ?? 0, tokens_out: completion.usage?.completion_tokens ?? 0 },
        };
      }
    } catch (e) {
      console.error("[llm:opencode] Error:", (e as Error).message);
    }
  }

  // 2. Intentar OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const orModel = OPENROUTER_MODELS[opts.task];
      const completion = await openrouterClient().chat.completions.create({
        model: orModel,
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
          usage: { model: `or:${orModel}`, tokens_in: completion.usage?.prompt_tokens ?? 0, tokens_out: completion.usage?.completion_tokens ?? 0 },
        };
      }
    } catch (e) {
      console.error("[llm:openrouter] Error:", (e as Error).message);
    }
  }

  // 3. Fallback a Gemini
  console.error("[llm] Todos los providers fallaron, usando Gemini");
  return geminiGenerateText(opts);
}
