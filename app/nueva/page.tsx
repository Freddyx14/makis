"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ArrowRight, Globe, Target, DollarSign, MapPin, Loader2 } from "lucide-react";

export default function NuevaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockDemo, setMockDemo] = useState(true);
  const [form, setForm] = useState({
    url: "https://crispy-chicken-promo.example/",
    objective: "Impulsar pedidos digitales de una propuesta para compartir en Lima durante cuatro semanas.",
    budget: "S/12,000 PEN · 4 semanas",
    market: "Lima, Perú / español · audiencia 18–35 años",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.url || !form.objective) return;

    setLoading(true);
    setError(null);

    try {
      if (mockDemo) {
        const sessionResponse = await fetch("/api/lab/session", {cache:"no-store"});
        const session = await sessionResponse.json();
        if (!sessionResponse.ok) throw new Error(session.detail || "No se pudo conectar al laboratorio.");
        if (!session.authenticated) throw new Error("Inicia sesión en /laboratorio y vuelve a esta pantalla para cargar el mockup.");
        const response = await fetch("/api/lab/campaigns/mock-kfc", {
          method:"POST", headers:{"Content-Type":"application/json"}, body:"{}",
        });
        const campaign = await response.json();
        if (!response.ok) throw new Error(campaign.detail || "No se pudo cargar el caso de presentación.");
        router.push(`/laboratorio?campaign=${encodeURIComponent(campaign.id)}`);
        return;
      }
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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-serif text-brand-light mb-4">
            Create agency workspace
          </h1>
          <p className="text-brand-light/70 text-lg">
            Start with the agency URL. Mark AI prepares the operating context.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-brand-light">
            <label className="flex gap-3 items-start cursor-pointer">
              <input type="checkbox" checked={mockDemo} disabled={loading} onChange={e=>{
                const enabled=e.target.checked;
                setMockDemo(enabled);
                setForm(enabled ? {url:"https://crispy-chicken-promo.example/",objective:"Impulsar pedidos digitales de una propuesta para compartir en Lima durante cuatro semanas.",budget:"S/12,000 PEN · 4 semanas",market:"Lima, Perú / español · audiencia 18–35 años"} : {url:"",objective:"",budget:"",market:""});
              }}/>
              <span><strong>Usar caso BK: Crispy Chicken Promo</strong><br/>Al continuar abrirás Laboratorio de campañas con las cinco etapas cargadas.</span>
            </label>
          </div>
          {/* URL */}
          <div>
            <label className="block text-brand-light/80 text-sm font-medium mb-2">
              <Globe className="w-4 h-4 inline mr-2" />
              Agency website *
            </label>
            <input
              type="url"
              required
              placeholder="https://youragency.com"
              value={form.url}
              readOnly={mockDemo || loading}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>

          {/* Objetivo */}
          <div>
            <label className="block text-brand-light/80 text-sm font-medium mb-2">
              <Target className="w-4 h-4 inline mr-2" />
              Founder objective *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Example: bring client delivery, cash and campaign work into one operating view"
              value={form.objective}
              readOnly={mockDemo || loading}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:border-brand-accent transition-colors resize-none"
            />
          </div>

          {/* Presupuesto */}
          <div>
            <label className="block text-brand-light/80 text-sm font-medium mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Monthly operating budget (optional)
            </label>
            <input
              type="text"
              placeholder="Example: $500 USD"
              value={form.budget}
              readOnly={mockDemo || loading}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              className="w-full bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-brand-light placeholder-brand-light/40 focus:outline-none focus:border-brand-accent transition-colors"
            />
          </div>

          {/* Mercado */}
          <div>
            <label className="block text-brand-light/80 text-sm font-medium mb-2">
              <MapPin className="w-4 h-4 inline mr-2" />
              Primary market (optional)
            </label>
            <input
              type="text"
              placeholder="Example: Peru, LATAM"
              value={form.market}
              readOnly={mockDemo || loading}
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
                {mockDemo ? "Preparando campaña…" : "Creating workspace..."}
              </>
            ) : (
              <>
                {mockDemo ? "Abrir Laboratorio de campañas" : "Build operating context"}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
