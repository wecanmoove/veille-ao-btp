import type { NormalizedNotice, SourceConnector } from "./types";

/**
 * Connecteur TED (Tenders Electronic Daily) — Suisse, implémentation réelle.
 * API officielle de l'UE, gratuite et sans clé : https://api.ted.europa.eu/v3/notices/search
 * Couvre les marchés suisses au-dessus des seuils AMP/OMC (les plus gros marchés).
 * Pour la couverture complète sous les seuils, brancher simap.ch en phase 2
 * (nécessite un compte partenaire).
 */
const API_URL = "https://api.ted.europa.eu/v3/notices/search";
const PAGE_SIZE = 50;
const MAX_PAGES = 6;

/** NUTS 3 suisses → canton. Les cantons romands sont l'objet de la veille. */
const NUTS_TO_CANTON: Record<string, string> = {
  CH011: "VD",
  CH012: "VS",
  CH013: "GE",
  CH021: "BE",
  CH022: "FR",
  CH023: "SO",
  CH024: "NE",
  CH025: "JU",
  CH031: "BS",
  CH032: "BL",
  CH033: "AG",
  CH040: "ZH",
  CH051: "GL",
  CH052: "SH",
  CH053: "AR",
  CH054: "AI",
  CH055: "SG",
  CH056: "GR",
  CH057: "TG",
  CH061: "LU",
  CH062: "UR",
  CH063: "SZ",
  CH064: "OW",
  CH065: "NW",
  CH066: "ZG",
  CH070: "TI",
};

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
  for (const lang of ["fra", "FRA", "deu", "DEU", "ita", "eng"]) {
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
  const datePart = value.slice(0, 10); // "2026-08-28+02:00" -> "2026-08-28"
  const d = new Date(datePart);
  return isNaN(d.getTime()) ? null : d;
}

function toNotice(n: TedNotice): NormalizedNotice {
  const cantons = new Set<string>();
  for (const nuts of n["place-of-performance"] ?? []) {
    const canton = NUTS_TO_CANTON[nuts] ?? (nuts.startsWith("CH") && nuts.length === 5 ? nuts : null);
    if (canton) cantons.add(canton);
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
    departements: [...cantons],
    country: "CH",
    budgetEstime: null,
    publishedAt: parseTedDate(n["publication-date"]),
    deadlineAt: deadlines[0] ?? null,
    natureLibelle: "Avis de marché (TED)",
    sourceUrl:
      n.links?.html?.FRA ?? `https://ted.europa.eu/fr/notice/-/detail/${encodeURIComponent(pubNumber)}`,
  };
}

async function fetchPage(since: Date, page: number): Promise<{ total: number; notices: TedNotice[] }> {
  const sinceStr = since.toISOString().slice(0, 10).replace(/-/g, "");
  const body = {
    query: `place-of-performance IN (CHE) AND classification-cpv IN (45000000) AND publication-date >= ${sinceStr} SORT BY publication-date DESC`,
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

export const tedSuisseConnector: SourceConnector = {
  slug: "ted-suisse",
  name: "TED Europe — marchés suisses (API officielle)",
  kind: "api",
  implementation: "reelle",
  defaultCron: "0 6,18 * * *",
  async fetchSince(since: Date): Promise<NormalizedNotice[]> {
    const notices: NormalizedNotice[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const { total, notices: batch } = await fetchPage(since, page);
      notices.push(...batch.map(toNotice));
      if (page * PAGE_SIZE >= total || batch.length === 0) break;
    }
    return notices;
  },
};
