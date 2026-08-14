/**
 * Prefixe de deploiement : "" en local, "/veille-ao" derriere nginx.
 * Next ne prefixe que next/link et le router ; les URL ecrites a la main
 * (fetch, action de formulaire, redirections) doivent le porter elles-memes.
 * Fige au build : c est un NEXT_PUBLIC_* inline dans le bundle client.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
