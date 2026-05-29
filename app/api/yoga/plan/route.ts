import { NextResponse } from "next/server";

import { errorResponse } from "@/lib/api-response";
import { resolveViewer } from "@/lib/auth";
import { createSessionRecord } from "@/lib/cache-db";
import { setDashboardState } from "@/lib/history";
import { generateYogaSessionPlan, getYogaPoseById } from "@/lib/yoga";
import type { AppLanguage, YogaFocus, YogaLevel } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_FOCUS: YogaFocus[] = [
  "stress_relief",
  "sleep_wind_down",
  "lower_back",
  "morning_flow",
  "desk_reset",
  "full_body_reset",
];

const VALID_LEVELS: YogaLevel[] = ["beginner", "intermediate", "advanced"];

function isYogaFocus(value: string): value is YogaFocus {
  return VALID_FOCUS.includes(value as YogaFocus);
}

function isYogaLevel(value: string): value is YogaLevel {
  return VALID_LEVELS.includes(value as YogaLevel);
}

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to generate a yoga session.", 401);
  }

  const body = (await req.json().catch(() => ({}))) as {
    focus?: string;
    level?: string;
    durationMinutes?: number;
    language?: string;
  };

  const focus = body.focus && isYogaFocus(body.focus) ? body.focus : "stress_relief";
  const level = body.level && isYogaLevel(body.level) ? body.level : "beginner";
  const durationMinutes =
    typeof body.durationMinutes === "number" && Number.isFinite(body.durationMinutes)
      ? Math.max(3, Math.min(30, Math.floor(body.durationMinutes)))
      : 10;
  const language: AppLanguage = body.language === "es" ? "es" : "en";

  const generated = generateYogaSessionPlan({
    focus,
    level,
    durationMinutes,
    language,
  });

  const steps = generated.steps
    .map((step) => {
      const pose = getYogaPoseById(step.poseId);
      if (!pose) return null;

      return {
        order: step.order,
        poseId: pose.id,
        poseName: language === "es" ? pose.nameEs : pose.name,
        holdSeconds: step.holdSeconds,
        cues: language === "es" ? pose.cuesEs : pose.cuesEn,
      };
    })
    .filter((step): step is NonNullable<typeof step> => Boolean(step));

  const serializedFlow = steps
    .map((step) => `${step.order}. ${step.poseName} (${step.holdSeconds}s)`)
    .join("\n");

  const sessionId = await createSessionRecord(
    {
      mode: "yoga",
      meditationType: `yoga_${focus}`,
      mood: focus === "sleep_wind_down" ? "Sleepy" : "Calm",
      duration: `${durationMinutes} min`,
      breathingPattern: null,
      voice: "none",
      visual: "mist",
      sounds: [],
      text: `${generated.displayTitle}\n\n${serializedFlow}`,
    },
    viewer.userId
  );

  await setDashboardState(viewer.userId, {
    lastSessionType: "yoga",
    lastSessionId: sessionId,
    lastViewedSection: "yoga",
  });

  return NextResponse.json({
    ok: true,
    sessionId,
    plan: generated.plan,
    displayTitle: generated.displayTitle,
    steps,
  });
}
