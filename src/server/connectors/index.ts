import { boampConnector } from "./boamp";
import { tedSuisseConnector } from "./ted-suisse";
import { placeConnector } from "./place";
import { franceMarchesConnector } from "./france-marches";
import type { SourceConnector } from "./types";

/**
 * Registre des connecteurs Phase 1 :
 * - BOAMP (réel) : France, filtré sur les départements des zones de veille
 * - TED Suisse (réel) : marchés suisses au-dessus des seuils AMP, cantons romands ciblés
 * - PLACE et France Marchés : mockés, prêts à brancher
 * Phase 2 : simap.ch complet, profils d'acheteurs/bailleurs du 13, presse spécialisée BTP.
 */
export const connectors: SourceConnector[] = [
  boampConnector,
  tedSuisseConnector,
  placeConnector,
  franceMarchesConnector,
];

export function getConnector(slug: string): SourceConnector | undefined {
  return connectors.find((c) => c.slug === slug);
}

export * from "./types";
