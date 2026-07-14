import { NextResponse } from "next/server";
import { runDigest } from "@/server/notifications/notification-service";
import { getAlertConfig } from "@/server/settings";

/** POST /api/reports/weekly — déclenche immédiatement le rapport digest (test / envoi manuel). */
export async function POST() {
  const config = await getAlertConfig();
  if (config.mode !== "digest") {
    return NextResponse.json(
      { error: "Le mode d'alerte n'est pas 'digest' — activez-le dans Configuration." },
      { status: 400 },
    );
  }
  const sent = await runDigest();
  return NextResponse.json({ ok: true, tendersInReport: sent, recipients: config.emailRecipients });
}
