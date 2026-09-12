/**
 * GET /api/workspaces/[id]
 *
 * Devuelve el estado completo del workspace para el cockpit.
 */

import { NextRequest, NextResponse } from "next/server";
import { getState } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const state = await getState(id);
    if (!state) {
      return NextResponse.json(
        { error: "Workspace no encontrado" },
        { status: 404 },
      );
    }
    return NextResponse.json(state);
  } catch (e) {
    console.error(`[api/workspaces/${id}] Error:`, e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 },
    );
  }
}
