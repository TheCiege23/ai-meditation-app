import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/api-response";
import { resolveViewer } from "@/lib/auth";
import { logMoodEntry, getTodayMood, getMoodHistory } from "@/lib/mood";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (!viewer.userId) return errorResponse("Not authenticated.", 401);

  const url = new URL(req.url);
  const history = url.searchParams.get("history") === "true";

  if (history) {
    const entries = await getMoodHistory(viewer.userId, 30);
    return NextResponse.json({ entries });
  }

  const today = await getTodayMood(viewer.userId);
  return NextResponse.json({ mood: today });
}

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (!viewer.userId) return errorResponse("Not authenticated.", 401);

  const body = await req.json();
  const { mood, note } = body;

  if (!mood) return errorResponse("Mood is required.", 400);

  const entry = await logMoodEntry(viewer.userId, mood, note);
  return NextResponse.json({ entry });
}
