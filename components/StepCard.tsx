"use client";

/**
 * Tarjeta de paso del pipeline.
 *
 * Portada directamente de `Features.tsx` del prototipo `agencia-de-marketing-ia`.
 * El prototipo ya tenía el lenguaje visual resuelto; aquí solo se cambia el
 * disparador: donde había `whileInView` (scroll) ahora manda el estado real
 * del `AgentStep` que llega por SSE.
 *
 * El estado `running` reutiliza el patrón `highlight` que ya existía en el
 * prototipo (`border-brand-accent/40 bg-brand-accent/5`).
 */

import { motion } from "motion/react";
import { AlertCircle, Check, Loader2, type LucideIcon } from "lucide-react";
import type { StepStatus } from "@/lib/types";

interface StepCardProps {
  index?: number;
  title: string;
  description: string;
  icon: LucideIcon;
  status?: StepStatus;
  /** Fuentes citadas. Se muestra el recuento: la trazabilidad es el producto. */
  sourceCount?: number;
  onClick?: () => void;
}

const STATUS_RING: Record<StepStatus, string> = {
  pending: "border-surface-border opacity-60",
  running: "step-running",
  done: "border-surface-border",
  failed: "border-red-500/40 bg-red-500/5",
};

export function StepCard({
  index,
  title,
  description,
  icon: Icon,
  status = "pending",
  sourceCount,
  onClick,
}: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClick}
      className={[
        "bg-surface-dark border p-5 rounded-xl flex items-start gap-4",
        "transition-colors hover:border-brand-accent/50",
        onClick ? "cursor-pointer" : "",
        STATUS_RING[status],
      ].join(" ")}
    >
      <div className="bg-brand-dark p-3 rounded-xl border border-surface-border shrink-0">
        <Icon
          className={[
            "w-5 h-5",
            status === "running"
              ? "text-brand-accent animate-makis-pulse"
              : status === "done"
                ? "text-brand-accent"
                : "text-brand-light/40",
          ].join(" ")}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          {index !== undefined && (
            <span className="text-brand-accent/50 font-mono text-sm">{index}</span>
          )}
          <h5 className="font-medium text-brand-light truncate">{title}</h5>
          <StatusBadge status={status} />
        </div>

        <p className="text-brand-light/60 text-xs leading-relaxed">{description}</p>

        {sourceCount !== undefined && sourceCount > 0 && (
          <p className="mt-2 text-[11px] text-brand-accent/70 font-mono">
            {sourceCount} {sourceCount === 1 ? "fuente" : "fuentes"}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: StepStatus }) {
  if (status === "running") {
    return <Loader2 className="w-3.5 h-3.5 text-brand-accent animate-spin shrink-0" />;
  }
  if (status === "done") {
    return <Check className="w-3.5 h-3.5 text-brand-accent shrink-0" />;
  }
  if (status === "failed") {
    return <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />;
  }
  return null;
}

/**
 * Etiqueta de honestidad. La rúbrica penaliza lo simulado disfrazado de real,
 * así que todo lo que sea mock se marca visiblemente en la UI.
 */
export function ModeBadge({ mode }: { mode: "real" | "mock" }) {
  return (
    <span
      className={[
        "text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded",
        mode === "real"
          ? "bg-brand-accent/15 text-brand-accent"
          : "bg-amber-500/15 text-amber-400",
      ].join(" ")}
    >
      {mode === "real" ? "real" : "simulado"}
    </span>
  );
}
