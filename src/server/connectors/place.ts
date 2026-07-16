import type { NormalizedNotice, SourceConnector } from "./types";

/**
 * Connecteur PLACE / écosystème Chorus Pro / TNCP — MOCKÉ.
 *
 * État réel : la plateforme PLACE (marches-publics.gouv.fr) et le TNCP (Chorus Pro)
 * n'exposent pas d'API publique de recherche d'avis en libre accès équivalente à celle
 * du BOAMP (accès nécessite convention/habilitation spécifique côté DGFiP/AIFE).
 * Ce connecteur respecte le même contrat `SourceConnector` que BOAMP afin de pouvoir
 * être branché sur la vraie API dès qu'un accès est obtenu, sans changer le pipeline.
 * Les données ci-dessous sont des exemples réalistes générés localement (pas de scraping).
 */

export const placeConnector: SourceConnector = {
  slug: "place",
  name: "PLACE / Chorus Pro (TNCP) — en attente d'accès API",
  kind: "mock",
  implementation: "mockee",
  defaultCron: "0 6,18 * * *",
  // Politique produit : aucune annonce simulée. Ce connecteur ne renvoie rien
  // tant que l'accès API réel (convention AIFE/DGFiP) n'est pas branché.
  async fetchSince(): Promise<NormalizedNotice[]> {
    return [];
  },
};
