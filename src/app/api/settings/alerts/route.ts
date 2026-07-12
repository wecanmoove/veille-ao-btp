import { NextResponse } from "next/server";
import { z } from "zod";
import cron from "node-cron";
import { getAlertConfig, saveAlertConfig } from "@/server/settings";
import { scheduleDigest } from "@/server/scheduler";

export async function GET() {
  return NextResponse.json(await getAlertConfig());
}

const patchSchema = z.object({
  emailEnabled: z.boolean().optional(),
  slackEnabled: z.boolean().optional(),
  emailRecipients: z.string().optional(),
  minScore: z.number().int().min(0).max(100).optional(),
  mode: z.enum(["instant", "digest"]).optional(),
  digestCron: z.string().optional(),
  includeAVerifier: z.boolean().optional(),
});

/** PATCH /api/settings/alerts — met à jour la configuration d'alertes (page Configuration). */
export async function PATCH(req: Request) {
  const body = patchSchema.parse(await req.json());
  if (body.digestCron && !cron.validate(body.digestCron)) {
    return NextResponse.json({ error: "Expression cron de digest invalide" }, { status: 400 });
  }
  const config = await saveAlertConfig(body);
  await scheduleDigest();
  return NextResponse.json(config);
}
