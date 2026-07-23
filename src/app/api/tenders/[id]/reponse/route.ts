import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getCompanyProfile, isProfileUsable } from "@/server/company-profile";
import { buildReponsePack } from "@/server/reponse/generate";
import { listCompanyDocuments, isDocumentValid } from "@/server/company-documents";
import { isAdmin } from "@/lib/auth";

/** GET /api/tenders/[id]/reponse — génère le dossier de réponse (lettre, mémoire, checklist). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req.headers)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  const { id } = await params;
  const tender = await prisma.tender.findUnique({ where: { id } });
  if (!tender) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }
  const profile = await getCompanyProfile();
  const pack = buildReponsePack(tender, profile);
  const documents = await listCompanyDocuments();

  return NextResponse.json({
    ...pack,
    profileComplete: isProfileUsable(profile),
    documents: documents.map((d) => ({
      id: d.id,
      type: d.type,
      fileName: d.fileName,
      expiresAt: d.expiresAt,
      valid: isDocumentValid(d),
    })),
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
