import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { serializeTender } from "@/server/serialize";
import { sessionFromHeaders } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

/** GET /api/stats — KPI du tableau de bord (calculés en direct sur la base). */
export async function GET(req: NextRequest) {
  const now = Date.now();
  const in14d = new Date(now + 14 * 24 * 3600_000);
  const since7d = new Date(now - 7 * 24 * 3600_000);

  const session = sessionFromHeaders(req.headers);
  // Compte restreint : aucune annonce suisse ne doit apparaître dans les KPI ni le top.
  const restrictedWhere: Prisma.TenderWhereInput = session?.role === "restricted" ? { country: "FR" } : {};

  const [tenders, topTenders] = await Promise.all([
    prisma.tender.findMany({
      where: restrictedWhere,
      select: {
        relevanceLevel: true,
        workCategory: true,
        zonesJson: true,
        departementsJson: true,
        country: true,
        budgetEstime: true,
        createdAt: true,
        deadlineAt: true,
        score: true,
      },
    }),
    prisma.tender.findMany({
      where: { ...restrictedWhere, relevanceLevel: { in: ["tres_pertinent", "pertinent"] } },
      include: { source: true },
      orderBy: [{ score: "desc" }, { publishedAt: "desc" }],
      take: 5,
    }),
  ]);

  const relevant = tenders.filter((t) => t.relevanceLevel !== "non_pertinent");

  const byZone: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  let budgetSum = 0;
  let new7d = 0;
  let expiring14d = 0;
  let aixMarseille = 0;
  let aixMarseilleNew7d = 0;

  for (const t of relevant) {
    for (const z of JSON.parse(t.zonesJson) as string[]) byZone[z] = (byZone[z] ?? 0) + 1;
    byCategory[t.workCategory] = (byCategory[t.workCategory] ?? 0) + 1;
    if (t.budgetEstime && t.score >= 45) budgetSum += t.budgetEstime;
    if (t.createdAt >= since7d) new7d++;
    if (t.deadlineAt && t.deadlineAt >= new Date(now) && t.deadlineAt <= in14d) expiring14d++;
    const depts = JSON.parse(t.departementsJson) as string[];
    if (t.country === "FR" && depts.includes("13")) {
      aixMarseille++;
      if (t.createdAt >= since7d) aixMarseilleNew7d++;
    }
  }

  return NextResponse.json({
    total: tenders.length,
    relevant: relevant.length,
    tresPertinent: tenders.filter((t) => t.relevanceLevel === "tres_pertinent").length,
    new7d,
    expiring14d,
    budgetSum,
    byZone,
    byCategory,
    aixMarseille: { total: aixMarseille, new7d: aixMarseilleNew7d },
    topTenders: topTenders.map((t) => ({ ...serializeTender(t), source: t.source })),
  });
}
