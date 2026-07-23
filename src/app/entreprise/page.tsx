"use client";

import { useEffect, useState, useCallback } from "react";
import { DOCUMENT_TYPES } from "@/server/document-types";

type Profile = Record<string, string>;

interface CompanyDocumentRow {
  id: string;
  type: string;
  fileName: string;
  sizeBytes: number;
  expiresAt: string | null;
  createdAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

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
  const [documents, setDocuments] = useState<CompanyDocumentRow[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    const res = await fetch("/api/settings/documents");
    setDocuments(await res.json());
  }, []);

  useEffect(() => {
    void (async () => {
      await Promise.all([
        fetch("/api/settings/company")
          .then((r) => r.json())
          .then(setProfile)
          .catch(() => setProfile({})),
        loadDocuments(),
      ]);
    })();
  }, [loadDocuments]);

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

  async function uploadDocument(type: string, file: File, expiresAt: string) {
    setUploading(type);
    setDocError(null);
    const form = new FormData();
    form.set("type", type);
    form.set("file", file);
    if (expiresAt) form.set("expiresAt", expiresAt);
    const res = await fetch("/api/settings/documents", { method: "POST", body: form });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDocError(data.error ?? "Échec de l'envoi");
    } else {
      await loadDocuments();
    }
    setUploading(null);
  }

  async function removeDocument(id: string) {
    await fetch(`/api/settings/documents/${id}`, { method: "DELETE" });
    await loadDocuments();
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

      {/* Bibliothèque de documents administratifs */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">📎 Mes documents</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Uploadez vos pièces administratives une fois : elles cocheront automatiquement la checklist de chaque
          dossier de réponse et pourront y être jointes. Un nouvel envoi remplace le document précédent du même type.
        </p>
        {docError && <p className="mt-2 text-sm font-medium text-red-600">{docError}</p>}
        <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
          {DOCUMENT_TYPES.map((dt) => {
            const doc = documents.find((d) => d.type === dt.id);
            const expired = doc?.expiresAt ? new Date(doc.expiresAt).getTime() < Date.now() : false;
            const soon = doc?.expiresAt && !expired ? new Date(doc.expiresAt).getTime() - Date.now() < 30 * 24 * 3600_000 : false;
            return (
              <li key={dt.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{dt.label}</p>
                  {doc ? (
                    <p className="truncate text-xs text-slate-500">
                      <a href={`/api/settings/documents/${doc.id}`} className="text-teal-700 hover:underline dark:text-teal-400">
                        {doc.fileName}
                      </a>{" "}
                      · {formatSize(doc.sizeBytes)}
                      {doc.expiresAt && (
                        <span className={expired ? "font-bold text-red-600" : soon ? "font-bold text-amber-600" : ""}>
                          {" "}
                          · valide jusqu&apos;au {new Date(doc.expiresAt).toLocaleDateString("fr-FR")}
                          {expired ? " (expiré)" : soon ? " (bientôt expiré)" : ""}
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400">Aucun document</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <DocumentUploadButton
                    uploading={uploading === dt.id}
                    onUpload={(file, expiresAt) => uploadDocument(dt.id, file, expiresAt)}
                  />
                  {doc && (
                    <button
                      onClick={() => removeDocument(doc.id)}
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 dark:border-slate-700"
                    >
                      Suppr.
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
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

function DocumentUploadButton({
  uploading,
  onUpload,
}: {
  uploading: boolean;
  onUpload: (file: File, expiresAt: string) => void;
}) {
  const [expiresAt, setExpiresAt] = useState("");

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        value={expiresAt}
        onChange={(e) => setExpiresAt(e.target.value)}
        title="Date de validité (optionnel)"
        className="w-32 rounded-lg border border-slate-300 px-1.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
      />
      <label className="cursor-pointer rounded-lg bg-teal-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-teal-600">
        {uploading ? "Envoi…" : "Choisir un fichier"}
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file, expiresAt);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
