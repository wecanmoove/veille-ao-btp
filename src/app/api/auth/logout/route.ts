import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, publicOrigin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/auth", publicOrigin(req)), { status: 303 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
