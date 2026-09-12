import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { MarkLogo } from "@/components/MarkLogo";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      <Header />
      <main className="flex-1 flex flex-col items-center">
        <Hero />
        <Features />
      </main>
      <footer className="py-8 text-center text-brand-light/60 text-sm mt-12 border-t border-surface-border w-full max-w-7xl mx-auto">
        <p>&copy; {new Date().getFullYear()} Mark AI. Your agency, in context.</p>
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header className="w-full absolute top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <MarkLogo className="h-7 w-auto" />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#how-it-works" className="text-brand-light/70 hover:text-brand-light transition-colors">
            How it works
          </a>
          <Link
            href="/nueva"
            className="bg-brand-accent hover:bg-brand-accent-hover text-white px-4 py-2 rounded-full text-sm font-medium transition-all"
          >
            Start workspace
          </Link>
        </nav>
      </div>
    </header>
  );
}
