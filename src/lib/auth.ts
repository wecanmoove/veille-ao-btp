import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Authentification multi-comptes (admin / restreint) — remplace l'ancienne
 * gate à mot de passe unique. Cookie de session signé (HMAC), pas de HTTP
 * Basic Auth : la boîte de dialogue native échoue silencieusement dans une
 * PWA iOS installée en plein écran et dans beaucoup de navigateurs intégrés
 * (WebView) — un cookie posé après un simple formulaire HTML fonctionne
 * dans tous ces contextes.
 */
export const SESSION_COOKIE = "rm_session";

export type Role = "admin" | "restricted";

export interface SessionPayload {
  uid: string;
  username: string;
  role: Role;
}

const scryptAsync = promisify(scrypt);

/** Hash un mot de passe en clair — format stocké : "sel_hex:hash_hex". */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

/** Vérifie un mot de passe en clair contre un hash stocké, en temps constant. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scryptAsync(password, salt, expected.length)) as Buffer;
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf-8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf-8");
}

async function hmacHex(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Construit la valeur de cookie signée pour une session utilisateur. */
export async function signSession(payload: SessionPayload, secret: string): Promise<string> {
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = await hmacHex(encoded, secret);
  return `${encoded}.${signature}`;
}

/** Vérifie et décode une valeur de cookie de session. Renvoie null si absente/invalide/altérée. */
export async function verifySession(cookieValue: string | undefined, secret: string): Promise<SessionPayload | null> {
  if (!cookieValue) return null;
  const [encoded, signature] = cookieValue.split(".");
  if (!encoded || !signature) return null;
  const expected = await hmacHex(encoded, secret);
  if (expected.length !== signature.length) return null;
  if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"))) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(encoded)) as SessionPayload;
    if (!payload.uid || !payload.username || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Origine publique réelle de la requête, à utiliser pour toute redirection
 * absolue construite côté serveur.
 *
 * cloudflared (tunnel rapide) transmet la requête à `http://127.0.0.1:3000`
 * en réécrivant l'en-tête Host au passage — dans les Route Handlers Node.js
 * (contrairement au Proxy Edge historique), `req.url` reflète alors cette
 * adresse locale et non le nom public du tunnel. Résultat observé : une
 * redirection après connexion pointait vers `https://localhost:3000/`,
 * injoignable depuis un vrai appareil distant. On reconstruit donc l'origine
 * à partir de X-Forwarded-Proto/Host (posés par le proxy) avec repli sur le
 * Host reçu.
 */
export function publicOrigin(req: { headers: Headers; url: string }): string {
  const proto = req.headers.get("x-forwarded-proto") ?? new URL(req.url).protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  return `${proto}://${host}`;
}

// En-têtes internes posés par proxy.ts après vérification du cookie, relus
// par les Route Handlers / Server Components pour connaître l'utilisateur
// courant sans revérifier le HMAC à chaque fois.
export const USER_HEADERS = {
  id: "x-rm-user-id",
  username: "x-rm-username",
  role: "x-rm-role",
} as const;

export function sessionFromHeaders(headers: Headers): SessionPayload | null {
  const uid = headers.get(USER_HEADERS.id);
  const username = headers.get(USER_HEADERS.username);
  const role = headers.get(USER_HEADERS.role);
  if (!uid || !username || (role !== "admin" && role !== "restricted")) return null;
  return { uid, username, role };
}

export function isAdmin(headers: Headers): boolean {
  return sessionFromHeaders(headers)?.role === "admin";
}
