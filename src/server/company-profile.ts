import { z } from "zod";
import { prisma } from "./db";

/**
 * Profil de l'entreprise candidate — utilisé pour préremplir les dossiers
 * de réponse aux appels d'offres (lettre de candidature, mémoire technique).
 */
const companyProfileSchema = z.object({
  raisonSociale: z.string().default(""),
  formeJuridique: z.string().default(""),
  capital: z.string().default(""),
  siret: z.string().default(""),
  adresse: z.string().default(""),
  codePostal: z.string().default(""),
  ville: z.string().default(""),
  contactNom: z.string().default(""),
  contactFonction: z.string().default(""),
  contactEmail: z.string().default(""),
  contactTel: z.string().default(""),
  effectif: z.string().default(""),
  chiffreAffaires: z.string().default(""),
  qualifications: z.string().default(""),
  assuranceDecennale: z.string().default(""),
  assuranceRcPro: z.string().default(""),
  references: z.string().default(""),
  specialites: z.string().default(""),
});

export type CompanyProfile = z.infer<typeof companyProfileSchema>;

const COMPANY_PROFILE_KEY = "companyProfile";

export async function getCompanyProfile(): Promise<CompanyProfile> {
  const row = await prisma.setting.findUnique({ where: { key: COMPANY_PROFILE_KEY } });
  if (!row) return companyProfileSchema.parse({});
  try {
    return companyProfileSchema.parse(JSON.parse(row.value));
  } catch {
    return companyProfileSchema.parse({});
  }
}

export async function saveCompanyProfile(partial: Partial<CompanyProfile>): Promise<CompanyProfile> {
  const current = await getCompanyProfile();
  const next = companyProfileSchema.parse({ ...current, ...partial });
  await prisma.setting.upsert({
    where: { key: COMPANY_PROFILE_KEY },
    update: { value: JSON.stringify(next) },
    create: { key: COMPANY_PROFILE_KEY, value: JSON.stringify(next) },
  });
  return next;
}

/** Le profil est-il suffisamment rempli pour générer un dossier crédible ? */
export function isProfileUsable(p: CompanyProfile): boolean {
  return Boolean(p.raisonSociale && p.siret && p.ville);
}
