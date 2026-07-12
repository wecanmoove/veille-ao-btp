import type { Tender } from "@prisma/client";

export interface AlertPayload {
  tender: Tender;
  detailUrl: string;
  emailRecipients?: string[];
}

export interface SendResult {
  ok: boolean;
  error?: string;
}

/** Contrat commun à tout canal de notification (email, slack, futur whatsapp/webhook générique...). */
export interface NotificationProvider {
  channel: "email" | "slack";
  isConfigured(): boolean;
  send(payload: AlertPayload): Promise<SendResult>;
}
