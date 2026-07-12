import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Veille AO BTP",
  description: "Veille automatisée des appels d'offres BTP / réhabilitation",
};

const NAV_ITEMS = [
  { href: "/ao", label: "Tableau de bord" },
  { href: "/config", label: "Configuration" },
  { href: "/historique", label: "Historique syncs" },
  { href: "/notifications-log", label: "Notifications" },
  { href: "/erreurs", label: "Journal d'erreurs" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/ao" className="text-lg font-bold text-slate-900">
                🏗️ Veille AO BTP
              </Link>
              <nav className="flex gap-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </body>
    </html>
  );
}
