import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { createSessionRecord } from "@/lib/cache-db";
import { setDashboardState } from "@/lib/history";
import { buildQuickBreathingScript } from "@/lib/recommendations";
import { incrementBreathingUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PATTERNS = new Set(["balanced-446", "box-444", "relax-478", "deep-reset"]);

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to start a breathing exercise.", 401);
  }

  const body = await req.json().catch(() => ({}));
  const pattern = typeof body.pattern === "string" && PATTERNS.has(body.pattern) ? body.pattern : "balanced-446";
  const duration = typeof body.duration === "string" ? body.duration : "3 min";
  const soundId = typeof body.soundId === "string" ? body.soundId : "wind";

  const sessionId = await createSessionRecord(
    {
      mode: "breathing",
      meditationType: "breath_reset",
      mood: "Calm",
      duration,
      breathingPattern: pattern,
      voice: "marin",
      visual: "mist",
      sounds: [soundId],
      text: buildQuickBreathingScript(pattern, duration),
    },
    viewer.userId
  );

  await incrementBreathingUsage(viewer.userId);
  await setDashboardState(viewer.userId, {
    lastSessionType: "breathing",
    lastSessionId: sessionId,
    lastViewedSection: "breathing",
  });

  return NextResponse.json({ ok: true, sessionId, pattern, duration, soundId });
}
