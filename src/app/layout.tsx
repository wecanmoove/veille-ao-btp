import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Renov Midi — Veille AO BTP",
  description: "Plateforme SaaS de veille automatisée des appels d'offres BTP — Région Sud, Alpes, Suisse romande",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 font-sans dark:bg-slate-950 dark:text-slate-50">
        <div className="flex h-screen flex-col">
          {/* Header */}
          <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-lg font-bold text-teal-700 dark:text-teal-400">
                  <span className="text-2xl">🏗️</span>
                  <span>Renov Midi</span>
                </Link>
                <nav className="hidden sm:flex gap-1">
                  <Link href="/" className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                    Dashboard
                  </Link>
                  <Link href="/ao" className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                    Annonces
                  </Link>
                  <Link href="/config" className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                    Config
                  </Link>
                </nav>
              </div>
            </div>
          </header>
          {/* Main */}
          <main className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
