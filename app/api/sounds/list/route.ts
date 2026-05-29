import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { getMeditationSoundOptions } from "@/lib/audio";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  const tier = viewer.isGuest ? "free" : viewer.subscriptionTier;
  return NextResponse.json({ sounds: getMeditationSoundOptions(tier) });
}