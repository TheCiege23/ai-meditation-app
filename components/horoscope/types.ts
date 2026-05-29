export type HoroscopeView = "daily" | "weekly" | "zen-guidance";

export type CosmicProfile = {
  name: string;
  birthdate: string | null;
  sign: string;
  signLabel: string;
  cosmicLine: string;
  premium: boolean;
};

export type DailyReflection = {
  sign: string;
  date: string;
  overview: string;
  energy?: string;
  love?: string;
  focus?: string;
  rest?: string;
  mood?: string;
  luckyColor?: string;
  luckyNumber?: string;
  source: "freeastroapi" | "mock";
  rangeLabel?: string;
  range?: string;
};

export type ActionTile = {
  id: string;
  title: string;
  description: string;
  cta: string;
  premium?: boolean;
};

export type DailyAffirmation = {
  text: string;
  whisper: string;
};

export type JournalPrompt = {
  title: string;
  prompt: string;
  tone: string;
};

export type BreathworkSuggestion = {
  title: string;
  pattern: string;
  duration: string;
  reason: string;
  guidance: string;
};

export type AuraInsight = {
  colorName: string;
  theme: string;
  description: string;
  gradientClassName: string;
  glowClassName: string;
};

export type ContinueCalm = {
  title: string;
  description: string;
  cta: string;
};

export type SleepSuggestion = {
  title: string;
  description: string;
  cta: string;
};