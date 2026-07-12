/** Mots-clés métier BTP initiaux (spécifiés par le métier). */
export const BTP_KEYWORDS: string[] = [
  "réhabilitation",
  "rénovation",
  "restructuration",
  "réaménagement",
  "remise en état",
  "travaux tous corps d'état",
  "tous corps d'état",
  "tce",
  "gros œuvre",
  "gros oeuvre",
  "second œuvre",
  "second oeuvre",
  "maçonnerie",
  "charpente",
  "couverture",
  "étanchéité",
  "façade",
  "ravalement",
  "bardage",
  "isolation",
  "menuiserie",
  "cloison",
  "plâtrerie",
  "peinture",
  "plomberie",
  "cvc",
  "chauffage",
  "ventilation",
  "désamiantage",
  "démolition",
  "terrassement",
  "vrd",
  "extension",
  "réfection",
  "réhabilitation énergétique",
];

/** Expressions/mots signalant des prestations hors cible (fournitures, services généraux, nettoyage). */
export const EXCLUSION_HINTS: string[] = [
  "fourniture de bureau",
  "fournitures de bureau",
  "nettoyage des locaux",
  "prestations de nettoyage",
  "gardiennage",
  "restauration collective",
  "assurance",
  "formation professionnelle",
  "prestations intellectuelles",
  "audit comptable",
  "consommables informatiques",
  "licences logicielles",
  "matériel informatique",
  "location de véhicules",
  "transport de personnes",
];

/** CPV division 45 (travaux de construction) — préfixes forts. */
export const CPV_DIVISION_45_PREFIX = "45";

/** Sous-groupes CPV 45 particulièrement représentatifs de la réhabilitation/rénovation. */
export const CPV_REHAB_PREFIXES = [
  "4521", // travaux de construction de bâtiments
  "4326", // travaux de rénovation
  "4545", // travaux de restauration et rénovation
  "4526", // travaux de couverture et étanchéité
  "4544", // travaux de peinture et de vitrerie
  "4531", // installations électriques
  "4533", // plomberie/chauffage
];

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function findMatchedKeywords(text: string): string[] {
  const norm = normalize(text);
  return BTP_KEYWORDS.filter((kw) => norm.includes(normalize(kw)));
}

export function findExclusionHints(text: string): string[] {
  const norm = normalize(text);
  return EXCLUSION_HINTS.filter((kw) => norm.includes(normalize(kw)));
}

export function isTravauxCpv(cpv: string): boolean {
  return cpv.startsWith(CPV_DIVISION_45_PREFIX);
}

export function isRehabCpv(cpv: string): boolean {
  return CPV_REHAB_PREFIXES.some((p) => cpv.startsWith(p));
}
