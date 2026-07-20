import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, expectedSessionValue, publicOrigin } from "@/lib/tunnel-auth";

export async function POST(req: NextRequest) {
  const password = process.env.TUNNEL_PASSWORD;
  const secret = process.env.SESSION_SECRET ?? "";
  if (!password) {
    return NextResponse.json({ error: "Gate non configurée" }, { status: 500 });
  }

  const form = await req.formData();
  const entered = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/");
  const safeNext = next.startsWith("/") ? next : "/";
  const origin = publicOrigin(req);

  if (entered !== password) {
    const url = new URL("/auth", origin);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", safeNext);
    return NextResponse.redirect(url, { status: 303 });
  }

  const value = await expectedSessionValue(password, secret);
  const res = NextResponse.redirect(new URL(safeNext, origin), { status: 303 });
  res.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    path: "/",
  });
  return res;
}
