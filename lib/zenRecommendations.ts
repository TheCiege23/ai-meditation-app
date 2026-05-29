import type { DailyReflection } from "@/components/horoscope/types";

type BreathingType = "box" | "4-7-8" | "deep-reset" | "calm";

export type ZenRecommendation = {
  affirmation: string;
  journalPrompt: string;
  breathingType: BreathingType;
  meditationSuggestion: string;
  soundSuggestion: string;
  sleepSuggestion?: string;
  auraColor?: string;
};

function contains(text: string, keywords: string[]) {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

export function getZenRecommendations(reflection: Pick<DailyReflection, "overview" | "energy" | "focus" | "rest" | "mood" | "luckyColor">): ZenRecommendation {
  const combined = [
    reflection.overview,
    reflection.energy,
    reflection.focus,
    reflection.rest,
    reflection.mood,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (contains(combined, ["stress", "overwhelm", "anxious", "tension", "heavy"])) {
    return {
      affirmation: "I can soften the pace and return to steady ground.",
      journalPrompt: "What feels most charged right now, and what would support me in meeting it with less force?",
      breathingType: "calm",
      meditationSuggestion: "Try a grounding meditation with longer exhales and body awareness.",
      soundSuggestion: "Forest rain or soft ocean layers.",
      sleepSuggestion: "Keep your evening low-stimulation and let your exhale lengthen before bed.",
      auraColor: reflection.luckyColor ?? "Soft Lavender",
    };
  }

  if (contains(combined, ["focus", "clarity", "work", "attention", "organize"])) {
    return {
      affirmation: "My mind can be clear without becoming hard.",
      journalPrompt: "What is the one thing worth protecting my attention for today?",
      breathingType: "box",
      meditationSuggestion: "Choose a shorter focus reset with minimal narration and clear pauses.",
      soundSuggestion: "Wind, forest, or a clean ambient study soundscape.",
      auraColor: reflection.luckyColor ?? "Silver Blue",
    };
  }

  if (contains(combined, ["rest", "sleep", "recover", "restore", "evening"])) {
    return {
      affirmation: "Rest is part of my rhythm, not a reward I have to earn.",
      journalPrompt: "Where could I lower the volume of today so tonight feels more restorative?",
      breathingType: "4-7-8",
      meditationSuggestion: "A sleep wind-down or body-scan will match today’s softer energy well.",
      soundSuggestion: "Ocean or rain with low brightness and gentle pacing.",
      sleepSuggestion: "Dim lights early and let screens end before your wind-down begins.",
      auraColor: reflection.luckyColor ?? "Midnight Blue",
    };
  }

  return {
    affirmation: "I can move with calm confidence and trust my inner timing.",
    journalPrompt: "What intention would help me move through today with more ease and less urgency?",
    breathingType: "deep-reset",
    meditationSuggestion: "An intention-setting meditation will work well with today’s energy.",
    soundSuggestion: "Birds, light wind, or sunrise ambience.",
    auraColor: reflection.luckyColor ?? "Golden Amber",
  };
}