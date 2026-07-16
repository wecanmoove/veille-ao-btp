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

const MOCK_BUYERS = [
  "Ministère des Armées - SGA",
  "Direction régionale des finances publiques d'Île-de-France",
  "Établissement public foncier de Provence-Alpes-Côte d'Azur",
  "Préfecture de la région Occitanie",
  "Rectorat de l'académie de Lyon",
];

const MOCK_TITLES = [
  { title: "Travaux de réhabilitation énergétique de bâtiments administratifs", cpv: ["45000000", "45300000"] },
  { title: "Restructuration lourde d'un site tertiaire - lots gros œuvre et second œuvre", cpv: ["45210000", "45400000"] },
  { title: "Rénovation de couverture et étanchéité de bâtiments publics", cpv: ["45261000"] },
  { title: "Maintenance et fournitures de consommables bureautiques", cpv: ["30192000"] },
];

function seededNotices(since: Date): NormalizedNotice[] {
  const now = Date.now();
  return MOCK_TITLES.map((t, i): NormalizedNotice | null => {
    const publishedAt = new Date(now - i * 36 * 3600_000);
    if (publishedAt < since) return null;
    return {
      sourceRef: `PLACE-MOCK-${publishedAt.toISOString().slice(0, 10)}-${i}`,
      title: t.title,
      buyer: MOCK_BUYERS[i % MOCK_BUYERS.length],
      description: `Consultation simulée (connecteur PLACE mocké) portant sur : ${t.title.toLowerCase()}.`,
      cpvCodes: t.cpv,
      departements: [String(13 + i).padStart(2, "0")],
      budgetEstime: i % 2 === 0 ? 250_000 + i * 50_000 : null,
      publishedAt,
      deadlineAt: new Date(publishedAt.getTime() + 30 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      // Connecteur mocké : pas d'URL directe réelle (pas de portail homepage trompeur non plus).
      sourceUrl: undefined,
    };
  }).filter((n): n is NormalizedNotice => n !== null);
}

export const placeConnector: SourceConnector = {
  slug: "place",
  name: "PLACE / Chorus Pro (TNCP) — connecteur mocké",
  kind: "mock",
  implementation: "mockee",
  defaultCron: "0 6,18 * * *",
  async fetchSince(since: Date): Promise<NormalizedNotice[]> {
    return seededNotices(since);
  },
};
