import cron, { type ScheduledTask } from "node-cron";
import { prisma } from "./db";
import { logError, logInfo } from "./logger";
import { runSync, isSourceLocked } from "./pipeline/run-sync";
import { connectors } from "./connectors";
import { getAlertConfig } from "./settings";
import { runDigest } from "./notifications/notification-service";

const scheduledTasks = new Map<string, ScheduledTask>();
let digestTask: ScheduledTask | null = null;

/**
 * (Re)programme les tâches cron à partir de la configuration en base (Source.cronExpression,
 * Source.enabled, Source.timezone) ainsi que le digest d'alertes. Appelée au démarrage
 * et après toute modification de settings.
 */
export async function scheduleAllSources(): Promise<void> {
  for (const task of scheduledTasks.values()) task.stop();
  scheduledTasks.clear();

  const sources = await prisma.source.findMany();
  for (const source of sources) {
    if (!source.enabled) continue;
    if (!cron.validate(source.cronExpression)) {
      await logError("scheduler", `Expression cron invalide pour ${source.slug}: ${source.cronExpression}`);
      continue;
    }
    const task = cron.schedule(
      source.cronExpression,
      () => {
        if (isSourceLocked(source.slug)) {
          logInfo("scheduler", `${source.slug} déjà en cours, tick ignoré`);
          return;
        }
        runSync(source.slug, "cron").catch((err) => logError("scheduler", `Échec run cron ${source.slug}`, err));
      },
      { timezone: source.timezone },
    );
    scheduledTasks.set(source.slug, task);
    logInfo("scheduler", `Planifié ${source.slug} sur "${source.cronExpression}" (${source.timezone})`);
  }

  await scheduleDigest();
}

/** Planifie (ou déplanifie) le job de digest selon la config d'alertes courante. */
export async function scheduleDigest(): Promise<void> {
  digestTask?.stop();
  digestTask = null;

  const config = await getAlertConfig();
  if (config.mode !== "digest") return;
  if (!cron.validate(config.digestCron)) {
    await logError("scheduler", `Expression cron de digest invalide: ${config.digestCron}`);
    return;
  }
  digestTask = cron.schedule(
    config.digestCron,
    () => {
      runDigest().catch((err) => logError("scheduler", "Échec digest d'alertes", err));
    },
    { timezone: "Europe/Paris" },
  );
  logInfo("scheduler", `Digest d'alertes planifié sur "${config.digestCron}"`);
}

let bootstrapped = false;

/** Crée les sources manquantes en base (à partir du registre de connecteurs) puis démarre le scheduler. */
export async function bootstrapScheduler(): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;

  for (const connector of connectors) {
    const mock = connector.implementation === "mockee";
    await prisma.source.upsert({
      where: { slug: connector.slug },
      update: {},
      create: {
        slug: connector.slug,
        name: connector.name,
        kind: connector.kind,
        implementation: connector.implementation,
        status: mock ? "mocke" : "actif",
        cronExpression: connector.defaultCron,
        // Aucune donnée simulée : les connecteurs sans API réelle naissent désactivés.
        enabled: !mock,
      },
    });
  }

  await scheduleAllSources();
  logInfo("scheduler", "Scheduler démarré");
}
