/**
 * Types de pièces administratives de l'entreprise (Kbis, attestations...).
 * Les ids restent synchronisés avec ceux de la checklist de réponse aux AO
 * (voir buildChecklist dans reponse/generate.ts). Fichier sans dépendance
 * serveur (fs/prisma) car importé aussi côté client (page /entreprise).
 */
export const DOCUMENT_TYPES = [
  { id: "kbis", label: "Extrait Kbis" },
  { id: "attestation-fiscale", label: "Attestation fiscale" },
  { id: "attestation-sociale", label: "Attestation de vigilance URSSAF" },
  { id: "decennale", label: "Attestation d'assurance décennale" },
  { id: "rcpro", label: "Attestation RC professionnelle" },
  { id: "qualifications", label: "Certificats de qualification (Qualibat, RGE...)" },
  { id: "rib", label: "RIB" },
] as const;

export type DocumentTypeId = (typeof DOCUMENT_TYPES)[number]["id"];

export const DOCUMENT_TYPE_IDS = DOCUMENT_TYPES.map((d) => d.id);
