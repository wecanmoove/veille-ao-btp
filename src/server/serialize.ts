import type { Tender } from "@prisma/client";

/** Sérialise un Tender pour l'API : parse les colonnes JSON en tableaux exploitables côté client. */
export function serializeTender(t: Tender) {
  return {
    ...t,
    cpvCodes: JSON.parse(t.cpvCodesJson) as string[],
    departements: JSON.parse(t.departementsJson) as string[],
    keywords: JSON.parse(t.keywordsJson) as string[],
    zones: JSON.parse(t.zonesJson) as string[],
    country: t.country || "FR",
  };
}
