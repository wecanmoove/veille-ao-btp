import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { runSync } from "@/server/pipeline/run-sync";

/** POST /api/sync — déclenche une synchronisation manuelle de toutes les sources actives ("bouton punch"). */
export async function POST() {
  const sources = await prisma.source.findMany({ where: { enabled: true } });

  const totals = { fetched: 0, inserted: 0, duplicates: 0, rejected: 0, alertsSent: 0 };
  const perSource: Record<string, string> = {};

  for (const source of sources) {
    try {
      const result = await runSync(source.slug, "manual");
      totals.fetched += result.fetched;
      totals.inserted += result.inserted;
      totals.duplicates += result.duplicates;
      totals.rejected += result.rejected;
      totals.alertsSent += result.alertsSent;
      perSource[source.slug] = result.status;
    } catch (err) {
      perSource[source.slug] = err instanceof Error ? err.message : String(err);
    }
  }

  return NextResponse.json({ sourcesRun: sources.length, ...totals, perSource });
}
