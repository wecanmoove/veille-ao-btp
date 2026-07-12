import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { isSourceLocked } from "@/server/pipeline/run-sync";

/** GET /api/sources — liste des sources avec statut, dernière sync, verrou courant. */
export async function GET() {
  const sources = await prisma.source.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(
    sources.map((s) => ({ ...s, locked: isSourceLocked(s.slug) })),
  );
}
