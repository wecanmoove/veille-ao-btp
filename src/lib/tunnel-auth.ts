/**
 * Gate mot de passe pour l'exposition tunnel/LAN — cookie de session, PAS
 * de HTTP Basic Auth.
 *
 * Pourquoi pas Basic Auth : la boîte de dialogue native échoue de façon
 * silencieuse dans une PWA iOS installée en plein écran (« Sur l'écran
 * d'accueil ») et dans beaucoup de navigateurs intégrés (WebView) — l'app
 * reste bloquée sans jamais proposer la saisie. Un cookie posé après un
 * simple formulaire HTML fonctionne dans tous ces contextes.
 */
export const SESSION_COOKIE = "rm_session";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Valeur de cookie attendue pour un mot de passe donné (dérivée, jamais le mot de passe en clair). */
export async function expectedSessionValue(password: string, secret: string): Promise<string> {
  return sha256Hex(`${password}:${secret}`);
}

export async function isValidSession(cookieValue: string | undefined, password: string, secret: string): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await expectedSessionValue(password, secret);
  return cookieValue === expected;
}

/**
 * Origine publique réelle de la requête, à utiliser pour toute redirection
 * absolue construite côté serveur.
 *
 * cloudflared (tunnel rapide) transmet la requête à `http://127.0.0.1:3000`
 * en réécrivant l'en-tête Host au passage — dans les Route Handlers Node.js
 * (contrairement au middleware Edge), `req.url` reflète alors cette adresse
 * locale et non le nom public du tunnel. Résultat observé : une redirection
 * après connexion pointait vers `https://localhost:3000/`, injoignable
 * depuis un vrai appareil distant. On reconstruit donc l'origine à partir
 * de X-Forwarded-Proto/Host (posés par le proxy) avec repli sur le Host reçu.
 */
export function publicOrigin(req: { headers: Headers; url: string }): string {
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  return `${proto}://${host}`;
}
