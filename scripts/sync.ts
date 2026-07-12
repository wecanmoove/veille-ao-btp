/**
 * Commande de synchronisation manuelle en ligne de commande.
 * Usage: npx tsx scripts/sync.ts [slug-source]
 * Sans argument, synchronise toutes les sources actives séquentiellement.
 */
import { prisma } from "../src/server/db";
import { runSync } from "../src/server/pipeline/run-sync";

async function main() {
  const slugArg = process.argv[2];
  const sources = slugArg
    ? [await prisma.source.findUniqueOrThrow({ where: { slug: slugArg } })]
    : await prisma.source.findMany({ where: { enabled: true } });

  for (const source of sources) {
    console.log(`\n=== Synchronisation ${source.slug} ===`);
    const result = await runSync(source.slug, "manual");
    console.log(result);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
