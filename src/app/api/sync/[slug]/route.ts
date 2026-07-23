import { NextRequest, NextResponse } from "next/server";
import { runSync } from "@/server/pipeline/run-sync";
import { isAdmin } from "@/lib/auth";

/** POST /api/sync/[slug] — déclenche une synchronisation manuelle pour une source. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!isAdmin(req.headers)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  const { slug } = await params;
  try {
    const result = await runSync(slug, "manual");
    if (result.status === "skipped_locked") {
      return NextResponse.json({ error: "Une synchronisation est déjà en cours pour cette source" }, { status: 409 });
    }
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
