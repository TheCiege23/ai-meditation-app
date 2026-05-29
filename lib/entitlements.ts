import type { DailyUsage } from "@prisma/client";

import type { SubscriptionStatus, SubscriptionTier } from "@/lib/types";

export type Entitlements = {
  tier: SubscriptionTier;
  meditationsPerDay: number | null;
  speechPerDay: number | null;
  horoscopeViewsPerDay: number | null;
  maxDailyMeditations: number | null;
  maxDailySpeech: number | null;
  maxDailyHoroscopes: number | null;
  maxDurationMinutes: number;
  premiumVoices: boolean;
  sleepMode: boolean;
  soundMixer: boolean;
  sessionHistory: boolean;
  dailyPlans: boolean;
  allowedVoiceTones: string[];
  allowedVoices: string[];
  allowedSounds: string[];
  maxSounds: number;
  weeklyHoroscope: boolean;
  advancedAstrology: boolean;
  allowedVisuals: string[];
  allowedTimerStyles: string[];
  /** Premium: multi-day courses — active, enforced in /api/courses */
  courses: boolean;
  /** Premium: full journal history (more entries) — active, enforced in /api/journal */
  fullJournal: boolean;
  /** Premium: daily wisdom feed in dashboard — active */
  dailyWisdom: boolean;
  /** Emergency calm reset (1-min breathing) - all users, not gated */
  emergencyCalm: boolean;
  /** Coming soon: focus / mindful work timer — flag reserved, feature not yet shipped */
  focusTimer: boolean;
  /** Coming soon: sleep stories and night soundscapes — flag reserved, feature not yet shipped */
  sleepStories: boolean;
};

const FREE_VOICE_TONES = ["calm-female"];
const FREE_VOICES = ["marin"];
const FREE_SOUNDS = ["Raindrop", "ocean", "forest"];

export type EffectiveEntitlementsInput = {
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
};

export function isPremiumAccessActive(input: EffectiveEntitlementsInput): boolean {
  if (input.subscriptionTier !== "premium") {
    return false;
  }
  if (input.subscriptionStatus !== "active" && input.subscriptionStatus !== "trialing") {
    return false;
  }
  if (input.currentPeriodEnd !== null && new Date(input.currentPeriodEnd) <= new Date()) {
    return false;
  }
  return true;
}

/** Use on the server/API layer to enforce access based on actual subscription validity. */
export function getEffectiveEntitlements(input: EffectiveEntitlementsInput): Entitlements {
  return getEntitlements(isPremiumAccessActive(input) ? "premium" : "free");
}

export function getEntitlements(tier: SubscriptionTier): Entitlements {
  if (tier === "premium") {
    return {
      tier: "premium",
      meditationsPerDay: null,
      speechPerDay: null,
      horoscopeViewsPerDay: null,
      maxDailyMeditations: null,
      maxDailySpeech: null,
      maxDailyHoroscopes: null,
      maxDurationMinutes: 60,
      premiumVoices: true,
      sleepMode: true,
      soundMixer: true,
      sessionHistory: true,
      dailyPlans: true,
      allowedVoiceTones: ["calm-female", "deep-male", "soft-guide", "whisper-guide"],
      allowedVoices: ["marin", "onyx", "sage", "verse"],
      allowedSounds: ["Raindrop", "ocean", "forest", "Campfire", "Birds", "Wind"],
      maxSounds: 6,
      weeklyHoroscope: true,
      advancedAstrology: true,
      allowedVisuals: ["mist", "sunrise", "forest", "night", "ocean-dusk", "starfield"],
      allowedTimerStyles: ["minimal-ring", "zen-ring", "glowing-orb", "lotus-bloom", "mandala-pulse", "wave"],
      courses: true,
      fullJournal: true,
      dailyWisdom: true,
      emergencyCalm: true,
      focusTimer: true,
      sleepStories: true,
    };
  }

  return {
    tier: "free",
    meditationsPerDay: 3,
    speechPerDay: 3,
    horoscopeViewsPerDay: 5,
    maxDailyMeditations: 3,
    maxDailySpeech: 3,
    maxDailyHoroscopes: 5,
    maxDurationMinutes: 5,
    premiumVoices: false,
    sleepMode: false,
    soundMixer: false,
    sessionHistory: false,
    dailyPlans: false,
    allowedVoiceTones: FREE_VOICE_TONES,
    allowedVoices: FREE_VOICES,
    allowedSounds: FREE_SOUNDS,
    maxSounds: 1,
    weeklyHoroscope: false,
    advancedAstrology: false,
    allowedVisuals: ["mist", "sunrise"],
    allowedTimerStyles: ["minimal-ring", "zen-ring"],
    courses: false,
    fullJournal: false,
    dailyWisdom: false,
    emergencyCalm: true,
    focusTimer: false,
    sleepStories: false,
  };
}

export function durationLabelToMinutes(duration: string) {
  const value = Number(duration.split(" ")[0]);
  return Number.isNaN(value) ? 0 : value;
}

function isUnlimited(limit: number | null) {
  return limit === null;
}

export function canUseMeditation(
  userUsage: Pick<DailyUsage, "meditationCount"> | null | undefined,
  entitlements: Entitlements
) {
  if (isUnlimited(entitlements.meditationsPerDay)) {
    return true;
  }

  return (userUsage?.meditationCount ?? 0) < (entitlements.meditationsPerDay ?? 0);
}

export function canUseSpeech(
  userUsage: Pick<DailyUsage, "speechCount"> | null | undefined,
  entitlements: Entitlements
) {
  if (isUnlimited(entitlements.speechPerDay)) {
    return true;
  }

  return (userUsage?.speechCount ?? 0) < (entitlements.speechPerDay ?? 0);
}

export function canUseHoroscope(
  userUsage: Pick<DailyUsage, "horoscopeCount"> | null | undefined,
  entitlements: Entitlements
) {
  if (isUnlimited(entitlements.horoscopeViewsPerDay)) {
    return true;
  }

  return (userUsage?.horoscopeCount ?? 0) < (entitlements.horoscopeViewsPerDay ?? 0);
}

/** Clamp visual to an allowed value for the tier. Use when saving preferences or session. */
export function clampVisualToEntitlements(visual: string | null | undefined, entitlements: Entitlements): string {
  const v = (visual ?? "mist").trim();
  if (entitlements.allowedVisuals.includes(v)) return v;
  return entitlements.allowedVisuals[0] ?? "mist";
}

/** Clamp timer style to an allowed value for the tier. Use when saving preferences. */
export function clampTimerStyleToEntitlements(style: string | null | undefined, entitlements: Entitlements): string {
  const s = (style ?? "minimal-ring").trim();
  if (entitlements.allowedTimerStyles.includes(s)) return s;
  return entitlements.allowedTimerStyles[0] ?? "minimal-ring";
}

/** Clamp voice tone to an allowed value for the tier. Use when saving preferences or presets. */
export function clampVoiceToneToEntitlements(tone: string | null | undefined, entitlements: Entitlements): string {
  const nextTone = (tone ?? "calm-female").trim();
  if (entitlements.allowedVoiceTones.includes(nextTone)) return nextTone;
  return entitlements.allowedVoiceTones[0] ?? "calm-female";
}

/** Clamp voice to an allowed value for the tier. Use when creating session or generating speech. */
export function clampVoiceToEntitlements(voice: string | null | undefined, entitlements: Entitlements): string {
  const v = (voice ?? "marin").trim();
  if (entitlements.allowedVoices.includes(v)) return v;
  return entitlements.allowedVoices[0] ?? "marin";
}
