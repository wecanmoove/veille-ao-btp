"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./logo";

const NAV = [
  { href: "/", label: "Accueil", icon: "🏠" },
  { href: "/ao", label: "Annonces", icon: "📢" },
  { href: "/favoris", label: "Favoris", icon: "⭐" },
  { href: "/sources", label: "Sources de veille", icon: "📚" },
  { href: "/entreprise", label: "Mon entreprise", icon: "🏢" },
  { href: "/config", label: "Configuration", icon: "⚙️" },
  { href: "/historique", label: "Synchronisations", icon: "🔄" },
  { href: "/notifications-log", label: "Alertes envoyées", icon: "🔔" },
  { href: "/erreurs", label: "Journal d'erreurs", icon: "🩺" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-0.5 px-3 py-4">
      {NAV.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-teal-50 text-teal-900 dark:bg-teal-900/40 dark:text-teal-200"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            }`}
          >
            <span className="text-base" aria-hidden>{item.icon}</span>
            {item.label}
            {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-16 items-center border-b border-slate-200 px-5 dark:border-slate-800">
          <Link href="/"><BrandMark /></Link>
        </div>
        <NavLinks />
        <div className="border-t border-slate-200 px-5 py-4 text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
          Aix-Marseille · Région Sud · Alpes · Suisse romande
        </div>
      </aside>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl dark:bg-slate-900">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
              <BrandMark compact />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Fermer le menu"
              >
                ✕
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Contenu */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Ouvrir le menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <Link href="/"><BrandMark compact /></Link>
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
