import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";

/** GET /api/notifications — historique des notifications envoyées/échouées. */
export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const notifications = await prisma.notification.findMany({
    where: status ? { status } : undefined,
    include: { tender: { select: { id: true, title: true, score: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json(notifications);
}
