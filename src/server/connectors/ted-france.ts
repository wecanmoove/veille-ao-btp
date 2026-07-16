import type { NormalizedNotice, SourceConnector } from "./types";
import { getWatchedFrDepartments } from "../zones";

/**
 * Connecteur TED (Tenders Electronic Daily) — France Sud, implémentation réelle.
 * API officielle de l'UE, gratuite et sans clé : https://api.ted.europa.eu/v3/notices/search
 * Deuxième source réelle pour la France : tous les marchés au-dessus des seuils
 * européens (≈ 5,5 M€ travaux) y sont publiés — les grosses opérations de
 * réhabilitation/TCE. Complète le BOAMP (le dédoublonnage inter-sources
 * élimine les avis publiés aux deux endroits).
 */
const API_URL = "https://api.ted.europa.eu/v3/notices/search";
const PAGE_SIZE = 50;
const MAX_PAGES = 6;

/** Départements de veille → NUTS 3 (nomenclature utilisée par TED). */
const DEPT_TO_NUTS: Record<string, string> = {
  "04": "FRL01",
  "05": "FRL02",
  "06": "FRL03",
  "13": "FRL04",
  "83": "FRL05",
  "84": "FRL06",
  "01": "FRK21",
  "07": "FRK22",
  "26": "FRK23",
  "38": "FRK24",
  "42": "FRK25",
  "69": "FRK26",
  "73": "FRK27",
  "74": "FRK28",
};

const NUTS_TO_DEPT: Record<string, string> = Object.fromEntries(
  Object.entries(DEPT_TO_NUTS).map(([dept, nuts]) => [nuts, dept]),
);

type MultilingualText = Record<string, string[] | string> | string | null | undefined;

interface TedNotice {
  "publication-number": string;
  "notice-title"?: MultilingualText;
  "buyer-name"?: MultilingualText;
  "publication-date"?: string;
  "deadline-receipt-tender-date-lot"?: string[];
  "classification-cpv"?: string[];
  "place-of-performance"?: string[];
  "description-proc"?: MultilingualText;
  links?: { html?: Record<string, string> };
}

/** Extrait un texte multilingue en privilégiant le français. */
function pickText(value: MultilingualText): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  for (const lang of ["fra", "FRA", "eng", "ENG"]) {
    const v = value[lang];
    if (typeof v === "string") return v;
    if (Array.isArray(v) && v.length > 0) return v.join(" — ");
  }
  const first = Object.values(value)[0];
  if (typeof first === "string") return first;
  if (Array.isArray(first)) return first.join(" — ");
  return undefined;
}

function parseTedDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value.slice(0, 10));
  return isNaN(d.getTime()) ? null : d;
}

function toNotice(n: TedNotice): NormalizedNotice {
  const depts = new Set<string>();
  for (const nuts of n["place-of-performance"] ?? []) {
    const dept = NUTS_TO_DEPT[nuts];
    if (dept) depts.add(dept);
  }
  const deadlines = (n["deadline-receipt-tender-date-lot"] ?? [])
    .map(parseTedDate)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  const pubNumber = n["publication-number"];
  return {
    sourceRef: pubNumber,
    title: pickText(n["notice-title"]) ?? "(titre non renseigné)",
    buyer: pickText(n["buyer-name"]),
    description: pickText(n["description-proc"])?.slice(0, 4000),
    cpvCodes: [...new Set(n["classification-cpv"] ?? [])],
    departements: [...depts],
    country: "FR",
    budgetEstime: null,
    publishedAt: parseTedDate(n["publication-date"]),
    deadlineAt: deadlines[0] ?? null,
    natureLibelle: "Avis de marché (TED)",
    sourceUrl:
      n.links?.html?.FRA ?? `https://ted.europa.eu/fr/notice/-/detail/${encodeURIComponent(pubNumber)}`,
  };
}

async function fetchPage(
  since: Date,
  page: number,
  nutsCodes: string[],
): Promise<{ total: number; notices: TedNotice[] }> {
  const sinceStr = since.toISOString().slice(0, 10).replace(/-/g, "");
  const body = {
    query: `place-of-performance IN (${nutsCodes.join(", ")}) AND classification-cpv IN (45000000) AND publication-date >= ${sinceStr} SORT BY publication-date DESC`,
    fields: [
      "publication-number",
      "notice-title",
      "buyer-name",
      "publication-date",
      "deadline-receipt-tender-date-lot",
      "classification-cpv",
      "place-of-performance",
      "description-proc",
      "links",
    ],
    limit: PAGE_SIZE,
    page,
  };
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    throw new Error(`TED API HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as { totalNoticeCount?: number; notices?: TedNotice[] };
  return { total: data.totalNoticeCount ?? 0, notices: data.notices ?? [] };
}

export const tedFranceConnector: SourceConnector = {
  slug: "ted-france",
  name: "TED Europe — marchés France Sud (API officielle)",
  kind: "api",
  implementation: "reelle",
  defaultCron: "0 7,19 * * *",
  async fetchSince(since: Date): Promise<NormalizedNotice[]> {
    const departments = await getWatchedFrDepartments();
    const nutsCodes = departments.map((d) => DEPT_TO_NUTS[d]).filter(Boolean);
    if (nutsCodes.length === 0) return [];

    const notices: NormalizedNotice[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const { total, notices: batch } = await fetchPage(since, page, nutsCodes);
      notices.push(...batch.map(toNotice));
      if (page * PAGE_SIZE >= total || batch.length === 0) break;
    }
    return notices;
  },
};
