import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { getDailyJournalPrompt, savePrompt } from "@/lib/journal";
import { getUserProfileSnapshot } from "@/lib/user-store";
import { getTimeOfDay } from "@/lib/recommendations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to view your journal prompt.", 401);
  }

  const profile = await getUserProfileSnapshot(viewer.userId);
  const prompt = await getDailyJournalPrompt({
    userId: viewer.userId,
    sign: profile?.zodiacSign ?? null,
    preferredMood: profile?.preferredMood ?? null,
    timeOfDay: getTimeOfDay(profile?.timezone),
  });

  return NextResponse.json({ prompt });
}

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to save prompts.", 401);
  }

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const source = typeof body?.source === "string" ? body.source.trim() : null;

  if (!text) {
    return errorResponse("Prompt text is required.", 400);
  }

  const saved = await savePrompt(viewer.userId, text, source);
  return NextResponse.json({ ok: true, saved, message: "Prompt saved." });
}
