import { NextResponse } from "next/server";
import { z } from "zod";
import { getCompanyProfile, saveCompanyProfile } from "@/server/company-profile";

export async function GET() {
  return NextResponse.json(await getCompanyProfile());
}

const patchSchema = z.record(z.string(), z.string());

/** PATCH /api/settings/company — met à jour le profil entreprise (page Mon entreprise). */
export async function PATCH(req: Request) {
  const body = patchSchema.parse(await req.json());
  const profile = await saveCompanyProfile(body);
  return NextResponse.json(profile);
}
