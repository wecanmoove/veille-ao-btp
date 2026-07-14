import type { NormalizedNotice } from "../connectors/types";
import { findExclusionHints, findMatchedKeywords, isRehabCpv, isTravauxCpv } from "./btp-keywords";
import type { RelevanceLevel, ScoringResult, WorkCategory } from "./types";

/** Territoire prioritaire du client : Aix-Marseille (13) d'abord, puis le reste de la Région Sud. */
const PRIORITY_DEPARTMENTS: Record<string, number> = { "13": 8, "83": 4, "06": 4, "05": 4 };

/**
 * Filtrage métier BTP — mode fallback sans IA (déterministe).
 * Utilisé si OPENAI_API_KEY absente, si l'appel IA échoue, ou en préfiltrage
 * (le score règles sert aussi de signal d'entrée pour la classification IA).
 */
export function scoreWithRules(notice: NormalizedNotice): ScoringResult {
  const fullText = [notice.title, notice.description ?? ""].join("\n");
  const matchedKeywords = findMatchedKeywords(fullText);
  const exclusionHints = findExclusionHints(fullText);

  const travauxCpv = notice.cpvCodes.filter(isTravauxCpv);
  const rehabCpv = notice.cpvCodes.filter(isRehabCpv);
  const hasCpvInfo = notice.cpvCodes.length > 0;

  let score = 0;

  // Pondération mots-clés (jusqu'à 45 pts)
  score += Math.min(matchedKeywords.length * 12, 45);

  // Pondération CPV (jusqu'à 45 pts) — forte pondération division 45
  if (rehabCpv.length > 0) score += 45;
  else if (travauxCpv.length > 0) score += 30;

  // Bonus cohérence mots-clés + CPV travaux
  if (matchedKeywords.length > 0 && travauxCpv.length > 0) score += 10;

  // Sans CPV mais description clairement orientée travaux (>=2 mots-clés) : reste éligible
  if (!hasCpvInfo && matchedKeywords.length >= 2) score += 15;

  // Déclassement fort si indices de fournitures/services généraux, sauf CPV travaux fort
  if (exclusionHints.length > 0 && rehabCpv.length === 0) {
    score -= 40;
  }

  // Bonus territoire prioritaire (Aix-Marseille en tête) — uniquement si signal BTP présent,
  // pour ne pas remonter du hors-sujet local.
  let priorityBonus = 0;
  if ((matchedKeywords.length > 0 || travauxCpv.length > 0) && (notice.country ?? "FR") === "FR") {
    priorityBonus = Math.max(0, ...notice.departements.map((d) => PRIORITY_DEPARTMENTS[d] ?? 0));
    score += priorityBonus;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  let relevanceLevel: RelevanceLevel;
  let exclusionReason: string | undefined;

  if (exclusionHints.length > 0 && matchedKeywords.length === 0 && travauxCpv.length === 0) {
    relevanceLevel = "non_pertinent";
    exclusionReason = `Vocabulaire hors BTP détecté : ${exclusionHints.slice(0, 3).join(", ")}`;
    score = Math.min(score, 15);
  } else if (score >= 70) {
    relevanceLevel = "tres_pertinent";
  } else if (score >= 45) {
    relevanceLevel = "pertinent";
  } else if (score >= 20 || matchedKeywords.length > 0 || travauxCpv.length > 0) {
    relevanceLevel = "a_verifier";
  } else {
    relevanceLevel = "non_pertinent";
    exclusionReason = exclusionReason ?? "Aucun mot-clé métier BTP ni CPV travaux détecté";
  }

  const workCategory = inferWorkCategory(matchedKeywords, relevanceLevel);

  const justification =
    relevanceLevel === "non_pertinent"
      ? exclusionReason ?? "Aucun signal BTP détecté"
      : `Score règles: ${score}/100. Mots-clés: ${matchedKeywords.slice(0, 5).join(", ") || "aucun"}. ` +
        `CPV travaux (div. 45): ${travauxCpv.join(", ") || "aucun"}.` +
        (priorityBonus > 0 ? ` Bonus territoire prioritaire (+${priorityBonus}).` : "");

  return {
    score,
    relevanceLevel,
    workCategory,
    matchedKeywords,
    justification,
    exclusionReason,
    scoredBy: "rules",
  };
}

function inferWorkCategory(keywords: string[], level: RelevanceLevel): WorkCategory {
  if (level === "non_pertinent") return "hors_cible";
  const has = (...kws: string[]) => kws.some((k) => keywords.includes(k));

  if (has("réhabilitation énergétique", "réhabilitation")) return "rehabilitation";
  if (has("rénovation", "réfection", "restructuration", "réaménagement", "remise en état")) return "renovation";
  if (has("travaux tous corps d'état", "tous corps d'état", "tce")) return "tce";
  if (has("gros œuvre", "gros oeuvre", "maçonnerie", "terrassement", "démolition", "charpente"))
    return "gros_oeuvre";
  if (
    has(
      "second œuvre",
      "second oeuvre",
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
      "vrd",
      "extension",
      "désamiantage",
    )
  )
    return "second_oeuvre";
  return level === "a_verifier" ? "hors_cible" : "maintenance_entretien";
}
