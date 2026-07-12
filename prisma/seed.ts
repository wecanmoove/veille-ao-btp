/**
 * Données de démonstration réalistes : quelques annonces déjà scorées, un historique de sync,
 * et des notifications, pour visualiser immédiatement le dashboard sans attendre un vrai run.
 */
import { PrismaClient } from "@prisma/client";
import { connectors } from "../src/server/connectors";

const prisma = new PrismaClient();

async function main() {
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
  const place = await prisma.source.findUniqueOrThrow({ where: { slug: "place" } });

  const seedTenders = [
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-001",
      dedupKey: "seed-dedup-001",
      title: "Travaux de réhabilitation énergétique d'un groupe scolaire",
      buyer: "Commune de Marseille",
      description: "Réhabilitation énergétique et rénovation thermique du bâtiment principal : isolation, menuiseries, chauffage.",
      cpvCodesJson: JSON.stringify(["45300000", "45321000"]),
      departementsJson: JSON.stringify(["13"]),
      publishedAt: new Date(Date.now() - 2 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 25 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: "https://www.boamp.fr/",
      score: 92,
      relevanceLevel: "tres_pertinent",
      workCategory: "rehabilitation",
      keywordsJson: JSON.stringify(["réhabilitation énergétique", "isolation", "chauffage"]),
      justification: "Annonce fortement orientée réhabilitation énergétique avec CPV travaux et mots-clés métier multiples.",
      scoredBy: "rules",
      status: "new",
    },
    {
      sourceId: place.id,
      sourceRef: "SEED-PLACE-001",
      dedupKey: "seed-dedup-002",
      title: "Restructuration lourde d'un site tertiaire - lots gros œuvre et second œuvre",
      buyer: "Établissement public foncier de Provence-Alpes-Côte d'Azur",
      description: "Restructuration lourde comprenant démolition partielle, gros œuvre, cloisons, plâtrerie, peinture.",
      cpvCodesJson: JSON.stringify(["45210000", "45400000"]),
      departementsJson: JSON.stringify(["13"]),
      publishedAt: new Date(Date.now() - 5 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 18 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: "https://www.marches-publics.gouv.fr/",
      score: 78,
      relevanceLevel: "pertinent",
      workCategory: "gros_oeuvre",
      keywordsJson: JSON.stringify(["restructuration", "gros œuvre", "cloison", "plâtrerie", "peinture"]),
      justification: "Restructuration avec vocabulaire gros œuvre / second œuvre clairement identifié.",
      scoredBy: "rules",
      status: "new",
    },
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-002",
      dedupKey: "seed-dedup-003",
      title: "Fourniture de consommables de bureau pour les services administratifs",
      buyer: "Conseil départemental des Bouches-du-Rhône",
      description: "Marché de fourniture de papeterie et consommables bureautiques.",
      cpvCodesJson: JSON.stringify(["30192000"]),
      departementsJson: JSON.stringify(["13"]),
      publishedAt: new Date(Date.now() - 1 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 20 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: "https://www.boamp.fr/",
      score: 5,
      relevanceLevel: "non_pertinent",
      workCategory: "hors_cible",
      keywordsJson: JSON.stringify([]),
      justification: "Aucun signal BTP détecté",
      exclusionReason: "Vocabulaire hors BTP détecté : fourniture de bureau",
      scoredBy: "rules",
      status: "new",
    },
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-003",
      dedupKey: "seed-dedup-004",
      title: "Entretien des espaces verts et prestations diverses de maintenance",
      buyer: "Métropole Aix-Marseille-Provence",
      description: "Entretien courant des espaces verts, avec possibilité de menus travaux d'aménagement extérieur.",
      cpvCodesJson: JSON.stringify([]),
      departementsJson: JSON.stringify(["13"]),
      publishedAt: new Date(Date.now() - 3 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 15 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: "https://www.boamp.fr/",
      score: 28,
      relevanceLevel: "a_verifier",
      workCategory: "hors_cible",
      keywordsJson: JSON.stringify(["extension"]),
      justification: "Signal BTP faible et ambigu (entretien principalement), à vérifier manuellement.",
      scoredBy: "rules",
      status: "new",
    },
  ];

  for (const t of seedTenders) {
    await prisma.tender.upsert({
      where: { sourceId_sourceRef: { sourceId: t.sourceId, sourceRef: t.sourceRef } },
      update: t,
      create: t,
    });
  }

  const firstTender = await prisma.tender.findUniqueOrThrow({
    where: { sourceId_sourceRef: { sourceId: boamp.id, sourceRef: "SEED-BOAMP-001" } },
  });
  await prisma.notification.upsert({
    where: { tenderId_channel: { tenderId: firstTender.id, channel: "email" } },
    update: {},
    create: { tenderId: firstTender.id, channel: "email", status: "sent", sentAt: new Date(), attempts: 1 },
  });
  await prisma.notification.upsert({
    where: { tenderId_channel: { tenderId: firstTender.id, channel: "slack" } },
    update: {},
    create: { tenderId: firstTender.id, channel: "slack", status: "skipped", lastError: "Canal non configuré" },
  });

  await prisma.syncRun.create({
    data: {
      sourceId: boamp.id,
      trigger: "manual",
      status: "success",
      startedAt: new Date(Date.now() - 3600_000),
      finishedAt: new Date(Date.now() - 3590_000),
      fetched: 12,
      inserted: 3,
      duplicates: 1,
      rejected: 8,
      alertsSent: 1,
    },
  });

  console.log("Seed terminé : sources, annonces de démonstration, notifications et historique créés.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
