/**
 * Branding Renov Midi — identité visuelle, couleurs, typo.
 * Inspiré des design systems modernes (Linear, Stripe, Vercel).
 */

export const BRANDING = {
  appName: "Renov Midi",
  tagline: "Appels d'offres BTP — Région Sud & Alpes",
  logo: "🏗️RM", // emoji placeholder; remplacer par SVG/PNG en production
  colors: {
    primary: "#0f766e", // teal foncé (Renov = rénovation verte)
    primaryLight: "#14b8a6",
    accent: "#f97316", // orange (construction)
    success: "#22c55e",
    warning: "#eab308",
    error: "#ef4444",
    neutral: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },
  },
  typography: {
    fontFamily: {
      sans: "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "ui-monospace, 'SF Mono', Monaco, 'Cascadia Code', Courier New, monospace",
    },
  },
} as const;

export const REGIONS = {
  FR_SUD: { id: "region-sud", name: "Région Sud", emoji: "☀️" },
  FR_ALPES: { id: "alpes", name: "Alpes", emoji: "⛰️" },
  CH_ROMANDE: { id: "suisse-romande", name: "Suisse romande", emoji: "🇨🇭" },
} as const;
