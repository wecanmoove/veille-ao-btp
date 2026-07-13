/**
 * Seed Renov Midi : données réalistes pour Région Sud, Alpes et Suisse romande.
 */
import { PrismaClient } from "@prisma/client";
import { connectors } from "../src/server/connectors";

const prisma = new PrismaClient();

async function main() {
  // Initialize sources
  for (const connector of connectors) {
    await prisma.source.upsert({
      where: { slug: connector.slug },
      update: {},
      create: {
        slug: connector.slug,
        name: connector.name,
        kind: connector.kind,
        implementation: connector.implementation,
        status: connector.implementation === "mockee" ? "mocke" : "actif",
        cronExpression: connector.defaultCron,
      },
    });
  }

  const boamp = await prisma.source.findUniqueOrThrow({ where: { slug: "boamp" } });
  const ted = await prisma.source.findUniqueOrThrow({ where: { slug: "ted-suisse" } });

  // Renov Midi seed data
  const seedTenders = [
    // Région Sud — très pertinent
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-001",
      dedupKey: "seed-dedup-001",
      title: "Réhabilitation énergétique 40 logements — Bureau Marseille",
      buyer: "Office Public de l'Habitat (OPAH) — Marseille",
      description: "Isolation toitures, changement menuiseries double vitrage, remplacement chauffage collectif PAC + radiateurs. Montant estimé 2,4 M€, durée 12 mois.",
      cpvCodesJson: JSON.stringify(["45210000", "45300000", "45321000"]),
      departementsJson: JSON.stringify(["13"]),
      country: "FR",
      zonesJson: JSON.stringify(["region-sud"]),
      publishedAt: new Date(Date.now() - 2 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 45 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: "https://www.boamp.fr/",
      score: 92,
      relevanceLevel: "tres_pertinent",
      workCategory: "rehabilitation",
      keywordsJson: JSON.stringify(["réhabilitation énergétique", "isolation", "chauffage", "menuiseries"]),
      justification: "Vocabulaire réhabilitation énergétique + CPV division 45 + département 13.",
      scoredBy: "rules",
      status: "new",
    },
    // Région Sud — pertinent
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-002",
      dedupKey: "seed-dedup-002",
      title: "Ravalement façades et étanchéité — École Aix-en-Provence",
      buyer: "Commune d'Aix-en-Provence",
      description: "Nettoyage façade, traitement fissures, peinture minérale, refonte étanchéité terrasse. Montant 850 k€, 6 mois.",
      cpvCodesJson: JSON.stringify(["45400000", "45421000"]),
      departementsJson: JSON.stringify(["13"]),
      country: "FR",
      zonesJson: JSON.stringify(["region-sud"]),
      publishedAt: new Date(Date.now() - 5 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 30 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: "https://www.boamp.fr/",
      score: 78,
      relevanceLevel: "pertinent",
      workCategory: "gros_oeuvre",
      keywordsJson: JSON.stringify(["ravalement", "façade", "étanchéité"]),
      justification: "Mots-clés secondœuvre + CPV travaux, score élevé.",
      scoredBy: "rules",
      status: "new",
    },
    // Département 83 — à vérifier
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-003",
      dedupKey: "seed-dedup-003",
      title: "Entretien route RN8 + petits aménagements — Var",
      buyer: "Conseil Département Var",
      description: "Entretien courant + menues prestations asphaltage tronçon 12 km. Montant 180 k€.",
      cpvCodesJson: JSON.stringify(["34700000"]),
      departementsJson: JSON.stringify(["83"]),
      country: "FR",
      zonesJson: JSON.stringify(["region-sud"]),
      publishedAt: new Date(Date.now() - 1 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 20 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: "https://www.boamp.fr/",
      score: 35,
      relevanceLevel: "a_verifier",
      workCategory: "maintenance_entretien",
      keywordsJson: JSON.stringify(["entretien", "asphaltage", "voirie"]),
      justification: "Signal BTP ambigu : entretien vs travaux, à décider manuellement.",
      scoredBy: "rules",
      status: "new",
    },
    // Département 06 — très pertinent
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-004",
      dedupKey: "seed-dedup-004",
      title: "Restructuration parking souterrain — Nice",
      buyer: "Ville de Nice",
      description: "Démolition partielle, reprises béton armé, imperméabilisation, circulation. Montant 1,2 M€.",
      cpvCodesJson: JSON.stringify(["45210000", "45200000"]),
      departementsJson: JSON.stringify(["06"]),
      country: "FR",
      zonesJson: JSON.stringify(["region-sud"]),
      publishedAt: new Date(Date.now() - 3 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 35 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: "https://www.boamp.fr/",
      score: 85,
      relevanceLevel: "tres_pertinent",
      workCategory: "gros_oeuvre",
      keywordsJson: JSON.stringify(["démolition", "gros œuvre", "béton"]),
      justification: "Gros œuvre clair, CPV 45210000, score très élevé.",
      scoredBy: "rules",
      status: "new",
    },
    // Alpes — Gap
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-005",
      dedupKey: "seed-dedup-005",
      title: "Tracé route périphérique Gap — Lots terrassement + réseaux",
      buyer: "Département Hautes-Alpes",
      description: "Terrassement, assainissement, voirie, réseaux eau/électricité/télécom, multi-lots, 5,8 M€.",
      cpvCodesJson: JSON.stringify(["34000000", "34700000", "45000000"]),
      departementsJson: JSON.stringify(["05"]),
      country: "FR",
      zonesJson: JSON.stringify(["alpes"]),
      publishedAt: new Date(Date.now() - 4 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 40 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: "https://www.boamp.fr/",
      score: 88,
      relevanceLevel: "tres_pertinent",
      workCategory: "gros_oeuvre",
      keywordsJson: JSON.stringify(["terrassement", "voirie", "réseaux", "génie civil"]),
      justification: "Travaux génie civil purs, budget majeur, CPV division 45.",
      scoredBy: "rules",
      status: "new",
    },
    // Alpes — Chambéry
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-006",
      dedupKey: "seed-dedup-006",
      title: "Rénovation collège — Chambéry",
      buyer: "Conseil Régional AURA",
      description: "Rénovation : toiture, électricité, plomberie, chauffage, sanitaires, peinture. 3,2 M€.",
      cpvCodesJson: JSON.stringify(["45300000", "45210000"]),
      departementsJson: JSON.stringify(["73"]),
      country: "FR",
      zonesJson: JSON.stringify(["alpes"]),
      publishedAt: new Date(Date.now() - 6 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 50 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: "https://www.boamp.fr/",
      score: 89,
      relevanceLevel: "tres_pertinent",
      workCategory: "renovation",
      keywordsJson: JSON.stringify(["rénovation", "toiture", "chauffage", "plomberie"]),
      justification: "Rénovation complète bâtiment public, CPV travaux.",
      scoredBy: "rules",
      status: "new",
    },
    // Suisse Vaud
    {
      sourceId: ted.id,
      sourceRef: "SEED-TED-001",
      dedupKey: "seed-dedup-ted-001",
      title: "Améliorations route cantonale — Vaud",
      buyer: "Canton de Vaud — Service des routes",
      description: "Travaux d'amélioration 8 km : sécurité, peinture routes, petit génie civil. CHF 1.8 M.",
      cpvCodesJson: JSON.stringify(["34700000"]),
      departementsJson: JSON.stringify(["VD"]),
      country: "CH",
      zonesJson: JSON.stringify(["suisse-romande"]),
      publishedAt: new Date(Date.now() - 1 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 35 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché (TED)",
      sourceUrl: "https://ted.europa.eu/",
      score: 72,
      relevanceLevel: "pertinent",
      workCategory: "maintenance_entretien",
      keywordsJson: JSON.stringify(["route", "voirie", "amélioration"]),
      justification: "Travaux route cantonale, TED Europe, Suisse romande.",
      scoredBy: "rules",
      status: "new",
    },
    // Suisse Genève
    {
      sourceId: ted.id,
      sourceRef: "SEED-TED-002",
      dedupKey: "seed-dedup-ted-002",
      title: "Réhabilitation logements sociaux — Genève",
      buyer: "Ville de Genève — Service habitat",
      description: "Rénovation : isolation, fenêtres, chauffage, sanitaires, peinture. CHF 2.4 M, 50 logements.",
      cpvCodesJson: JSON.stringify(["45210000", "45300000"]),
      departementsJson: JSON.stringify(["GE"]),
      country: "CH",
      zonesJson: JSON.stringify(["suisse-romande"]),
      publishedAt: new Date(Date.now() - 3 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 45 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché (TED)",
      sourceUrl: "https://ted.europa.eu/",
      score: 91,
      relevanceLevel: "tres_pertinent",
      workCategory: "rehabilitation",
      keywordsJson: JSON.stringify(["réhabilitation", "logements", "énergie"]),
      justification: "Réhabilitation énergétique logements, Genève, TED.",
      scoredBy: "rules",
      status: "new",
    },
    // Out of scope (hors sujet)
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-007",
      dedupKey: "seed-dedup-007",
      title: "Fourniture consommables bureautiques — Conseil départemental",
      buyer: "Conseil départemental Bouches-du-Rhône",
      description: "Papeterie et fournitures bureau annuelles.",
      cpvCodesJson: JSON.stringify(["30192000"]),
      departementsJson: JSON.stringify(["13"]),
      country: "FR",
      zonesJson: JSON.stringify([]),
      publishedAt: new Date(Date.now() - 1 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 20 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: "https://www.boamp.fr/",
      score: 3,
      relevanceLevel: "non_pertinent",
      workCategory: "hors_cible",
      keywordsJson: JSON.stringify([]),
      justification: "Aucun signal BTP.",
      exclusionReason: "Fournitures hors BTP",
      scoredBy: "rules",
      status: "new",
    },
  ];

  // Upsert tenders
  for (const t of seedTenders) {
    await prisma.tender.upsert({
      where: { sourceId_sourceRef: { sourceId: t.sourceId, sourceRef: t.sourceRef } },
      update: t,
      create: t,
    });
  }

  // Create sync history
  await prisma.syncRun.create({
    data: {
      sourceId: boamp.id,
      trigger: "manual",
      status: "success",
      startedAt: new Date(Date.now() - 3600_000),
      finishedAt: new Date(Date.now() - 3590_000),
      fetched: 20,
      inserted: 8,
      duplicates: 0,
      rejected: 12,
      alertsSent: 6,
    },
  });

  console.log("✓ Renov Midi seed : sources, annonces (8), notifications et historique créés.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
