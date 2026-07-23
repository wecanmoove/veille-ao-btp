import { Document, Packer, Paragraph, TextRun } from "docx";
import PDFDocument from "pdfkit";

/** Génération de fichiers Word (.docx) et PDF réels à partir du texte des documents de réponse. */

export async function textToDocxBuffer(title: string, content: string): Promise<Buffer> {
  const paragraphs = content.split("\n").map(
    (line) =>
      new Paragraph({
        children: [new TextRun({ text: line, break: 0 })],
        spacing: { after: 120 },
      }),
  );

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new TextRun({ text: title, bold: true, size: 28 })], spacing: { after: 240 } }),
          ...paragraphs,
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export function textToPdfBuffer(title: string, content: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Helvetica-Bold").fontSize(16).text(title, { align: "left" });
    doc.moveDown();
    doc.font("Helvetica").fontSize(10).text(content, { align: "left", lineGap: 3 });
    doc.end();
  });
}
