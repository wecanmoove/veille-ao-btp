import { boampConnector } from "./boamp";
import { placeConnector } from "./place";
import { franceMarchesConnector } from "./france-marches";
import type { SourceConnector } from "./types";

/**
 * Registre des connecteurs Phase 1 (BOAMP réel + 2 sources mockées prêtes à brancher).
 * Phase 2 : ajouter ici les profils d'acheteurs/bailleurs du 13 et la presse spécialisée BTP.
 */
export const connectors: SourceConnector[] = [boampConnector, placeConnector, franceMarchesConnector];

export function getConnector(slug: string): SourceConnector | undefined {
  return connectors.find((c) => c.slug === slug);
}

export * from "./types";
