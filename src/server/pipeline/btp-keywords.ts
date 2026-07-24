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

// --- Domaine du projet (voirie / route / habitation) -------------------------
// Chaque domaine dispose de préfixes CPV forts (pondération 2) et de mots-clés
// (pondération 1). On additionne les signaux par domaine et on retient le plus
// fort ; à égalité ou sans signal, on classe en "autre".

/** Route interurbaine : routes, autoroutes, ponts et ouvrages d'art. */
const ROUTE_CPV_PREFIXES = ["452331", "452332", "45221", "45233120", "45233140", "45233220", "45233130"];
const ROUTE_KEYWORDS = [
  "route",
  "routier",
  "routière",
  "autoroute",
  "giratoire",
  "rond-point",
  "ouvrage d'art",
  "pont",
  "enrobé",
  "enrobés",
  "voie rapide",
  "départementale",
  "nationale",
  "rd ",
  "rn ",
];

/** Voirie urbaine : rues, trottoirs, aménagement urbain, éclairage public. */
const VOIRIE_CPV_PREFIXES = ["452332 5", "45233250", "45233260", "45233293", "45316", "45112730"];
const VOIRIE_KEYWORDS = [
  "voirie",
  "trottoir",
  "aménagement urbain",
  "espace public",
  "espaces publics",
  "mobilier urbain",
  "éclairage public",
  "piéton",
  "piétonne",
  "piétonnisation",
  "requalification urbaine",
  "place publique",
  "vrd",
];

/** Habitation : bâtiments résidentiels (logements, immeubles, résidences). */
const HABITATION_CPV_PREFIXES = ["45211", "45215210", "70333"];
const HABITATION_KEYWORDS = [
  "logement",
  "logements",
  "habitat",
  "habitation",
  "immeuble",
  "résidence",
  "résidentiel",
  "hlm",
  "bailleur",
  "appartement",
  "maison individuelle",
  "foyer",
  "cité",
];

function domainScore(cpvCodes: string[], normText: string, cpvPrefixes: string[], keywords: string[]): number {
  let s = 0;
  for (const code of cpvCodes) {
    if (cpvPrefixes.some((p) => code.startsWith(p.trim()))) s += 2;
  }
  for (const kw of keywords) {
    if (normText.includes(normalize(kw))) s += 1;
  }
  return s;
}

/**
 * Déduit le domaine de l'ouvrage à partir des CPV et du texte (titre + description).
 * Retourne "autre" si aucun domaine ne se dégage clairement.
 */
export function inferProjectDomain(cpvCodes: string[], text: string): "voirie" | "route" | "habitation" | "autre" {
  const norm = normalize(text);
  const scores = {
    route: domainScore(cpvCodes, norm, ROUTE_CPV_PREFIXES, ROUTE_KEYWORDS),
    voirie: domainScore(cpvCodes, norm, VOIRIE_CPV_PREFIXES, VOIRIE_KEYWORDS),
    habitation: domainScore(cpvCodes, norm, HABITATION_CPV_PREFIXES, HABITATION_KEYWORDS),
  };

  const best = (Object.entries(scores) as [keyof typeof scores, number][]).reduce((a, b) => (b[1] > a[1] ? b : a));
  return best[1] > 0 ? best[0] : "autre";
}
