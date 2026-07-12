"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { RelevanceBadge, CategoryBadge, ScoreBadge } from "@/components/badges";

interface TenderListItem {
  id: string;
  title: string;
  buyer: string | null;
  score: number;
  relevanceLevel: string;
  workCategory: string;
  departements: string[];
  deadlineAt: string | null;
  publishedAt: string | null;
  status: string;
  source: { name: string; slug: string };
}

interface SourceOption {
  slug: string;
  name: string;
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

export default function DashboardPage() {
  const [items, setItems] = useState<TenderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [relevanceLevel, setRelevanceLevel] = useState("");
  const [workCategory, setWorkCategory] = useState("");
  const [minScore, setMinScore] = useState("");
  const [departement, setDepartement] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (source) params.set("source", source);
    if (relevanceLevel) params.set("relevanceLevel", relevanceLevel);
    if (workCategory) params.set("workCategory", workCategory);
    if (minScore) params.set("minScore", minScore);
    if (departement) params.set("departement", departement);
    params.set("pageSize", "50");
    const res = await fetch(`/api/tenders?${params}`);
    const data = await res.json();
    setItems(data.items);
    setTotal(data.total);
    setLoading(false);
  }, [q, source, relevanceLevel, workCategory, minScore, departement]);

  useEffect(() => {
    fetch("/api/sources").then((r) => r.json()).then(setSources);
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tableau de bord — Appels d&apos;offres</h1>
        <span className="text-sm text-slate-500">{total} annonce{total > 1 ? "s" : ""}</span>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6">
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm lg:col-span-2"
          placeholder="Recherche (titre, acheteur...)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">Toutes sources</option>
          {sources.map((s) => (
            <option key={s.slug} value={s.slug}>{s.name}</option>
          ))}
        </select>
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={relevanceLevel} onChange={(e) => setRelevanceLevel(e.target.value)}>
          {RELEVANCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={workCategory} onChange={(e) => setWorkCategory(e.target.value)}>
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Département (ex: 13)"
          value={departement}
          onChange={(e) => setDepartement(e.target.value)}
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          type="number"
          min={0}
          max={100}
          placeholder="Score min"
          value={minScore}
          onChange={(e) => setMinScore(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Annonce</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Source</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Score</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Pertinence</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Catégorie</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Dépts</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Date limite</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Chargement...</td></tr>
            )}
            {!loading && items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Aucune annonce ne correspond aux filtres.</td></tr>
            )}
            {!loading && items.map((t) => (
              <tr key={t.id} className={t.status === "new" ? "bg-blue-50/40" : undefined}>
                <td className="px-4 py-3">
                  <Link href={`/ao/${t.id}`} className="font-medium text-slate-900 hover:text-blue-700 hover:underline">
                    {t.title}
                  </Link>
                  <div className="text-xs text-slate-500">{t.buyer ?? "Acheteur non renseigné"}</div>
                </td>
                <td className="px-4 py-3 text-slate-600">{t.source.name}</td>
                <td className="px-4 py-3"><ScoreBadge score={t.score} /></td>
                <td className="px-4 py-3"><RelevanceBadge level={t.relevanceLevel} /></td>
                <td className="px-4 py-3"><CategoryBadge category={t.workCategory} /></td>
                <td className="px-4 py-3 text-slate-600">{t.departements.join(", ") || "—"}</td>
                <td className="px-4 py-3 text-slate-600">
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
