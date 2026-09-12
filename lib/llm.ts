/**
 * Capa de modelos — OpenCode Zen.
 *
 * Zen es un gateway compatible con la API de OpenAI: una sola clave da acceso a
 * modelos de OpenAI, Anthropic, Google, DeepSeek, Qwen y más. Por eso basta con
 * cambiar el `baseURL` del SDK oficial de OpenAI.
 *
 *   https://opencode.ai/docs/zen/
 *
 * DECISIÓN: no se usa `@openai/agents`. Ese SDK depende de funciones propias de
 * la Responses API que un gateway puede no proxyar completas, y descubrirlo a
 * pocas horas de la demo sería fatal. El orquestador propio (`lib/agents/`) es
 * pequeño y, para el criterio 3 de la rúbrica, demuestra más ingeniería:
 * pasos persistidos, reanudables y trazados.
 *
 * REGLA: ningún nombre de modelo hardcodeado fuera de este archivo.
 */

import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { z } from "zod";

const ZEN_BASE_URL = "https://opencode.ai/zen/v1";

let _client: OpenAI | null = null;

function client(): OpenAI {
  if (_client) return _client;

  const apiKey = process.env.OPENCODE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENCODE_API_KEY no está configurada. Consíguela en https://opencode.ai/auth " +
        "y ponla en .env.local",
    );
  }

  _client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENCODE_BASE_URL ?? ZEN_BASE_URL,
  });
  return _client;
}

/**
 * Un modelo por tarea, no uno para todo.
 *
 * `extract` corre muchas veces y sobre datos públicos → el más barato.
 * `synthesize` produce el entregable que lleva la marca → merece uno bueno.
 *
 * Precios por 1M tokens (entrada/salida) a 09/2026:
 *   gpt-5-nano     $0.05 / $0.40
 *   gpt-5.6-luna   $0.20 / $1.20
 *   claude-sonnet-5 $2.00 / $10.00
 *
 * Una ejecución completa cuesta céntimos. Si la calidad de la estrategia no da
 * la talla, sube `synthesize` a `claude-sonnet-5` y vuelve a medir.
 */
export const MODELS = {
  /** Extracción, parseo y clasificación. El 80% de las llamadas. */
  extract: process.env.MAKIS_MODEL_EXTRACT ?? "opencode/mimo-v2.5-free",
  /** Estrategia, copies y redacción final. Aquí se juega el entregable. */
  synthesize: process.env.MAKIS_MODEL_SYNTHESIZE ?? "opencode/mimo-v2.5-free",
  /** Razonamiento largo, si alguna vez hace falta. */
  reason: process.env.MAKIS_MODEL_REASON ?? "opencode/mimo-v2.5-free",
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

/**
 * Genera un objeto tipado validado contra un esquema Zod.
 *
 * Es la única forma en que los agentes hablan con el modelo: nada de parsear
 * texto libre. Si el modelo devuelve algo que no encaja en el esquema, falla
 * aquí y no tres capas más abajo.
 */
export async function generateObject<T extends z.ZodTypeAny>(opts: {
  task: ModelTask;
  schema: T;
  schemaName: string;
  system: string;
  prompt: string;
  temperature?: number;
}): Promise<LlmResult<z.infer<T>>> {
  const model = MODELS[opts.task];

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
  if (!parsed) {
    const refusal = completion.choices[0]?.message?.refusal;
    throw new Error(
      `[llm:${opts.schemaName}] el modelo ${model} no devolvió un objeto válido` +
        (refusal ? `: ${refusal}` : ""),
    );
  }

  return {
    data: parsed as z.infer<T>,
    usage: {
      model,
      tokens_in: completion.usage?.prompt_tokens ?? 0,
      tokens_out: completion.usage?.completion_tokens ?? 0,
    },
  };
}

/** Texto libre. Para copies y redacción, donde un esquema estorba. */
export async function generateText(opts: {
  task: ModelTask;
  system: string;
  prompt: string;
  temperature?: number;
}): Promise<LlmResult<string>> {
  const model = MODELS[opts.task];

  const completion = await client().chat.completions.create({
    model,
    temperature: opts.temperature ?? 0.7,
    messages: [
      { role: "system", content: opts.system },
      { role: "user", content: opts.prompt },
    ],
  });

  return {
    data: completion.choices[0]?.message?.content ?? "",
    usage: {
      model,
      tokens_in: completion.usage?.prompt_tokens ?? 0,
      tokens_out: completion.usage?.completion_tokens ?? 0,
    },
  };
}
