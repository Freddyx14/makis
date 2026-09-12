"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-16 px-6 overflow-hidden bg-[radial-gradient(circle_at_top_right,_#fff3ed,_transparent_38%)]">
      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <p className="text-brand-accent text-sm font-semibold uppercase tracking-[0.18em] mb-5">
            The agency operating environment
          </p>
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif text-brand-light leading-[0.95] mb-6">
            Your agency,<br />in context.
          </h1>
          <p className="text-xl md:text-2xl text-brand-light/70 max-w-2xl mx-auto mb-10">
            One place to connect commercial, delivery, finance, legal, campaigns and the decisions only you can make.
          </p>
          <Link
            href="/nueva"
            className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-white px-8 py-4 rounded-full font-medium text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Start with your agency URL
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
