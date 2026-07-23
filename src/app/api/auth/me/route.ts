import { NextRequest, NextResponse } from "next/server";
import { sessionFromHeaders } from "@/lib/auth";

/** GET /api/auth/me — identité de l'utilisateur courant (posée par proxy.ts après vérification du cookie). */
export async function GET(req: NextRequest) {
  const session = sessionFromHeaders(req.headers);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  return NextResponse.json({ username: session.username, role: session.role });
}
