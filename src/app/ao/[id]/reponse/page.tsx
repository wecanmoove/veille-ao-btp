"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

interface ChecklistItem {
  id: string;
  label: string;
  hint: string;
  required: boolean;
}

interface Pack {
  lettre: string;
  memoire: string;
  checklist: ChecklistItem[];
  profileComplete: boolean;
  tender: {
    id: string;
    title: string;
    buyer: string | null;
    deadlineAt: string | null;
    sourceUrl: string | null;
    sourceRef: string;
  };
}

function download(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReponsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [pack, setPack] = useState<Pack | null>(null);
  const [lettre, setLettre] = useState("");
  const [memoire, setMemoire] = useState("");
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tenders/${id}/reponse`)
      .then((r) => r.json())
      .then((p: Pack) => {
        setPack(p);
        setLettre(p.lettre);
        setMemoire(p.memoire);
      })
      .catch(() => setPack(null));
    try {
      setDone(JSON.parse(localStorage.getItem(`reponse-checklist-${id}`) ?? "{}"));
    } catch {
      setDone({});
    }
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
          {pack.checklist.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => toggle(item.id)}
                className="flex w-full items-start gap-3 px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
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
            </li>
          ))}
        </ul>
      </section>

      {/* Lettre de candidature */}
      <DocumentEditor
        title="✉️ Lettre de candidature"
        value={lettre}
        onChange={setLettre}
        onCopy={() => copy("lettre", lettre)}
        onDownload={() => download(`lettre-candidature-${pack.tender.sourceRef}.txt`, lettre)}
        copied={copied === "lettre"}
        rows={18}
      />

      {/* Mémoire technique */}
      <DocumentEditor
        title="📘 Trame de mémoire technique"
        value={memoire}
        onChange={setMemoire}
        onCopy={() => copy("memoire", memoire)}
        onDownload={() => download(`memoire-technique-${pack.tender.sourceRef}.txt`, memoire)}
        copied={copied === "memoire"}
        rows={28}
      />

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
  onDownload,
  copied,
  rows,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  onCopy: () => void;
  onDownload: () => void;
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
            onClick={onDownload}
            className="rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-600"
          >
            Télécharger .txt
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
