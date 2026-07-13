/** Modèle commun d'annonce normalisée, produit par chaque connecteur. */
export interface NormalizedNotice {
  sourceRef: string;
  title: string;
  buyer?: string;
  description?: string;
  cpvCodes: string[];
  /** Départements FR ("13") ou cantons CH ("GE") selon `country`. */
  departements: string[];
  country?: "FR" | "CH";
  city?: string;
  budgetEstime?: number | null;
  publishedAt?: Date | null;
  deadlineAt?: Date | null;
  procedureType?: string;
  natureLibelle?: string;
  sourceUrl?: string;
}

/** Contrat d'un connecteur de source. Un connecteur par plateforme. */
export interface SourceConnector {
  slug: string;
  name: string;
  kind: "api" | "mock" | "rss";
  /** "reelle" = branché sur la vraie plateforme, "mockee" = données simulées réalistes */
  implementation: "reelle" | "mockee";
  defaultCron: string;
  /** Récupère les annonces publiées depuis `since`, déjà normalisées. */
  fetchSince(since: Date): Promise<NormalizedNotice[]>;
}
