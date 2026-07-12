import { NextResponse } from "next/server";
import { prisma } from "@/server/db";

/** GET /api/errors — journal d'erreurs minimal. */
export async function GET() {
  const errors = await prisma.errorLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json(errors);
}
