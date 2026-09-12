"use client";

import { motion } from "motion/react";
import Link from "next/link";
import {
  Search,
  Target,
  PenTool,
  Palette,
  LayoutTemplate,
  Share2,
  CheckCircle2,
  TerminalSquare,
  Activity,
  Settings2,
  FileAudio,
  RefreshCw,
  BrainCircuit,
  Building2,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    id: 1,
    title: "Connect your agency",
    description: "Website, operating context, documents and approved sources.",
    icon: Building2,
  },
  {
    id: 2,
    title: "Founder cockpit",
    description: "Turns connected context into priorities, evidence and approval-ready actions.",
    icon: BrainCircuit,
  },
];

const investigate = [
  { title: "Commercial", desc: "Leads, discovery, proposals and the next conversation needed to close.", icon: Search },
  { title: "Finance and legal", desc: "Cash, collections, contracts and approval boundaries in one operating view.", icon: Target },
];

const produce = [
  { title: "Delivery", desc: "Milestones, meetings, owners and handoffs for active clients.", icon: PenTool },
  { title: "Campaigns", desc: "Briefs, creative production, review and performance by client.", icon: Palette },
  { title: "Documents", desc: "Readable Markdown rendered as the operating interface.", icon: LayoutTemplate },
  { title: "Capacity", desc: "Clear ownership and a view of workload across the team.", icon: Share2 },
];

const execute = [
  { title: "Human approval", desc: "Review drafts, contracts, budgets and external actions before anything moves.", icon: CheckCircle2, highlight: true },
  { title: "Auditable execution", desc: "Every approved action keeps an evidence trail and updates the canonical record.", icon: TerminalSquare },
];

const monitor = [
  { id: 6, title: "Founder Council", desc: "At most three decisions with evidence, owner and cost of waiting.", icon: Activity },
  { id: 7, title: "Focused work", desc: "Open one client context, work without leakage, and leave a useful handoff.", icon: Settings2 },
  { id: 8, title: "Operational memory", desc: "Outcomes become documented learnings for the next iteration.", icon: FileAudio },
];

export function Features() {
  return (
    <section id="how-it-works" className="w-full max-w-7xl mx-auto px-6 py-24 relative z-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-serif text-brand-light mb-4">
          One connected operating system
        </h2>
        <p className="text-brand-light/70 text-lg max-w-2xl mx-auto">
          Departments do deep work. The founder sees what needs a decision.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Row 1: Setup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, idx) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-surface-dark border border-surface-border p-6 rounded-2xl flex items-start gap-4 hover:border-brand-accent/50 transition-colors"
            >
              <div className="bg-brand-dark p-3 rounded-xl border border-surface-border">
                <step.icon className="w-6 h-6 text-brand-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-brand-accent/50 font-mono text-sm">{step.id}</span>
                  <h3 className="text-xl font-medium text-brand-light">{step.title}</h3>
                </div>
                <p className="text-brand-light/70 text-sm leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Middle Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
          {/* Investigate */}
          <div className="space-y-4">
            <h4 className="text-brand-light/50 font-medium mb-4 flex items-center gap-2">
              <span className="bg-brand-accent/20 text-brand-accent w-6 h-6 rounded-full flex items-center justify-center text-xs">
                3
              </span>
              Understand and decide
            </h4>
            {investigate.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + idx * 0.1 }}
                className="bg-surface-dark border border-surface-border p-5 rounded-xl flex gap-4"
              >
                <item.icon className="w-5 h-5 text-brand-light/40 shrink-0 mt-1" />
                <div>
                  <h5 className="font-medium text-brand-light mb-1">{item.title}</h5>
                  <p className="text-brand-light/60 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Produce */}
          <div className="space-y-4">
            <h4 className="text-brand-light/50 font-medium mb-4 flex items-center gap-2">
              <span className="bg-brand-accent/20 text-brand-accent w-6 h-6 rounded-full flex items-center justify-center text-xs">
                4
              </span>
              Run the agency
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {produce.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="bg-surface-dark border border-surface-border p-4 rounded-xl flex flex-col gap-2"
                >
                  <item.icon className="w-4 h-4 text-brand-light/40" />
                  <h5 className="font-medium text-brand-light text-sm">{item.title}</h5>
                  <p className="text-brand-light/60 text-[11px] leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Execute */}
          <div className="space-y-4">
            <h4 className="text-brand-light/50 font-medium mb-4 flex items-center gap-2">
              <span className="bg-brand-accent/20 text-brand-accent w-6 h-6 rounded-full flex items-center justify-center text-xs">
                5
              </span>
              Approve and move
            </h4>
            {execute.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + idx * 0.1 }}
                className={`bg-surface-dark border p-5 rounded-xl flex gap-4 ${
                  item.highlight ? "border-brand-accent/40 bg-brand-accent/5" : "border-surface-border"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 shrink-0 mt-1 ${
                    item.highlight ? "text-brand-accent" : "text-brand-light/40"
                  }`}
                />
                <div>
                  <h5 className="font-medium text-brand-light mb-1">{item.title}</h5>
                  <p className="text-brand-light/60 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Row 3: Monitor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {monitor.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 + idx * 0.1 }}
              className="bg-surface-dark border border-surface-border p-5 rounded-xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-brand-accent/50 font-mono text-sm">{item.id}</span>
                <item.icon className="w-4 h-4 text-brand-light/60" />
                <h5 className="font-medium text-brand-light">{item.title}</h5>
              </div>
              <p className="text-brand-light/60 text-xs leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Loop back */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.2 }}
          className="flex items-center justify-center gap-3 text-brand-accent mt-4 pt-6 border-t border-surface-border/50"
        >
          <RefreshCw className="w-5 h-5" />
          <span className="text-sm font-medium tracking-wide">
            Outcomes update the operating memory and improve the next decision
          </span>
        </motion.div>
      </div>

      {/* CTA */}
      <div className="mt-16 text-center">
        <Link
          href="/nueva"
          className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white px-8 py-4 rounded-full font-medium text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
        >
          Start workspace
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}
