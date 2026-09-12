/**
 * Persistencia sobre Supabase (Postgres).
 *
 * Este es el ÚNICO archivo que habla con la base de datos. Nada de aquí hacia
 * fuera conoce Supabase: todas las funciones devuelven tipos de `types.ts`.
 *
 * REGLA IMPORTANTE: `saveStep()` escribe el paso en cuanto termina. Esa
 * escritura es lo que Realtime empuja al cockpit. Por eso:
 *   - un run interrumpido es reanudable,
 *   - el navegador puede refrescarse sin perder nada,
 *   - varias personas ven la misma ejecución en vivo.
 *
 * OJO EQUIPO: todas estas funciones son `async`. Hay que await-earlas.
 */

import { randomUUID } from "node:crypto";

import { admin } from "./supabase";
import type {
  Act,
  AgentStep,
  Artifact,
  Brief,
  ContentPiece,
  Decision,
  Execution,
  Learning,
  Metric,
  Research,
  RunStatus,
  Strategy,
  Workspace,
  WorkspaceState,
} from "./types";

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function now(): string {
  return new Date().toISOString();
}

/** Convierte un error de Supabase en algo legible en consola. */
function check(error: { message: string } | null, context: string): void {
  if (error) throw new Error(`[db:${context}] ${error.message}`);
}

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------

export async function createWorkspace(
  ws: Workspace,
  ownerId?: string,
): Promise<Workspace> {
  const { error } = await admin()
    .from("workspaces")
    .insert({ ...ws, owner_id: ownerId ?? null });
  check(error, "createWorkspace");
  return ws;
}

export async function getWorkspace(id: string): Promise<Workspace | null> {
  const { data, error } = await admin()
    .from("workspaces")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  check(error, "getWorkspace");
  return (data as Workspace) ?? null;
}

export async function listWorkspaces(ownerId?: string): Promise<Workspace[]> {
  let query = admin().from("workspaces").select("*").order("created_at", { ascending: false });
  if (ownerId) query = query.eq("owner_id", ownerId);
  const { data, error } = await query;
  check(error, "listWorkspaces");
  return (data ?? []) as Workspace[];
}

export async function updateWorkspace(
  id: string,
  patch: Partial<Pick<Workspace, "current_act" | "status" | "drive_folder_url" | "name">>,
): Promise<void> {
  const { error } = await admin().from("workspaces").update(patch).eq("id", id);
  check(error, "updateWorkspace");
}

export async function setAct(id: string, act: Act, status?: RunStatus): Promise<void> {
  await updateWorkspace(id, status ? { current_act: act, status } : { current_act: act });
}

// ---------------------------------------------------------------------------
// Documentos únicos: brief | research | strategy
// ---------------------------------------------------------------------------

async function upsertDocument(
  workspaceId: string,
  kind: string,
  payload: unknown,
): Promise<void> {
  const { error } = await admin()
    .from("documents")
    .upsert(
      { workspace_id: workspaceId, kind, payload, updated_at: now() },
      { onConflict: "workspace_id,kind" },
    );
  check(error, `upsertDocument:${kind}`);
}

async function getDocument<T>(workspaceId: string, kind: string): Promise<T | null> {
  const { data, error } = await admin()
    .from("documents")
    .select("payload")
    .eq("workspace_id", workspaceId)
    .eq("kind", kind)
    .maybeSingle();
  check(error, `getDocument:${kind}`);
  return (data?.payload as T) ?? null;
}

export const saveBrief = (b: Brief) => upsertDocument(b.workspace_id, "brief", b);
export const getBrief = (id: string) => getDocument<Brief>(id, "brief");

export const saveResearch = (r: Research) => upsertDocument(r.workspace_id, "research", r);
export const getResearch = (id: string) => getDocument<Research>(id, "research");

export const saveStrategy = (s: Strategy) => upsertDocument(s.workspace_id, "strategy", s);
export const getStrategy = (id: string) => getDocument<Strategy>(id, "strategy");

// ---------------------------------------------------------------------------
// Contenido
// ---------------------------------------------------------------------------

export async function saveContentPiece(piece: ContentPiece): Promise<ContentPiece> {
  const { error } = await admin().from("content_pieces").upsert({
    id: piece.id,
    workspace_id: piece.workspace_id,
    approval: piece.approval,
    payload: piece,
    updated_at: now(),
  });
  check(error, "saveContentPiece");
  return piece;
}

export async function getContentPiece(id: string): Promise<ContentPiece | null> {
  const { data, error } = await admin()
    .from("content_pieces")
    .select("payload")
    .eq("id", id)
    .maybeSingle();
  check(error, "getContentPiece");
  return (data?.payload as ContentPiece) ?? null;
}

export async function listContent(workspaceId: string): Promise<ContentPiece[]> {
  const { data, error } = await admin()
    .from("content_pieces")
    .select("payload")
    .eq("workspace_id", workspaceId)
    .order("updated_at");
  check(error, "listContent");
  return (data ?? []).map((r) => r.payload as ContentPiece);
}

// ---------------------------------------------------------------------------
// Eventos append-only
// ---------------------------------------------------------------------------

async function appendEvent(
  workspaceId: string,
  kind: string,
  id: string,
  payload: unknown,
): Promise<void> {
  const { error } = await admin()
    .from("events")
    .insert({ id, workspace_id: workspaceId, kind, payload, created_at: now() });
  check(error, `appendEvent:${kind}`);
}

async function listEvents<T>(workspaceId: string, kind: string): Promise<T[]> {
  const { data, error } = await admin()
    .from("events")
    .select("payload")
    .eq("workspace_id", workspaceId)
    .eq("kind", kind)
    .order("created_at");
  check(error, `listEvents:${kind}`);
  return (data ?? []).map((r) => r.payload as T);
}

export async function saveDecision(d: Decision): Promise<Decision> {
  await appendEvent(d.workspace_id, "decision", d.id, d);
  return d;
}
export const listDecisions = (id: string) => listEvents<Decision>(id, "decision");

export async function saveExecution(e: Execution): Promise<Execution> {
  await appendEvent(e.workspace_id, "execution", e.id, e);
  return e;
}
export const listExecutions = (id: string) => listEvents<Execution>(id, "execution");

export async function saveMetrics(workspaceId: string, metrics: Metric[]): Promise<void> {
  if (metrics.length === 0) return;
  const { error } = await admin().from("events").insert(
    metrics.map((m) => ({
      id: newId("mtr"),
      workspace_id: workspaceId,
      kind: "metric",
      payload: m,
      created_at: now(),
    })),
  );
  check(error, "saveMetrics");
}
export const listMetrics = (id: string) => listEvents<Metric>(id, "metric");

export async function saveLearning(l: Learning): Promise<Learning> {
  await appendEvent(l.workspace_id, "learning", l.id, l);
  return l;
}
export const listLearnings = (id: string) => listEvents<Learning>(id, "learning");

// ---------------------------------------------------------------------------
// Artefactos de Google Workspace
// ---------------------------------------------------------------------------

export async function saveArtifact(a: Artifact): Promise<Artifact> {
  const { error } = await admin()
    .from("artifacts")
    .upsert(
      {
        id: a.id,
        workspace_id: a.workspace_id,
        slot: a.slot,
        payload: a,
        updated_at: now(),
      },
      { onConflict: "workspace_id,slot" },
    );
  check(error, "saveArtifact");
  return a;
}

export async function listArtifacts(workspaceId: string): Promise<Artifact[]> {
  const { data, error } = await admin()
    .from("artifacts")
    .select("payload")
    .eq("workspace_id", workspaceId)
    .order("slot");
  check(error, "listArtifacts");
  return (data ?? []).map((r) => r.payload as Artifact);
}

// ---------------------------------------------------------------------------
// Trazabilidad — esta escritura es la que dispara Realtime
// ---------------------------------------------------------------------------

export async function saveStep(step: AgentStep): Promise<AgentStep> {
  const { error } = await admin().from("agent_steps").upsert({
    id: step.id,
    workspace_id: step.workspace_id,
    act: step.act,
    agent: step.agent,
    status: step.status,
    payload: step,
  });
  check(error, "saveStep");
  return step;
}

export async function listSteps(workspaceId: string): Promise<AgentStep[]> {
  const { data, error } = await admin()
    .from("agent_steps")
    .select("payload")
    .eq("workspace_id", workspaceId)
    .order("seq");
  check(error, "listSteps");
  return (data ?? []).map((r) => r.payload as AgentStep);
}

// ---------------------------------------------------------------------------
// Estado completo: un solo read pinta el cockpit y alimenta a CopilotKit
// ---------------------------------------------------------------------------

export async function getState(workspaceId: string): Promise<WorkspaceState | null> {
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) return null;

  const [
    brief,
    research,
    strategy,
    content,
    decisions,
    executions,
    metrics,
    learnings,
    artifacts,
    steps,
  ] = await Promise.all([
    getBrief(workspaceId),
    getResearch(workspaceId),
    getStrategy(workspaceId),
    listContent(workspaceId),
    listDecisions(workspaceId),
    listExecutions(workspaceId),
    listMetrics(workspaceId),
    listLearnings(workspaceId),
    listArtifacts(workspaceId),
    listSteps(workspaceId),
  ]);

  return {
    workspace,
    brief,
    research,
    strategy,
    content,
    decisions,
    executions,
    metrics,
    learnings,
    artifacts,
    steps,
  };
}
