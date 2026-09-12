"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  Search,
  Target,
  PenTool,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Loader2,
  AlertCircle,
  FileText,
  Sheet,
} from "lucide-react";
import { StepCard, ModeBadge } from "@/components/StepCard";
import type { WorkspaceState, AgentStep, Artifact, ContentPiece } from "@/lib/types";

const ACT_ICONS: Record<string, typeof Search> = {
  entrada: Target,
  investigar: Search,
  construir: PenTool,
  gobernar: CheckCircle2,
  aprender: BarChart3,
};

const ACT_ORDER = ["entrada", "investigar", "construir", "gobernar", "aprender"];

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [state, setState] = useState<WorkspaceState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    async function fetchState() {
      try {
        const res = await fetch(`/api/workspaces/${id}`);
        if (!res.ok) throw new Error("Workspace no encontrado");
        const data = await res.json();
        if (mounted) {
          setState(data);
          setLoading(false);
        }
      } catch (e) {
        if (mounted) {
          setError((e as Error).message);
          setLoading(false);
        }
      }
    }

    fetchState();

    // Polling cada 3 segundos para actualizaciones
    const interval = setInterval(fetchState, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-brand-light/80 text-lg">{error || "Workspace no encontrado"}</p>
        <button
          onClick={() => router.push("/nueva")}
          className="text-brand-accent hover:text-brand-accent-hover text-sm"
        >
          Crear nuevo workspace
        </button>
      </div>
    );
  }

  const { workspace, steps, artifacts, content } = state;
  const currentActIndex = ACT_ORDER.indexOf(workspace.current_act);

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <header className="border-b border-surface-border bg-surface-dark/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif text-brand-light">{workspace.name || workspace.url}</h1>
            <p className="text-brand-light/60 text-sm">{workspace.objective}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={workspace.status} />
            {workspace.drive_folder_url && (
              <a
                href={workspace.drive_folder_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-brand-accent hover:text-brand-accent-hover text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Drive
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            {ACT_ORDER.map((act, idx) => {
              const Icon = ACT_ICONS[act] || Target;
              const isActive = workspace.current_act === act;
              const isDone = idx < currentActIndex;
              return (
                <div key={act} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border ${
                      isActive
                        ? "border-brand-accent bg-brand-accent/10"
                        : isDone
                          ? "border-brand-accent/50 bg-brand-accent/5"
                          : "border-surface-border bg-surface-dark"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? "text-brand-accent"
                          : isDone
                            ? "text-brand-accent/70"
                            : "text-brand-light/30"
                      }`}
                    />
                  </div>
                  {idx < ACT_ORDER.length - 1 && (
                    <div
                      className={`w-8 h-0.5 ${
                        isDone ? "bg-brand-accent/50" : "bg-surface-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-brand-light/60 text-sm capitalize">
            Acto: {workspace.current_act} &middot;{" "}
            <span className={workspace.status === "running" ? "text-brand-accent animate-makis-pulse" : ""}>
              {workspace.status}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda: Pasos */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-lg font-serif text-brand-light mb-4">Progreso del pipeline</h2>
            {steps.length === 0 ? (
              <p className="text-brand-light/50 text-sm">Esperando primer paso...</p>
            ) : (
              steps.map((step, idx) => (
                <StepCard
                  key={step.id}
                  index={idx + 1}
                  title={step.name}
                  description={step.detail || "..."}
                  icon={ACT_ICONS[step.act] || Target}
                  status={step.status}
                  sourceCount={step.sources.length}
                />
              ))
            )}
          </div>

          {/* Columna derecha: Artefactos + Contenido */}
          <div className="space-y-6">
            {/* Artefactos de Google Workspace */}
            <div>
              <h2 className="text-lg font-serif text-brand-light mb-4">Entregables en Drive</h2>
              {artifacts.length === 0 ? (
                <p className="text-brand-light/50 text-sm">Aún no hay artefactos...</p>
              ) : (
                <div className="space-y-2">
                  {artifacts.map((art) => (
                    <ArtifactCard key={art.id} artifact={art} />
                  ))}
                </div>
              )}
            </div>

            {/* Contenido generado */}
            {content.length > 0 && (
              <div>
                <h2 className="text-lg font-serif text-brand-light mb-4">Contenido</h2>
                <div className="space-y-2">
                  {content.map((piece) => (
                    <ContentCard key={piece.id} piece={piece} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-brand-light/10 text-brand-light/60",
    running: "bg-brand-accent/15 text-brand-accent",
    completed: "bg-green-500/15 text-green-400",
    failed: "bg-red-500/15 text-red-400",
    awaiting_approval: "bg-amber-500/15 text-amber-400",
  };

  return (
    <span className={`text-xs font-mono uppercase px-2 py-1 rounded ${colors[status] || colors.pending}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function ArtifactCard({ artifact }: { artifact: Artifact }) {
  const Icon = artifact.kind === "google_sheet" ? Sheet : FileText;

  return (
    <a
      href={artifact.url || "#"}
      target={artifact.url ? "_blank" : undefined}
      rel="noopener noreferrer"
      className="flex items-center gap-3 bg-surface-dark border border-surface-border rounded-xl p-3 hover:border-brand-accent/50 transition-colors"
    >
      <Icon className="w-5 h-5 text-brand-accent shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-brand-light text-sm font-medium truncate">{artifact.title}</p>
        <p className="text-brand-light/50 text-xs">{artifact.slot}</p>
      </div>
      <ModeBadge mode={artifact.mode} />
      {artifact.url && <ExternalLink className="w-4 h-4 text-brand-light/40 shrink-0" />}
    </a>
  );
}

function ContentCard({ piece }: { piece: ContentPiece }) {
  return (
    <div className="bg-surface-dark border border-surface-border rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-brand-accent/70 text-xs font-mono uppercase">{piece.kind}</span>
        <span className="text-brand-light/30 text-xs">/</span>
        <span className="text-brand-light/60 text-xs">{piece.channel}</span>
      </div>
      <p className="text-brand-light text-sm font-medium truncate">{piece.title}</p>
      <p className="text-brand-light/50 text-xs mt-1 line-clamp-2">{piece.body.slice(0, 120)}...</p>
    </div>
  );
}
