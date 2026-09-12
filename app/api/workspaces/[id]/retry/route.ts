/**
 * POST /api/workspaces/[id]/retry
 *
 * Reintenta un workspace fallido desde el acto donde se quedó.
 * La investigación ya está guardada, así que solo re-ejecuta desde ahí.
 */

import { NextRequest, NextResponse } from "next/server";
import { getWorkspace, getBrief, getResearch, updateWorkspace, setAct } from "@/lib/db";
import { runPipeline } from "@/lib/agents";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const workspace = await getWorkspace(id);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace no encontrado" }, { status: 404 });
    }

    if (workspace.status === "completed") {
      return NextResponse.json({ error: "El workspace ya está completado" }, { status: 400 });
    }

    const brief = await getBrief(id);
    if (!brief) {
      return NextResponse.json({ error: "No hay brief para este workspace" }, { status: 404 });
    }

    // Resetear estado a "running" en el acto donde falló
    await updateWorkspace(id, { status: "running" });
    await setAct(id, workspace.current_act, "running");

    // Re-lanzar el pipeline
    runPipeline(workspace, brief, "").catch((e) => {
      console.error(`[api/retry] Pipeline falló para ${id}:`, e);
    });

    return NextResponse.json({ ok: true, message: `Reintentando desde acto: ${workspace.current_act}` });
  } catch (e) {
    console.error(`[api/retry] Error:`, e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
