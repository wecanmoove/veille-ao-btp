"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RelevanceBadge, CategoryBadge, ScoreBadge } from "@/components/badges";

interface TenderListItem {
  id: string;
  title: string;
  buyer: string | null;
  score: number;
  relevanceLevel: string;
  workCategory: string;
  departements: string[];
  country: string;
  zones: string[];
  budgetEstime: number | null;
  deadlineAt: string | null;
  publishedAt: string | null;
  status: string;
  source: { name: string; slug: string };
}

interface SourceOption {
  slug: string;
  name: string;
}

interface ZoneOption {
  id: string;
  label: string;
  enabled: boolean;
}

const RELEVANCE_OPTIONS = [
  { value: "", label: "Tous niveaux" },
  { value: "tres_pertinent", label: "Très pertinent" },
  { value: "pertinent", label: "Pertinent" },
  { value: "a_verifier", label: "À vérifier" },
  { value: "non_pertinent", label: "Non pertinent" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "Toutes catégories" },
  { value: "rehabilitation", label: "Réhabilitation" },
  { value: "renovation", label: "Rénovation" },
  { value: "gros_oeuvre", label: "Gros œuvre" },
  { value: "second_oeuvre", label: "Second œuvre" },
  { value: "tce", label: "TCE" },
  { value: "maintenance_entretien", label: "Maintenance / entretien" },
  { value: "hors_cible", label: "Hors cible" },
];

/** Filtres rapides métier — priorité Aix-Marseille puis Région Sud, Alpes, Suisse. */
const QUICK_FILTERS: { label: string; kind: "q" | "dept"; value: string; hot?: boolean }[] = [
  { label: "Marseille", kind: "q", value: "Marseille", hot: true },
  { label: "Aix-en-Provence", kind: "q", value: "Aix", hot: true },
  { label: "13", kind: "dept", value: "13", hot: true },
  { label: "83", kind: "dept", value: "83" },
  { label: "06", kind: "dept", value: "06" },
  { label: "05", kind: "dept", value: "05" },
  { label: "Annecy", kind: "q", value: "Annecy" },
  { label: "74", kind: "dept", value: "74" },
  { label: "Genève", kind: "dept", value: "GE" },
  { label: "Vaud", kind: "dept", value: "VD" },
  { label: "Valais", kind: "dept", value: "VS" },
];

function csvEscape(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

function exportCsv(items: TenderListItem[]) {
  const header = ["Titre", "Acheteur", "Source", "Score", "Pertinence", "Catégorie", "Pays", "Localisation", "Budget", "Publiée le", "Date limite"];
  const rows = items.map((t) =>
    [
      csvEscape(t.title),
      csvEscape(t.buyer ?? ""),
      csvEscape(t.source.name),
      String(t.score),
      t.relevanceLevel,
      t.workCategory,
      t.country,
      csvEscape(t.departements.join(" ")),
      t.budgetEstime != null ? String(t.budgetEstime) : "",
      t.publishedAt ? new Date(t.publishedAt).toLocaleDateString("fr-FR") : "",
      t.deadlineAt ? new Date(t.deadlineAt).toLocaleDateString("fr-FR") : "",
    ].join(";"),
  );
  const blob = new Blob(["﻿" + [header.join(";"), ...rows].join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `renov-midi-annonces-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function AnnoncesContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<TenderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [zonesOptions, setZonesOptions] = useState<ZoneOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [source, setSource] = useState("");
  const [relevanceLevel, setRelevanceLevel] = useState(searchParams.get("relevanceLevel") ?? "");
  const [workCategory, setWorkCategory] = useState(searchParams.get("workCategory") ?? "");
  const [minScore, setMinScore] = useState(searchParams.get("minScore") ?? "");
  const [departement, setDepartement] = useState(searchParams.get("departement") ?? "");
  const [zone, setZone] = useState(searchParams.get("zone") ?? "");
  const [sortBy, setSortBy] = useState<"score" | "publishedAt" | "source" | "deadlineAt">(
    (searchParams.get("sortBy") as "score" | "publishedAt" | "source" | "deadlineAt") ?? "score",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">(searchParams.get("sortDir") === "asc" ? "asc" : "desc");
  // Filtres de "drill-down" en provenance des tuiles KPI de l'accueil — pas de contrôle
  // dédié dans l'UI, juste appliqués tels quels tant qu'ils sont présents dans l'URL initiale.
  const [createdAfterDays] = useState(searchParams.get("createdAfterDays") ?? "");
  const [deadlineWithinDays] = useState(searchParams.get("deadlineWithinDays") ?? "");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [punchKey, setPunchKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (source) params.set("source", source);
    if (relevanceLevel) params.set("relevanceLevel", relevanceLevel);
    if (workCategory) params.set("workCategory", workCategory);
    if (minScore) params.set("minScore", minScore);
    if (departement) params.set("departement", departement);
    if (zone) params.set("zone", zone);
    if (createdAfterDays) params.set("createdAfterDays", createdAfterDays);
    if (deadlineWithinDays) params.set("deadlineWithinDays", deadlineWithinDays);
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("pageSize", "100");
    const res = await fetch(`/api/tenders?${params}`);
    const data = await res.json();
    setItems(data.items);
    setTotal(data.total);
    setLoading(false);
  }, [q, source, relevanceLevel, workCategory, minScore, departement, zone, sortBy, sortDir, createdAfterDays, deadlineWithinDays]);

  function toggleSort(column: "score" | "publishedAt" | "source" | "deadlineAt") {
    if (sortBy === column) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
  }

  function sortIndicator(column: "score" | "publishedAt" | "source" | "deadlineAt") {
    if (sortBy !== column) return null;
    return <span className="ml-1 inline-block">{sortDir === "desc" ? "▼" : "▲"}</span>;
  }

  async function triggerSyncAll() {
    setPunchKey((k) => k + 1);
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage(`✓ ${data.inserted} nouvelle${data.inserted > 1 ? "s" : ""} annonce${data.inserted > 1 ? "s" : ""} (${data.fetched} récupérées, ${data.duplicates} doublons)`);
        await load();
      } else {
        setSyncMessage(`Erreur : ${data.error}`);
      }
    } catch {
      setSyncMessage("Erreur réseau pendant la synchronisation.");
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(null), 6000);
    }
  }

  useEffect(() => {
    fetch("/api/sources").then((r) => r.json()).then(setSources);
    fetch("/api/settings/zones").then((r) => r.json()).then(setZonesOptions);
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const toggleQuick = (f: (typeof QUICK_FILTERS)[number]) => {
    if (f.kind === "q") setQ(q === f.value ? "" : f.value);
    else setDepartement(departement === f.value ? "" : f.value);
  };

  const isQuickActive = (f: (typeof QUICK_FILTERS)[number]) =>
    f.kind === "q" ? q === f.value : departement === f.value;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Annonces</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {total} appel{total > 1 ? "s" : ""} d&apos;offres · triés par{" "}
            {sortBy === "score" ? "score de pertinence" : sortBy === "publishedAt" ? "date de publication" : sortBy === "deadlineAt" ? "date limite" : "source"}
            {" "}({sortDir === "desc" ? "plus récent" : "plus ancien"})
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncMessage && (
            <span className="max-w-xs text-xs font-medium text-slate-500 dark:text-slate-400">{syncMessage}</span>
          )}
          <button
            onClick={triggerSyncAll}
            disabled={syncing}
            title="Synchroniser toutes les sources actives"
            className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-orange-500 bg-orange-500 text-white shadow-md transition hover:bg-orange-400 disabled:opacity-60 ${syncing ? "animate-pulse" : ""}`}
          >
            <span key={punchKey} className="animate-punch inline-block text-lg">
              🥊
            </span>
          </button>
          <button
            onClick={() => exportCsv(items)}
            disabled={items.length === 0}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            ⬇️ Exporter CSV ({items.length})
          </button>
        </div>
      </div>

      {/* Filtres rapides ville / département / canton */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Accès rapide</span>
        {QUICK_FILTERS.map((f) => (
          <button
            key={`${f.kind}-${f.value}`}
            onClick={() => toggleQuick(f)}
            className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
              isQuickActive(f)
                ? "border-orange-500 bg-orange-500 text-white shadow"
                : f.hot
                  ? "border-orange-300 bg-orange-50 text-orange-800 hover:border-orange-500 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300"
                  : "border-slate-300 bg-white text-slate-600 hover:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Zones de veille */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setZone("")}
          className={`rounded-full border px-3 py-1 text-sm font-medium ${
            zone === ""
              ? "border-slate-800 bg-slate-800 text-white dark:border-slate-200 dark:bg-slate-200 dark:text-slate-900"
              : "border-slate-300 bg-white text-slate-600 hover:border-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          🌍 Toutes zones
        </button>
        {zonesOptions.map((z) => (
          <button
            key={z.id}
            onClick={() => setZone(zone === z.id ? "" : z.id)}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${
              zone === z.id
                ? "border-teal-600 bg-teal-600 text-white"
                : "border-slate-300 bg-white text-slate-600 hover:border-teal-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            📍 {z.label}
          </button>
        ))}
      </div>

      {/* Filtres avancés */}
      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6 dark:border-slate-800 dark:bg-slate-900">
        <input
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm lg:col-span-2 dark:border-slate-700 dark:bg-slate-950"
          placeholder="Recherche (titre, acheteur, description…)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">Toutes sources</option>
          {sources.map((s) => (
            <option key={s.slug} value={s.slug}>{s.name}</option>
          ))}
        </select>
        <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={relevanceLevel} onChange={(e) => setRelevanceLevel(e.target.value)}>
          {RELEVANCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" value={workCategory} onChange={(e) => setWorkCategory(e.target.value)}>
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          placeholder="Dépt / canton (13, GE…)"
          value={departement}
          onChange={(e) => setDepartement(e.target.value)}
        />
        <input
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          type="number"
          min={0}
          max={100}
          placeholder="Score min"
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
        />
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-950/60">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">
                <button onClick={() => toggleSort("publishedAt")} className="flex items-center hover:text-teal-700 dark:hover:text-teal-400">
                  Annonce{sortIndicator("publishedAt")}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">
                <button onClick={() => toggleSort("source")} className="flex items-center hover:text-teal-700 dark:hover:text-teal-400">
                  Source{sortIndicator("source")}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">
                <button onClick={() => toggleSort("score")} className="flex items-center hover:text-teal-700 dark:hover:text-teal-400">
                  Score{sortIndicator("score")}
                </button>
              </th>
              <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 md:table-cell dark:text-slate-400">Pertinence</th>
              <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 lg:table-cell dark:text-slate-400">Catégorie</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-400">Lieu</th>
              <th className="hidden px-4 py-3 text-left font-semibold text-slate-600 sm:table-cell dark:text-slate-400">
                <button onClick={() => toggleSort("deadlineAt")} className="flex items-center hover:text-teal-700 dark:hover:text-teal-400">
                  Limite{sortIndicator("deadlineAt")}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Chargement…</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Aucune annonce ne correspond aux filtres.</td></tr>
            )}
            {!loading && items.map((t) => (
              <tr key={t.id} className={t.status === "new" ? "bg-teal-50/40 dark:bg-teal-950/20" : undefined}>
                <td className="max-w-md px-4 py-3">
                  <Link href={`/ao/${t.id}`} className="font-medium text-slate-900 hover:text-teal-700 hover:underline dark:text-white dark:hover:text-teal-400">
                    {t.title}
                  </Link>
                  <div className="truncate text-xs text-slate-500">{t.buyer ?? "Acheteur non renseigné"}</div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{t.source.name.split("—")[0].split("(")[0].trim()}</td>
                <td className="px-4 py-3"><ScoreBadge score={t.score} /></td>
                <td className="hidden px-4 py-3 md:table-cell"><RelevanceBadge level={t.relevanceLevel} /></td>
                <td className="hidden px-4 py-3 lg:table-cell"><CategoryBadge category={t.workCategory} /></td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {t.country === "CH" ? "🇨🇭 " : ""}{t.departements.join(", ") || (t.country === "CH" ? "Suisse" : "—")}
                </td>
                <td className="hidden px-4 py-3 text-slate-600 sm:table-cell dark:text-slate-300">
                  {t.deadlineAt ? new Date(t.deadlineAt).toLocaleDateString("fr-FR") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AnnoncesPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-slate-400">Chargement…</div>}>
      <AnnoncesContent />
    </Suspense>
  );
}
