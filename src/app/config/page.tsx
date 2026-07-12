"use client";

import { useEffect, useState, useCallback } from "react";
import { StatusBadge } from "@/components/badges";
import { BTP_KEYWORDS } from "@/server/pipeline/btp-keywords";

interface SourceRow {
  id: string;
  slug: string;
  name: string;
  status: string;
  enabled: boolean;
  cronExpression: string;
  timezone: string;
  lastSuccessAt: string | null;
  implementation: string;
  locked: boolean;
}

interface AlertConfig {
  emailEnabled: boolean;
  slackEnabled: boolean;
  emailRecipients: string;
  minScore: number;
  mode: "instant" | "digest";
  digestCron: string;
  includeAVerifier: boolean;
}

export default function ConfigPage() {
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [syncMessage, setSyncMessage] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const loadSources = useCallback(async () => {
    const res = await fetch("/api/sources");
    setSources(await res.json());
  }, []);

  useEffect(() => {
    void (async () => {
      await loadSources();
      const res = await fetch("/api/settings/alerts");
      setAlertConfig(await res.json());
    })();
  }, []);

  async function updateSource(slug: string, patch: Partial<Pick<SourceRow, "enabled" | "cronExpression" | "timezone">>) {
    await fetch(`/api/sources/${slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    await loadSources();
  }

  async function triggerSync(slug: string) {
    setSyncMessage((m) => ({ ...m, [slug]: "En cours..." }));
    const res = await fetch(`/api/sync/${slug}`, { method: "POST" });
    const data = await res.json();
    setSyncMessage((m) => ({
      ...m,
      [slug]: res.ok
        ? `OK — ${data.fetched} récupérées, ${data.inserted} nouvelles, ${data.duplicates} doublons, ${data.rejected} rejetées`
        : `Erreur: ${data.error}`,
    }));
    await loadSources();
  }

  async function saveAlertConfig(patch: Partial<AlertConfig>) {
    if (!alertConfig) return;
    setSaving(true);
    const res = await fetch("/api/settings/alerts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    const data = await res.json();
    setAlertConfig(data);
    setSaving(false);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Configuration</h1>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Sources de données</h2>
        <p className="mt-1 text-sm text-slate-500">
          Activez/désactivez une source, ajustez sa fréquence cron et sa timezone, ou lancez une synchronisation manuelle.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Source</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Statut</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Activée</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Cron</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Timezone</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Dernier succès</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sources.map((s) => (
                <tr key={s.slug}>
                  <td className="px-3 py-2">
                    <div className="font-medium text-slate-900">{s.name}</div>
                    <div className="text-xs text-slate-400">
                      {s.implementation === "mockee" ? "Connecteur mocké (données simulées)" : "Connecteur réel"}
                    </div>
                  </td>
                  <td className="px-3 py-2"><StatusBadge status={s.status} /></td>
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={s.enabled} onChange={(e) => updateSource(s.slug, { enabled: e.target.checked })} />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-36 rounded border border-slate-300 px-2 py-1 font-mono text-xs"
                      defaultValue={s.cronExpression}
                      onBlur={(e) => e.target.value !== s.cronExpression && updateSource(s.slug, { cronExpression: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-32 rounded border border-slate-300 px-2 py-1 text-xs"
                      defaultValue={s.timezone}
                      onBlur={(e) => e.target.value !== s.timezone && updateSource(s.slug, { timezone: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {s.lastSuccessAt ? new Date(s.lastSuccessAt).toLocaleString("fr-FR") : "Jamais"}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => triggerSync(s.slug)}
                      disabled={s.locked}
                      className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {s.locked ? "En cours..." : "Synchroniser"}
                    </button>
                    {syncMessage[s.slug] && <div className="mt-1 text-xs text-slate-500">{syncMessage[s.slug]}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Alertes & notifications</h2>
        {!alertConfig ? (
          <p className="mt-2 text-sm text-slate-400">Chargement...</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={alertConfig.emailEnabled} onChange={(e) => setAlertConfig({ ...alertConfig, emailEnabled: e.target.checked })} />
              Alertes email activées
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={alertConfig.slackEnabled} onChange={(e) => setAlertConfig({ ...alertConfig, slackEnabled: e.target.checked })} />
              Alertes Slack activées
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              Destinataires email (séparés par des virgules)
              <input
                className="rounded border border-slate-300 px-2 py-1"
                value={alertConfig.emailRecipients}
                onChange={(e) => setAlertConfig({ ...alertConfig, emailRecipients: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Score minimal ({alertConfig.minScore}/100)
              <input
                type="range"
                min={0}
                max={100}
                value={alertConfig.minScore}
                onChange={(e) => setAlertConfig({ ...alertConfig, minScore: Number(e.target.value) })}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Mode d&apos;envoi
              <select
                className="rounded border border-slate-300 px-2 py-1"
                value={alertConfig.mode}
                onChange={(e) => setAlertConfig({ ...alertConfig, mode: e.target.value as "instant" | "digest" })}
              >
                <option value="instant">Instantané</option>
                <option value="digest">Digest planifié</option>
              </select>
            </label>
            {alertConfig.mode === "digest" && (
              <label className="flex flex-col gap-1 text-sm">
                Fréquence du digest (cron)
                <input
                  className="rounded border border-slate-300 px-2 py-1 font-mono text-xs"
                  value={alertConfig.digestCron}
                  onChange={(e) => setAlertConfig({ ...alertConfig, digestCron: e.target.value })}
                />
              </label>
            )}
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={alertConfig.includeAVerifier}
                onChange={(e) => setAlertConfig({ ...alertConfig, includeAVerifier: e.target.checked })}
              />
              Inclure les annonces &quot;à vérifier&quot; dans les alertes
            </label>
            <div className="sm:col-span-2">
              <button
                onClick={() => saveAlertConfig(alertConfig)}
                disabled={saving}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Mots-clés métier BTP</h2>
        <p className="mt-1 text-sm text-slate-500">
          Liste utilisée par le préfiltrage déterministe et le fallback sans IA (lecture seule pour le MVP).
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {BTP_KEYWORDS.map((k) => (
            <span key={k} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{k}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
