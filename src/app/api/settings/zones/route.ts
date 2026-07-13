import { NextResponse } from "next/server";
import { getZones, saveZones } from "@/server/zones";

export async function GET() {
  return NextResponse.json(await getZones());
}

/** PUT /api/settings/zones — remplace la configuration des zones de veille. */
export async function PUT(req: Request) {
  try {
    const zones = await saveZones(await req.json());
    return NextResponse.json(zones);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Configuration de zones invalide" },
      { status: 400 },
    );
  }
}
