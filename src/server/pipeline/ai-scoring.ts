import OpenAI from "openai";
import { z } from "zod";
import { env } from "../env";
import { logError } from "../logger";
import type { NormalizedNotice } from "../connectors/types";
import { scoreWithRules } from "./rules-scoring";
import type { ScoringResult } from "./types";

const aiResultSchema = z.object({
  score_pertinence: z.number().int().min(0).max(100),
  niveau_pertinence: z.enum(["tres_pertinent", "pertinent", "a_verifier", "non_pertinent"]),
  categorie_travaux: z.enum([
    "rehabilitation",
    "renovation",
    "gros_oeuvre",
    "second_oeuvre",
    "tce",
    "maintenance_entretien",
    "hors_cible",
  ]),
  mots_cles_detectes: z.array(z.string()),
  justification_courte: z.string(),
  raison_exclusion: z.string().nullable().optional(),
});

const SYSTEM_PROMPT = `Tu es un expert en marchés publics du BTP en France, spécialisé dans la qualification
d'appels d'offres pour une entreprise de réhabilitation / rénovation / travaux tous corps d'état.

Analyse le titre, la description, les CPV, la localisation et tout texte utile fournis.
Classe l'annonce selon ces règles métier strictes :
- une annonce avec vocabulaire BTP (réhabilitation, rénovation, gros œuvre, second œuvre, TCE, maçonnerie,
  charpente, couverture, étanchéité, façade, ravalement, isolation, menuiserie, plomberie, CVC,
  désamiantage, démolition, terrassement, VRD, réhabilitation énergétique, etc.) et des CPV de la
  division 45 (travaux de construction) doit être fortement favorisée (score élevé).
- une annonce sans CPV mais avec une description clairement orientée travaux reste éligible.
- une annonce orientée fournitures simples, nettoyage courant, services généraux, prestations
  intellectuelles ou toute prestation non liée aux travaux doit être déclassée (score bas, non_pertinent).
- les cas ambigus doivent être classés "a_verifier", jamais rejetés trop tôt sous prétexte de doute.

Réponds STRICTEMENT en JSON avec ce schéma, sans texte autour :
{
  "score_pertinence": <0-100>,
  "niveau_pertinence": "tres_pertinent" | "pertinent" | "a_verifier" | "non_pertinent",
  "categorie_travaux": "rehabilitation" | "renovation" | "gros_oeuvre" | "second_oeuvre" | "tce" | "maintenance_entretien" | "hors_cible",
  "mots_cles_detectes": string[],
  "justification_courte": string (1-2 phrases),
  "raison_exclusion": string | null
}`;

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!env.OPENAI_API_KEY) return null;
  if (!client) client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return client;
}

export function isAiScoringEnabled(): boolean {
  return Boolean(env.OPENAI_API_KEY);
}

function buildUserPrompt(notice: NormalizedNotice): string {
  return JSON.stringify(
    {
      titre: notice.title,
      acheteur: notice.buyer,
      description: notice.description?.slice(0, 3000),
      cpv: notice.cpvCodes,
      departements: notice.departements,
      localisation: notice.city,
      nature: notice.natureLibelle,
      budget_estime: notice.budgetEstime,
    },
    null,
    2,
  );
}

/**
 * Scoring IA d'une annonce, avec fallback automatique sur le moteur de règles :
 * - si aucune clé OpenAI n'est configurée
 * - si l'appel échoue (réseau, quota, réponse invalide)
 */
export async function scoreNotice(notice: NormalizedNotice): Promise<ScoringResult> {
  const c = getClient();
  if (!c) return scoreWithRules(notice);

  try {
    const completion = await c.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(notice) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("Réponse IA vide");
    const parsed = aiResultSchema.parse(JSON.parse(raw));

    return {
      score: parsed.score_pertinence,
      relevanceLevel: parsed.niveau_pertinence,
      workCategory: parsed.categorie_travaux,
      matchedKeywords: parsed.mots_cles_detectes,
      justification: parsed.justification_courte,
      exclusionReason: parsed.raison_exclusion ?? undefined,
      scoredBy: "ai",
    };
  } catch (err) {
    await logError("scoring:ai", `Échec scoring IA pour "${notice.title.slice(0, 80)}", fallback règles`, err);
    return scoreWithRules(notice);
  }
}
