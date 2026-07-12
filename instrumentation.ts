// Point d'entrée d'instrumentation Next.js : exécuté une fois au démarrage du serveur.
// Sert à amorcer le scheduler cron (voir src/server/scheduler.ts).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bootstrapScheduler } = await import("./src/server/scheduler");
    await bootstrapScheduler();
  }
}
