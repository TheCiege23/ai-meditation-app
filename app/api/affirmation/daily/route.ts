import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { getDailyAffirmation, saveAffirmation } from "@/lib/affirmations";
import { getUserProfileSnapshot } from "@/lib/user-store";
import { getTimeOfDay } from "@/lib/recommendations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to view your affirmation.", 401);
  }

  const profile = await getUserProfileSnapshot(viewer.userId);
  const affirmation = await getDailyAffirmation({
    userId: viewer.userId,
    sign: profile?.zodiacSign ?? null,
    preferredMood: profile?.preferredMood ?? null,
    timeOfDay: getTimeOfDay(profile?.timezone),
    language: profile?.preferredLanguage === "es" ? "es" : "en",
  });

  return NextResponse.json({ affirmation });
}

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to save affirmations.", 401);
  }

  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const theme = typeof body?.theme === "string" ? body.theme.trim() : null;

  if (!text) {
    return errorResponse("Affirmation text is required.", 400);
  }

  const saved = await saveAffirmation(viewer.userId, text, theme);
  return NextResponse.json({ ok: true, saved, message: "Affirmation saved." });
}
