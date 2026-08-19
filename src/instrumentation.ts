// Point d'entrée d'instrumentation Next.js : exécuté une fois au démarrage du
// serveur. Sert à amorcer le scheduler cron (voir server/scheduler.ts).
//
// Doit vivre DANS src/ : avec un dossier src, Next ignore un instrumentation.ts
// laissé à la racine, et le scheduler ne démarre jamais — en silence.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { bootstrapScheduler } = await import("./server/scheduler");
    await bootstrapScheduler();
  }
}
