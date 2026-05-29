import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { getUserStreakSummary } from "@/lib/streaks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to view streaks.", 401);
  }

  const streaks = await getUserStreakSummary(viewer.userId);
  return NextResponse.json({ streaks });
}
