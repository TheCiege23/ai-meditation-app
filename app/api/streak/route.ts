import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { resolveViewer } from "@/lib/auth";
import { getUserStreakSummary, incrementStreak } from "@/lib/streaks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (!viewer.userId) return errorResponse("Not authenticated.", 401);
  const streak = await getUserStreakSummary(viewer.userId);
  return NextResponse.json({ streak });
}

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (!viewer.userId) return errorResponse("Not authenticated.", 401);
  const streak = await incrementStreak(viewer.userId);
  return NextResponse.json({ streak });
}
