import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Renov Midi — Veille AO BTP",
  description:
    "Plateforme SaaS de veille automatisée des appels d'offres BTP — Aix-Marseille, Région Sud, Alpes, Suisse romande",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
