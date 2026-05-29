export type MeditationMode = "meditation" | "breathing" | "sleep";
export type BreathingStyle = "none" | "calm" | "box" | "4-7-8" | "deep-reset";
export type MeditationSessionStatus =
  | "preparing"
  | "ready"
  | "playing"
  | "paused"
  | "completed"
  | "stopped"
  | "abandoned";

export type MeditationSetupState = {
  mode: MeditationMode;
  mood: string;
  duration: string;
  voice: string;
  sound: string;
  breathingStyle: BreathingStyle;
  meditationType: string;
  visual: string;
  checkIn: string;
  narrationMode: "voice" | "transcript";
};

export type MeditationSessionRecord = {
  id: string;
  mode: MeditationMode;
  title: string;
  mood: string;
  durationMinutes: number;
  durationLabel: string;
  meditationType: string;
  voice: string;
  sound: string | null;
  soundLabel: string | null;
  breathingStyle: string | null;
  scriptText: string;
  audioUrl: string | null;
  status: MeditationSessionStatus;
  startedAt: string | null;
  pausedAt: string | null;
  completedAt: string | null;
  elapsedSeconds: number;
  visual: string;
  narrationMode: "voice" | "transcript";
  sourceContext: string | null;
  legacySessionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MeditationCompletionState = {
  kind: "completed" | "stopped";
  session: MeditationSessionRecord;
  streaks?: {
    currentStreak: number;
    longestStreak: number;
    meditationStreak: number;
    sleepStreak: number;
    reflectionStreak: number;
    sessionsThisWeek: number;
    totalSessions: number;
    completedSessions: number;
  } | null;
};

export type MeditationHistoryEntry = {
  id: string;
  sessionId: string | null;
  type: string;
  title: string;
  summary: string | null;
  metadataJson: unknown;
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  status: string;
};

export type StartSessionPayload = MeditationSetupState & {
  title?: string | null;
  sourceContext?: string | null;
  scriptText?: string | null;
};

export const DEFAULT_MEDITATION_SETUP: MeditationSetupState = {
  mode: "meditation",
  mood: "Calm",
  duration: "5 min",
  voice: "marin",
  sound: "ocean",
  breathingStyle: "calm",
  meditationType: "stress_relief",
  visual: "mist",
  checkIn: "",
  narrationMode: "voice",
};

export const MEDITATION_MOODS = [
  "Calm",
  "Overwhelmed",
  "Unfocused",
  "Low Energy",
  "Sleepy",
  "Anxious",
  "Focused",
] as const;

export const MEDITATION_DURATIONS = ["1 min", "3 min", "5 min", "10 min", "15 min", "20 min"] as const;

export const BREATHING_STYLE_OPTIONS: Array<{ value: BreathingStyle; label: string; description: string }> = [
  { value: "none", label: "None", description: "Keep the orb ambient without paced breath prompts." },
  { value: "calm", label: "Calm breathing", description: "A slow inhale and longer exhale to steady the nervous system." },
  { value: "box", label: "Box breathing", description: "Equal inhale, hold, exhale, and rest phases." },
  { value: "4-7-8", label: "4-7-8", description: "A deeper hold and long exhale for evening calm." },
  { value: "deep-reset", label: "Deep reset", description: "A shorter inhale and grounded exhale for a quick reset." },
];

export const SESSION_STATUS_LABELS: Record<MeditationSessionStatus, string> = {
  preparing: "Preparing",
  ready: "Ready",
  playing: "Playing",
  paused: "Paused",
  completed: "Completed",
  stopped: "Stopped",
  abandoned: "Discarded",
};