import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { serializeTender } from "@/server/serialize";
import type { Prisma } from "@prisma/client";

/** GET /api/tenders — liste filtrable des appels d'offres pour le dashboard. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const where: Prisma.TenderWhereInput = {};

  const q = sp.get("q");
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { buyer: { contains: q } },
      { description: { contains: q } },
    ];
  }

  const sourceSlug = sp.get("source");
  if (sourceSlug) where.source = { slug: sourceSlug };

  const relevanceLevel = sp.get("relevanceLevel");
  if (relevanceLevel) where.relevanceLevel = relevanceLevel;

  const workCategory = sp.get("workCategory");
  if (workCategory) where.workCategory = workCategory;

  const departement = sp.get("departement");
  if (departement) where.departementsJson = { contains: `"${departement}"` };

  const zone = sp.get("zone");
  if (zone) where.zonesJson = { contains: `"${zone}"` };

  const country = sp.get("country");
  if (country) where.country = country;

  const minScore = sp.get("minScore");
  if (minScore) where.score = { gte: Number(minScore) };

  const deadlineBefore = sp.get("deadlineBefore");
  if (deadlineBefore) where.deadlineAt = { lte: new Date(deadlineBefore) };

  const status = sp.get("status");
  if (status) where.status = status;

  const page = Math.max(1, Number(sp.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? "25")));

  const [total, tenders] = await Promise.all([
    prisma.tender.count({ where }),
    prisma.tender.findMany({
      where,
      include: { source: true },
      orderBy: [{ score: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    items: tenders.map((t) => ({ ...serializeTender(t), source: t.source })),
  });
}
