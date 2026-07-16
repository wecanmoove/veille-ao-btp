import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/server/db";
import { serializeTender } from "@/server/serialize";
import { RelevanceBadge, CategoryBadge, ScoreBadge, StatusBadge } from "@/components/badges";
import FavoriteButton from "@/components/favorite-button";

export default async function TenderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tender = await prisma.tender.findUnique({
    where: { id },
    include: { source: true, notifications: true },
  });
  if (!tender) notFound();

  const t = serializeTender(tender);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/ao" className="text-sm text-blue-700 hover:underline">&larr; Retour au tableau de bord</Link>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <ScoreBadge score={t.score} />
          <RelevanceBadge level={t.relevanceLevel} />
          <CategoryBadge category={t.workCategory} />
          <span className="ml-auto text-xs text-slate-400">
            Scoré par {t.scoredBy === "ai" ? "IA" : "moteur de règles (fallback)"}
          </span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.title}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t.buyer ?? "Acheteur non renseigné"} — {tender.source.name}</p>
          </div>
          <FavoriteButton tenderId={t.id} title={t.title} />
        </div>

        <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4">Détails</h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Localisation">{t.country === "CH" ? "🇨🇭 Suisse" : "🇫🇷 France"} · {t.departements.join(", ") || "Non renseigné"}</Field>
            <Field label="Budget estimé">{t.budgetEstime ? `${t.budgetEstime.toLocaleString("fr-FR")} €` : "—"}</Field>
            <Field label="Publié le">{t.publishedAt ? new Date(t.publishedAt).toLocaleDateString("fr-FR") : "—"}</Field>
            <Field label="Date limite de réponse">{t.deadlineAt ? new Date(t.deadlineAt).toLocaleDateString("fr-FR") : "—"}</Field>
            <Field label="Type de procédure">{t.procedureType ?? "—"}</Field>
            <Field label="Nature">{t.natureLibelle ?? "—"}</Field>
          </dl>
        </div>

        {t.description && (
          <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
            <h2 className="font-semibold text-slate-900 dark:text-white mb-3">Description</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t.description.slice(0, 2000)}{t.description.length > 2000 ? "..." : ""}</p>
          </div>
        )}

        {t.cpvCodes.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-700">Codes CPV</h2>
            <div className="mt-1 flex flex-wrap gap-1">
              {t.cpvCodes.map((c: string) => (
                <span key={c} className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-700">{c}</span>
              ))}
            </div>
          </div>
        )}

        {t.keywords.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-slate-700">Mots-clés métier détectés</h2>
            <div className="mt-1 flex flex-wrap gap-1">
              {t.keywords.map((k: string) => (
                <span key={k} className="rounded bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">{k}</span>
              ))}
            </div>
          </div>
        )}

        {t.justification && (
          <div className="mt-6 rounded-md bg-slate-50 p-3">
            <h2 className="text-sm font-semibold text-slate-700">Justification</h2>
            <p className="mt-1 text-sm text-slate-600">{t.justification}</p>
            {t.exclusionReason && (
              <p className="mt-1 text-sm text-red-600">Raison d&apos;exclusion : {t.exclusionReason}</p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/ao/${t.id}/reponse`}
            className="rounded-md bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-600"
          >
            📝 Préparer ma réponse
          </Link>
          {t.sourceUrl && (
            <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Voir la source d&apos;origine
            </a>
          )}
        </div>

        {tender.notifications.length > 0 && (
          <div className="mt-8 border-t border-slate-100 pt-4">
            <h2 className="text-sm font-semibold text-slate-700">Notifications liées</h2>
            <ul className="mt-2 space-y-1">
              {tender.notifications.map((n) => (
                <li key={n.id} className="flex items-center gap-2 text-sm text-slate-600">
                  <StatusBadge status={n.status} /> {n.channel}
                  {n.sentAt && <span className="text-xs text-slate-400">— {new Date(n.sentAt).toLocaleString("fr-FR")}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{children}</dd>
    </div>
  );
}
