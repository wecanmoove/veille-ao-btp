import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { SESSION_COOKIE, signSession, verifyPassword, publicOrigin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const secret = process.env.SESSION_SECRET ?? "";

  const form = await req.formData();
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/");
  const safeNext = next.startsWith("/") ? next : "/";
  const origin = publicOrigin(req);

  const user = username ? await prisma.user.findUnique({ where: { username } }) : null;
  const valid = user ? await verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid) {
    const url = new URL("/auth", origin);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", safeNext);
    return NextResponse.redirect(url, { status: 303 });
  }

  const value = await signSession({ uid: user.id, username: user.username, role: user.role as "admin" | "restricted" }, secret);
  const res = NextResponse.redirect(new URL(safeNext, origin), { status: 303 });
  res.cookies.set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    path: "/",
  });
  return res;
}
