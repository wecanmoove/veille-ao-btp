import { NextResponse } from "next/server";
import { z } from "zod";
import cron from "node-cron";
import { prisma } from "@/server/db";
import { scheduleAllSources } from "@/server/scheduler";

const patchSchema = z.object({
  enabled: z.boolean().optional(),
  cronExpression: z.string().optional(),
  timezone: z.string().optional(),
});

/** PATCH /api/sources/[slug] — activer/désactiver une source, changer sa fréquence cron ou sa timezone. */
export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = patchSchema.parse(await req.json());

  if (body.cronExpression && !cron.validate(body.cronExpression)) {
    return NextResponse.json({ error: "Expression cron invalide" }, { status: 400 });
  }

  const source = await prisma.source.update({ where: { slug }, data: body });
  await scheduleAllSources(); // reprogramme immédiatement le scheduler avec la nouvelle config
  return NextResponse.json(source);
}
