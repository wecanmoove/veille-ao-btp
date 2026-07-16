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

const MOCK_ITEMS = [
  { title: "Réhabilitation de logements sociaux - VRD et second œuvre", cpv: ["45262690", "45450000"] },
  { title: "Travaux de désamiantage et démolition partielle avant reconstruction", cpv: ["45262660", "45111000"] },
  { title: "Rénovation de façades et ravalement d'un ensemble immobilier", cpv: ["45443000"] },
];

const MOCK_BUYERS = [
  "Office Public de l'Habitat des Bouches-du-Rhône",
  "Ville de Marseille - Direction du patrimoine bâti",
  "Métropole Aix-Marseille-Provence",
];

function seededNotices(since: Date): NormalizedNotice[] {
  const now = Date.now();
  return MOCK_ITEMS.map((t, i): NormalizedNotice | null => {
    const publishedAt = new Date(now - (i * 20 + 5) * 3600_000);
    if (publishedAt < since) return null;
    return {
      sourceRef: `FM-MOCK-${publishedAt.toISOString().slice(0, 10)}-${i}`,
      title: t.title,
      buyer: MOCK_BUYERS[i % MOCK_BUYERS.length],
      description: `Consultation agrégée (connecteur France Marchés mocké) : ${t.title.toLowerCase()}.`,
      cpvCodes: t.cpv,
      departements: ["13"],
      budgetEstime: null,
      publishedAt,
      deadlineAt: new Date(publishedAt.getTime() + 21 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      // Connecteur mocké : pas d'URL directe réelle (pas de portail homepage trompeur non plus).
      sourceUrl: undefined,
    };
  }).filter((n): n is NormalizedNotice => n !== null);
}

export const franceMarchesConnector: SourceConnector = {
  slug: "france-marches",
  name: "France Marchés — connecteur mocké",
  kind: "mock",
  implementation: "mockee",
  defaultCron: "0 6 * * *",
  async fetchSince(since: Date): Promise<NormalizedNotice[]> {
    return seededNotices(since);
  },
};
