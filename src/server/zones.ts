import { z } from "zod";
import { prisma } from "./db";

/**
 * Zones de veille géographiques.
 * `codes` contient des numéros de département pour la France (ex: "13"),
 * des codes canton pour la Suisse (ex: "GE").
 */
const watchZoneSchema = z.object({
  id: z.string(),
  label: z.string(),
  country: z.enum(["FR", "CH"]),
  enabled: z.boolean(),
  codes: z.array(z.string()),
});

const zonesConfigSchema = z.array(watchZoneSchema);

export type WatchZone = z.infer<typeof watchZoneSchema>;

const ZONES_KEY = "watchZones";

/** Zones par défaut demandées par le métier. Modifiables ensuite via la page Configuration. */
export const DEFAULT_ZONES: WatchZone[] = [
  {
    id: "region-sud",
    label: "Région Sud — Marseille (13, 83, 06, 05)",
    country: "FR",
    enabled: true,
    codes: ["13", "83", "06", "05"],
  },
  {
    id: "alpes",
    label: "Alpes — Annecy / Haute-Savoie (74, 73, 38)",
    country: "FR",
    enabled: true,
    codes: ["74", "73", "38"],
  },
  {
    id: "suisse-romande",
    label: "Suisse romande (GE, VD, VS, NE, FR, JU)",
    country: "CH",
    enabled: true,
    codes: ["GE", "VD", "VS", "NE", "FR", "JU"],
  },
];

export async function getZones(): Promise<WatchZone[]> {
  const row = await prisma.setting.findUnique({ where: { key: ZONES_KEY } });
  if (!row) return DEFAULT_ZONES;
  try {
    return zonesConfigSchema.parse(JSON.parse(row.value));
  } catch {
    return DEFAULT_ZONES;
  }
}

export async function saveZones(zones: unknown): Promise<WatchZone[]> {
  const parsed = zonesConfigSchema.parse(zones);
  await prisma.setting.upsert({
    where: { key: ZONES_KEY },
    update: { value: JSON.stringify(parsed) },
    create: { key: ZONES_KEY, value: JSON.stringify(parsed) },
  });
  return parsed;
}

/** Départements français couverts par les zones FR actives (pour le filtre serveur BOAMP). */
export async function getWatchedFrDepartments(): Promise<string[]> {
  const zones = await getZones();
  const depts = new Set<string>();
  for (const zone of zones) {
    if (zone.country === "FR" && zone.enabled) zone.codes.forEach((c) => depts.add(c));
  }
  return [...depts];
}

/**
 * Retourne les ids des zones actives correspondant à une annonce
 * (intersection non vide entre les codes de la zone et la localisation de l'annonce).
 * Une annonce suisse sans canton précisé (localisation "CH" seule) matche toute zone CH active.
 */
export function matchZones(
  zones: WatchZone[],
  notice: { country: string; departements: string[] },
): string[] {
  return zones
    .filter((zone) => {
      if (!zone.enabled || zone.country !== notice.country) return false;
      if (notice.country === "CH" && notice.departements.length === 0) return true;
      return notice.departements.some((code) => zone.codes.includes(code));
    })
    .map((zone) => zone.id);
}
