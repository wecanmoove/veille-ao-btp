export type RelevanceLevel = "tres_pertinent" | "pertinent" | "a_verifier" | "non_pertinent";

export type WorkCategory =
  | "rehabilitation"
  | "renovation"
  | "gros_oeuvre"
  | "second_oeuvre"
  | "tce"
  | "maintenance_entretien"
  | "hors_cible";

export interface ScoringResult {
  score: number; // 0-100
  relevanceLevel: RelevanceLevel;
  workCategory: WorkCategory;
  matchedKeywords: string[];
  justification: string;
  exclusionReason?: string;
  scoredBy: "ai" | "rules";
}
