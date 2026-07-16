import type { Tender } from "@prisma/client";
import type { CompanyProfile } from "../company-profile";

/**
 * Génération du dossier de réponse à un appel d'offres, en français.
 * Approche par gabarits : fiable, sans dépendance IA — les passages à
 * personnaliser sont balisés « [À compléter : …] ».
 */

export interface ChecklistItem {
  id: string;
  label: string;
  hint: string;
  required: boolean;
}

export interface ReponsePack {
  lettre: string;
  memoire: string;
  checklist: ChecklistItem[];
}

function fmtDate(d: Date | null): string {
  return d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—";
}

function ou(valeur: string, placeholder: string): string {
  return valeur.trim() || `[À compléter : ${placeholder}]`;
}

const CATEGORY_LABELS: Record<string, string> = {
  rehabilitation: "réhabilitation",
  renovation: "rénovation",
  gros_oeuvre: "gros œuvre",
  second_oeuvre: "second œuvre",
  tce: "tous corps d'état (TCE)",
  maintenance_entretien: "maintenance et entretien",
  hors_cible: "travaux",
};

export function buildLettreCandidature(t: Tender, p: CompanyProfile): string {
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const metier = CATEGORY_LABELS[t.workCategory] ?? "travaux";
  const specialites = p.specialites.trim() || metier;

  return `${ou(p.raisonSociale, "raison sociale")}
${p.formeJuridique ? `${p.formeJuridique}${p.capital ? ` au capital de ${p.capital}` : ""}` : "[À compléter : forme juridique]"}
${ou(p.adresse, "adresse")}
${[p.codePostal, p.ville].filter(Boolean).join(" ") || "[À compléter : code postal et ville]"}
SIRET : ${ou(p.siret, "SIRET")}
${p.contactTel ? `Tél. : ${p.contactTel}` : ""}${p.contactEmail ? ` — ${p.contactEmail}` : ""}

À l'attention de ${t.buyer ?? "[À compléter : nom de l'acheteur public]"}

Objet : Candidature au marché « ${t.title} »
Référence de l'avis : ${t.sourceRef}
Date limite de remise des offres : ${fmtDate(t.deadlineAt)}

${p.ville || "[Ville]"}, le ${today}

Madame, Monsieur,

Par la présente, la société ${ou(p.raisonSociale, "raison sociale")}${p.formeJuridique ? `, ${p.formeJuridique}` : ""}, spécialisée en ${specialites}, a l'honneur de présenter sa candidature au marché cité en objet.

Notre entreprise${p.effectif ? `, forte d'un effectif de ${p.effectif}` : ""}${p.chiffreAffaires ? ` et d'un chiffre d'affaires de ${p.chiffreAffaires}` : ""}, intervient régulièrement sur des opérations de ${metier} comparables à celle décrite dans votre consultation${t.departementsJson !== "[]" ? `, notamment sur le secteur ${(JSON.parse(t.departementsJson) as string[]).join(", ")}` : ""}.

${p.qualifications ? `Nous disposons des qualifications suivantes : ${p.qualifications}.` : "[À compléter : qualifications professionnelles (Qualibat, QualiPV, RGE…)]"}
${p.assuranceDecennale ? `Notre assurance décennale est souscrite auprès de ${p.assuranceDecennale}.` : "[À compléter : assurance décennale]"}
${p.assuranceRcPro ? `Notre responsabilité civile professionnelle est couverte par ${p.assuranceRcPro}.` : ""}

Vous trouverez dans le présent dossier l'ensemble des pièces administratives requises ainsi que notre mémoire technique détaillant les moyens humains et matériels affectés à l'opération, notre méthodologie d'exécution et nos références récentes.

Nous restons à votre entière disposition pour toute information complémentaire et vous prions d'agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

${ou(p.contactNom, "nom du signataire")}
${p.contactFonction || "[Fonction]"}
${ou(p.raisonSociale, "raison sociale")}`;
}

export function buildMemoireTechnique(t: Tender, p: CompanyProfile): string {
  const metier = CATEGORY_LABELS[t.workCategory] ?? "travaux";
  const depts = (JSON.parse(t.departementsJson) as string[]).join(", ");

  return `MÉMOIRE TECHNIQUE
${t.title}
${t.buyer ?? ""}${depts ? ` — Secteur ${depts}` : ""}
Référence : ${t.sourceRef} · Date limite : ${fmtDate(t.deadlineAt)}

════════════════════════════════════════════

1. PRÉSENTATION DE L'ENTREPRISE

Raison sociale : ${ou(p.raisonSociale, "raison sociale")}
Forme juridique : ${ou(p.formeJuridique, "forme juridique")}
SIRET : ${ou(p.siret, "SIRET")}
Siège : ${[p.adresse, p.codePostal, p.ville].filter(Boolean).join(", ") || "[À compléter]"}
Effectif : ${ou(p.effectif, "effectif")}
Chiffre d'affaires : ${ou(p.chiffreAffaires, "CA des 3 derniers exercices")}
Qualifications : ${ou(p.qualifications, "Qualibat / RGE / autres qualifications")}
Assurances : décennale ${p.assuranceDecennale || "[À compléter]"}${p.assuranceRcPro ? ` · RC Pro ${p.assuranceRcPro}` : ""}

[À compléter : historique de l'entreprise, implantation locale, valeurs.]

2. COMPRÉHENSION DU BESOIN ET CONTEXTE DE L'OPÉRATION

L'opération porte sur : ${t.title.toLowerCase()}.
${t.description ? `Éléments clés de la consultation :\n${t.description.slice(0, 800)}` : "[À compléter : reformuler le besoin de l'acheteur pour démontrer la bonne compréhension des enjeux — contraintes de site, occupation des locaux, phasage, exigences environnementales.]"}

3. MOYENS HUMAINS AFFECTÉS À L'OPÉRATION

[À compléter : organigramme du chantier]
- Conducteur de travaux : [nom, expérience]
- Chef de chantier : [nom, expérience]
- Équipes d'exécution : [nombre de compagnons par corps d'état]
- Encadrement QSE : [le cas échéant]

4. MOYENS MATÉRIELS

[À compléter : matériel propre à l'entreprise mobilisé pour cette opération — échafaudages, engins, outillage spécifique au ${metier}.]

5. MÉTHODOLOGIE D'EXÉCUTION

[À compléter : mode opératoire par phase]
5.1 Installation de chantier et préparation
5.2 Phasage des travaux${t.workCategory === "rehabilitation" ? " (site occupé : décrire les dispositions de maintien en service et de protection des occupants)" : ""}
5.3 Points techniques sensibles et solutions proposées
5.4 Gestion des interfaces avec les autres corps d'état

6. PLANNING PRÉVISIONNEL

[À compléter : planning détaillé par phase, en cohérence avec le délai fixé dans le règlement de consultation. Date limite de remise : ${fmtDate(t.deadlineAt)}.]

7. DÉMARCHE QUALITÉ, SÉCURITÉ ET ENVIRONNEMENT

- Qualité : [contrôles internes, autocontrôles, traitement des non-conformités]
- Sécurité : [PPSPS, accueil sécurité, EPI, coordination SPS]
- Environnement : [gestion et traçabilité des déchets (BSD), réduction des nuisances, chantier propre${t.workCategory === "rehabilitation" || t.workCategory === "renovation" ? ", performance énergétique visée" : ""}]

8. RÉFÉRENCES RÉCENTES SIMILAIRES

${p.references.trim() || `[À compléter : 3 à 5 références de moins de 5 ans, comparables en nature (${metier}) et en montant — indiquer maître d'ouvrage, montant, année, contact.]`}

9. ENGAGEMENTS SPÉCIFIQUES

[À compléter : délais garantis, pénalités acceptées, garanties étendues, insertion sociale (heures d'insertion), approvisionnement local…]`;
}

export function buildChecklist(t: Tender): ChecklistItem[] {
  return [
    { id: "rc", label: "Règlement de consultation (RC) lu et analysé", hint: "Télécharger le DCE complet depuis l'avis d'origine — critères de jugement, pondération, délais.", required: true },
    { id: "dc1", label: "DC1 — Lettre de candidature", hint: "Formulaire officiel signé (ou DUME).", required: true },
    { id: "dc2", label: "DC2 — Déclaration du candidat", hint: "Capacités économiques et financières.", required: true },
    { id: "attestation-fiscale", label: "Attestation fiscale", hint: "À jour, moins de 6 mois — impots.gouv.fr.", required: true },
    { id: "attestation-sociale", label: "Attestation de vigilance URSSAF", hint: "À jour, moins de 6 mois.", required: true },
    { id: "kbis", label: "Extrait Kbis", hint: "Moins de 3 mois.", required: true },
    { id: "decennale", label: "Attestation d'assurance décennale", hint: "En cours de validité, couvrant l'activité concernée.", required: true },
    { id: "rcpro", label: "Attestation RC professionnelle", hint: "En cours de validité.", required: true },
    { id: "qualifications", label: "Certificats de qualification", hint: "Qualibat, RGE, ou références équivalentes.", required: false },
    { id: "references", label: "Références travaux similaires", hint: "3 à 5 opérations de moins de 5 ans avec attestations de bonne exécution.", required: true },
    { id: "memoire", label: "Mémoire technique personnalisé", hint: "Adapté à CETTE opération — jamais un mémoire générique (critère souvent pondéré à 40-60 %).", required: true },
    { id: "acte-engagement", label: "Acte d'engagement (AE/ATTRI1)", hint: "Complété et signé, avec le prix.", required: true },
    { id: "dpgf", label: "DPGF / BPU complété", hint: "Décomposition du prix global et forfaitaire, sans modification du cadre.", required: true },
    { id: "planning", label: "Planning prévisionnel d'exécution", hint: "Cohérent avec le délai du marché.", required: false },
    { id: "rib", label: "RIB", hint: "Pour les paiements.", required: true },
    { id: "dc4", label: "DC4 — Déclaration de sous-traitance", hint: "Uniquement si sous-traitance déclarée dès l'offre.", required: false },
    { id: "depot", label: "Dépôt dématérialisé testé AVANT la date limite", hint: `Profil acheteur : compte créé, signature électronique valide. Limite : ${fmtDate(t.deadlineAt)} — déposer au moins 24 h avant.`, required: true },
  ];
}

export function buildReponsePack(t: Tender, p: CompanyProfile): ReponsePack {
  return {
    lettre: buildLettreCandidature(t, p),
    memoire: buildMemoireTechnique(t, p),
    checklist: buildChecklist(t),
  };
}
