import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { getEffectiveEntitlements } from "@/lib/entitlements";
import { createSessionRecord } from "@/lib/cache-db";
import { setDashboardState } from "@/lib/history";
import { incrementSleepUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function buildSleepScript(duration: string) {
  return `Welcome to your ${duration} sleep wind-down. Let your breathing ease, your jaw soften, and your body feel held by the bed beneath you. Nothing needs solving right now. Each exhale is an invitation to become quieter and more at rest.`;
}

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to start a sleep session.", 401);
  }

  const entitlements = getEffectiveEntitlements(viewer);
  const body = await req.json().catch(() => ({}));
  const duration = typeof body.duration === "string" ? body.duration : "10 min";
  const soundId = typeof body.soundId === "string" ? body.soundId : "ocean";
  const numericDuration = Number(duration.split(" ")[0]);

  if (!entitlements.sleepMode && numericDuration > 5) {
    return NextResponse.json(
      {
        error: "Upgrade required",
        message: "Long-form sleep sessions are part of ChimAura Premium.",
        upgradeRequired: true,
        tier: viewer.subscriptionTier,
        feature: "sleep",
      },
      { status: 403 }
    );
  }

  const sessionId = await createSessionRecord(
    {
      mode: "sleep",
      meditationType: "sleep",
      mood: "Low Energy",
      duration,
      breathingPattern: null,
      voice: "marin",
      visual: "night",
      sounds: [soundId],
      text: buildSleepScript(duration),
    },
    viewer.userId
  );

  await incrementSleepUsage(viewer.userId);
  await setDashboardState(viewer.userId, {
    lastSessionType: "sleep",
    lastSessionId: sessionId,
    lastViewedSection: "sleep",
  });

  return NextResponse.json({ ok: true, sessionId, duration, soundId });
}
