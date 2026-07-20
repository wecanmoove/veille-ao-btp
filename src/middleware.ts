import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSession, publicOrigin } from "@/lib/tunnel-auth";

/**
 * Protection cookie OPT-IN pour exposition tunnel/LAN.
 *
 * Active uniquement si TUNNEL_PASSWORD est défini (.env.local) — sans lui,
 * le comportement en local reste inchangé. Login via page /auth (voir
 * src/app/auth/page.tsx), pas de HTTP Basic Auth : la boîte de dialogue
 * native échoue silencieusement dans une PWA iOS installée en plein écran
 * et dans beaucoup de navigateurs intégrés (WebView).
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

export async function middleware(req: NextRequest) {
  const password = process.env.TUNNEL_PASSWORD;
  if (!password) return NextResponse.next();
  if (PUBLIC_PATHS.has(req.nextUrl.pathname)) return NextResponse.next();

  const secret = process.env.SESSION_SECRET ?? "";
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (await isValidSession(cookie, password, secret)) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  }
  const url = new URL("/auth", publicOrigin(req));
  url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
