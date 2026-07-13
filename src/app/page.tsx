"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardStats {
  totalTenders: number;
  regions: { id: string; label: string; count: number; icon: string }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/tenders?pageSize=1");
        const data = await res.json();
        setStats({
          totalTenders: data.total,
          regions: [
            { id: "region-sud", label: "Région Sud", icon: "☀️", count: 0 },
            { id: "alpes", label: "Alpes", icon: "⛰️", count: 0 },
            { id: "suisse-romande", label: "Suisse romande", icon: "🇨🇭", count: 0 },
          ],
        });
      } catch (err) {
        console.error("Dashboard load:", err);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord Renov Midi</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Veille centralisée des appels d'offres BTP</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Annonces en base"
          value={stats?.totalTenders ?? "—"}
          icon="📊"
          href="/ao"
        />
        <StatCard label="Région Sud" value="—" icon="☀️" href="/ao?zone=region-sud" />
        <StatCard label="Alpes" value="—" icon="⛰️" href="/ao?zone=alpes" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold">Accès rapide</h2>
          <div className="space-y-2">
            <Link href="/ao" className="block rounded-lg px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800">
              📢 Toutes les annonces
            </Link>
            <Link href="/config" className="block rounded-lg px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800">
              ⚙️ Configuration
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold">À propos</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Renov Midi centralise les appels d'offres BTP de la Région Sud (13, 83, 06, 05),
            des Alpes (74, 73, 38) et de Suisse romande (GE, VD, VS, NE, FR, JU).
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: string | number;
  icon: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
