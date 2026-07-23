import { NextRequest, NextResponse } from "next/server";
import { textToDocxBuffer, textToPdfBuffer } from "@/server/reponse/export";
import { isAdmin } from "@/lib/auth";

/** POST /api/reponse/export — convertit le texte édité (lettre ou mémoire) en .docx ou .pdf réel. */
export async function POST(req: NextRequest) {
  if (!isAdmin(req.headers)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const title = String(body?.title ?? "");
  const content = String(body?.content ?? "");
  const format = body?.format === "pdf" ? "pdf" : body?.format === "docx" ? "docx" : null;
  const filename = String(body?.filename ?? "document");

  if (!content || !format) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  if (format === "docx") {
    const buffer = await textToDocxBuffer(title, content);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}.docx`,
      },
    });
  }

  const buffer = await textToPdfBuffer(title, content);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}.pdf`,
    },
  });
}
