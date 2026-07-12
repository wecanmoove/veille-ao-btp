import { prisma } from "../db";
import { env } from "../env";
import { logError, logInfo } from "../logger";
import { withRetry } from "../retry";
import { getConnector } from "../connectors";
import type { NormalizedNotice } from "../connectors/types";
import { computeDedupKey } from "./dedup";
import { scoreWithRules } from "./rules-scoring";
import { scoreNotice } from "./ai-scoring";
import { sendAlertsForTender, skipUnconfiguredChannels } from "../notifications/notification-service";
import { getAlertConfig } from "../settings";

/** Verrou anti-chevauchement en mémoire (process unique Next.js). Un verrou par source. */
const runningLocks = new Set<string>();

export function isSourceLocked(sourceSlug: string): boolean {
  return runningLocks.has(sourceSlug);
}

export interface RunSyncResult {
  runId: string;
  status: "success" | "error" | "skipped_locked";
  fetched: number;
  inserted: number;
  duplicates: number;
  rejected: number;
  alertsSent: number;
}

/**
 * Exécute le pipeline complet pour une source :
 * collecte -> normalisation (faite par le connecteur) -> dédoublonnage ->
 * filtrage métier + scoring -> stockage -> alertes.
 */
export async function runSync(sourceSlug: string, trigger: "cron" | "manual"): Promise<RunSyncResult> {
  if (isSourceLocked(sourceSlug)) {
    logInfo("sync", `Source ${sourceSlug} déjà en cours d'exécution, run ignoré`);
    return { runId: "", status: "skipped_locked", fetched: 0, inserted: 0, duplicates: 0, rejected: 0, alertsSent: 0 };
  }

  const source = await prisma.source.findUnique({ where: { slug: sourceSlug } });
  if (!source) throw new Error(`Source inconnue en base: ${sourceSlug}`);
  const connector = getConnector(sourceSlug);
  if (!connector) throw new Error(`Aucun connecteur enregistré pour: ${sourceSlug}`);

  runningLocks.add(sourceSlug);
  const run = await prisma.syncRun.create({
    data: { sourceId: source.id, trigger, status: "running" },
  });

  let fetched = 0;
  let inserted = 0;
  let duplicates = 0;
  let rejected = 0;
  let alertsSent = 0;

  try {
    const since = source.lastSuccessAt
      ? new Date(source.lastSuccessAt.getTime() - 6 * 3600_000) // marge de recouvrement de 6h
      : new Date(Date.now() - env.SYNC_LOOKBACK_DAYS * 24 * 3600_000);

    const notices: NormalizedNotice[] = await withRetry(() => connector.fetchSince(since), {
      attempts: 3,
      label: `fetch:${sourceSlug}`,
    });
    fetched = notices.length;

    let aiCallsUsed = 0;

    for (const notice of notices) {
      // Dédoublonnage intra-source : contrainte unique (sourceId, sourceRef) gérée par upsert plus bas.
      const dedupKey = computeDedupKey(notice.title, notice.buyer);

      // Dédoublonnage inter-sources : une annonce avec la même dedupKey déjà connue
      // (autre source ou même source) est traitée comme doublon si sourceRef diffère.
      const existingByDedup = await prisma.tender.findFirst({
        where: {
          dedupKey,
          NOT: { AND: [{ sourceId: source.id }, { sourceRef: notice.sourceRef }] },
        },
      });

      const existingBySourceRef = await prisma.tender.findUnique({
        where: { sourceId_sourceRef: { sourceId: source.id, sourceRef: notice.sourceRef } },
      });

      if (existingByDedup && !existingBySourceRef) {
        duplicates++;
        continue;
      }

      // Préfiltrage déterministe (rapide) pour décider si un appel IA est utile.
      const ruleResult = scoreWithRules(notice);

      const useAi = ruleResult.relevanceLevel !== "non_pertinent" && aiCallsUsed < env.AI_MAX_PER_RUN;
      let scoring = ruleResult;
      if (useAi) {
        aiCallsUsed++;
        scoring = await scoreNotice(notice);
      }

      if (scoring.relevanceLevel === "non_pertinent") {
        rejected++;
      }

      const data = {
        sourceId: source.id,
        sourceRef: notice.sourceRef,
        dedupKey,
        title: notice.title,
        buyer: notice.buyer,
        description: notice.description,
        cpvCodesJson: JSON.stringify(notice.cpvCodes),
        departementsJson: JSON.stringify(notice.departements),
        city: notice.city,
        budgetEstime: notice.budgetEstime ?? null,
        publishedAt: notice.publishedAt ?? null,
        deadlineAt: notice.deadlineAt ?? null,
        procedureType: notice.procedureType,
        natureLibelle: notice.natureLibelle,
        sourceUrl: notice.sourceUrl,
        score: scoring.score,
        relevanceLevel: scoring.relevanceLevel,
        workCategory: scoring.workCategory,
        keywordsJson: JSON.stringify(scoring.matchedKeywords),
        justification: scoring.justification,
        exclusionReason: scoring.exclusionReason,
        scoredBy: scoring.scoredBy,
      };

      const wasNew = !existingBySourceRef;
      const tender = await prisma.tender.upsert({
        where: { sourceId_sourceRef: { sourceId: source.id, sourceRef: notice.sourceRef } },
        create: data,
        update: data,
      });

      if (wasNew) {
        inserted++;
        const alertConfig = await getAlertConfig();
        if (alertConfig.mode === "instant") {
          alertsSent += await sendAlertsForTender(tender);
          await skipUnconfiguredChannels(tender);
        }
      }
    }

    await prisma.source.update({ where: { id: source.id }, data: { lastSuccessAt: new Date(), status: "actif" } });
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: "success", finishedAt: new Date(), fetched, inserted, duplicates, rejected, alertsSent },
    });
    logInfo("sync", `${sourceSlug}: ${fetched} récupérées, ${inserted} nouvelles, ${duplicates} doublons, ${rejected} rejetées, ${alertsSent} alertes`);

    return { runId: run.id, status: "success", fetched, inserted, duplicates, rejected, alertsSent };
  } catch (err) {
    await prisma.source.update({ where: { id: source.id }, data: { status: "en_erreur" } });
    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: "error",
        finishedAt: new Date(),
        fetched,
        inserted,
        duplicates,
        rejected,
        alertsSent,
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });
    await logError("sync", `Échec synchronisation ${sourceSlug}`, err);
    return { runId: run.id, status: "error", fetched, inserted, duplicates, rejected, alertsSent };
  } finally {
    runningLocks.delete(sourceSlug);
  }
}
