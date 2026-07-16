import Link from "next/link";

/**
 * Annuaire de veille manuelle : sites réels où trouver des AO TCE/réhabilitation
 * dans le 13 et en PACA. Aucune donnée simulée — uniquement des liens directs
 * vers les espaces marchés de chaque organisme.
 */

interface SourceLink {
  name: string;
  url: string;
  note: string;
  auto?: "api" | "attente";
}

const SECTIONS: { title: string; icon: string; links: SourceLink[] }[] = [
  {
    title: "Plateformes nationales",
    icon: "📋",
    links: [
      { name: "BOAMP", url: "https://www.boamp.fr", note: "Journal officiel des marchés publics — collecté automatiquement toutes les 4 h.", auto: "api" },
      { name: "TED Europe", url: "https://ted.europa.eu/fr/", note: "Marchés européens et suisses — collecté automatiquement 2×/jour.", auto: "api" },
      { name: "PLACE (marches-publics.gouv.fr)", url: "https://www.marches-publics.gouv.fr", note: "Plateforme de l'État — API en attente de convention AIFE.", auto: "attente" },
      { name: "France Marchés", url: "https://www.francemarches.com", note: "Agrégateur de la presse quotidienne régionale.", auto: "attente" },
      { name: "Marchés Online", url: "https://www.marchesonline.com", note: "Agrégateur Groupe Moniteur — alertes email gratuites." },
      { name: "E-marchespublics", url: "https://www.e-marchespublics.com", note: "Profil acheteur de nombreuses collectivités du Sud." },
      { name: "Marchés Sécurisés", url: "https://www.marches-securises.fr", note: "Profil acheteur utilisé par des communes des Bouches-du-Rhône." },
      { name: "Achat Public", url: "https://www.achatpublic.com", note: "Profil acheteur de grandes collectivités et bailleurs." },
      { name: "Klekoon", url: "https://www.klekoon.com", note: "Plateforme de dématérialisation — consultation gratuite des avis." },
      { name: "AWS Achat", url: "https://www.marches-publics.info", note: "AWS-Achat / marches-publics.info — profil acheteur répandu en PACA." },
    ],
  },
  {
    title: "Bailleurs sociaux du 13",
    icon: "🏗️",
    links: [
      { name: "13 Habitat", url: "https://www.13habitat.fr", note: "OPH du département — gros volumes de réhabilitation. Rubrique Marchés publics." },
      { name: "Habitat Marseille Provence", url: "https://www.habitatmarseilleprovence.fr", note: "OPH de la métropole — voir Espace fournisseurs." },
      { name: "Erilia", url: "https://www.erilia.fr", note: "ESH groupe Habitat en Région — rubrique Appels d'offres." },
      { name: "Logirem", url: "https://www.logirem.fr", note: "ESH groupe Habitat en Région — rubrique Fournisseurs." },
      { name: "Unicil", url: "https://www.unicil.fr", note: "Groupe Action Logement — rubrique Marchés." },
      { name: "Vilogia", url: "https://www.vilogia.fr", note: "Espace Fournisseur national, opérations dans le 13." },
      { name: "CDC Habitat", url: "https://www.cdc-habitat.com", note: "Consultations via achats.cdc-habitat.com." },
    ],
  },
  {
    title: "Institutionnels PACA / Marseille",
    icon: "🏛️",
    links: [
      { name: "Ville de Marseille", url: "https://marchespublics.marseille.fr", note: "Profil acheteur de la Ville." },
      { name: "Métropole Aix-Marseille-Provence", url: "https://marchespublics.ampmetropole.fr", note: "Profil acheteur de la Métropole AMP." },
      { name: "Région Sud", url: "https://achat.maregionsud.fr", note: "Plateforme achats de la Région — lycées, bâtiments régionaux." },
      { name: "Département des Bouches-du-Rhône", url: "https://marchespublics.departement13.fr", note: "Collèges et patrimoine départemental." },
      { name: "AP-HM", url: "https://www.ap-hm.fr", note: "Assistance Publique — Hôpitaux de Marseille, rubrique marchés." },
      { name: "SPLA-IN Aix-Marseille-Provence", url: "https://www.splain-ampmetropole.fr", note: "Aménagement urbain métropolitain." },
    ],
  },
];

export default function SourcesPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">📚 Sources de veille</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Où trouver les appels d&apos;offres TCE / réhabilitation dans le 13 et en PACA. Les sources marquées{" "}
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">AUTO</span>{" "}
          sont collectées automatiquement par Renov Midi ; les autres sont à consulter manuellement (la plupart
          proposent des alertes email gratuites sur inscription).
        </p>
      </div>

      {SECTIONS.map((section) => (
        <section key={section.title} className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <h2 className="border-b border-slate-200 px-5 py-4 font-bold text-slate-900 dark:border-slate-800 dark:text-white">
            {section.icon} {section.title}
          </h2>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {section.links.map((l) => (
              <li key={l.name} className="flex items-start gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-teal-700 hover:underline dark:text-teal-400"
                    >
                      {l.name} ↗
                    </a>
                    {l.auto === "api" && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                        AUTO
                      </span>
                    )}
                    {l.auto === "attente" && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        API en attente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{l.note}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="text-xs text-slate-400">
        Astuce : sur chaque plateforme manuelle, créez une alerte email avec les mots-clés « réhabilitation »,
        « rénovation », « TCE » et le département 13 — vous doublez ainsi la couverture automatique de Renov Midi.{" "}
        <Link href="/config" className="underline">Configurer la collecte automatique →</Link>
      </p>
    </div>
  );
}
