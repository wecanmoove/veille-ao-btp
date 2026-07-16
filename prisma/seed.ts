/**
 * Seed Renov Midi : uniquement les sources de collecte.
 *
 * AUCUNE annonce n'est créée ici : la base ne contient que des annonces
 * réelles collectées par les connecteurs (BOAMP, TED). Le seed purge
 * d'ailleurs toute donnée simulée résiduelle d'anciennes versions.
 */
import { PrismaClient } from "@prisma/client";
import { connectors } from "../src/server/connectors";

const prisma = new PrismaClient();

async function main() {
  for (const connector of connectors) {
    const mock = connector.implementation === "mockee";
    await prisma.source.upsert({
      where: { slug: connector.slug },
      // Les connecteurs mockés sont désactivés : pas de données simulées.
      update: mock ? { enabled: false } : {},
      create: {
        slug: connector.slug,
        name: connector.name,
        kind: connector.kind,
        implementation: connector.implementation,
        status: mock ? "mocke" : "actif",
        cronExpression: connector.defaultCron,
        enabled: !mock,
      },
    });
  }

  // Purge des annonces simulées créées par les anciens seeds / connecteurs mockés.
  const fakeWhere = {
    OR: [
      { sourceRef: { startsWith: "SEED-" } },
      { sourceRef: { startsWith: "PLACE-MOCK-" } },
      { sourceRef: { startsWith: "FM-MOCK-" } },
    ],
  };
  const fakes = await prisma.tender.findMany({ where: fakeWhere, select: { id: true } });
  const fakeIds = fakes.map((t) => t.id);
  if (fakeIds.length > 0) {
    await prisma.notification.deleteMany({ where: { tenderId: { in: fakeIds } } });
    await prisma.tender.deleteMany({ where: { id: { in: fakeIds } } });
  }

  // Purge de l'entrée d'historique fictive de l'ancien seed.
  await prisma.syncRun.deleteMany({
    where: { trigger: "manual", fetched: 20, inserted: 8, duplicates: 0, rejected: 12, alertsSent: 6 },
  });

  const remaining = await prisma.tender.count();
  console.log(
    `✓ Renov Midi seed : sources initialisées (mocks désactivés), ${fakeIds.length} annonces simulées purgées, ${remaining} annonces réelles conservées.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
