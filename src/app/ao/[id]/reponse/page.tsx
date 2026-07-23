"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface ChecklistItem {
  id: string;
  label: string;
  hint: string;
  required: boolean;
}

interface DocumentRef {
  id: string;
  type: string;
  fileName: string;
  expiresAt: string | null;
  valid: boolean;
}

interface Pack {
  lettre: string;
  memoire: string;
  checklist: ChecklistItem[];
  profileComplete: boolean;
  documents: DocumentRef[];
  tender: {
    id: string;
    title: string;
    buyer: string | null;
    deadlineAt: string | null;
    sourceUrl: string | null;
    sourceRef: string;
  };
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportDoc(title: string, content: string, filename: string, format: "docx" | "pdf") {
  const res = await fetch("/api/reponse/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content, filename, format }),
  });
  if (!res.ok) throw new Error("Échec de l'export");
  downloadBlob(`${filename}.${format}`, await res.blob());
}

export default function ReponsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [pack, setPack] = useState<Pack | null>(null);
  const [lettre, setLettre] = useState("");
  const [memoire, setMemoire] = useState("");
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [exportingLettre, setExportingLettre] = useState<"docx" | "pdf" | null>(null);
  const [exportingMemoire, setExportingMemoire] = useState<"docx" | "pdf" | null>(null);
  const [exportingZip, setExportingZip] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    fetch(`/api/tenders/${id}/reponse`)
      .then(async (r) => {
        if (r.status === 403) {
          setForbidden(true);
          return;
        }
        const p: Pack = await r.json();
        setPack(p);
        setLettre(p.lettre);
        setMemoire(p.memoire);

        // Coche automatiquement les pièces pour lesquelles un document valide est déjà en bibliothèque,
        // sans écraser un choix explicite déjà fait par l'utilisateur (stocké en localStorage).
        const autoChecked: Record<string, boolean> = {};
        for (const doc of p.documents) if (doc.valid) autoChecked[doc.type] = true;
        let stored: Record<string, boolean> = {};
        try {
          stored = JSON.parse(localStorage.getItem(`reponse-checklist-${id}`) ?? "{}");
        } catch {
          stored = {};
        }
        setDone({ ...autoChecked, ...stored });
      })
      .catch(() => setPack(null));
  }, [id]);

  function toggle(itemId: string) {
    const next = { ...done, [itemId]: !done[itemId] };
    setDone(next);
    localStorage.setItem(`reponse-checklist-${id}`, JSON.stringify(next));
  }

  async function copy(label: string, content: string) {
    await navigator.clipboard.writeText(content);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-md space-y-3 text-center">
        <p className="text-4xl">🔒</p>
        <p className="font-semibold text-slate-800 dark:text-slate-200">Accès non autorisé</p>
        <p className="text-sm text-slate-500">Votre compte n&apos;a pas les droits pour préparer une réponse aux AO.</p>
        <Link href={`/ao/${id}`} className="text-sm text-teal-700 hover:underline dark:text-teal-400">
          &larr; Retour à l&apos;annonce
        </Link>
      </div>
    );
  }

  if (!pack) return <p className="text-sm text-slate-400">Génération du dossier…</p>;

  const deadline = pack.tender.deadlineAt ? new Date(pack.tender.deadlineAt) : null;
  const joursRestants = deadline ? Math.ceil((deadline.getTime() - Date.now()) / (24 * 3600_000)) : null;
  const doneCount = pack.checklist.filter((c) => done[c.id]).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href={`/ao/${id}`} className="text-sm text-teal-700 hover:underline dark:text-teal-400">
          &larr; Retour à l&apos;annonce
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">📝 Préparer ma réponse</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{pack.tender.title}</p>
        <p className="text-sm text-slate-500">{pack.tender.buyer ?? "Acheteur non renseigné"} · réf. {pack.tender.sourceRef}</p>
      </div>

      {/* Compte à rebours + accès DCE */}
      <div className="flex flex-wrap items-center gap-4">
        {joursRestants !== null && (
          <div
            className={`rounded-xl border px-5 py-3 ${
              joursRestants <= 7
                ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                : "border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200"
            }`}
          >
            <p className="text-2xl font-extrabold">
              {joursRestants > 0 ? `J−${joursRestants}` : "Échue"}
            </p>
            <p className="text-xs">
              limite : {deadline!.toLocaleDateString("fr-FR")}
            </p>
          </div>
        )}
        {pack.tender.sourceUrl && (
          <a
            href={pack.tender.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-400"
          >
            📥 Ouvrir l&apos;avis d&apos;origine (télécharger le DCE)
          </a>
        )}
      </div>

      {!pack.profileComplete && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          ⚠️ Votre profil entreprise est incomplet — les documents contiennent des champs « [À compléter] ».{" "}
          <Link href="/entreprise" className="font-bold underline">
            Renseigner mon entreprise
          </Link>{" "}
          puis recharger cette page.
        </div>
      )}

      {/* Checklist */}
      <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 className="font-bold text-slate-900 dark:text-white">✅ Pièces du dossier</h2>
          <span className="text-sm font-semibold text-slate-500">
            {doneCount}/{pack.checklist.length}
          </span>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {pack.checklist.map((item) => {
            const attached = pack.documents.find((d) => d.type === item.id);
            return (
              <li key={item.id}>
                <div className="flex w-full items-start gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  <button onClick={() => toggle(item.id)} className="flex flex-1 items-start gap-3 text-left">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold ${
                        done[item.id]
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {done[item.id] ? "✓" : ""}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block text-sm font-medium ${
                          done[item.id] ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        {item.label}
                        {item.required && <span className="ml-1 text-red-500">*</span>}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">{item.hint}</span>
                    </span>
                  </button>
                  {attached && (
                    <a
                      href={`/api/settings/documents/${attached.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        attached.valid
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                          : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
                      }`}
                    >
                      📎 {attached.valid ? "pièce jointe" : "expirée"}
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-slate-200 px-5 py-3 dark:border-slate-800">
          <Link href="/entreprise" className="text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400">
            📎 Gérer mes documents (Kbis, décennale, RC pro...) →
          </Link>
        </div>
      </section>

      {/* Lettre de candidature */}
      <DocumentEditor
        title="✉️ Lettre de candidature"
        value={lettre}
        onChange={setLettre}
        onCopy={() => copy("lettre", lettre)}
        exporting={exportingLettre}
        onExport={async (format) => {
          setExportingLettre(format);
          try {
            await exportDoc("Lettre de candidature", lettre, `lettre-candidature-${pack.tender.sourceRef}`, format);
          } finally {
            setExportingLettre(null);
          }
        }}
        copied={copied === "lettre"}
        rows={18}
      />

      {/* Mémoire technique */}
      <DocumentEditor
        title="📘 Trame de mémoire technique"
        value={memoire}
        onChange={setMemoire}
        onCopy={() => copy("memoire", memoire)}
        exporting={exportingMemoire}
        onExport={async (format) => {
          setExportingMemoire(format);
          try {
            await exportDoc("Mémoire technique", memoire, `memoire-technique-${pack.tender.sourceRef}`, format);
          } finally {
            setExportingMemoire(null);
          }
        }}
        copied={copied === "memoire"}
        rows={28}
      />

      {/* Dossier complet */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 p-5 dark:border-teal-900 dark:bg-teal-950/30">
        <div>
          <p className="font-bold text-slate-900 dark:text-white">📦 Dossier complet</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Lettre + mémoire (.docx et .pdf) + checklist + pièces jointes valides, dans une seule archive .zip.
          </p>
        </div>
        <button
          onClick={async () => {
            setExportingZip(true);
            try {
              const res = await fetch(`/api/tenders/${id}/reponse/export-zip`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lettre, memoire }),
              });
              if (res.ok) downloadBlob(`dossier-${pack.tender.sourceRef}.zip`, await res.blob());
            } finally {
              setExportingZip(false);
            }
          }}
          disabled={exportingZip}
          className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-400 disabled:opacity-50"
        >
          {exportingZip ? "Génération…" : "⬇️ Télécharger le dossier (.zip)"}
        </button>
      </div>

      <p className="text-xs text-slate-400">
        Documents générés automatiquement à partir de l&apos;annonce et de votre profil entreprise — relisez et
        personnalisez chaque section avant dépôt. Les passages « [À compléter] » sont à votre charge.
      </p>
    </div>
  );
}

function DocumentEditor({
  title,
  value,
  onChange,
  onCopy,
  onExport,
  exporting,
  copied,
  rows,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  onCopy: () => void;
  onExport: (format: "docx" | "pdf") => void;
  exporting: "docx" | "pdf" | null;
  copied: boolean;
  rows: number;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={onCopy}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {copied ? "✓ Copié" : "Copier"}
          </button>
          <button
            onClick={() => onExport("docx")}
            disabled={exporting !== null}
            className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-600 disabled:opacity-50"
          >
            {exporting === "docx" ? "…" : "Télécharger .docx"}
          </button>
          <button
            onClick={() => onExport("pdf")}
            disabled={exporting !== null}
            className="rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-600 disabled:opacity-50"
          >
            {exporting === "pdf" ? "…" : "Télécharger .pdf"}
          </button>
        </div>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full resize-y rounded-b-xl border-0 bg-transparent px-5 py-4 font-mono text-xs leading-relaxed text-slate-800 focus:outline-none dark:text-slate-200"
      />
    </section>
  );
}
