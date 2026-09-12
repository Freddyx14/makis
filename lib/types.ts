/**
 * Espejo en TypeScript del contrato de `apps/api/models.py`.
 *
 * LA FUENTE DE VERDAD ES EL ARCHIVO DE PYTHON. Si cambias algo alli, replicalo
 * aqui en el mismo commit. Hay cuatro personas construyendo contra estos tipos.
 *
 * Los cuatro actos: INVESTIGAR -> CONSTRUIR -> GOBERNAR -> APRENDER.
 */

export type Act = "entrada" | "investigar" | "construir" | "gobernar" | "aprender";

export const ACTS: Act[] = ["entrada", "investigar", "construir", "gobernar", "aprender"];

export const ACT_LABEL: Record<Act, string> = {
  entrada: "Entrada",
  investigar: "Investigar",
  construir: "Construir",
  gobernar: "Gobernar",
  aprender: "Aprender",
};

export type RunStatus =
  | "pending"
  | "running"
  | "awaiting_approval"
  | "completed"
  | "failed";

export type StepStatus = "pending" | "running" | "done" | "failed";

export type AgentName =
  | "director"
  | "researcher"
  | "strategist"
  | "creator"
  | "analyst";

export type Confidence = "alta" | "media" | "baja";

export type ApprovalState = "draft" | "approved" | "rejected" | "edited";

/** Distingue lo real de lo simulado. La UI DEBE mostrar esta diferencia. */
export type ExecutionMode = "real" | "mock";

// ---------------------------------------------------------------------------
// Trazabilidad
// ---------------------------------------------------------------------------

export interface Source {
  url: string;
  title: string;
  snippet: string;
  retrieved_at: string;
}

// ---------------------------------------------------------------------------
// ENTRADA
// ---------------------------------------------------------------------------

export interface WorkspaceCreate {
  url: string;
  objective: string;
  budget?: string | null;
  market?: string | null;
}

export interface BusinessProfile {
  brand_name: string;
  offer: string;
  categories: string[];
  tone?: string | null;
  audience_signals: string[];
  language: string;
  sources: Source[];
  confirmed_by_user: boolean;
}

export interface Brief {
  workspace_id: string;
  profile: BusinessProfile;
  objective: string;
  budget?: string | null;
  market?: string | null;
  assumptions: string[];
}

// ---------------------------------------------------------------------------
// 1. INVESTIGAR
// ---------------------------------------------------------------------------

export type FindingCategory =
  | "mercado"
  | "competencia"
  | "audiencia"
  | "tendencias"
  | "tecnico"
  | "contenido";

export interface Finding {
  id: string;
  category: FindingCategory;
  claim: string;
  /** Nunca vacio. Un finding sin evidencia es un bug. */
  evidence: Source[];
  confidence: Confidence;
}

export interface Competitor {
  name: string;
  url: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  sources: Source[];
}

export interface Research {
  workspace_id: string;
  findings: Finding[];
  competitors: Competitor[];
}

// ---------------------------------------------------------------------------
// 2. CONSTRUIR
// ---------------------------------------------------------------------------

export interface BuyerPersona {
  name: string;
  description: string;
  pains: string[];
  triggers: string[];
}

export interface ChannelPlan {
  channel: string;
  rationale: string;
  /** Fraccion del presupuesto, 0..1 */
  budget_share: number;
}

export interface Kpi {
  name: string;
  target: string;
  why: string;
}

export interface Strategy {
  workspace_id: string;
  campaign: string;
  offer: string;
  personas: BuyerPersona[];
  channels: ChannelPlan[];
  kpis: Kpi[];
  grounded_in: string[];
}

export type ContentKind =
  | "post"
  | "email"
  | "ad"
  | "article"
  | "script"
  | "landing";

export interface ContentPiece {
  id: string;
  workspace_id: string;
  kind: ContentKind;
  channel: string;
  title: string;
  body: string;
  image_prompt?: string | null;
  image_url?: string | null;
  scheduled_for?: string | null;
  approval: ApprovalState;
}

// ---------------------------------------------------------------------------
// 3. GOBERNAR
// ---------------------------------------------------------------------------

export interface Decision {
  id: string;
  workspace_id: string;
  target_kind: "content_piece" | "strategy" | "brief";
  target_id: string;
  action: "approve" | "reject" | "edit";
  note?: string | null;
  previous_value?: string | null;
  new_value?: string | null;
  decided_at: string;
}

export interface Execution {
  id: string;
  workspace_id: string;
  content_piece_id: string;
  target:
    | "resend"
    | "google_ads"
    | "meta_ads"
    | "google_docs"
    | "google_sheets";
  mode: ExecutionMode;
  external_ref?: string | null;
  executed_at: string;
}

// ---------------------------------------------------------------------------
// 4. APRENDER
// ---------------------------------------------------------------------------

export interface Metric {
  channel: string;
  leads: number;
  conversions: number;
  cpl: number;
  cac: number;
  roas: number;
  mode: ExecutionMode;
}

export interface Learning {
  id: string;
  workspace_id: string;
  insight: string;
  evidence: Metric[];
  next_experiment: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Artefactos en Google Workspace
// ---------------------------------------------------------------------------

export type ArtifactSlot =
  | "00-brief"
  | "01-investigacion"
  | "02-estrategia"
  | "03-calendario"
  | "04-creatividades"
  | "05-resultados";

export interface Artifact {
  id: string;
  workspace_id: string;
  slot: ArtifactSlot;
  kind: "google_doc" | "google_sheet" | "google_slides";
  title: string;
  url?: string | null;
  mode: ExecutionMode;
  updated_at: string;
}

export const ARTIFACT_TITLES: Record<ArtifactSlot, string> = {
  "00-brief": "00 · Brief",
  "01-investigacion": "01 · Investigación",
  "02-estrategia": "02 · Estrategia",
  "03-calendario": "03 · Calendario",
  "04-creatividades": "04 · Creatividades",
  "05-resultados": "05 · Resultados",
};

// ---------------------------------------------------------------------------
// Orquestacion
// ---------------------------------------------------------------------------

export interface AgentStep {
  id: string;
  workspace_id: string;
  act: Act;
  agent: AgentName;
  name: string;
  status: StepStatus;
  detail?: string | null;
  sources: Source[];
  model?: string | null;
  tokens_in: number;
  tokens_out: number;
  started_at?: string | null;
  finished_at?: string | null;
}

export interface Workspace {
  id: string;
  url: string;
  name: string;
  objective: string;
  budget?: string | null;
  market?: string | null;
  current_act: Act;
  status: RunStatus;
  drive_folder_url?: string | null;
  created_at: string;
}

/** Un solo GET pinta todo el cockpit. Es tambien lo que lee CopilotKit. */
export interface WorkspaceState {
  workspace: Workspace;
  brief?: Brief | null;
  research?: Research | null;
  strategy?: Strategy | null;
  content: ContentPiece[];
  decisions: Decision[];
  executions: Execution[];
  metrics: Metric[];
  learnings: Learning[];
  artifacts: Artifact[];
  steps: AgentStep[];
}

// ---------------------------------------------------------------------------
// Eventos SSE
// ---------------------------------------------------------------------------

export interface StreamEvent {
  type: "step" | "artifact" | "state" | "error" | "done";
  act?: Act | null;
  step?: AgentStep | null;
  artifact?: Artifact | null;
  message?: string | null;
}
