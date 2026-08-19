/**
 * Préfixe de déploiement : "" en local, "/veille-ao" quand l'application est
 * servie en sous-chemin derrière nginx.
 *
 * Next ne réécrit que les URL de next/link et du router. Tout ce qui est écrit
 * à la main — fetch, action de formulaire, redirection, métadonnées — doit
 * porter le préfixe soi-même, sinon la requête part à la racine du domaine et
 * atterrit sur l'application voisine, qui répond 404 sans bruit.
 *
 * Figé au build : NEXT_PUBLIC_* est inliné dans le bundle client.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
