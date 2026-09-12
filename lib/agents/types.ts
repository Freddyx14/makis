/**
 * Contexto compartido entre todos los agentes.
 *
 * Cada agente recibe un `PipelineContext` inmutable (el director lo crea
 * al inicio del run). Los agentes NO hablan entre sí: todo el estado
 * viaja por Supabase a través de `lib/db.ts`.
 */

import type { Workspace, Brief, Research, Strategy, ContentPiece, AgentStep } from "../types";

export interface PipelineContext {
  workspace: Workspace;
  brief: Brief;
  /** Token de Google del usuario. Vence en 1 hora. Se pasa para crear Docs/Sheets. */
  accessToken: string;
  /** URL de redirección para el post-pipeline. */
  redirectUrl: string;
}

/**
 * Resultado de un agente. El director lo persiste y pasa al siguiente.
 */
export interface AgentResult {
  act: string;
  agent: string;
  name: string;
  /** Paso de trazabilidad generado. */
  step: AgentStep;
  /** Datos producidos (brief, research, strategy, content[], etc.) */
  data?: unknown;
}

/**
 * Firma de un agente: recibe contexto + datos previos, devuelve resultado.
 */
export type AgentFn = (
  ctx: PipelineContext,
  prev?: AgentResult,
) => Promise<AgentResult>;
