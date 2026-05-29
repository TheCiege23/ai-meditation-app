import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { getDashboardResetPayload } from "@/lib/dashboard";
import { buildQuickBreathingScript } from "@/lib/recommendations";
import { createSessionRecord } from "@/lib/cache-db";
import { incrementBreathingUsage, incrementSleepUsage } from "@/lib/usage";
import { setDashboardState } from "@/lib/history";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function buildSleepScript(duration: string) {
  return `Welcome to your ${duration} sleep wind-down. Let your jaw soften, your shoulders drop, and your breathing grow slower. With each exhale, give your body permission to settle. There is nothing to fix right now. Only this softer pace, this dimmer light, and a gentler way into rest.`;
}

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to view today's reset.", 401);
  }

  const reset = await getDashboardResetPayload(viewer);
  return NextResponse.json(reset);
}

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to start today's reset.", 401);
  }

  const reset = await getDashboardResetPayload(viewer);
  const suggestion = reset.suggestion;

  let sessionId = "";
  if (suggestion.mode === "breathing") {
    sessionId = await createSessionRecord(
      {
        mode: "breathing",
        meditationType: suggestion.meditationType,
        mood: suggestion.mood,
        duration: suggestion.duration,
        breathingPattern: suggestion.breathingPattern,
        voice: "marin",
        visual: "mist",
        sounds: [suggestion.soundId],
        text: buildQuickBreathingScript(suggestion.breathingPattern ?? "balanced-446", suggestion.duration),
      },
      viewer.userId
    );
    await incrementBreathingUsage(viewer.userId);
  } else if (suggestion.mode === "sleep") {
    sessionId = await createSessionRecord(
      {
        mode: "sleep",
        meditationType: "sleep",
        mood: suggestion.mood,
        duration: suggestion.duration,
        breathingPattern: null,
        voice: "marin",
        visual: "night",
        sounds: [suggestion.soundId],
        text: buildSleepScript(suggestion.duration),
      },
      viewer.userId
    );
    await incrementSleepUsage(viewer.userId);
  } else {
    sessionId = await createSessionRecord(
      {
        mode: "meditation",
        meditationType: suggestion.meditationType,
        mood: suggestion.mood,
        duration: suggestion.duration,
        breathingPattern: null,
        voice: "marin",
        visual: "mist",
        sounds: [suggestion.soundId],
        text: reset.script ?? `${suggestion.title}. ${suggestion.affirmationSnippet}`,
      },
      viewer.userId
    );
  }

  await setDashboardState(viewer.userId, {
    lastSessionType: suggestion.mode,
    lastSessionId: sessionId,
    lastViewedSection: "today-reset",
  });

  return NextResponse.json({
    ok: true,
    sessionId,
    suggestion,
    script: reset.script,
  });
}
