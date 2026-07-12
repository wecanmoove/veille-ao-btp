const RELEVANCE_STYLES: Record<string, string> = {
  tres_pertinent: "bg-emerald-100 text-emerald-800 border-emerald-300",
  pertinent: "bg-sky-100 text-sky-800 border-sky-300",
  a_verifier: "bg-amber-100 text-amber-800 border-amber-300",
  non_pertinent: "bg-slate-100 text-slate-500 border-slate-300",
};

const RELEVANCE_LABELS: Record<string, string> = {
  tres_pertinent: "Très pertinent",
  pertinent: "Pertinent",
  a_verifier: "À vérifier",
  non_pertinent: "Non pertinent",
};

export function RelevanceBadge({ level }: { level: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${RELEVANCE_STYLES[level] ?? RELEVANCE_STYLES.a_verifier}`}>
      {RELEVANCE_LABELS[level] ?? level}
    </span>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  rehabilitation: "Réhabilitation",
  renovation: "Rénovation",
  gros_oeuvre: "Gros œuvre",
  second_oeuvre: "Second œuvre",
  tce: "TCE",
  maintenance_entretien: "Maintenance / entretien",
  hors_cible: "Hors cible",
};

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
      {CATEGORY_LABELS[category] ?? category}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-600" : score >= 45 ? "bg-sky-600" : score >= 20 ? "bg-amber-600" : "bg-slate-400";
  return (
    <span className={`inline-flex items-center justify-center rounded-md ${color} px-2 py-1 text-xs font-bold text-white`}>
      {score}/100
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
  skipped: "bg-slate-100 text-slate-500",
  success: "bg-emerald-100 text-emerald-800",
  error: "bg-red-100 text-red-800",
  running: "bg-sky-100 text-sky-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}
