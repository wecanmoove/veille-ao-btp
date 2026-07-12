import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().default("file:./dev.db"),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  EMAIL_PROVIDER: z.enum(["resend", "console"]).default("console"),
  RESEND_API_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("Veille AO BTP <veille@example.com>"),
  ALERT_EMAIL_TO: z.string().default(""),
  SLACK_WEBHOOK_URL: z.string().optional().default(""),
  ALERT_MIN_SCORE: z.coerce.number().int().min(0).max(100).default(60),
  ALERT_MODE: z.enum(["instant", "digest"]).default("instant"),
  ALERT_DIGEST_CRON: z.string().default("0 7,13,18 * * *"),
  ALERT_INCLUDE_A_VERIFIER: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
  APP_BASE_URL: z.string().default("http://localhost:3000"),
  SYNC_LOOKBACK_DAYS: z.coerce.number().int().min(1).max(30).default(3),
  AI_MAX_PER_RUN: z.coerce.number().int().min(0).default(40),
});

export const env = envSchema.parse(process.env);
