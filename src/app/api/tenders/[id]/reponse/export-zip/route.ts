import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { prisma } from "@/server/db";
import { buildChecklist } from "@/server/reponse/generate";
import { textToDocxBuffer, textToPdfBuffer } from "@/server/reponse/export";
import { listCompanyDocuments, isDocumentValid, readCompanyDocumentBytes } from "@/server/company-documents";

/** POST /api/tenders/[id]/reponse/export-zip — dossier complet : lettre + mémoire (docx/pdf) + checklist + pièces jointes. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tender = await prisma.tender.findUnique({ where: { id } });
  if (!tender) {
    return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const lettre = String(body?.lettre ?? "");
  const memoire = String(body?.memoire ?? "");

  const checklist = buildChecklist(tender);
  const documents = await listCompanyDocuments();
  const validByType = new Map(documents.filter(isDocumentValid).map((d) => [d.type, d]));

  const zip = new JSZip();
  zip.file("lettre-candidature.docx", await textToDocxBuffer("Lettre de candidature", lettre));
  zip.file("lettre-candidature.pdf", await textToPdfBuffer("Lettre de candidature", lettre));
  zip.file("memoire-technique.docx", await textToDocxBuffer("Mémoire technique", memoire));
  zip.file("memoire-technique.pdf", await textToPdfBuffer("Mémoire technique", memoire));

  const checklistText = checklist
    .map((item) => {
      const attached = validByType.has(item.id);
      const mark = attached ? "[x] (pièce jointe fournie)" : item.required ? "[ ] REQUIS" : "[ ]";
      return `${mark} ${item.label}\n     ${item.hint}`;
    })
    .join("\n\n");
  zip.file("checklist.txt", checklistText);

  const piecesFolder = zip.folder("pieces");
  for (const doc of validByType.values()) {
    const bytes = await readCompanyDocumentBytes(doc.storagePath).catch(() => null);
    if (bytes) piecesFolder?.file(`${doc.type}-${doc.fileName}`, bytes);
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(`dossier-${tender.sourceRef}.zip`)}`,
    },
  });
}
