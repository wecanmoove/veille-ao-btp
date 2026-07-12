import { env } from "../env";
import type { AlertPayload, NotificationProvider, SendResult } from "./types";

export const slackProvider: NotificationProvider = {
  channel: "slack",
  isConfigured() {
    return Boolean(env.SLACK_WEBHOOK_URL);
  },
  async send(payload: AlertPayload): Promise<SendResult> {
    if (!env.SLACK_WEBHOOK_URL) return { ok: false, error: "SLACK_WEBHOOK_URL non configuré" };
    const { tender, detailUrl } = payload;
    const departements = (JSON.parse(tender.departementsJson) as string[]).join(", ") || "N/A";
    const deadline = tender.deadlineAt ? new Date(tender.deadlineAt).toLocaleDateString("fr-FR") : "N/A";

    const body = {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Nouvel AO pertinent (${tender.score}/100 — ${tender.relevanceLevel})*\n<${detailUrl}|${tender.title}>`,
          },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Acheteur:*\n${tender.buyer ?? "N/A"}` },
            { type: "mrkdwn", text: `*Catégorie:*\n${tender.workCategory}` },
            { type: "mrkdwn", text: `*Localisation:*\n${departements}` },
            { type: "mrkdwn", text: `*Date limite:*\n${deadline}` },
          ],
        },
        ...(tender.justification
          ? [{ type: "section" as const, text: { type: "mrkdwn" as const, text: tender.justification.slice(0, 500) } }]
          : []),
        {
          type: "actions",
          elements: [
            { type: "button", text: { type: "plain_text", text: "Voir la fiche" }, url: detailUrl },
            ...(tender.sourceUrl
              ? [{ type: "button" as const, text: { type: "plain_text" as const, text: "Voir la source" }, url: tender.sourceUrl }]
              : []),
          ],
        },
      ],
    };

    try {
      const res = await fetch(env.SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        return { ok: false, error: `Slack HTTP ${res.status}: ${(await res.text()).slice(0, 300)}` };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
};
