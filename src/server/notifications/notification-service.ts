import type { Tender } from "@prisma/client";
import { prisma } from "../db";
import { env } from "../env";
import { logError, logInfo } from "../logger";
import { withRetry } from "../retry";
import { getAlertConfig, type AlertConfig } from "../settings";
import { emailProvider } from "./email-provider";
import { slackProvider } from "./slack-provider";
import type { NotificationProvider } from "./types";

const providers: NotificationProvider[] = [emailProvider, slackProvider];

/** Une annonce doit-elle déclencher une alerte selon les seuils configurés (base > env) ? */
export function isAlertable(
  tender: Pick<Tender, "score" | "relevanceLevel" | "zonesJson">,
  config: AlertConfig,
): boolean {
  if (tender.relevanceLevel === "non_pertinent") return false;
  if (tender.relevanceLevel === "a_verifier" && !config.includeAVerifier) return false;
  if (config.onlyWatchedZones) {
    const zones = JSON.parse(tender.zonesJson) as string[];
    if (zones.length === 0) return false;
  }
  return tender.score >= config.minScore;
}

function isChannelEnabled(channel: "email" | "slack", config: AlertConfig): boolean {
  return channel === "email" ? config.emailEnabled : config.slackEnabled;
}

/**
 * Envoie les alertes pour une annonce sur tous les canaux activés et configurés.
 * Anti-doublon : contrainte unique (tenderId, channel) sur Notification — un upsert
 * garantit qu'une même annonce n'est jamais renotifiée sur le même canal.
 */
export async function sendAlertsForTender(tender: Tender): Promise<number> {
  const config = await getAlertConfig();
  if (!isAlertable(tender, config)) return 0;
  const detailUrl = `${env.APP_BASE_URL}/ao/${tender.id}`;
  const emailRecipients = config.emailRecipients.split(",").map((s) => s.trim()).filter(Boolean);
  let sent = 0;

  for (const provider of providers) {
    if (!isChannelEnabled(provider.channel, config) || !provider.isConfigured()) continue;

    const existing = await prisma.notification.findUnique({
      where: { tenderId_channel: { tenderId: tender.id, channel: provider.channel } },
    });
    if (existing && existing.status === "sent") continue; // anti-doublon

    const notif =
      existing ??
      (await prisma.notification.create({
        data: { tenderId: tender.id, channel: provider.channel, status: "pending" },
      }));

    try {
      const result = await withRetry(() => provider.send({ tender, detailUrl, emailRecipients }), {
        attempts: 3,
        label: `notify:${provider.channel}`,
      });
      if (result.ok) {
        await prisma.notification.update({
          where: { id: notif.id },
          data: { status: "sent", sentAt: new Date(), attempts: { increment: 1 } },
        });
        sent++;
        logInfo("notify", `${provider.channel} envoyé pour "${tender.title.slice(0, 60)}"`);
      } else {
        await prisma.notification.update({
          where: { id: notif.id },
          data: { status: "failed", lastError: result.error, attempts: { increment: 1 } },
        });
        await logError("notify", `Échec ${provider.channel} pour "${tender.title.slice(0, 60)}"`, result.error);
      }
    } catch (err) {
      await prisma.notification.update({
        where: { id: notif.id },
        data: { status: "failed", lastError: err instanceof Error ? err.message : String(err), attempts: { increment: 1 } },
      });
      await logError("notify", `Exception ${provider.channel}`, err);
    }
  }
  return sent;
}

/** Marque comme "skipped" les canaux désactivés/non configurés pour une annonce (visibilité dans l'historique). */
export async function skipUnconfiguredChannels(tender: Tender): Promise<void> {
  const config = await getAlertConfig();
  if (!isAlertable(tender, config)) return;
  for (const provider of providers) {
    if (isChannelEnabled(provider.channel, config) && provider.isConfigured()) continue;
    await prisma.notification.upsert({
      where: { tenderId_channel: { tenderId: tender.id, channel: provider.channel } },
      update: {},
      create: {
        tenderId: tender.id,
        channel: provider.channel,
        status: "skipped",
        lastError: !isChannelEnabled(provider.channel, config) ? "Canal désactivé" : "Canal non configuré",
      },
    });
  }
}

/** Regroupe les annonces récemment insérées et alertables pour un envoi en digest (mode ALERT_MODE=digest). */
export async function runDigest(): Promise<number> {
  const config = await getAlertConfig();
  if (config.mode !== "digest") return 0;
  const since = new Date(Date.now() - 24 * 3600_000);
  const candidates = await prisma.tender.findMany({
    where: { createdAt: { gte: since }, relevanceLevel: { not: "non_pertinent" } },
    orderBy: { score: "desc" },
  });
  let total = 0;
  for (const tender of candidates) {
    total += await sendAlertsForTender(tender);
    await skipUnconfiguredChannels(tender);
  }
  logInfo("notify", `Digest exécuté : ${total} alertes envoyées sur ${candidates.length} candidates`);
  return total;
}
