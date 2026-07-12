import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

/** GET /api/sync-runs — historique des synchronisations. */
export async function GET(request: NextRequest) {
  const sourceSlug = request.nextUrl.searchParams.get("source");
  const runs = await prisma.syncRun.findMany({
    where: sourceSlug ? { source: { slug: sourceSlug } } : undefined,
    include: { source: true },
    orderBy: { startedAt: "desc" },
    take: 100,
  });
  return NextResponse.json(runs);
}
