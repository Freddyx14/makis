"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Globe, Target, DollarSign, MapPin, Loader2 } from "lucide-react";

export default function NuevaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    url: "",
    objective: "",
    budget: "",
    market: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.url || !form.objective) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: form.url,
          objective: form.objective,
          budget: form.budget || null,
          market: form.market || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error creando workspace");
      }

      router.push(`/workspace/${data.workspace.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-serif text-brand-light mb-4">
            Nuevo workspace
          </h1>
          <p className="text-brand-light/70 text-lg">
            Ingresa los datos de tu negocio y Makis se encarga del resto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL */}
          <div>
            <label className="block text-brand-light/80 text-sm font-medium mb-2">
              <Globe className="w-4 h-4 inline mr-2" />
              URL del negocio *
            </label>
            <input
              type="url"
              required
              placeholder="https://tunegocio.com"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>

          {/* Objetivo */}
          <div>
            <label className="block text-brand-light/80 text-sm font-medium mb-2">
              <Target className="w-4 h-4 inline mr-2" />
              Objetivo de marketing *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Ej: Generar 50 leads calificados por mes para nuestro servicio de consultoría"
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:border-brand-accent transition-colors resize-none"
            />
          </div>

          {/* Presupuesto */}
          <div>
            <label className="block text-brand-light/80 text-sm font-medium mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Presupuesto mensual (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: $500 USD"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>

          {/* Mercado */}
          <div>
            <label className="block text-brand-light/80 text-sm font-medium mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Mercado objetivo (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej: Chile, Latinoamérica"
              value={form.market}
              onChange={(e) => setForm({ ...form, market: e.target.value })}
              className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !form.url || !form.objective}
            className="w-full bg-brand-accent hover:bg-brand-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-brand-dark px-6 py-4 rounded-full font-medium text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creando workspace...
              </>
            ) : (
              <>
                Lanzar investigación
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
