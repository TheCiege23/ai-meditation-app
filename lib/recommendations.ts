import type { DailyHoroscopePayload } from "@/types/api";
import type { Viewer } from "@/lib/types";
import type { Entitlements } from "@/lib/entitlements";

export type DashboardRecommendation = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  duration: string;
  locked: boolean;
  premiumReason?: string;
  mode: "meditation" | "breathing" | "sleep" | "journal" | "horoscope" | "sound";
};

export type ResetSuggestion = {
  title: string;
  subtitle: string;
  mode: "meditation" | "breathing" | "sleep";
  meditationType: string;
  mood: string;
  duration: string;
  soundId: string;
  affirmationSnippet: string;
  breathingPattern: string | null;
  locked: boolean;
};

function capitalize(value: string | null | undefined) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getTimeOfDay(timezone?: string | null) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: timezone || undefined,
  });
  const hour = Number(formatter.format(now));
  if (hour < 12) return "morning" as const;
  if (hour < 18) return "afternoon" as const;
  return "evening" as const;
}

export function buildResetSuggestion(input: {
  viewer: Viewer;
  entitlements: Entitlements;
  preferredMood?: string | null;
  reflection?: DailyHoroscopePayload | null;
  affirmation: string;
  timezone?: string | null;
}) : ResetSuggestion {
  const timeOfDay = getTimeOfDay(input.timezone);
  const mood = capitalize(input.preferredMood) || (timeOfDay === "evening" ? "Low Energy" : "Calm");

  if (timeOfDay === "morning") {
    return {
      title: "Morning Reset",
      subtitle: "A quick grounding start with gentle energy.",
      mode: "breathing",
      meditationType: "quick_calm",
      mood,
      duration: "3 min",
      soundId: "birds",
      affirmationSnippet: input.affirmation,
      breathingPattern: "balanced-446",
      locked: false,
    };
  }

  if (timeOfDay === "evening") {
    return {
      title: input.entitlements.sleepMode ? "Sleep Wind-Down" : "Evening Exhale",
      subtitle: input.entitlements.sleepMode
        ? "A soft transition into deeper rest tonight."
        : "A shorter calming reset for the end of the day.",
      mode: input.entitlements.sleepMode ? "sleep" : "breathing",
      meditationType: "sleep",
      mood: "Low Energy",
      duration: input.entitlements.sleepMode ? "10 min" : "3 min",
      soundId: "ocean",
      affirmationSnippet: input.affirmation,
      breathingPattern: input.entitlements.sleepMode ? null : "relax-478",
      locked: false,
    };
  }

  return {
    title: input.reflection ? "Reflection Reset" : "Midday Reset",
    subtitle: input.reflection
      ? "Use today\'s energy as the anchor for a calmer next step."
      : "A short pause to steady your attention and breath.",
    mode: "meditation",
    meditationType: input.reflection?.focus?.toLowerCase().includes("focus") ? "focus" : "stress_relief",
    mood,
    duration: "5 min",
    soundId: "forest",
    affirmationSnippet: input.affirmation,
    breathingPattern: null,
    locked: false,
  };
}

export function buildRecommendations(input: {
  viewer: Viewer;
  entitlements: Entitlements;
  timeOfDay: "morning" | "afternoon" | "evening";
  hasBirthdate: boolean;
  preferredMood?: string | null;
  reflection?: DailyHoroscopePayload | null;
  focusSleepPreference?: string | null;
}) {
  const premiumLocked = input.viewer.subscriptionTier !== "premium";
  const recommendations: DashboardRecommendation[] = [
    {
      id: "grounding-reset",
      title: input.timeOfDay === "morning" ? "3-minute grounding reset" : "Steady breath reset",
      description: "A short guided pause to settle your attention and reset your pace.",
      ctaLabel: "Start",
      href: "/breathe",
      duration: "3 min",
      locked: false,
      mode: "breathing",
    },
    {
      id: "sound-focus",
      title: "Ocean sound focus session",
      description: "Use a clean ambient layer to soften distraction and return to one thing.",
      ctaLabel: "Open",
      href: "/dashboard?sound=ocean",
      duration: "5 min",
      locked: false,
      mode: "sound",
    },
    {
      id: "sleep-flow",
      title: "Nightly wind-down",
      description: "A softer evening transition with slower pacing and lower stimulation.",
      ctaLabel: premiumLocked ? "Upgrade" : "Start",
      href: premiumLocked ? "/pricing" : "/sleep",
      duration: premiumLocked ? "Premium" : "10 min",
      locked: premiumLocked,
      premiumReason: premiumLocked ? "Long-form sleep sessions are part of Premium." : undefined,
      mode: "sleep",
    },
    {
      id: "cosmic-journal",
      title: input.hasBirthdate ? "Reflection-based journal prompt" : "Unlock cosmic reflection",
      description: input.hasBirthdate
        ? "Use today's energy as a prompt for a calmer journal check-in."
        : "Save your birthdate to unlock a personalized daily cosmic reflection.",
      ctaLabel: input.hasBirthdate ? "Write" : "Save birthdate",
      href: input.hasBirthdate ? "/journal" : "/settings?section=birthdate",
      duration: "2 min",
      locked: false,
      mode: input.hasBirthdate ? "journal" : "horoscope",
    },
  ];

  return recommendations;
}

export function buildQuickBreathingScript(pattern: string, duration: string) {
  const scripts: Record<string, string> = {
    "balanced-446": `Welcome. We\'ll move through a ${duration} breathing reset. Inhale for 4. Hold for 4. Exhale for 6. Repeat with a soft jaw and relaxed shoulders.`,
    "box-444": `Welcome. We\'ll use box breathing for ${duration}. Inhale 4. Hold 4. Exhale 4. Hold 4. Keep the rhythm steady and light.`,
    "relax-478": `Welcome. We\'ll settle with a 4-7-8 pattern for ${duration}. Inhale for 4. Hold for 7. Exhale for 8. Let the exhale stay easy, never forced.`,
    "deep-reset": `Welcome. We\'ll use a deep reset breath for ${duration}. Inhale for 5. Exhale for 5. Let the next round arrive naturally.`,
  };

  return scripts[pattern] ?? scripts["balanced-446"];
}

export function buildResetMeditationScript(input: {
  title: string;
  affirmationSnippet: string;
  reflection?: DailyHoroscopePayload | null;
  duration: string;
  mood: string;
}) {
  const reflectionLine = input.reflection?.overview
    ? `Today\'s reflection is this: ${input.reflection.overview}`
    : "Today is inviting a steadier, softer pace.";

  return `${input.title}. ${reflectionLine} Let your breathing slow. Notice where your body is carrying unnecessary effort and let some of it soften. Repeat quietly: ${input.affirmationSnippet} Stay with this rhythm for the next ${input.duration}, and let one gentle intention guide the rest of your day.`;
}
