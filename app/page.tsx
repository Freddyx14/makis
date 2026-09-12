import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col relative overflow-hidden">
      <Header />
      <main className="flex-1 flex flex-col items-center">
        <Hero />
        <Features />
      </main>
      <footer className="py-8 text-center text-brand-light/60 text-sm mt-12 border-t border-surface-border w-full max-w-7xl mx-auto">
        <p>&copy; {new Date().getFullYear()} Makis OS. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header className="w-full absolute top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-serif text-lg tracking-wide text-brand-light">Makis OS</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/laboratorio" className="text-brand-light/80 hover:text-brand-light">Laboratorio de campañas</Link>
          <a href="#como-funciona" className="text-brand-light/80 hover:text-brand-light transition-colors">
            Cómo funciona
          </a>
          <Link
            href="/nueva"
            className="bg-brand-accent hover:bg-brand-accent-hover text-brand-dark px-4 py-2 rounded-full text-sm font-medium transition-all"
          >
            Empezar
          </Link>
        </nav>
      </div>
    </header>
  );
}
