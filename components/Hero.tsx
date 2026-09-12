"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-16 px-6 overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif text-brand-light leading-tight mb-6">
            Makis OS
          </h1>
          <p className="text-xl md:text-2xl text-brand-light/80 max-w-2xl mx-auto mb-10 font-light">
            El equipo de marketing que vive en tu Google Workspace.
            <br />
            Pega la URL de tu negocio y obtén la campaña completa.
          </p>
          <Link
            href="/nueva"
            className="inline-flex items-center gap-2 bg-brand-accent hover:bg-brand-accent-hover text-brand-dark px-8 py-4 rounded-full font-medium text-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Empezar ahora
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
