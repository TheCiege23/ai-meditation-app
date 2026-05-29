import { prisma } from "@/lib/db";
import { getDailyHoroscopeBySign, buildFallbackHoroscope } from "@/lib/horoscope";
import { getCachedHoroscope, saveCachedHoroscope } from "@/lib/horoscope-cache";
import { getDailyAffirmation } from "@/lib/affirmations";
import { getDailyJournalPrompt } from "@/lib/journal";
import { getUserProfileSnapshot } from "@/lib/user-store";
import { getZodiacSign } from "@/lib/zodiac";
import { getDateKey, getTodayUsage } from "@/lib/usage";
import { getEffectiveEntitlements } from "@/lib/entitlements";
import {
  getContinueSession,
  getFavoriteSessions,
  getRecentSessionHistory,
  setDashboardState,
} from "@/lib/history";
import { getUserStreakSummary } from "@/lib/streaks";
import {
  buildRecommendations,
  buildResetMeditationScript,
  buildResetSuggestion,
  getTimeOfDay,
} from "@/lib/recommendations";
import { getRecommendedSound, getSoundLibrary } from "@/lib/audio";
import { getProgressStats } from "@/lib/progress-stats";
import { getDailyWisdom } from "@/lib/wisdom";
import { getTodayMood } from "@/lib/mood";
import type { Viewer } from "@/lib/types";
import type { DailyHoroscopePayload } from "@/types/api";

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

async function resolveReflection(viewer: Viewer) {
  if (!viewer.userId) {
    return null;
  }

  const profile = await getUserProfileSnapshot(viewer.userId);
  let sign = profile?.zodiacSign ?? null;
  if (!sign && profile?.birthdate) {
    sign = getZodiacSign(new Date(profile.birthdate));
  }

  if (!sign) {
    return { profile, reflection: null };
  }

  const normalizedSign = toTitleCase(sign);
  const dateKey = getDateKey();
  const cached = (await getCachedHoroscope(normalizedSign, dateKey, "freeastroapi"))
    ?? (await getCachedHoroscope(normalizedSign, dateKey, "mock"));

  if (cached) {
    return {
      profile,
      reflection: cached.payloadJson as unknown as DailyHoroscopePayload,
    };
  }

  let reflection;
  let source: "freeastroapi" | "mock" = "freeastroapi";

  try {
    reflection = await getDailyHoroscopeBySign(normalizedSign, dateKey);
    if (reflection.source === "mock") {
      source = "mock";
    }
  } catch {
    reflection = buildFallbackHoroscope(normalizedSign, dateKey);
    source = "mock";
  }

  await saveCachedHoroscope(normalizedSign, dateKey, reflection, source);

  return {
    profile,
    reflection,
  };
}

export async function getDashboardOverview(viewer: Viewer) {
  if (!viewer.userId) {
    throw new Error("Dashboard requires an authenticated user.");
  }

  const entitlements = getEffectiveEntitlements(viewer);

  const reflectionResult = await resolveReflection(viewer).catch(() => null);
  const recentSessions = await getRecentSessionHistory(viewer.userId, 6).catch(() => []);
  const favorites = await getFavoriteSessions(viewer.userId, 4).catch(() => []);
  const continueSession = await getContinueSession(viewer.userId).catch(() => null);
  const usage = await getTodayUsage(viewer.userId).catch(() => null);
  const streaks = await getUserStreakSummary(viewer.userId).catch(() => ({
    currentStreak: 0,
    longestStreak: 0,
  }));
  const notificationPrefs = await prisma.notificationPreference
    .findUnique({ where: { userId: viewer.userId } })
    .catch(() => null);
  const activePushSubscriptions = await prisma.pushSubscription
    .count({ where: { userId: viewer.userId, isActive: true } })
    .catch(() => 0);
  const progressStats = await getProgressStats(viewer.userId).catch(() => ({
    totalSessions: 0,
    totalMindfulMinutes: 0,
    weeklyMindfulMinutes: 0,
    monthlyMindfulMinutes: 0,
  }));
  const todayMood = await getTodayMood(viewer.userId).catch(() => null);

  const profile = reflectionResult?.profile ?? null;
  const reflection = reflectionResult?.reflection ?? null;
  const language = profile?.preferredLanguage === "es" ? "es" : "en";
  const usageCounts = usage ?? {
    meditationCount: 0,
    speechCount: 0,
    horoscopeCount: 0,
  };
  const timeOfDay = getTimeOfDay(profile?.timezone);

  const affirmation = await getDailyAffirmation({
    userId: viewer.userId,
    sign: profile?.zodiacSign ?? null,
    preferredMood: profile?.preferredMood ?? null,
    timeOfDay,
    language: profile?.preferredLanguage === "es" ? "es" : "en",
  }).catch(() => ({
    text:
      language === "es"
        ? "Respira hondo. Un paso tranquilo es suficiente por ahora."
        : "Take a deep breath. One calm step is enough for now.",
    source: "fallback",
  }));

  const journalPrompt = await getDailyJournalPrompt({
    userId: viewer.userId,
    sign: profile?.zodiacSign ?? null,
    preferredMood: profile?.preferredMood ?? null,
    timeOfDay,
  }).catch(() => ({
    question:
      language === "es"
        ? "Que pequena accion te ayudaria a sentirte mas en calma hoy?"
        : "What small action would help you feel calmer today?",
    source: "fallback",
  }));

  const reset = buildResetSuggestion({
    viewer,
    entitlements,
    preferredMood: profile?.preferredMood ?? null,
    reflection,
    affirmation: affirmation.text,
    timezone: profile?.timezone ?? null,
  });

  const recommendedSound = getRecommendedSound({
    timeOfDay,
    focus: reflection?.focus ?? null,
    prefersSleep: reset.mode === "sleep",
  });

  const recommendations = buildRecommendations({
    viewer,
    entitlements,
    timeOfDay,
    hasBirthdate: Boolean(profile?.birthdate),
    preferredMood: profile?.preferredMood ?? null,
    reflection,
  });

  return {
    hero: {
      greeting:
        timeOfDay === "morning"
          ? "Good morning"
          : timeOfDay === "afternoon"
            ? "Good afternoon"
            : "Good evening",
      subtitle: "A calm place to continue your rituals, reflect, and reset.",
      displayName: viewer.displayName,
      tier: viewer.subscriptionTier,
      zodiacSign: profile?.zodiacSign ?? null,
      streakDays: streaks.currentStreak,
      isAdmin: viewer.role === "admin" || viewer.role === "super_admin",
    },
    profile,
    progressStats,
    todayMood,
    dailyWisdom: getDailyWisdom(language),
    todayReset: {
      ...reset,
      sound: recommendedSound,
    },
    affirmation,
    journalPrompt,
    reflection,
    recentSessions,
    favorites,
    continueSession,
    streaks,
    usage: {
      today: usage,
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
    },
    soundscape: {
      recommended: recommendedSound,
      library: getSoundLibrary(viewer.subscriptionTier),
    },
    notificationPrompt: {
      enabled: Boolean(notificationPrefs?.enablePush && activePushSubscriptions > 0),
      activeDevices: activePushSubscriptions,
      title:
        notificationPrefs?.enablePush && activePushSubscriptions > 0
          ? "Reminders are active"
          : "Enable gentle reminders",
      description:
        notificationPrefs?.enablePush && activePushSubscriptions > 0
          ? "You will receive your saved reminder types on this device when quiet hours allow."
          : "Turn on notifications for daily resets, evening calm, and your cosmic reflection.",
    },
    premiumHighlights:
      viewer.subscriptionTier === "premium"
        ? []
        : [
            {
              id: "premium-voices",
              title: "Premium voices",
              description: "Unlock softer guide styles and deeper voice options.",
            },
            {
              id: "sound-mixer",
              title: "Sound mixer",
              description: "Blend ocean, wind, forest, and ritual layers together.",
            },
            {
              id: "weekly-astrology",
              title: "Weekly cosmic reflection",
              description: "Get a longer-range reflective view with richer guidance.",
            },
          ],
    recommendations,
  };
}

export async function getDashboardResetPayload(viewer: Viewer) {
  const overview = await getDashboardOverview(viewer);
  const reflection = overview.reflection;
  const suggestion = overview.todayReset;

  return {
    suggestion,
    script:
      suggestion.mode === "breathing"
        ? null
        : buildResetMeditationScript({
            title: suggestion.title,
            affirmationSnippet: overview.affirmation.text,
            reflection,
            duration: suggestion.duration,
            mood: suggestion.mood,
          }),
  };
}

export async function rememberViewedSection(userId: string, section: string) {
  await setDashboardState(userId, { lastViewedSection: section });
}