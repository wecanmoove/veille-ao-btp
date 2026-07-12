import { prisma } from "./db";

export function logInfo(scope: string, message: string) {
  console.log(`[${new Date().toISOString()}] [${scope}] ${message}`);
}

/** Journalise une erreur en console + table ErrorLog (journal d'erreurs minimal). */
export async function logError(scope: string, message: string, detail?: unknown) {
  const detailStr =
    detail instanceof Error
      ? `${detail.message}\n${detail.stack ?? ""}`
      : detail !== undefined
        ? JSON.stringify(detail).slice(0, 4000)
        : undefined;
  console.error(`[${new Date().toISOString()}] [${scope}] ERREUR: ${message}`, detailStr ?? "");
  try {
    await prisma.errorLog.create({ data: { scope, message: message.slice(0, 1000), detail: detailStr } });
  } catch {
    // le journal d'erreurs ne doit jamais faire échouer le pipeline
  }
}
