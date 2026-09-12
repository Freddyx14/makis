/**
 * POST /api/workspaces
 *
 * Crea un workspace y lanza el pipeline en background.
 * El cliente recibe el workspace inmediatamente y puede seguir el progreso
 * por polling o Realtime.
 */

import { NextRequest, NextResponse } from "next/server";

import { createWorkspace, newId, now, saveBrief } from "@/lib/db";
import { readSite } from "@/lib/exa";
import { generateObject } from "@/lib/llm";
import { runPipeline } from "@/lib/agents";
import type { Workspace, Brief, BusinessProfile } from "@/lib/types";
import { z } from "zod";

const BriefExtractionSchema = z.object({
  brand_name: z.string().describe("Nombre de la marca o negocio"),
  offer: z.string().describe("Producto o servicio principal"),
  categories: z.array(z.string()).describe("Categorías del negocio"),
  tone: z.string().nullable().describe("Tono de comunicación, null si no se detecta"),
  audience_signals: z.array(z.string()).describe("Señales de audiencia objetivo"),
  language: z.string().describe("Idioma principal"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, objective, budget, market } = body;

    if (!url || !objective) {
      return NextResponse.json(
        { error: "url y objective son requeridos" },
        { status: 400 },
      );
    }

    // 1. Leer el sitio para extraer perfil
    const { text: siteText, sources } = await readSite(url);

    // 2. Extraer perfil con LLM
    const extraction = await generateObject({
      task: "extract",
      schema: BriefExtractionSchema,
      schemaName: "BusinessProfile",
      system:
        "Extrae el perfil del negocio a partir del contenido de su sitio web. " +
        "Si no tienes suficiente información, usa lo que puedas inferir. Responde en español.",
      prompt: `Contenido del sitio:\n${siteText.slice(0, 5000)}`,
    });

    const profile: BusinessProfile = {
      brand_name: extraction.data.brand_name || "Negocio",
      offer: extraction.data.offer || "Servicios",
      categories: extraction.data.categories ?? ["marketing"],
      tone: extraction.data.tone ?? null,
      audience_signals: extraction.data.audience_signals ?? ["general"],
      language: extraction.data.language || "es",
      sources,
      confirmed_by_user: false,
    };

    // 3. Crear workspace
    const wsId = newId("ws");
    const workspace: Workspace = {
      id: wsId,
      url,
      name: profile.brand_name || new URL(url).hostname,
      objective,
      budget: budget ?? null,
      market: market ?? null,
      current_act: "entrada",
      status: "running",
      drive_folder_url: null,
      created_at: now(),
    };

    await createWorkspace(workspace);

    // 4. Crear brief
    const brief: Brief = {
      workspace_id: wsId,
      profile,
      objective,
      budget: budget ?? null,
      market: market ?? null,
      assumptions: [],
    };
    await saveBrief(brief);

    // 5. Lanzar pipeline en background (no await)
    runPipeline(workspace, brief, "").catch((e) => {
      console.error(`[api/workspaces] Pipeline falló para ${wsId}:`, e);
    });

    return NextResponse.json({ workspace, brief });
  } catch (e) {
    console.error("[api/workspaces] Error:", e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
