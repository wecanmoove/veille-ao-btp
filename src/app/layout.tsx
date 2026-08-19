import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";
import { BASE_PATH } from "@/lib/base-path";

export const metadata: Metadata = {
  title: "Renov Midi — Veille AO BTP",
  description:
    "Plateforme SaaS de veille automatisée des appels d'offres BTP — Aix-Marseille, Région Sud, Alpes, Suisse romande",
  manifest: `${BASE_PATH}/manifest.json`,
  icons: {
    icon: `${BASE_PATH}/icon-192.png`,
    apple: `${BASE_PATH}/apple-touch-icon.png`,
  },
  appleWebApp: {
    capable: true,
    title: "Renov Midi",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
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
