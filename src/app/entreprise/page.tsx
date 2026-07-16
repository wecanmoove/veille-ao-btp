"use client";

import { useEffect, useState } from "react";

type Profile = Record<string, string>;

const FIELDS: { key: string; label: string; placeholder: string; wide?: boolean }[] = [
  { key: "raisonSociale", label: "Raison sociale *", placeholder: "SARL Renov Midi" },
  { key: "formeJuridique", label: "Forme juridique", placeholder: "SARL" },
  { key: "capital", label: "Capital social", placeholder: "50 000 €" },
  { key: "siret", label: "SIRET *", placeholder: "123 456 789 00012" },
  { key: "adresse", label: "Adresse", placeholder: "12 rue des Artisans", wide: true },
  { key: "codePostal", label: "Code postal", placeholder: "13100" },
  { key: "ville", label: "Ville *", placeholder: "Aix-en-Provence" },
  { key: "contactNom", label: "Signataire (nom)", placeholder: "Jean Dupont" },
  { key: "contactFonction", label: "Fonction", placeholder: "Gérant" },
  { key: "contactEmail", label: "Email", placeholder: "contact@renovmidi.fr" },
  { key: "contactTel", label: "Téléphone", placeholder: "04 42 00 00 00" },
  { key: "effectif", label: "Effectif", placeholder: "18 salariés" },
  { key: "chiffreAffaires", label: "Chiffre d'affaires", placeholder: "2,4 M€ (2025)" },
  { key: "qualifications", label: "Qualifications", placeholder: "Qualibat 4311, RGE", wide: true },
  { key: "assuranceDecennale", label: "Assurance décennale", placeholder: "SMABTP police n° …", wide: true },
  { key: "assuranceRcPro", label: "Assurance RC Pro", placeholder: "SMABTP police n° …", wide: true },
  { key: "specialites", label: "Spécialités", placeholder: "réhabilitation en site occupé, rénovation énergétique", wide: true },
];

export default function EntreprisePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings/company")
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => setProfile({}));
  }, []);

  async function save() {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings/company", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!profile) return <p className="text-sm text-slate-400">Chargement…</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">🏢 Mon entreprise</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Ces informations préremplissent automatiquement vos dossiers de réponse aux appels d&apos;offres
        (lettre de candidature et mémoire technique). Champs * indispensables.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900">
        {FIELDS.map((f) => (
          <label key={f.key} className={`block ${f.wide ? "sm:col-span-2" : ""}`}>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{f.label}</span>
            <input
              type="text"
              value={profile[f.key] ?? ""}
              onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-300 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600"
            />
          </label>
        ))}

        <label className="block sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Références chantiers (3 à 5 opérations récentes)
          </span>
          <textarea
            value={profile.references ?? ""}
            onChange={(e) => setProfile({ ...profile, references: e.target.value })}
            rows={5}
            placeholder={"- Réhabilitation 40 logements, 13 Habitat, 1,2 M€, 2025\n- Rénovation énergétique groupe scolaire, Ville d'Aix, 800 k€, 2024"}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-300 focus:border-teal-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600"
          />
        </label>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-teal-600 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer le profil"}
        </button>
        {saved && <span className="text-sm font-semibold text-emerald-600">✓ Profil enregistré</span>}
      </div>
    </div>
  );
}
