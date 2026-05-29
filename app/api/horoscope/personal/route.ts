import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { getPersonalAstroSnapshot } from "@/lib/horoscope";
import { getUserProfileSnapshot } from "@/lib/user-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in first.", 401);
  }

  const profile = await getUserProfileSnapshot(viewer.userId);
  if (!profile) {
    return errorResponse("Profile not found.", 404);
  }

  const snapshot = await getPersonalAstroSnapshot(profile);
  return NextResponse.json({ snapshot });
}