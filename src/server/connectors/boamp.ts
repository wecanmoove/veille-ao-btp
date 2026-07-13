import type { NormalizedNotice, SourceConnector } from "./types";
import { getWatchedFrDepartments } from "../zones";

/**
 * Connecteur BOAMP — implémentation réelle.
 * API officielle Opendatasoft du BOAMP (DILA) :
 * https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records
 */
const API_URL =
  "https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records";

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

interface BoampRecord {
  idweb: string;
  objet: string | null;
  nomacheteur: string | null;
  code_departement: string[] | null;
  dateparution: string | null;
  datelimitereponse: string | null;
  type_procedure: string | null;
  nature_libelle: string | null;
  type_marche: string[] | null;
  descripteur_libelle: string[] | null;
  url_avis: string | null;
  donnees: string | null;
}

/**
 * Extraction défensive des codes CPV depuis le JSON `donnees` (schémas hétérogènes :
 * eForms `cbc:ItemClassificationCode`, anciens schémas `CPV`). On parcourt l'arbre
 * et on collecte les valeurs à 8 chiffres sous des clés de classification.
 */
function extractCpvCodes(donneesRaw: string | null): string[] {
  if (!donneesRaw) return [];
  const codes = new Set<string>();
  try {
    const walk = (node: unknown, keyHint: boolean) => {
      if (node == null) return;
      if (typeof node === "string" || typeof node === "number") {
        const s = String(node);
        if (keyHint && /^\d{8}$/.test(s)) codes.add(s);
        return;
      }
      if (Array.isArray(node)) {
        for (const item of node) walk(item, keyHint);
        return;
      }
      if (typeof node === "object") {
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
          const isCpvKey = /itemclassificationcode|cpv/i.test(k) || (keyHint && /#text|code/i.test(k));
          walk(v, isCpvKey);
        }
      }
    };
    walk(JSON.parse(donneesRaw), false);
  } catch {
    // donnees non parsable : on continue sans CPV
  }
  return [...codes];
}

/** Extraction best-effort d'une description depuis le JSON `donnees`. */
function extractDescription(donneesRaw: string | null): string | undefined {
  if (!donneesRaw) return undefined;
  const texts: string[] = [];
  try {
    const walk = (node: unknown, depth: number) => {
      if (node == null || depth > 12 || texts.length >= 5) return;
      if (Array.isArray(node)) {
        for (const item of node) walk(item, depth + 1);
        return;
      }
      if (typeof node === "object") {
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
          if (/description|resume_objet|objet_complet/i.test(k)) {
            const t = typeof v === "string" ? v : typeof v === "object" && v !== null ? (v as Record<string, unknown>)["#text"] : null;
            if (typeof t === "string" && t.length > 20) texts.push(t);
          }
          walk(v, depth + 1);
        }
      }
    };
    walk(JSON.parse(donneesRaw), 0);
  } catch {
    return undefined;
  }
  if (texts.length === 0) return undefined;
  return [...new Set(texts)].join("\n").slice(0, 4000);
}

async function fetchPage(
  since: Date,
  offset: number,
  departments: string[],
): Promise<{ total: number; results: BoampRecord[] }> {
  const sinceStr = since.toISOString().slice(0, 10);
  // Filtre géographique côté serveur : uniquement les départements des zones de veille FR actives.
  const deptClause =
    departments.length > 0
      ? ` AND code_departement IN (${departments.map((d) => `"${d}"`).join(",")})`
      : "";
  const params = new URLSearchParams({
    select:
      "idweb,objet,nomacheteur,code_departement,dateparution,datelimitereponse,type_procedure,nature_libelle,type_marche,descripteur_libelle,url_avis,donnees",
    where: `dateparution >= date'${sinceStr}'${deptClause}`,
    order_by: "dateparution desc",
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });
  const res = await fetch(`${API_URL}?${params}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    throw new Error(`BOAMP API HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = (await res.json()) as { total_count: number; results: BoampRecord[] };
  return { total: data.total_count, results: data.results };
}

function toNotice(r: BoampRecord): NormalizedNotice {
  const descripteurs = (r.descripteur_libelle ?? []).join(", ");
  const donneesDesc = extractDescription(r.donnees);
  return {
    sourceRef: r.idweb,
    title: r.objet ?? "(objet non renseigné)",
    buyer: r.nomacheteur ?? undefined,
    description: [donneesDesc, descripteurs ? `Descripteurs BOAMP : ${descripteurs}` : ""]
      .filter(Boolean)
      .join("\n") || undefined,
    cpvCodes: extractCpvCodes(r.donnees),
    departements: r.code_departement ?? [],
    country: "FR",
    budgetEstime: null,
    publishedAt: r.dateparution ? new Date(r.dateparution) : null,
    deadlineAt: r.datelimitereponse ? new Date(r.datelimitereponse) : null,
    procedureType: r.type_procedure ?? undefined,
    natureLibelle: r.nature_libelle ?? undefined,
    sourceUrl:
      r.url_avis ?? `https://www.boamp.fr/pages/avis/?q=idweb:%22${encodeURIComponent(r.idweb)}%22`,
  };
}

export const boampConnector: SourceConnector = {
  slug: "boamp",
  name: "BOAMP (API officielle DILA)",
  kind: "api",
  implementation: "reelle",
  defaultCron: "0 */4 * * *",
  async fetchSince(since: Date): Promise<NormalizedNotice[]> {
    const departments = await getWatchedFrDepartments();
    const notices: NormalizedNotice[] = [];
    let offset = 0;
    for (let page = 0; page < MAX_PAGES; page++) {
      const { total, results } = await fetchPage(since, offset, departments);
      for (const r of results) {
        // On ne garde que les avis d'appel à concurrence de type travaux OU sans type
        // (le filtrage métier fin est fait par le pipeline en aval).
        const types = r.type_marche ?? [];
        if (types.length > 0 && !types.includes("TRAVAUX")) continue;
        notices.push(toNotice(r));
      }
      offset += PAGE_SIZE;
      if (offset >= total || results.length === 0) break;
    }
    return notices;
  },
};
