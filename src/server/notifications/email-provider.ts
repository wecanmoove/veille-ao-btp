import { env } from "../env";
import type { AlertPayload, NotificationProvider, SendResult } from "./types";

function formatDate(d: Date | null): string {
  return d ? new Date(d).toLocaleDateString("fr-FR") : "Non renseignée";
}

function buildHtml(payload: AlertPayload): string {
  const { tender, detailUrl } = payload;
  return `<!doctype html>
<html lang="fr"><body style="font-family: Arial, sans-serif; color:#1a1a1a;">
  <h2 style="color:#0b5ed7;">Nouvel appel d'offres pertinent</h2>
  <h3>${escapeHtml(tender.title)}</h3>
  <table cellpadding="4" style="border-collapse:collapse;">
    <tr><td><strong>Score</strong></td><td>${tender.score}/100 (${tender.relevanceLevel})</td></tr>
    <tr><td><strong>Catégorie</strong></td><td>${tender.workCategory}</td></tr>
    <tr><td><strong>Acheteur</strong></td><td>${escapeHtml(tender.buyer ?? "Non renseigné")}</td></tr>
    <tr><td><strong>Localisation</strong></td><td>${JSON.parse(tender.departementsJson).join(", ") || "Non renseignée"}</td></tr>
    <tr><td><strong>Date limite</strong></td><td>${formatDate(tender.deadlineAt)}</td></tr>
  </table>
  <p>${escapeHtml(tender.justification ?? "")}</p>
  <p>
    <a href="${detailUrl}" style="color:#0b5ed7;">Voir la fiche détail</a>
    ${tender.sourceUrl ? ` | <a href="${escapeHtml(tender.sourceUrl)}" style="color:#0b5ed7;">Voir la source d'origine</a>` : ""}
  </p>
</body></html>`;
}

function buildText(payload: AlertPayload): string {
  const { tender, detailUrl } = payload;
  return [
    `Nouvel appel d'offres pertinent : ${tender.title}`,
    `Score : ${tender.score}/100 (${tender.relevanceLevel})`,
    `Catégorie : ${tender.workCategory}`,
    `Acheteur : ${tender.buyer ?? "Non renseigné"}`,
    `Date limite : ${formatDate(tender.deadlineAt)}`,
    tender.justification ?? "",
    `Fiche détail : ${detailUrl}`,
    tender.sourceUrl ? `Source d'origine : ${tender.sourceUrl}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Provider email. EMAIL_PROVIDER=resend envoie réellement via l'API Resend.
 * EMAIL_PROVIDER=console (défaut dev) journalise le contenu sans envoyer.
 */
export const emailProvider: NotificationProvider = {
  channel: "email",
  isConfigured() {
    if (env.EMAIL_PROVIDER === "console") return true;
    return Boolean(env.RESEND_API_KEY && env.ALERT_EMAIL_TO);
  },
  async send(payload: AlertPayload): Promise<SendResult> {
    const to = (payload.emailRecipients ?? env.ALERT_EMAIL_TO.split(",")).map((s) => s.trim()).filter(Boolean);
    if (to.length === 0) return { ok: false, error: "Aucun destinataire email configuré" };

    const html = buildHtml(payload);
    const text = buildText(payload);

    if (env.EMAIL_PROVIDER === "console") {
      console.log(`[email:console] À: ${to.join(", ")} | Sujet: AO pertinent — ${payload.tender.title}\n${text}`);
      return { ok: true };
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: env.EMAIL_FROM,
          to,
          subject: `AO pertinent (${payload.tender.score}/100) — ${payload.tender.title}`,
          html,
          text,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        return { ok: false, error: `Resend HTTP ${res.status}: ${(await res.text()).slice(0, 300)}` };
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
};
