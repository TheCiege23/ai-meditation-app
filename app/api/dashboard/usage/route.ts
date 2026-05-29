import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { getEffectiveEntitlements } from "@/lib/entitlements";
import { getTodayUsage } from "@/lib/usage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to view usage.", 401);
  }

  const usage = await getTodayUsage(viewer.userId);
  const usageCounts = usage ?? {
    meditationCount: 0,
    speechCount: 0,
    horoscopeCount: 0,
  };
  const entitlements = getEffectiveEntitlements(viewer);

  return NextResponse.json({
    usage,
    remaining: {
      meditations:
        entitlements.maxDailyMeditations === null
          ? null
          : Math.max(0, entitlements.maxDailyMeditations - usageCounts.meditationCount),
      speech:
        entitlements.maxDailySpeech === null
          ? null
          : Math.max(0, entitlements.maxDailySpeech - usageCounts.speechCount),
      horoscope:
        entitlements.maxDailyHoroscopes === null
          ? null
          : Math.max(0, entitlements.maxDailyHoroscopes - usageCounts.horoscopeCount),
    },
    entitlements,
  });
}
