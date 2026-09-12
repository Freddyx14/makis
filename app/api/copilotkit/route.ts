/**
 * POST /api/copilotkit
 *
 * Runtime de CopilotKit. Permite al usuario interactuar con el workspace
 * a través de un chat embebido en el cockpit.
 *
 * CopilotKit se conecta aquí y puede:
 *   - Leer el estado del workspace
 *   - Responder preguntas sobre la estrategia
 *   - Sugerir cambios
 *   - Explicar métricas
 */

import { NextRequest, NextResponse } from "next/server";
import { getState } from "@/lib/db";
import { generateText } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, workspaceId } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages es requerido" },
        { status: 400 },
      );
    }

    // Obtener estado del workspace si se proporciona
    let workspaceContext = "";
    if (workspaceId) {
      const state = await getState(workspaceId);
      if (state) {
        workspaceContext = `
## Estado del workspace
- Marca: ${state.brief?.profile.brand_name ?? "Desconocido"}
- Objetivo: ${state.workspace.objective}
- Acto actual: ${state.workspace.current_act}
- Estado: ${state.workspace.status}
- Pasos completados: ${state.steps.filter((s) => s.status === "done").length}/${state.steps.length}
- Artefactos: ${state.artifacts.length}
- Contenido: ${state.content.length} piezas

## Estrategia
${state.strategy ? `- Campaña: ${state.strategy.campaign}\n- Oferta: ${state.strategy.offer}\n- Canales: ${state.strategy.channels.map((c) => c.channel).join(", ")}` : "Aún no generada"}

## Hallazgos
${state.research?.findings.slice(0, 5).map((f) => `- ${f.claim}`).join("\n") ?? "Aún no hay hallazgos"}
`;
      }
    }

    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.content ?? "";

    const result = await generateText({
      task: "synthesize",
      system: `Eres el asistente de Makis OS, un sistema agéntico de marketing.
Tu función es ayudar al usuario a entender y gestionar su workspace de marketing.
Responde en español, sé conciso y útil.
${workspaceContext}`,
      prompt: userMessage,
      temperature: 0.7,
    });

    return NextResponse.json({
      messages: [
        ...messages,
        { role: "assistant", content: result.data },
      ],
    });
  } catch (e) {
    console.error("[api/copilotkit] Error:", e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
