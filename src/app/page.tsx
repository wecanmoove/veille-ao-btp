"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ScoreBadge, RelevanceBadge } from "@/components/badges";

interface Stats {
  total: number;
  relevant: number;
  tresPertinent: number;
  new7d: number;
  expiring14d: number;
  budgetSum: number;
  byZone: Record<string, number>;
  byCategory: Record<string, number>;
  aixMarseille: { total: number; new7d: number };
  topTenders: {
    id: string;
    title: string;
    buyer: string | null;
    score: number;
    relevanceLevel: string;
    departements: string[];
    country: string;
    deadlineAt: string | null;
    source: { name: string };
  }[];
}

const ZONE_META: Record<string, { label: string; icon: string; color: string }> = {
  "region-sud": { label: "Région Sud — Marseille", icon: "☀️", color: "bg-orange-500" },
  alpes: { label: "Alpes — Annecy", icon: "⛰️", color: "bg-sky-500" },
  "suisse-romande": { label: "Suisse romande", icon: "🇨🇭", color: "bg-red-500" },
};

const CATEGORY_LABELS: Record<string, string> = {
  rehabilitation: "Réhabilitation",
  renovation: "Rénovation",
  gros_oeuvre: "Gros œuvre",
  second_oeuvre: "Second œuvre",
  tce: "TCE",
  maintenance_entretien: "Maintenance",
  hors_cible: "Autres",
};

function formatEuros(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M€`;
  if (n >= 1_000) return `${Math.round(n / 1_000).toLocaleString("fr-FR")} k€`;
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const maxZone = stats ? Math.max(1, ...Object.values(stats.byZone)) : 1;
  const categories = stats
    ? Object.entries(stats.byCategory)
        .filter(([k]) => k !== "hors_cible")
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
    : [];
  const maxCat = Math.max(1, ...categories.map(([, v]) => v));

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 p-8 text-white shadow-lg dark:border-slate-800">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/95 shadow-lg">
            <Logo size={52} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Renov <span className="text-orange-400">Midi</span>
            </h1>
            <p className="mt-1 max-w-2xl text-teal-100">
              Votre veille d&apos;appels d&apos;offres BTP, centrée sur <strong className="text-white">Aix-Marseille</strong> et
              la Région Sud, étendue aux Alpes et à la Suisse romande. Collecte automatique, score sur 100, alertes.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/ao?departement=13"
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow hover:bg-orange-400"
              >
                🎯 Focus Aix-Marseille (13)
              </Link>
              <Link
                href="/ao"
                className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/40 hover:bg-white/20"
              >
                Toutes les annonces
              </Link>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 opacity-10" aria-hidden>
          <Logo size={280} />
        </div>
      </section>

      {/* KPI */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Kpi label="Annonces suivies" value={stats?.relevant ?? "…"} icon="📋" />
        <Kpi label="Nouvelles (7 jours)" value={stats?.new7d ?? "…"} icon="✨" accent />
        <Kpi label="Expirent sous 14 j" value={stats?.expiring14d ?? "…"} icon="⏰" />
        <Kpi label="Très pertinentes" value={stats?.tresPertinent ?? "…"} icon="🎯" />
        <Kpi label="Montants cumulés" value={stats ? formatEuros(stats.budgetSum) : "…"} icon="💶" />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Focus Aix-Marseille */}
        <section className="rounded-xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-900/50 dark:bg-orange-950/30">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-orange-700 dark:text-orange-300">
            🎯 Priorité Aix-Marseille
          </h2>
          <p className="mt-3 text-4xl font-extrabold text-slate-900 dark:text-white">
            {stats?.aixMarseille.total ?? "…"}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            annonces actives dans le 13, dont{" "}
            <strong className="text-orange-700 dark:text-orange-300">{stats?.aixMarseille.new7d ?? "…"} nouvelles</strong>{" "}
            cette semaine. Le scoring donne un bonus aux Bouches-du-Rhône.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { label: "Marseille", href: "/ao?q=Marseille" },
              { label: "Aix-en-Provence", href: "/ao?q=Aix" },
              { label: "Dépt 13", href: "/ao?departement=13" },
            ].map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-300 hover:bg-orange-100 dark:bg-slate-900 dark:text-orange-300 dark:ring-orange-800"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Répartition zones */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Répartition géographique
          </h2>
          <div className="mt-4 space-y-4">
            {Object.entries(ZONE_META).map(([zoneId, meta]) => {
              const count = stats?.byZone[zoneId] ?? 0;
              return (
                <Link key={zoneId} href={`/ao?zone=${zoneId}`} className="block group">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 group-hover:text-teal-700 dark:text-slate-300">
                      {meta.icon} {meta.label}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{count}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${meta.color}`}
                      style={{ width: `${(count / maxZone) * 100}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Répartition catégories */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Répartition sectorielle
          </h2>
          <div className="mt-4 space-y-3">
            {categories.length === 0 && <p className="text-sm text-slate-400">Chargement…</p>}
            {categories.map(([cat, count]) => (
              <Link key={cat} href={`/ao?workCategory=${cat}`} className="block group">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 group-hover:text-teal-700 dark:text-slate-300">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{count}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-teal-600"
                    style={{ width: `${(count / maxCat) * 100}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Top annonces */}
      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white">🏆 Meilleures opportunités du moment</h2>
          <Link href="/ao" className="text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400">
            Tout voir →
          </Link>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {!stats && <li className="px-5 py-6 text-sm text-slate-400">Chargement…</li>}
          {stats?.topTenders.map((t) => (
            <li key={t.id}>
              <Link href={`/ao/${t.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <ScoreBadge score={t.score} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900 dark:text-white">{t.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {t.buyer ?? "Acheteur non renseigné"} · {t.country === "CH" ? "🇨🇭" : "🇫🇷"}{" "}
                    {t.departements.join(", ")}
                    {t.deadlineAt && ` · limite ${new Date(t.deadlineAt).toLocaleDateString("fr-FR")}`}
                  </p>
                </div>
                <span className="hidden sm:block"><RelevanceBadge level={t.relevanceLevel} /></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Kpi({ label, value, icon, accent }: { label: string; value: string | number; icon: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent
          ? "border-teal-200 bg-teal-50 dark:border-teal-900 dark:bg-teal-950/40"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <span aria-hidden>{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
