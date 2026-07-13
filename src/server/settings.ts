import { z } from "zod";
import { prisma } from "./db";
import { env } from "./env";

const alertConfigSchema = z.object({
  emailEnabled: z.boolean(),
  slackEnabled: z.boolean(),
  emailRecipients: z.string(),
  minScore: z.number().int().min(0).max(100),
  mode: z.enum(["instant", "digest"]),
  digestCron: z.string(),
  includeAVerifier: z.boolean(),
  /** N'alerter que si l'annonce est dans une zone de veille active. */
  onlyWatchedZones: z.boolean().default(true),
});

export type AlertConfig = z.infer<typeof alertConfigSchema>;

const ALERT_CONFIG_KEY = "alertConfig";

function defaultAlertConfig(): AlertConfig {
  return {
    emailEnabled: env.EMAIL_PROVIDER !== "console" || true, // console mode = activé mais journalise seulement
    slackEnabled: Boolean(env.SLACK_WEBHOOK_URL),
    emailRecipients: env.ALERT_EMAIL_TO,
    minScore: env.ALERT_MIN_SCORE,
    mode: env.ALERT_MODE,
    digestCron: env.ALERT_DIGEST_CRON,
    includeAVerifier: env.ALERT_INCLUDE_A_VERIFIER,
    onlyWatchedZones: true,
  };
}

/** Configuration d'alertes : valeurs en base (modifiables via UI) avec fallback sur les variables d'environnement. */
export async function getAlertConfig(): Promise<AlertConfig> {
  const row = await prisma.setting.findUnique({ where: { key: ALERT_CONFIG_KEY } });
  if (!row) return defaultAlertConfig();
  try {
    return alertConfigSchema.parse(JSON.parse(row.value));
  } catch {
    return defaultAlertConfig();
  }
}

export async function saveAlertConfig(partial: Partial<AlertConfig>): Promise<AlertConfig> {
  const current = await getAlertConfig();
  const next = alertConfigSchema.parse({ ...current, ...partial });
  await prisma.setting.upsert({
    where: { key: ALERT_CONFIG_KEY },
    update: { value: JSON.stringify(next) },
    create: { key: ALERT_CONFIG_KEY, value: JSON.stringify(next) },
  });
  return next;
}
