import crypto from "node:crypto";

/** Normalise un texte pour comparaison robuste (accents, casse, ponctuation, espaces). */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Clé de dédoublonnage inter-sources : hash du titre normalisé + acheteur normalisé.
 * Deux annonces publiées sur des plateformes différentes mais portant sur le même
 * marché (même objet, même acheteur) partagent cette clé.
 */
export function computeDedupKey(title: string, buyer?: string | null): string {
  const base = `${normalize(title)}|${normalize(buyer ?? "")}`;
  return crypto.createHash("sha256").update(base).digest("hex").slice(0, 32);
}
