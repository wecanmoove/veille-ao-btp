import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { serializeTender } from "@/server/serialize";
import { sessionFromHeaders } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

/** GET /api/tenders — liste filtrable des appels d'offres pour le dashboard. */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const where: Prisma.TenderWhereInput = {};
  const session = sessionFromHeaders(request.headers);

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
  if (relevanceLevel) {
    where.relevanceLevel = relevanceLevel.includes(",") ? { in: relevanceLevel.split(",") } : relevanceLevel;
  }

  const workCategory = sp.get("workCategory");
  if (workCategory) where.workCategory = workCategory;

  const departement = sp.get("departement");
  if (departement) where.departementsJson = { contains: `"${departement}"` };

  const zone = sp.get("zone");
  if (zone) where.zonesJson = { contains: `"${zone}"` };

  const country = sp.get("country");
  if (country) where.country = country;

  // Compte restreint : les annonces suisses ne doivent jamais être visibles, quels
  // que soient les filtres demandés côté client.
  if (session?.role === "restricted") where.country = "FR";

  const minScore = sp.get("minScore");
  if (minScore) where.score = { gte: Number(minScore) };

  const deadlineBefore = sp.get("deadlineBefore");
  if (deadlineBefore) where.deadlineAt = { lte: new Date(deadlineBefore) };

  const deadlineWithinDays = sp.get("deadlineWithinDays");
  if (deadlineWithinDays) {
    where.deadlineAt = { gte: new Date(), lte: new Date(Date.now() + Number(deadlineWithinDays) * 24 * 3600_000) };
  }

  const createdAfterDays = sp.get("createdAfterDays");
  if (createdAfterDays) {
    where.createdAt = { gte: new Date(Date.now() - Number(createdAfterDays) * 24 * 3600_000) };
  }

  const status = sp.get("status");
  if (status) where.status = status;

  const page = Math.max(1, Number(sp.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(sp.get("pageSize") ?? "25")));

  const sortDir: "asc" | "desc" = sp.get("sortDir") === "asc" ? "asc" : "desc";
  const sortBy = sp.get("sortBy");
  const orderBy: Prisma.TenderOrderByWithRelationInput[] =
    sortBy === "publishedAt"
      ? [{ publishedAt: sortDir }]
      : sortBy === "deadlineAt"
        ? [{ deadlineAt: sortDir }]
        : sortBy === "source"
          ? [{ source: { name: sortDir } }]
          : sortBy === "relevanceLevel"
            ? // Le niveau de pertinence dérive directement du score — trier sur le score
              // donne un classement cohérent (pas d'ordre alphabétique arbitraire sur l'enum).
              [{ score: sortDir }]
            : sortBy === "workCategory"
              ? [{ workCategory: sortDir }]
              : sortBy === "location"
                ? [{ country: sortDir }, { departementsJson: sortDir }]
                : [{ score: "desc" }, { publishedAt: "desc" }];

  const [total, tenders] = await Promise.all([
    prisma.tender.count({ where }),
    prisma.tender.findMany({
      where,
      include: { source: true },
      orderBy,
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
