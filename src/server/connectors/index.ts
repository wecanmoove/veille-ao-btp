import { boampConnector } from "./boamp";
import { tedSuisseConnector } from "./ted-suisse";
import { tedFranceConnector } from "./ted-france";
import { placeConnector } from "./place";
import { franceMarchesConnector } from "./france-marches";
import type { SourceConnector } from "./types";

/**
 * Registre des connecteurs — uniquement des annonces réelles :
 * - BOAMP (réel) : France, filtré sur les départements des zones de veille
 * - TED France Sud (réel) : marchés français au-dessus des seuils européens
 * - TED Suisse (réel) : marchés suisses au-dessus des seuils AMP, cantons romands ciblés
 * - PLACE et France Marchés : désactivés, en attente d'accès API réel
 * Phase 2 : simap.ch complet, profils d'acheteurs/bailleurs du 13, presse spécialisée BTP.
 */
export const connectors: SourceConnector[] = [
  boampConnector,
  tedFranceConnector,
  tedSuisseConnector,
  placeConnector,
  franceMarchesConnector,
];

export function getConnector(slug: string): SourceConnector | undefined {
  return connectors.find((c) => c.slug === slug);
}

export * from "./types";
