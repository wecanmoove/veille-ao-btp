import { randomUUID } from "node:crypto";
import { mkdir, unlink, readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "./db";

export { DOCUMENT_TYPES, DOCUMENT_TYPE_IDS, type DocumentTypeId } from "./document-types";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

async function ensureUploadsDir(): Promise<void> {
  await mkdir(UPLOADS_DIR, { recursive: true });
}

/** Enregistre un fichier uploadé sur disque et sa fiche en base. Remplace un éventuel document existant du même type. */
export async function saveCompanyDocument(params: {
  type: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
  expiresAt: Date | null;
}) {
  await ensureUploadsDir();
  const ext = path.extname(params.fileName);
  const storagePath = `${randomUUID()}${ext}`;
  const { writeFile } = await import("node:fs/promises");
  await writeFile(path.join(UPLOADS_DIR, storagePath), params.bytes);

  // Un seul document actif par type — on remplace l'existant.
  const previous = await prisma.companyDocument.findFirst({ where: { type: params.type } });
  if (previous) {
    await deleteCompanyDocument(previous.id);
  }

  return prisma.companyDocument.create({
    data: {
      type: params.type,
      label: params.fileName,
      fileName: params.fileName,
      mimeType: params.mimeType,
      storagePath,
      sizeBytes: params.bytes.byteLength,
      expiresAt: params.expiresAt,
    },
  });
}

export async function listCompanyDocuments() {
  return prisma.companyDocument.findMany({ orderBy: { type: "asc" } });
}

export async function getCompanyDocument(id: string) {
  return prisma.companyDocument.findUnique({ where: { id } });
}

export async function readCompanyDocumentBytes(storagePath: string): Promise<Buffer> {
  return readFile(path.join(UPLOADS_DIR, storagePath));
}

export async function deleteCompanyDocument(id: string): Promise<void> {
  const doc = await prisma.companyDocument.findUnique({ where: { id } });
  if (!doc) return;
  await prisma.companyDocument.delete({ where: { id } });
  await unlink(path.join(UPLOADS_DIR, doc.storagePath)).catch(() => {});
}

/** Un document est considéré valide s'il existe et n'est pas expiré. */
export function isDocumentValid(doc: { expiresAt: Date | null } | undefined): boolean {
  if (!doc) return false;
  if (!doc.expiresAt) return true;
  return doc.expiresAt.getTime() > Date.now();
}
