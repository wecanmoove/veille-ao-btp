import { NextRequest, NextResponse } from "next/server";
import { listCompanyDocuments, saveCompanyDocument } from "@/server/company-documents";
import { DOCUMENT_TYPE_IDS } from "@/server/document-types";

/** GET /api/settings/documents — liste des pièces administratives de l'entreprise. */
export async function GET() {
  const docs = await listCompanyDocuments();
  return NextResponse.json(
    docs.map((d) => ({
      id: d.id,
      type: d.type,
      label: d.label,
      fileName: d.fileName,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      expiresAt: d.expiresAt,
      createdAt: d.createdAt,
    })),
  );
}

/** POST /api/settings/documents — upload d'une pièce (remplace le document existant du même type). */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const type = String(form.get("type") ?? "");
  if (!DOCUMENT_TYPE_IDS.includes(type as (typeof DOCUMENT_TYPE_IDS)[number])) {
    return NextResponse.json({ error: "Type de document inconnu" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Fichier vide" }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (15 Mo max)" }, { status: 400 });
  }

  const expiresAtRaw = String(form.get("expiresAt") ?? "");
  const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "Date de validité invalide" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const doc = await saveCompanyDocument({
    type,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    bytes,
    expiresAt,
  });

  return NextResponse.json({ id: doc.id, type: doc.type, fileName: doc.fileName, expiresAt: doc.expiresAt });
}
