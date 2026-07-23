import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession, publicOrigin, USER_HEADERS } from "@/lib/auth";

/**
 * Authentification par cookie de session signé, multi-comptes (admin /
 * restreint) — voir src/lib/auth.ts. Remplace l'ancienne gate à mot de passe
 * unique : toujours active désormais (plus de mode "sans mot de passe" pour
 * le dev local), puisque des comptes nominatifs existent réellement.
 *
 * Login via page /auth (voir src/app/auth/page.tsx), pas de HTTP Basic Auth :
 * la boîte de dialogue native échoue silencieusement dans une PWA iOS
 * installée en plein écran et dans beaucoup de navigateurs intégrés
 * (WebView). Un cookie posé après un simple formulaire HTML fonctionne dans
 * tous ces contextes.
 */

// Accessibles sans authentification : login lui-même + assets nécessaires
// à l'installation PWA (icônes/manifeste demandés par le système avant login).
const PUBLIC_PATHS = new Set([
  "/auth",
  "/api/auth/login",
  "/manifest.json",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.ico",
]);

export async function proxy(req: NextRequest) {
  if (PUBLIC_PATHS.has(req.nextUrl.pathname)) return NextResponse.next();

  const secret = process.env.SESSION_SECRET ?? "";
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(cookie, secret);

  if (!session) {
    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }
    const url = new URL("/auth", publicOrigin(req));
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Relaie l'identité vérifiée aux Route Handlers / Server Components en aval,
  // qui n'ont ainsi pas besoin de revérifier la signature HMAC à chaque requête.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(USER_HEADERS.id, session.uid);
  requestHeaders.set(USER_HEADERS.username, session.username);
  requestHeaders.set(USER_HEADERS.role, session.role);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
