import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

export default async function ErreursPage() {
  const errors = await prisma.errorLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <div>
      <h1 className="text-2xl font-bold">Journal d&apos;erreurs</h1>
      <div className="mt-6 space-y-3">
        {errors.length === 0 && (
          <p className="rounded-lg border border-slate-200 bg-white p-6 text-center text-slate-400">
            Aucune erreur enregistrée.
          </p>
        )}
        {errors.map((e) => (
          <div key={e.id} className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center justify-between">
              <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-mono text-red-700">{e.scope}</span>
              <span className="text-xs text-slate-500">{new Date(e.createdAt).toLocaleString("fr-FR")}</span>
            </div>
            <p className="mt-2 text-sm font-medium text-red-900">{e.message}</p>
            {e.detail && <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-slate-600">{e.detail}</pre>}
          </div>
        ))}
      </div>
    </div>
  );
}
