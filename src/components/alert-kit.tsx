"use client";

import { useState } from "react";

const KEYWORDS = "réhabilitation, rénovation, TCE, tous corps d'état, gros œuvre, second œuvre, restructuration, réhabilitation énergétique, ravalement";
const CPV = "45000000, 45210000, 45260000, 45300000, 45400000, 45450000";
const DEPTS = "13, 83, 84, 06, 05, 04";

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="rounded bg-teal-700 px-2.5 py-1 text-xs font-bold text-white hover:bg-teal-600"
        >
          {copied ? "✓ Copié" : "Copier"}
        </button>
      </div>
      <p className="mt-1.5 font-mono text-xs leading-relaxed text-slate-700 dark:text-slate-300">{value}</p>
    </div>
  );
}

/** Kit prêt-à-coller pour créer les alertes email sur les plateformes externes. */
export function AlertKit() {
  return (
    <section className="rounded-xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-900/50 dark:bg-orange-950/30">
      <h2 className="font-bold text-orange-900 dark:text-orange-200">🔔 Kit d&apos;alertes — 2 minutes par plateforme</h2>
      <p className="mt-1 text-sm text-orange-800/90 dark:text-orange-200/80">
        Sur chaque plateforme ci-dessous : créez un compte gratuit avec votre email, ouvrez la rubrique
        « alertes » ou « veille », puis collez ces critères :
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CopyField label="Mots-clés" value={KEYWORDS} />
        <CopyField label="Codes CPV (travaux)" value={CPV} />
        <CopyField label="Départements" value={DEPTS} />
      </div>
      <p className="mt-3 text-xs text-orange-800/80 dark:text-orange-200/70">
        Fréquence recommandée : quotidienne. Adresse conseillée : celle qui reçoit déjà le rapport Renov Midi,
        pour tout centraliser.
      </p>
    </section>
  );
}
