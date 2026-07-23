import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { serializeTender } from "@/server/serialize";
import { sessionFromHeaders } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tender = await prisma.tender.findUnique({
    where: { id },
    include: { source: true, notifications: true },
  });
  if (!tender) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const session = sessionFromHeaders(req.headers);
  if (session?.role === "restricted" && tender.country === "CH") {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (tender.status === "new") {
    await prisma.tender.update({ where: { id }, data: { status: "seen" } });
  }

  return NextResponse.json({ ...serializeTender(tender), source: tender.source, notifications: tender.notifications });
}
