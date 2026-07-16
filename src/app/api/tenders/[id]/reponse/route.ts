import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCompanyProfile, isProfileUsable } from "@/server/company-profile";
import { buildReponsePack } from "@/server/reponse/generate";

/** GET /api/tenders/[id]/reponse — génère le dossier de réponse (lettre, mémoire, checklist). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tender = await prisma.tender.findUnique({ where: { id } });
  if (!tender) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }
  const profile = await getCompanyProfile();
  const pack = buildReponsePack(tender, profile);
  return NextResponse.json({
    ...pack,
    profileComplete: isProfileUsable(profile),
    tender: {
      id: tender.id,
      title: tender.title,
      buyer: tender.buyer,
      deadlineAt: tender.deadlineAt,
      sourceUrl: tender.sourceUrl,
      sourceRef: tender.sourceRef,
    },
  });
}
