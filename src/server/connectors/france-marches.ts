import type { NormalizedNotice, SourceConnector } from "./types";

/**
 * Connecteur France Marchés (agrégateur) — MOCKÉ.
 *
 * État réel : France Marchés est un agrégateur commercial sans API publique documentée
 * en accès libre ; une intégration réelle nécessiterait un partenariat commercial ou
 * un scraping (écarté par choix architectural, cf. contraintes techniques). Ce connecteur
 * respecte le contrat `SourceConnector` pour être branché proprement si un accès API
 * devient disponible.
 */

export const franceMarchesConnector: SourceConnector = {
  slug: "france-marches",
  name: "France Marchés — en attente d'accès API",
  kind: "mock",
  implementation: "mockee",
  defaultCron: "0 6 * * *",
  // Politique produit : aucune annonce simulée. Ce connecteur ne renvoie rien
  // tant qu'un accès API partenaire n'est pas disponible.
  async fetchSince(): Promise<NormalizedNotice[]> {
    return [];
  },
};
