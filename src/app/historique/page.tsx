import { prisma } from "@/server/db";
import { StatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function HistoriquePage() {
  const runs = await prisma.syncRun.findMany({
    include: { source: true },
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Historique des synchronisations</h1>
      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Source</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Déclencheur</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Statut</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Début</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Fin</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Récupérées</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Nouvelles</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Doublons</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Rejetées</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Alertes</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Erreur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {runs.length === 0 && (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-400">Aucune synchronisation pour le moment.</td></tr>
            )}
            {runs.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{r.source.name}</td>
                <td className="px-4 py-3 text-slate-600">{r.trigger === "manual" ? "Manuel" : "Cron"}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-xs text-slate-500">{new Date(r.startedAt).toLocaleString("fr-FR")}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{r.finishedAt ? new Date(r.finishedAt).toLocaleString("fr-FR") : "—"}</td>
                <td className="px-4 py-3">{r.fetched}</td>
                <td className="px-4 py-3">{r.inserted}</td>
                <td className="px-4 py-3">{r.duplicates}</td>
                <td className="px-4 py-3">{r.rejected}</td>
                <td className="px-4 py-3">{r.alertsSent}</td>
                <td className="px-4 py-3 max-w-xs truncate text-xs text-red-600" title={r.errorMessage ?? undefined}>{r.errorMessage ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
