import { NextResponse } from "next/server";
import { deleteCompanyDocument, getCompanyDocument, readCompanyDocumentBytes } from "@/server/company-documents";

/** GET /api/settings/documents/[id] — télécharge le fichier original. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getCompanyDocument(id);
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const bytes = await readCompanyDocumentBytes(doc.storagePath);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
    },
  });
}

/** DELETE /api/settings/documents/[id] — supprime la pièce (fichier + fiche). */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteCompanyDocument(id);
  return NextResponse.json({ ok: true });
}
