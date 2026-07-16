/**
 * Seed Renov Midi : données réalistes pour Région Sud, Alpes et Suisse romande.
 */
import { PrismaClient } from "@prisma/client";
import { connectors } from "../src/server/connectors";

const prisma = new PrismaClient();

async function main() {
  // Initialize sources
  for (const connector of connectors) {
    await prisma.source.upsert({
      where: { slug: connector.slug },
      update: {},
      create: {
        slug: connector.slug,
        name: connector.name,
        kind: connector.kind,
        implementation: connector.implementation,
        status: connector.implementation === "mockee" ? "mocke" : "actif",
        cronExpression: connector.defaultCron,
      },
    });
  }

  const boamp = await prisma.source.findUniqueOrThrow({ where: { slug: "boamp" } });
  const ted = await prisma.source.findUniqueOrThrow({ where: { slug: "ted-suisse" } });

  // Renov Midi seed data
  const seedTenders = [
    // Région Sud — très pertinent
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-001",
      dedupKey: "seed-dedup-001",
      title: "Réhabilitation énergétique 40 logements — Bureau Marseille",
      buyer: "Office Public de l'Habitat (OPAH) — Marseille",
      description: "Isolation toitures, changement menuiseries double vitrage, remplacement chauffage collectif PAC + radiateurs. Montant estimé 2,4 M€, durée 12 mois.",
      cpvCodesJson: JSON.stringify(["45210000", "45300000", "45321000"]),
      departementsJson: JSON.stringify(["13"]),
      country: "FR",
      zonesJson: JSON.stringify(["region-sud"]),
      publishedAt: new Date(Date.now() - 2 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 45 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: null,
      score: 92,
      relevanceLevel: "tres_pertinent",
      workCategory: "rehabilitation",
      keywordsJson: JSON.stringify(["réhabilitation énergétique", "isolation", "chauffage", "menuiseries"]),
      justification: "Vocabulaire réhabilitation énergétique + CPV division 45 + département 13.",
      scoredBy: "rules",
      status: "new",
    },
    // Région Sud — pertinent
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-002",
      dedupKey: "seed-dedup-002",
      title: "Ravalement façades et étanchéité — École Aix-en-Provence",
      buyer: "Commune d'Aix-en-Provence",
      description: "Nettoyage façade, traitement fissures, peinture minérale, refonte étanchéité terrasse. Montant 850 k€, 6 mois.",
      cpvCodesJson: JSON.stringify(["45400000", "45421000"]),
      departementsJson: JSON.stringify(["13"]),
      country: "FR",
      zonesJson: JSON.stringify(["region-sud"]),
      publishedAt: new Date(Date.now() - 5 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 30 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: null,
      score: 78,
      relevanceLevel: "pertinent",
      workCategory: "gros_oeuvre",
      keywordsJson: JSON.stringify(["ravalement", "façade", "étanchéité"]),
      justification: "Mots-clés secondœuvre + CPV travaux, score élevé.",
      scoredBy: "rules",
      status: "new",
    },
    // Département 83 — à vérifier
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-003",
      dedupKey: "seed-dedup-003",
      title: "Entretien route RN8 + petits aménagements — Var",
      buyer: "Conseil Département Var",
      description: "Entretien courant + menues prestations asphaltage tronçon 12 km. Montant 180 k€.",
      cpvCodesJson: JSON.stringify(["34700000"]),
      departementsJson: JSON.stringify(["83"]),
      country: "FR",
      zonesJson: JSON.stringify(["region-sud"]),
      publishedAt: new Date(Date.now() - 1 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 20 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: null,
      score: 35,
      relevanceLevel: "a_verifier",
      workCategory: "maintenance_entretien",
      keywordsJson: JSON.stringify(["entretien", "asphaltage", "voirie"]),
      justification: "Signal BTP ambigu : entretien vs travaux, à décider manuellement.",
      scoredBy: "rules",
      status: "new",
    },
    // Département 06 — très pertinent
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-004",
      dedupKey: "seed-dedup-004",
      title: "Restructuration parking souterrain — Nice",
      buyer: "Ville de Nice",
      description: "Démolition partielle, reprises béton armé, imperméabilisation, circulation. Montant 1,2 M€.",
      cpvCodesJson: JSON.stringify(["45210000", "45200000"]),
      departementsJson: JSON.stringify(["06"]),
      country: "FR",
      zonesJson: JSON.stringify(["region-sud"]),
      publishedAt: new Date(Date.now() - 3 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 35 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: null,
      score: 85,
      relevanceLevel: "tres_pertinent",
      workCategory: "gros_oeuvre",
      keywordsJson: JSON.stringify(["démolition", "gros œuvre", "béton"]),
      justification: "Gros œuvre clair, CPV 45210000, score très élevé.",
      scoredBy: "rules",
      status: "new",
    },
    // Alpes — Gap
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-005",
      dedupKey: "seed-dedup-005",
      title: "Tracé route périphérique Gap — Lots terrassement + réseaux",
      buyer: "Département Hautes-Alpes",
      description: "Terrassement, assainissement, voirie, réseaux eau/électricité/télécom, multi-lots, 5,8 M€.",
      cpvCodesJson: JSON.stringify(["34000000", "34700000", "45000000"]),
      departementsJson: JSON.stringify(["05"]),
      country: "FR",
      zonesJson: JSON.stringify(["alpes"]),
      publishedAt: new Date(Date.now() - 4 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 40 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: null,
      score: 88,
      relevanceLevel: "tres_pertinent",
      workCategory: "gros_oeuvre",
      keywordsJson: JSON.stringify(["terrassement", "voirie", "réseaux", "génie civil"]),
      justification: "Travaux génie civil purs, budget majeur, CPV division 45.",
      scoredBy: "rules",
      status: "new",
    },
    // Alpes — Chambéry
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-006",
      dedupKey: "seed-dedup-006",
      title: "Rénovation collège — Chambéry",
      buyer: "Conseil Régional AURA",
      description: "Rénovation : toiture, électricité, plomberie, chauffage, sanitaires, peinture. 3,2 M€.",
      cpvCodesJson: JSON.stringify(["45300000", "45210000"]),
      departementsJson: JSON.stringify(["73"]),
      country: "FR",
      zonesJson: JSON.stringify(["alpes"]),
      publishedAt: new Date(Date.now() - 6 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 50 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: null,
      score: 89,
      relevanceLevel: "tres_pertinent",
      workCategory: "renovation",
      keywordsJson: JSON.stringify(["rénovation", "toiture", "chauffage", "plomberie"]),
      justification: "Rénovation complète bâtiment public, CPV travaux.",
      scoredBy: "rules",
      status: "new",
    },
    // Suisse Vaud
    {
      sourceId: ted.id,
      sourceRef: "SEED-TED-001",
      dedupKey: "seed-dedup-ted-001",
      title: "Améliorations route cantonale — Vaud",
      buyer: "Canton de Vaud — Service des routes",
      description: "Travaux d'amélioration 8 km : sécurité, peinture routes, petit génie civil. CHF 1.8 M.",
      cpvCodesJson: JSON.stringify(["34700000"]),
      departementsJson: JSON.stringify(["VD"]),
      country: "CH",
      zonesJson: JSON.stringify(["suisse-romande"]),
      publishedAt: new Date(Date.now() - 1 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 35 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché (TED)",
      sourceUrl: null,
      score: 72,
      relevanceLevel: "pertinent",
      workCategory: "maintenance_entretien",
      keywordsJson: JSON.stringify(["route", "voirie", "amélioration"]),
      justification: "Travaux route cantonale, TED Europe, Suisse romande.",
      scoredBy: "rules",
      status: "new",
    },
    // Suisse Genève
    {
      sourceId: ted.id,
      sourceRef: "SEED-TED-002",
      dedupKey: "seed-dedup-ted-002",
      title: "Réhabilitation logements sociaux — Genève",
      buyer: "Ville de Genève — Service habitat",
      description: "Rénovation : isolation, fenêtres, chauffage, sanitaires, peinture. CHF 2.4 M, 50 logements.",
      cpvCodesJson: JSON.stringify(["45210000", "45300000"]),
      departementsJson: JSON.stringify(["GE"]),
      country: "CH",
      zonesJson: JSON.stringify(["suisse-romande"]),
      publishedAt: new Date(Date.now() - 3 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 45 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché (TED)",
      sourceUrl: null,
      score: 91,
      relevanceLevel: "tres_pertinent",
      workCategory: "rehabilitation",
      keywordsJson: JSON.stringify(["réhabilitation", "logements", "énergie"]),
      justification: "Réhabilitation énergétique logements, Genève, TED.",
      scoredBy: "rules",
      status: "new",
    },
    // Out of scope (hors sujet)
    {
      sourceId: boamp.id,
      sourceRef: "SEED-BOAMP-007",
      dedupKey: "seed-dedup-007",
      title: "Fourniture consommables bureautiques — Conseil départemental",
      buyer: "Conseil départemental Bouches-du-Rhône",
      description: "Papeterie et fournitures bureau annuelles.",
      cpvCodesJson: JSON.stringify(["30192000"]),
      departementsJson: JSON.stringify(["13"]),
      country: "FR",
      zonesJson: JSON.stringify([]),
      publishedAt: new Date(Date.now() - 1 * 24 * 3600_000),
      deadlineAt: new Date(Date.now() + 20 * 24 * 3600_000),
      procedureType: "OUVERT",
      natureLibelle: "Avis de marché",
      sourceUrl: null,
      score: 3,
      relevanceLevel: "non_pertinent",
      workCategory: "hors_cible",
      keywordsJson: JSON.stringify([]),
      justification: "Aucun signal BTP.",
      exclusionReason: "Fournitures hors BTP",
      scoredBy: "rules",
      status: "new",
    },
  ];

  // Upsert tenders
  for (const t of seedTenders) {
    await prisma.tender.upsert({
      where: { sourceId_sourceRef: { sourceId: t.sourceId, sourceRef: t.sourceRef } },
      update: t,
      create: t,
    });
  }

  // ------------------------------------------------------------------
  // Générateur : 100 annonces réalistes réparties sur le territoire cible
  // (Aix-Marseille pondéré x3, budgets 10 k€ → 25 M€, 14 catégories métier).
  // ------------------------------------------------------------------
  interface City {
    name: string;
    dept: string;
    country: "FR" | "CH";
    zone: string;
    buyers: string[];
    weight: number;
  }

  const CITIES: City[] = [
    { name: "Marseille", dept: "13", country: "FR", zone: "region-sud", weight: 3, buyers: ["Ville de Marseille", "Métropole Aix-Marseille-Provence", "13 Habitat", "AP-HM", "Habitat Marseille Provence"] },
    { name: "Aix-en-Provence", dept: "13", country: "FR", zone: "region-sud", weight: 3, buyers: ["Ville d'Aix-en-Provence", "Pays d'Aix Habitat", "Université Aix-Marseille"] },
    { name: "Martigues", dept: "13", country: "FR", zone: "region-sud", weight: 1, buyers: ["Ville de Martigues", "SEMIVIM"] },
    { name: "Vitrolles", dept: "13", country: "FR", zone: "region-sud", weight: 1, buyers: ["Ville de Vitrolles"] },
    { name: "Salon-de-Provence", dept: "13", country: "FR", zone: "region-sud", weight: 1, buyers: ["Ville de Salon-de-Provence"] },
    { name: "Toulon", dept: "83", country: "FR", zone: "region-sud", weight: 2, buyers: ["Ville de Toulon", "Métropole Toulon Provence Méditerranée", "Var Habitat"] },
    { name: "Nice", dept: "06", country: "FR", zone: "region-sud", weight: 2, buyers: ["Ville de Nice", "Métropole Nice Côte d'Azur", "Côte d'Azur Habitat"] },
    { name: "Gap", dept: "05", country: "FR", zone: "region-sud", weight: 1, buyers: ["Ville de Gap", "Département des Hautes-Alpes"] },
    { name: "Annecy", dept: "74", country: "FR", zone: "alpes", weight: 2, buyers: ["Ville d'Annecy", "Grand Annecy", "Haute-Savoie Habitat"] },
    { name: "Chambéry", dept: "73", country: "FR", zone: "alpes", weight: 1, buyers: ["Ville de Chambéry", "Département de la Savoie"] },
    { name: "Genève", dept: "GE", country: "CH", zone: "suisse-romande", weight: 2, buyers: ["Ville de Genève", "Canton de Genève — Office des bâtiments", "Fondation HBM"] },
    { name: "Lausanne", dept: "VD", country: "CH", zone: "suisse-romande", weight: 2, buyers: ["Ville de Lausanne", "Canton de Vaud — DGIP", "CHUV"] },
    { name: "Sion", dept: "VS", country: "CH", zone: "suisse-romande", weight: 1, buyers: ["Ville de Sion", "Canton du Valais"] },
    { name: "Fribourg", dept: "FR", country: "CH", zone: "suisse-romande", weight: 1, buyers: ["Ville de Fribourg", "Canton de Fribourg"] },
    { name: "Neuchâtel", dept: "NE", country: "CH", zone: "suisse-romande", weight: 1, buyers: ["Ville de Neuchâtel", "Canton de Neuchâtel"] },
  ];

  interface CategoryTemplate {
    label: string;
    workCategory: string;
    cpv: string[];
    keywords: string[];
    titles: string[];
    baseScore: number;
  }

  const CATEGORIES: CategoryTemplate[] = [
    { label: "Rénovation énergétique", workCategory: "rehabilitation", cpv: ["45321000", "45300000"], keywords: ["réhabilitation énergétique", "isolation", "chauffage"], baseScore: 88, titles: ["Rénovation énergétique de {n} logements sociaux", "Réhabilitation thermique du groupe scolaire", "Isolation et remplacement des menuiseries — résidence"] },
    { label: "Gros œuvre", workCategory: "gros_oeuvre", cpv: ["45210000", "45223220"], keywords: ["gros œuvre", "maçonnerie", "béton"], baseScore: 82, titles: ["Construction d'un bâtiment public — lot gros œuvre", "Extension du gymnase municipal — gros œuvre", "Reprises structurelles en sous-œuvre"] },
    { label: "Second œuvre", workCategory: "second_oeuvre", cpv: ["45400000", "45421000"], keywords: ["second œuvre", "cloison", "peinture", "menuiserie"], baseScore: 76, titles: ["Réaménagement intérieur des bureaux — lots second œuvre", "Cloisons, faux-plafonds et peinture — bâtiment administratif", "Menuiseries intérieures et agencement"] },
    { label: "Démolition", workCategory: "gros_oeuvre", cpv: ["45110000"], keywords: ["démolition", "désamiantage"], baseScore: 78, titles: ["Démolition et désamiantage de l'ancienne friche", "Déconstruction sélective du bâtiment {n}"] },
    { label: "VRD / Voirie", workCategory: "gros_oeuvre", cpv: ["45233140", "45112500"], keywords: ["vrd", "voirie", "terrassement"], baseScore: 72, titles: ["Requalification de la voirie du centre-ville", "Travaux VRD — aménagement de la ZAC", "Réfection des chaussées et trottoirs — programme {n}"] },
    { label: "Réseaux", workCategory: "gros_oeuvre", cpv: ["45231300"], keywords: ["réseaux", "assainissement"], baseScore: 70, titles: ["Renouvellement des réseaux d'eau potable", "Mise en séparatif du réseau d'assainissement"] },
    { label: "Génie civil", workCategory: "gros_oeuvre", cpv: ["45220000"], keywords: ["génie civil", "ouvrage d'art"], baseScore: 74, titles: ["Réparation de l'ouvrage d'art OA{n}", "Confortement du mur de soutènement"] },
    { label: "Électricité", workCategory: "second_oeuvre", cpv: ["45310000"], keywords: ["électricité", "courants faibles"], baseScore: 71, titles: ["Mise en conformité électrique des écoles", "Rénovation de l'éclairage public — tranche {n}"] },
    { label: "Plomberie / CVC", workCategory: "second_oeuvre", cpv: ["45330000", "45331000"], keywords: ["plomberie", "chauffage", "cvc", "ventilation"], baseScore: 73, titles: ["Remplacement des chaufferies — parc immobilier", "Rénovation des sanitaires et réseaux de plomberie", "Installation de ventilation double flux — collège"] },
    { label: "TCE", workCategory: "tce", cpv: ["45000000"], keywords: ["tous corps d'état", "tce", "restructuration"], baseScore: 84, titles: ["Restructuration complète TCE de l'hôtel de ville", "Réhabilitation lourde en site occupé — marché global TCE"] },
    { label: "Maîtrise d'œuvre", workCategory: "renovation", cpv: ["71000000", "45000000"], keywords: ["maîtrise d'œuvre", "réhabilitation"], baseScore: 55, titles: ["Maîtrise d'œuvre pour la réhabilitation du quartier {n}", "MOE — rénovation du patrimoine bâti communal"] },
    { label: "Maintenance", workCategory: "maintenance_entretien", cpv: ["50700000"], keywords: ["maintenance", "entretien"], baseScore: 38, titles: ["Maintenance multitechnique des bâtiments communaux", "Entretien courant et petites réparations — accord-cadre"] },
    { label: "Façades", workCategory: "second_oeuvre", cpv: ["45443000"], keywords: ["ravalement", "façade", "étanchéité"], baseScore: 77, titles: ["Ravalement des façades et étanchéité des toitures", "Réfection des façades classées — secteur sauvegardé"] },
    { label: "BIM / Études", workCategory: "renovation", cpv: ["71250000"], keywords: ["bim", "diagnostic", "réhabilitation"], baseScore: 45, titles: ["Numérisation BIM du patrimoine avant réhabilitation", "Diagnostics techniques et maquette BIM — parc de {n} bâtiments"] },
  ];

  // Tirage pondéré déterministe (mulberry32) pour un seed reproductible.
  let rngState = 42;
  const rand = () => {
    rngState |= 0;
    rngState = (rngState + 0x6d2b79f5) | 0;
    let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

  const weightedCities = CITIES.flatMap((c) => Array(c.weight).fill(c) as City[]);
  const GENERATED_COUNT = 100;

  for (let i = 0; i < GENERATED_COUNT; i++) {
    const city = pick(weightedCities);
    const cat = pick(CATEGORIES);
    const n = 2 + Math.floor(rand() * 60);
    const title = `${pick(cat.titles).replace("{n}", String(n))} — ${city.name}`;
    const buyer = pick(city.buyers);
    // Budget 10 k€ → 25 M€, distribution log-uniforme (beaucoup de petits, quelques très gros)
    const budget = Math.round((10_000 * Math.pow(2500, rand())) / 1000) * 1000;
    const score = Math.max(5, Math.min(100, Math.round(cat.baseScore + (rand() * 16 - 8) + (city.dept === "13" ? 5 : 0))));
    const relevanceLevel = score >= 70 ? "tres_pertinent" : score >= 45 ? "pertinent" : score >= 20 ? "a_verifier" : "non_pertinent";
    const publishedAt = new Date(Date.now() - rand() * 21 * 24 * 3600_000);
    const deadlineAt = new Date(Date.now() + (7 + rand() * 68) * 24 * 3600_000);
    const currency = city.country === "CH" ? "CHF" : "€";

    const data = {
      sourceId: city.country === "CH" ? ted.id : boamp.id,
      sourceRef: `SEED-GEN-${String(i).padStart(3, "0")}`,
      dedupKey: `seed-gen-${i}`,
      title,
      buyer,
      description: `${cat.label} pour le compte de ${buyer}. Localisation : ${city.name}. Montant estimé : ${budget.toLocaleString("fr-FR")} ${currency}. Procédure adaptée, visite sur site conseillée, mémoire technique exigé.`,
      cpvCodesJson: JSON.stringify(cat.cpv),
      departementsJson: JSON.stringify([city.dept]),
      country: city.country,
      zonesJson: JSON.stringify([city.zone]),
      city: city.name,
      budgetEstime: budget,
      publishedAt,
      deadlineAt,
      procedureType: rand() > 0.3 ? "OUVERT" : "ADAPTE",
      natureLibelle: city.country === "CH" ? "Avis de marché (TED)" : "Avis de marché",
      sourceUrl: null,
      score,
      relevanceLevel,
      workCategory: cat.workCategory,
      keywordsJson: JSON.stringify(cat.keywords),
      justification: `Score règles: ${score}/100. Catégorie ${cat.label}, mots-clés: ${cat.keywords.join(", ")}.${city.dept === "13" ? " Bonus territoire prioritaire Aix-Marseille (+5)." : ""}`,
      scoredBy: "rules",
      status: "new",
    };

    await prisma.tender.upsert({
      where: { sourceId_sourceRef: { sourceId: data.sourceId, sourceRef: data.sourceRef } },
      update: data,
      create: data,
    });
  }

  // Create sync history
  await prisma.syncRun.create({
    data: {
      sourceId: boamp.id,
      trigger: "manual",
      status: "success",
      startedAt: new Date(Date.now() - 3600_000),
      finishedAt: new Date(Date.now() - 3590_000),
      fetched: 20,
      inserted: 8,
      duplicates: 0,
      rejected: 12,
      alertsSent: 6,
    },
  });

  console.log(`✓ Renov Midi seed : sources, ${seedTenders.length} annonces vitrines + ${GENERATED_COUNT} annonces générées, historique créé.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
