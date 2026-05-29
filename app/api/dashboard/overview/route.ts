import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { getDashboardOverview } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function buildFallbackOverview(viewer: Awaited<ReturnType<typeof resolveViewer>>) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return {
    hero: {
      greeting,
      subtitle: "A calm place to continue your rituals, reflect, and reset.",
      displayName: viewer.displayName,
      tier: viewer.subscriptionTier,
      streakDays: 0,
    },
    progressStats: {
      totalMindfulMinutes: 0,
      weeklyMindfulMinutes: 0,
    },
    streaks: {
      currentStreak: 0,
      longestStreak: 0,
    },
    todayMood: null,
    dailyWisdom: {
      text: "Small breaths, steady focus, and one calm step forward.",
      author: "ChimAura",
    },
    todayReset: {
      title: "Quick Calm",
      subtitle: "Take a short reset to settle your nervous system.",
      mode: "meditation",
      duration: "3 min",
      locked: false,
    },
    reflection: null,
    recommendations: [],
  };
}

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to view your dashboard.", 401);
  }

  try {
    const overview = await getDashboardOverview(viewer);
    return NextResponse.json({ overview });
  } catch (error) {
    console.error("Dashboard overview failed, returning fallback payload:", error);
    return NextResponse.json({
      overview: buildFallbackOverview(viewer),
      degraded: true,
    });
  }
}
