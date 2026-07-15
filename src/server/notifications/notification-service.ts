import type { Tender } from "@prisma/client";
import { prisma } from "../db";
import { env } from "../env";
import { logError, logInfo } from "../logger";
import { withRetry } from "../retry";
import { getAlertConfig, type AlertConfig } from "../settings";
import { emailProvider, sendEmail } from "./email-provider";
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

const REPORT_LOOKBACK_DAYS = 7;
const REPORT_MAX_ITEMS = 25;

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Rapport consolidé des appels d'offres les plus pertinents (mode digest).
 * Un seul email récapitulatif — pensé pour un envoi hebdomadaire (ex: lundi 8h,
 * digestCron "0 8 * * 1") : top des annonces des 7 derniers jours, triées par score,
 * limitées aux zones de veille actives.
 */
export async function runDigest(): Promise<number> {
  const config = await getAlertConfig();
  if (config.mode !== "digest" || !config.emailEnabled) return 0;

  const since = new Date(Date.now() - REPORT_LOOKBACK_DAYS * 24 * 3600_000);
  const candidates = await prisma.tender.findMany({
    where: {
      createdAt: { gte: since },
      relevanceLevel: { in: ["tres_pertinent", "pertinent"] },
      score: { gte: config.minScore },
    },
    include: { source: true },
    orderBy: [{ score: "desc" }, { publishedAt: "desc" }],
  });
  const inZone = config.onlyWatchedZones
    ? candidates.filter((t) => (JSON.parse(t.zonesJson) as string[]).length > 0)
    : candidates;
  const top = inZone.slice(0, REPORT_MAX_ITEMS);

  const periodLabel = `${since.toLocaleDateString("fr-FR")} → ${new Date().toLocaleDateString("fr-FR")}`;
  const subject = `🏗️ Renov Midi — ${top.length} opportunité${top.length > 1 ? "s" : ""} BTP à étudier (${periodLabel})`;

  const rowsHtml = top
    .map((t, i) => {
      const depts = (JSON.parse(t.departementsJson) as string[]).join(", ");
      const lieu = `${t.country === "CH" ? "🇨🇭 " : ""}${depts || "—"}`;
      const limite = t.deadlineAt ? new Date(t.deadlineAt).toLocaleDateString("fr-FR") : "—";
      const scoreColor = t.score >= 70 ? "#047857" : "#0369a1";
      const linkUrl = t.sourceUrl || `${env.APP_BASE_URL}/ao/${t.id}`;
      return `<tr style="background:${i % 2 ? "#f8fafc" : "#ffffff"};">
        <td style="padding:8px 10px; font-weight:bold; color:${scoreColor}; white-space:nowrap;">${t.score}/100</td>
        <td style="padding:8px 10px;"><a href="${linkUrl}" style="color:#0f766e; font-weight:600;">${esc(t.title)}</a><br>
          <span style="color:#64748b; font-size:12px;">${esc(t.buyer ?? "Acheteur non renseigné")}</span></td>
        <td style="padding:8px 10px; white-space:nowrap;">${lieu}</td>
        <td style="padding:8px 10px; white-space:nowrap;">${limite}</td>
        <td style="padding:8px 10px; white-space:nowrap;"><a href="${linkUrl}" style="color:#0f766e; font-weight:600; text-decoration:none;">🔗</a></td>
      </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="fr"><body style="font-family: Arial, sans-serif; color:#1e293b; margin:0; padding:24px; background:#f1f5f9;">
  <div style="max-width:680px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;">
    <div style="background:#0f766e; color:#ffffff; padding:20px 24px;">
      <h1 style="margin:0; font-size:20px;">🏗️ Renov Midi — Rapport hebdomadaire</h1>
      <p style="margin:6px 0 0; color:#99f6e4; font-size:13px;">Appels d'offres BTP les plus pertinents · ${periodLabel} · Aix-Marseille, Région Sud, Alpes, Suisse romande</p>
    </div>
    <div style="padding:20px 24px;">
      ${
        top.length === 0
          ? `<p>Aucune nouvelle opportunité au-dessus du seuil (score ≥ ${config.minScore}) cette semaine. Le radar reste en veille.</p>`
          : `<p><strong>${top.length}</strong> opportunité${top.length > 1 ? "s" : ""} détectée${top.length > 1 ? "s" : ""} cette semaine (score ≥ ${config.minScore}) :</p>
      <table cellspacing="0" cellpadding="0" style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr style="text-align:left; border-bottom:2px solid #e2e8f0;">
          <th style="padding:8px 10px;">Score</th><th style="padding:8px 10px;">Annonce</th><th style="padding:8px 10px;">Lieu</th><th style="padding:8px 10px;">Limite</th><th style="padding:8px 10px; text-align:center;">Lien</th>
        </tr>
        ${rowsHtml}
      </table>`
      }
      <p style="margin-top:20px;"><a href="${env.APP_BASE_URL}/ao" style="display:inline-block; background:#f97316; color:#ffffff; padding:10px 18px; border-radius:8px; text-decoration:none; font-weight:bold;">Plus de détails sur Renov Midi</a></p>
    </div>
    <div style="padding:12px 24px; background:#f8fafc; color:#94a3b8; font-size:11px;">Rapport automatique Renov Midi — fréquence et seuil réglables dans Configuration.</div>
  </div>
</body></html>`;

  const text = [
    `Renov Midi — Rapport hebdomadaire (${periodLabel})`,
    `${top.length} opportunité(s) BTP au-dessus du seuil ${config.minScore}/100 :`,
    "",
    ...top.map(
      (t) => {
        const linkUrl = t.sourceUrl || `${env.APP_BASE_URL}/ao/${t.id}`;
        return `- [${t.score}/100] ${t.title} — ${t.buyer ?? "?"} (${(JSON.parse(t.departementsJson) as string[]).join(", ")})` +
          `${t.deadlineAt ? ` — limite ${new Date(t.deadlineAt).toLocaleDateString("fr-FR")}` : ""}\n  ${linkUrl}`;
      }
    ),
    "",
    `Tableau de bord : ${env.APP_BASE_URL}/ao`,
  ].join("\n");

  const to = config.emailRecipients.split(",").map((s) => s.trim()).filter(Boolean);
  const result = await withRetry(() => sendEmail({ to, subject, html, text }), {
    attempts: 3,
    label: "notify:digest-email",
  });

  if (!result.ok) {
    await logError("notify", `Échec envoi du rapport digest à ${to.join(", ")}`, result.error);
    return 0;
  }
  logInfo("notify", `Rapport digest envoyé à ${to.join(", ")} : ${top.length} annonces (sur ${candidates.length} candidates)`);
  return top.length;
}
