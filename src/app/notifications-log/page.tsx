import Link from "next/link";
import { prisma } from "@/server/db";
import { StatusBadge } from "@/components/badges";

export const dynamic = "force-dynamic";

export default async function NotificationsLogPage() {
  const notifications = await prisma.notification.findMany({
    include: { tender: { select: { id: true, title: true, score: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Historique des notifications</h1>
      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Annonce</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Canal</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Statut</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Tentatives</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Envoyée le</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-600">Erreur</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {notifications.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Aucune notification pour le moment.</td></tr>
            )}
            {notifications.map((n) => (
              <tr key={n.id}>
                <td className="px-4 py-3">
                  <Link href={`/ao/${n.tender.id}`} className="text-blue-700 hover:underline">{n.tender.title}</Link>
                </td>
                <td className="px-4 py-3 capitalize text-slate-600">{n.channel}</td>
                <td className="px-4 py-3"><StatusBadge status={n.status} /></td>
                <td className="px-4 py-3">{n.attempts}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{n.sentAt ? new Date(n.sentAt).toLocaleString("fr-FR") : "—"}</td>
                <td className="px-4 py-3 max-w-xs truncate text-xs text-red-600" title={n.lastError ?? undefined}>{n.lastError ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
