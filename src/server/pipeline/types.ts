export type RelevanceLevel = "tres_pertinent" | "pertinent" | "a_verifier" | "non_pertinent";

export type WorkCategory =
  | "rehabilitation"
  | "renovation"
  | "gros_oeuvre"
  | "second_oeuvre"
  | "tce"
  | "maintenance_entretien"
  | "hors_cible";

/**
 * Domaine du projet — axe orthogonal à WorkCategory : décrit *quoi* est construit
 * (l'ouvrage), pas *quel type* de travaux. Déduit des CPV + du texte.
 * - voirie : espaces publics urbains (rues, trottoirs, aménagement urbain, éclairage public)
 * - route : infrastructure interurbaine (routes, autoroutes, ponts, ouvrages d'art)
 * - habitation : bâtiments résidentiels (logements, immeubles, résidences)
 * - autre : tout le reste (ERP, tertiaire, équipements publics non résidentiels…)
 */
export type ProjectDomain = "voirie" | "route" | "habitation" | "autre";

export interface ScoringResult {
  score: number; // 0-100
  relevanceLevel: RelevanceLevel;
  workCategory: WorkCategory;
  matchedKeywords: string[];
  justification: string;
  exclusionReason?: string;
  scoredBy: "ai" | "rules";
}
