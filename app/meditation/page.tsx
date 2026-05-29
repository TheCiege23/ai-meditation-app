"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminButton from "@/components/shared/AdminButton";
import BreathingCircle, {
  type BreathingPhase,
  type BreathingTheme,
} from "@/components/BreathingCircle";
import ZenBackground from "@/components/ZenBackground";
import HomeCreatePanel from "@/components/home/HomeCreatePanel";
import HomeSessionList from "@/components/home/HomeSessionList";
import { useSubscriptionPrompt } from "@/components/billing/SubscriptionPromptProvider";
import DailyReflectionCard from "@/components/horoscope/DailyReflectionCard";
import type { DailyReflection } from "@/components/horoscope/types";
import LanguageSelector from "@/components/language/LanguageSelector";
import { useLanguage } from "@/components/language/LanguageContext";
import { getHomeCopy, getTimerStyleLabel, getVisualSceneLabel } from "@/lib/home-translations";
import MoodCheckModal from "@/components/wellness/MoodCheckModal";

type SessionMode = "meditation" | "breathing" | "yoga";
type Tab = "create" | "history" | "favorites";

type VisualScene = {
  label: string;
  value: string;
  description: string;
  background: string;
  overlay: string;
  breathingTheme: BreathingTheme;
};

type BreathingPattern = {
  label: string;
  value: string;
  description: string;
  inhale: number;
  hold: number;
  exhale: number;
};

type SessionHistoryItem = {
  sessionId: string;
  mode: string;
  meditationType: string;
  mood: string;
  duration: string;
  breathingPattern: string | null;
  voice: string;
  visual: string;
  sounds: string[];
  text: string;
  isFavorite: boolean;
  playCount: number;
  completedCount: number;
  createdAt: string;
};

type Preset = {
  presetId: string;
  name: string;
  mode: string;
  meditationType: string;
  breathingPattern: string | null;
  voiceTone: string;
  visual: string;
  duration: string;
  sounds: string[];
};

type VoiceTone = {
  label: string;
  value: string;
  description: string;
  voice: string;
};

type SoundOption = {
  label: string;
  value: string;
  file: string;
  icon: string;
  accent: string;
};

type SubscriptionTier = "free" | "premium";

type CurrentUser = {
  userId: string;
  email: string | null;
  displayName: string;
  isGuest: boolean;
  role: "user" | "admin" | "super_admin";
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
};

type ViewerEntitlements = {
  tier: SubscriptionTier;
  maxDailyMeditations: number | null;
  maxDurationMinutes: number;
  premiumVoices: boolean;
  sleepMode: boolean;
  soundMixer: boolean;
  sessionHistory: boolean;
  dailyPlans: boolean;
  allowedVoiceTones: string[];
  allowedSounds: string[];
  maxSounds: number;
  allowedVisuals?: string[];
  allowedTimerStyles?: string[];
};

const meditationTypes = [
  { label: "Stress Relief", value: "stress_relief" },
  { label: "Focus", value: "focus" },
  { label: "Sleep", value: "sleep" },
  { label: "Energy", value: "energy" },
  { label: "Anxiety Reset", value: "anxiety_reset" },
  { label: "Quick Calm", value: "quick_calm" },
];

const zodiacSigns = [
  { label: "Aries", value: "aries" },
  { label: "Taurus", value: "taurus" },
  { label: "Gemini", value: "gemini" },
  { label: "Cancer", value: "cancer" },
  { label: "Leo", value: "leo" },
  { label: "Virgo", value: "virgo" },
  { label: "Libra", value: "libra" },
  { label: "Scorpio", value: "scorpio" },
  { label: "Sagittarius", value: "sagittarius" },
  { label: "Capricorn", value: "capricorn" },
  { label: "Aquarius", value: "aquarius" },
  { label: "Pisces", value: "pisces" },
];

const soundOptions: SoundOption[] = [
  { label: "Soft Rain", value: "Raindrop", file: "/sounds/Raindrop.mp3", icon: "RN", accent: "from-sky-500/20 to-blue-500/10" },
  { label: "Gentle Ocean", value: "ocean", file: "/sounds/ocean.mp3", icon: "OC", accent: "from-cyan-500/20 to-indigo-500/10" },
  { label: "Forest Ambience", value: "forest", file: "/sounds/forest.mp3", icon: "FR", accent: "from-emerald-500/20 to-lime-500/10" },
  { label: "Campfire Glow", value: "Campfire", file: "/sounds/Campfire.mp3", icon: "CF", accent: "from-orange-500/20 to-amber-500/10" },
  { label: "Morning Birds", value: "Birds", file: "/sounds/Birds.mp3", icon: "BD", accent: "from-violet-500/20 to-sky-500/10" },
  { label: "Soft Wind", value: "Wind", file: "/sounds/Wind.mp3", icon: "WD", accent: "from-slate-500/20 to-blue-500/10" },
];

const voiceTones: VoiceTone[] = [
  { label: "Calm Female", value: "calm-female", description: "Gentle and balanced.", voice: "marin" },
  { label: "Deep Male", value: "deep-male", description: "Grounded and warm.", voice: "onyx" },
  { label: "Soft Guide", value: "soft-guide", description: "Smooth and comforting.", voice: "sage" },
  { label: "Whisper Guide", value: "whisper-guide", description: "Very soft and bedtime style.", voice: "verse" },
];

const visualScenes: VisualScene[] = [
  {
    label: "Morning Mist",
    value: "mist",
    description: "Soft sky tones with a clean, airy feeling.",
    background: "linear-gradient(180deg, #f0f9ff 0%, #dbeafe 100%)",
    overlay: "radial-gradient(circle at 50% 40%, rgba(224, 242, 254, 0.45), rgba(224, 242, 254, 0.08) 60%, transparent 80%)",
    breathingTheme: "mist",
  },
  {
    label: "Golden Sunrise",
    value: "sunrise",
    description: "Warm light and amber tones for uplifting calm.",
    background: "linear-gradient(180deg, #fff7ed 0%, #ffedd5 45%, #fde68a 100%)",
    overlay: "radial-gradient(circle at 50% 35%, rgba(255, 237, 213, 0.5), rgba(253, 186, 116, 0.12) 65%, transparent 82%)",
    breathingTheme: "sunrise",
  },
  {
    label: "Forest Calm",
    value: "forest",
    description: "Natural greens with grounded softness.",
    background: "linear-gradient(180deg, #ecfdf5 0%, #dcfce7 45%, #bbf7d0 100%)",
    overlay: "radial-gradient(circle at 50% 38%, rgba(220, 252, 231, 0.5), rgba(74, 222, 128, 0.12) 65%, transparent 82%)",
    breathingTheme: "forest",
  },
  {
    label: "Night Tide",
    value: "night",
    description: "Deep blue tones for evening wind-down sessions.",
    background: "linear-gradient(180deg, #0f172a 0%, #1e3a8a 52%, #1d4ed8 100%)",
    overlay: "radial-gradient(circle at 50% 34%, rgba(147, 197, 253, 0.36), rgba(59, 130, 246, 0.1) 65%, transparent 82%)",
    breathingTheme: "night",
  },
  {
    label: "Ocean Dusk",
    value: "ocean-dusk",
    description: "Soft teal and dusk tones for calm focus.",
    background: "linear-gradient(180deg, #0c4a6e 0%, #0e7490 40%, #06b6d4 100%)",
    overlay: "radial-gradient(circle at 50% 35%, rgba(34, 211, 238, 0.25), transparent 70%)",
    breathingTheme: "night",
  },
  {
    label: "Starfield",
    value: "starfield",
    description: "Dark ambient with subtle star-like glow.",
    background: "linear-gradient(180deg, #020617 0%, #0f172a 50%, #1e1b4b 100%)",
    overlay: "radial-gradient(circle at 50% 30%, rgba(129, 140, 248, 0.15), transparent 60%)",
    breathingTheme: "night",
  },
];

const timerStyles: Array<{ label: string; value: string }> = [
  { label: "Minimal ring", value: "minimal-ring" },
  { label: "Zen ring", value: "zen-ring" },
  { label: "Glowing orb", value: "glowing-orb" },
  { label: "Lotus bloom", value: "lotus-bloom" },
  { label: "Mandala pulse", value: "mandala-pulse" },
  { label: "Wave", value: "wave" },
];

const breathingPatterns: BreathingPattern[] = [
  { label: "Balanced (4-4-6)", value: "balanced-446", description: "Steady rhythm.", inhale: 4, hold: 4, exhale: 6 },
  { label: "Box (4-4-4)", value: "box-444", description: "Even rhythm.", inhale: 4, hold: 4, exhale: 4 },
  { label: "Relaxing (4-7-8)", value: "relax-478", description: "Long exhale pattern.", inhale: 4, hold: 7, exhale: 8 },
];

const CHUNK_CHAR_LIMIT = 2400;

const defaultEntitlements: ViewerEntitlements = {
  tier: "free",
  maxDailyMeditations: 3,
  maxDurationMinutes: 5,
  premiumVoices: false,
  sleepMode: false,
  soundMixer: false,
  sessionHistory: false,
  dailyPlans: false,
  allowedVoiceTones: ["calm-female"],
  allowedSounds: ["Raindrop", "ocean", "forest"],
  maxSounds: 1,
  allowedVisuals: ["mist", "sunrise"],
  allowedTimerStyles: ["minimal-ring", "zen-ring"],
};

const landingMeditationTypes = meditationTypes.filter(
  (type) => type.value === "quick_calm" || type.value === "stress_relief"
);
const landingMoods = ["Calm", "Overwhelmed"];
const landingDurations = ["3 min", "5 min"];
const landingVoiceTones: VoiceTone[] = [
  {
    label: "ChimAura Guide",
    value: "calm-female",
    description: "Warm, clear, and easy to follow.",
    voice: "marin",
  },
];
const landingVisualScenes = visualScenes.filter(
  (scene) => scene.value === "mist" || scene.value === "sunrise"
);

function filterVisualScenesByEntitlements(
  scenes: VisualScene[],
  allowed: string[] | undefined
): VisualScene[] {
  if (!allowed?.length) return landingVisualScenes;
  return scenes.filter((s) => allowed.includes(s.value));
}

function filterTimerStylesByEntitlements(
  styles: Array<{ label: string; value: string }>,
  allowed: string[] | undefined
): Array<{ label: string; value: string }> {
  if (!allowed?.length) return styles.filter((s) => s.value === "minimal-ring" || s.value === "zen-ring");
  return styles.filter((s) => allowed.includes(s.value));
}

function SessionTimerVisual({
  style,
  progressRatio,
}: {
  style: string;
  progressRatio: number;
}) {
  const deg = Math.round(progressRatio * 360);
  const sizeClass = "relative mb-8 h-32 w-32";

  if (style === "zen-ring") {
    return (
      <div
        className={`${sizeClass} rounded-full border-[6px] border-white/20 shadow-[0_0_50px_rgba(56,189,248,0.4)]`}
        style={{
          background: `conic-gradient(rgba(56,189,248,0.95) ${deg}deg, rgba(255,255,255,0.08) 0deg)`,
          mask: "radial-gradient(farthest-side, transparent calc(100% - 6px), black calc(100% - 5px))",
          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 6px), black calc(100% - 5px))",
        }}
      />
    );
  }

  if (style === "glowing-orb") {
    return (
      <div className={`${sizeClass} flex items-center justify-center`}>
        <div
          className="h-full w-full rounded-full shadow-[0_0_60px_rgba(56,189,248,0.5),inset_0_0_30px_rgba(255,255,255,0.1)]"
          style={{
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), rgba(56,189,248,${0.3 + progressRatio * 0.6}) ${progressRatio * 100}%, rgba(15,23,42,0.6) 100%)`,
          }}
        />
      </div>
    );
  }

  if (style === "lotus-bloom") {
    return (
      <div className={`${sizeClass} flex items-center justify-center`}>
        <div
          className="absolute h-24 w-24 rounded-full border-2 border-white/30 opacity-60"
          style={{ transform: `scale(${0.6 + progressRatio * 0.4})` }}
        />
        <div
          className="absolute h-20 w-20 rounded-full border-2 border-cyan-300/50"
          style={{ transform: `scale(${0.7 + progressRatio * 0.3})` }}
        />
        <div
          className="h-16 w-16 rounded-full border-2 border-cyan-200/70 shadow-[0_0_30px_rgba(34,211,238,0.4)]"
          style={{
            background: `conic-gradient(rgba(34,211,238,0.9) ${deg}deg, transparent 0deg)`,
            mask: "radial-gradient(farthest-side, transparent 55%, black 56%)",
            WebkitMask: "radial-gradient(farthest-side, transparent 55%, black 56%)",
          }}
        />
      </div>
    );
  }

  if (style === "mandala-pulse") {
    return (
      <div
        className={`${sizeClass} rounded-full border-2 border-white/25 shadow-[0_0_45px_rgba(139,92,246,0.35)] animate-pulse`}
        style={{
          background: `conic-gradient(rgba(139,92,246,0.9) ${deg}deg, rgba(255,255,255,0.1) 0deg)`,
          mask: "radial-gradient(farthest-side, transparent calc(100% - 10px), black calc(100% - 9px))",
          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 10px), black calc(100% - 9px))",
        }}
      />
    );
  }

  if (style === "wave") {
    return (
      <div className={`${sizeClass} flex items-center justify-center overflow-visible`}>
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <linearGradient id="wave-fill" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(56,189,248,0.2)" />
              <stop offset="100%" stopColor="rgba(56,189,248,0.9)" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#wave-fill)"
            strokeWidth="4"
            strokeDasharray={`${2 * Math.PI * 45 * progressRatio} ${2 * Math.PI * 45}`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full border border-white/15 shadow-[0_0_40px_rgba(255,255,255,0.12)]`}
      style={{
        background: `conic-gradient(#38bdf8 ${deg}deg, rgba(255,255,255,0.15) 0deg)`,
      }}
    />
  );
}
const landingBreathingPatterns = breathingPatterns.filter(
  (pattern) => pattern.value === "balanced-446" || pattern.value === "box-444"
);
const landingSoundOptions = soundOptions.filter(
  (option) => option.value === "Raindrop" || option.value === "ocean"
);

const yogaFocusOptions: Array<{ label: string; value: string }> = [
  { label: "Full Body Flow", value: "full_body" },
  { label: "Flexibility", value: "flexibility" },
  { label: "Strength", value: "strength" },
  { label: "Mobility", value: "mobility" },
  { label: "Recovery", value: "recovery" },
  { label: "Balance", value: "balance" },
];

const yogaLevelOptions: Array<{ label: string; value: "beginner" | "intermediate" | "advanced" }> = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

function splitLongSentence(sentence: string, maxChars: number) {
  const pieces: string[] = [];
  let remaining = sentence.trim();

  while (remaining.length > maxChars) {
    let splitIndex = remaining.lastIndexOf(" ", maxChars);
    if (splitIndex < Math.floor(maxChars * 0.6)) {
      splitIndex = maxChars;
    }
    pieces.push(remaining.slice(0, splitIndex).trim());
    remaining = remaining.slice(splitIndex).trim();
  }

  if (remaining) {
    pieces.push(remaining);
  }

  return pieces;
}

function splitParagraphIntoSegments(paragraph: string, maxChars: number) {
  if (paragraph.length <= maxChars) {
    return [paragraph];
  }

  const sentences = paragraph.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);
  const segments: string[] = [];
  let currentSegment = "";

  for (const sentence of sentences) {
    const candidate = currentSegment ? `${currentSegment} ${sentence}` : sentence;
    if (candidate.length <= maxChars) {
      currentSegment = candidate;
      continue;
    }

    if (currentSegment) {
      segments.push(currentSegment.trim());
      currentSegment = "";
    }

    if (sentence.length <= maxChars) {
      currentSegment = sentence;
      continue;
    }

    const longSentencePieces = splitLongSentence(sentence, maxChars);
    const lastPiece = longSentencePieces.pop();
    segments.push(...longSentencePieces);
    currentSegment = lastPiece ?? "";
  }

  if (currentSegment) {
    segments.push(currentSegment.trim());
  }

  return segments;
}

function splitMeditationIntoChunks(text: string, maxChars = CHUNK_CHAR_LIMIT) {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return [];

  const segments = paragraphs.flatMap((paragraph) => splitParagraphIntoSegments(paragraph, maxChars));
  const chunks: string[] = [];
  let currentChunk = "";

  for (const segment of segments) {
    const candidate = currentChunk ? `${currentChunk}\n\n${segment}` : segment;
    if (candidate.length <= maxChars) {
      currentChunk = candidate;
      continue;
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    currentChunk = segment;
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(Boolean);
}

function durationToSeconds(duration: string) {
  const mins = Number(duration.split(" ")[0]);
  return Number.isNaN(mins) ? 300 : mins * 60;
}

function estimateSessionSeconds(
  text: string,
  mode: SessionMode,
  fallbackSeconds: number
) {
  const trimmed = text.trim();
  if (!trimmed) return fallbackSeconds;

  const words = trimmed.split(/\s+/).filter(Boolean).length;
  if (!words) return fallbackSeconds;

  const wordsPerMinute = mode === "breathing" ? 60 : 78;
  const narrationSeconds = Math.round((words / wordsPerMinute) * 60);

  // Never allow the visual session to feel shorter than the requested duration.
  return Math.max(fallbackSeconds, narrationSeconds);
}

function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function buildQuickBreathingScript(pattern: BreathingPattern, duration: string) {
  const totalSeconds = durationToSeconds(duration);
  const cycleSeconds = Math.max(1, pattern.inhale + pattern.hold + pattern.exhale);
  const spokenCycles = Math.max(8, Math.min(72, Math.floor(totalSeconds / cycleSeconds)));
  const cueVariants = [
    `Inhale for ${pattern.inhale}. Hold for ${pattern.hold}. Exhale for ${pattern.exhale}. Let the shoulders soften as the breath leaves the body.`,
    `Again, breathe in for ${pattern.inhale}. Hold for ${pattern.hold}. Breathe out for ${pattern.exhale}. Stay easy inside the count instead of forcing it.`,
    `Take the next inhale for ${pattern.inhale}. Pause for ${pattern.hold}. Release for ${pattern.exhale}. Let the exhale feel like a quiet reset.`,
    `One more slow breath. Inhale for ${pattern.inhale}. Hold for ${pattern.hold}. Exhale for ${pattern.exhale}. Let the jaw loosen and the chest stay open.`,
  ];

  const sections = [
    `Welcome to this ${duration} breathing session. We are using a ${pattern.inhale}-${pattern.hold}-${pattern.exhale} rhythm to help the body settle.`,
    `Let the breath be steady and kind. If the mind drifts, come back to the count and the feeling of air moving in and out.`,
  ];

  for (let index = 0; index < spokenCycles; index += 1) {
    sections.push(cueVariants[index % cueVariants.length]);
  }

  sections.push(
    `For the final moments, keep the breath smooth and natural. Notice how the body feels now compared with when you began.`,
    `When you are ready, let go of the count and return to an easy breath. Carry this steadier pace into the rest of your day.`
  );

  return sections.join("\n\n");
}

function buildFallbackPreviewReflection(signValue: string): DailyReflection {
  const signLabel = zodiacSigns.find((sign) => sign.value === signValue)?.label ?? signValue;

  return {
    sign: signLabel,
    date: new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date()),
    overview:
      "Your live horoscope is taking a breath, so here is a gentle fallback reflection: move slowly, protect your focus, and choose one calming ritual that helps you feel steady today.",
    energy: "Soft reset",
    focus: "Keep your next step simple",
    rest: "Leave more space between demands",
    mood: "Grounded and open",
    luckyColor: "Sky Bloom",
    luckyNumber: "8",
    source: "mock",
  };
}

export default function MeditationPage({
  searchParams,
}: {
  searchParams?: { mode?: string; mood?: string; duration?: string };
}) {
  const [tab, setTab] = useState<Tab>("create");
  const [sessionMode, setSessionMode] = useState<SessionMode>(
    searchParams?.mode === "breathing"
      ? "breathing"
      : searchParams?.mode === "yoga"
        ? "yoga"
        : "meditation"
  );
  const [selectedMood, setSelectedMood] = useState(
    searchParams?.mood ? searchParams.mood : "Calm"
  );
  const [selectedDuration, setSelectedDuration] = useState(
    searchParams?.duration ? searchParams.duration : "3 min"
  );
  const [selectedMeditationType, setSelectedMeditationType] = useState("quick_calm");
  const [selectedSounds, setSelectedSounds] = useState<string[]>(["Raindrop"]);
  const [selectedVisual, setSelectedVisual] = useState("mist");
  const [selectedTimerStyle, setSelectedTimerStyle] = useState("minimal-ring");
  const [selectedPattern, setSelectedPattern] = useState("balanced-446");
  const [selectedYogaFocus, setSelectedYogaFocus] = useState("full_body");
  const [selectedYogaLevel, setSelectedYogaLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [selectedVoiceTone, setSelectedVoiceTone] = useState("calm-female");
  const [moodCheckIn, setMoodCheckIn] = useState("");
  const [meditationText, setMeditationText] = useState("");
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [heygenVideoId, setHeygenVideoId] = useState<string | null>(null);
  const [meditationVideoUrl, setMeditationVideoUrl] = useState<string | null>(null);
  const [videoStatusMessage, setVideoStatusMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<BreathingPhase>("Inhale");
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSessionScreen, setShowSessionScreen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<SessionHistoryItem[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [stats, setStats] = useState({ totalSessions: 0, completedSessions: 0, streakDays: 0 });
  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [entitlements, setEntitlements] = useState<ViewerEntitlements>(defaultEntitlements);
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up" | null>(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [billingMessage, setBillingMessage] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [selectedHoroscopeSign, setSelectedHoroscopeSign] = useState("aries");
  const [dailyReflection, setDailyReflection] = useState<DailyReflection | null>(null);
  const [isLoadingReflection, setIsLoadingReflection] = useState(false);
  const [reflectionError, setReflectionError] = useState("");
  const [showMoodCheckModal, setShowMoodCheckModal] = useState(false);
  const { language } = useLanguage();
  const { openPrompt } = useSubscriptionPrompt();
  const copy = getHomeCopy(language);

  const afterMoodCheckRef = useRef<(() => void) | null>(null);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const ambientPlayersRef = useRef<HTMLAudioElement[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playbackSessionRef = useRef(0);
  const generationDoneRef = useRef(false);
  const chunkQueueRef = useRef<string[]>([]);
  const activeObjectUrlsRef = useRef<string[]>([]);
  const pendingControllersRef = useRef<AbortController[]>([]);
  const nextChunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heygenPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const visualScenesForUser = useMemo(
    () => filterVisualScenesByEntitlements(visualScenes, entitlements.allowedVisuals),
    [entitlements.allowedVisuals]
  );

  const timerStylesForUser = useMemo(
    () => filterTimerStylesByEntitlements(timerStyles, entitlements.allowedTimerStyles),
    [entitlements.allowedTimerStyles]
  );

  const visualScenesForUserTranslated = useMemo(
    () => visualScenesForUser.map((s) => ({ ...s, label: getVisualSceneLabel(s.value, language) })),
    [visualScenesForUser, language]
  );

  const timerStylesForUserTranslated = useMemo(
    () => timerStylesForUser.map((s) => ({ ...s, label: getTimerStyleLabel(s.value, language) })),
    [timerStylesForUser, language]
  );

  const currentVisual = useMemo(
    () => visualScenes.find((scene) => scene.value === selectedVisual) ?? visualScenes[0],
    [selectedVisual]
  );

  const currentPattern = useMemo(
    () => breathingPatterns.find((pattern) => pattern.value === selectedPattern) ?? breathingPatterns[0],
    [selectedPattern]
  );

  const selectedVoice = useMemo(
    () => voiceTones.find((tone) => tone.value === selectedVoiceTone)?.voice ?? "marin",
    [selectedVoiceTone]
  );

  const progressRatio = totalSeconds > 0 ? 1 - remainingSeconds / totalSeconds : 0;
  const surfaceClass = darkMode
    ? "rounded-3xl border border-white/10 bg-slate-900/80 shadow-lg backdrop-blur"
    : "rounded-3xl bg-white/85 shadow-lg backdrop-blur";
  const sectionHeadingClass = darkMode ? "text-lg font-semibold text-slate-100" : "text-lg font-semibold text-slate-800";
  const secondaryTextClass = darkMode ? "text-slate-300" : "text-slate-600";
  const fieldClass = darkMode
    ? "rounded-xl border border-white/10 bg-slate-800/90 px-3 py-2 text-slate-100 placeholder:text-slate-400"
    : "rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700";
  const isGuestView = currentUser?.isGuest !== false;
  const currentPlan: "guest" | "free" | "premium" = isGuestView
    ? "guest"
    : currentUser?.subscriptionTier === "premium"
      ? "premium"
      : "free";
  const voiceTonesForUser = useMemo(() => {
    if (currentPlan !== "premium") {
      return landingVoiceTones;
    }

    return voiceTones.filter((tone) => entitlements.allowedVoiceTones.includes(tone.value));
  }, [currentPlan, entitlements.allowedVoiceTones]);

  const loadDashboard = useCallback(async () => {
    const response = await fetch("/api/session-data", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setHistory(data.recent ?? []);
    setFavorites(data.favorites ?? []);
    setPresets(data.presets ?? []);
    setStats(data.stats ?? { totalSessions: 0, completedSessions: 0, streakDays: 0 });
    setCurrentUser(data.currentUser ?? null);
    setEntitlements(data.entitlements ?? defaultEntitlements);
    if (data.preferences) {
      setSelectedVoiceTone(data.preferences.preferredVoiceTone ?? "calm-female");
      setSelectedVisual(data.preferences.preferredVisual ?? "mist");
      setSelectedTimerStyle(data.preferences.preferredTimerStyle ?? "minimal-ring");
      setSelectedDuration(data.preferences.preferredDuration ?? "5 min");
      setSelectedSounds(data.preferences.preferredSounds ?? []);
    }
  }, []);

  const loadDailyReflection = useCallback(async (sign: string) => {
    try {
      setIsLoadingReflection(true);
      setReflectionError("");
      const params = new URLSearchParams({ sign, range: "day", language });
      const response = await fetch(`/api/horoscope/daily?${params.toString()}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as DailyReflection & { error?: string };
      if (!response.ok) {
        setDailyReflection(buildFallbackPreviewReflection(sign));
        setReflectionError("Showing a calm fallback reflection while the live horoscope reconnects.");
        return;
      }

      setDailyReflection(data);
      setReflectionError("");
    } catch (error) {
      console.error("Daily horoscope preview failed:", error);
      setDailyReflection(buildFallbackPreviewReflection(sign));
      setReflectionError("Showing a calm fallback reflection while the live horoscope reconnects.");
    } finally {
      setIsLoadingReflection(false);
    }
  }, [language]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    void loadDailyReflection(selectedHoroscopeSign);
  }, [loadDailyReflection, selectedHoroscopeSign]);

  useEffect(() => {
    const nextVoiceTone = entitlements.allowedVoiceTones.includes("calm-female")
      ? "calm-female"
      : entitlements.allowedVoiceTones[0] ?? "calm-female";
    if (selectedVoiceTone !== nextVoiceTone) {
      setSelectedVoiceTone(nextVoiceTone);
    }

    const allowedLandingSounds = landingSoundOptions
      .map((option) => option.value)
      .filter((sound) => entitlements.allowedSounds.includes(sound));
    const fallbackSound = allowedLandingSounds[0] ?? "";
    const clampedSounds = selectedSounds.filter((sound) => allowedLandingSounds.includes(sound)).slice(0, 1);
    const nextSounds = clampedSounds.length > 0 ? clampedSounds : fallbackSound ? [fallbackSound] : [];
    if (nextSounds.join("|") !== selectedSounds.join("|")) {
      setSelectedSounds(nextSounds);
    }

    const durationMinutes = Number(selectedDuration.split(" ")[0]);
    if (durationMinutes > entitlements.maxDurationMinutes || !landingDurations.includes(selectedDuration)) {
      const fallbackDuration =
        landingDurations[0] ?? "5 min";
      if (selectedDuration !== fallbackDuration) {
        setSelectedDuration(fallbackDuration);
      }
    }

    if (!landingMeditationTypes.some((item) => item.value === selectedMeditationType)) {
      setSelectedMeditationType("quick_calm");
    }

    if (!landingMoods.includes(selectedMood)) {
      setSelectedMood("Calm");
    }

    const allowedVisuals = filterVisualScenesByEntitlements(visualScenes, entitlements.allowedVisuals);
    if (!allowedVisuals.some((scene) => scene.value === selectedVisual)) {
      setSelectedVisual(allowedVisuals[0]?.value ?? "mist");
    }
    const allowedTimerStyles = filterTimerStylesByEntitlements(timerStyles, entitlements.allowedTimerStyles);
    if (allowedTimerStyles.length > 0 && !allowedTimerStyles.some((s) => s.value === selectedTimerStyle)) {
      setSelectedTimerStyle(allowedTimerStyles[0]?.value ?? "minimal-ring");
    }

    if (!landingBreathingPatterns.some((pattern) => pattern.value === selectedPattern)) {
      setSelectedPattern("balanced-446");
    }

    if (!entitlements.sessionHistory && tab !== "create") {
      setTab("create");
    }
  }, [
    entitlements,
    selectedDuration,
    selectedMeditationType,
    selectedMood,
    selectedPattern,
    selectedSounds,
    selectedVisual,
    selectedVoiceTone,
    selectedTimerStyle,
    tab,
  ]);

  useEffect(() => {
    void fetch("/api/session-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save-preferences",
        preferredVoiceTone: selectedVoiceTone,
        preferredVisual: selectedVisual,
        preferredTimerStyle: selectedTimerStyle,
        preferredDuration: selectedDuration,
        preferredSounds: selectedSounds,
      }),
    });
  }, [selectedVoiceTone, selectedVisual, selectedTimerStyle, selectedDuration, selectedSounds]);

  useEffect(() => {
    return () => {
      clearHeygenPoll();
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = (seconds: number) => {
    clearTimer();
    setTotalSeconds(seconds);
    setRemainingSeconds(seconds);
    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearNextChunkTimer = () => {
    if (nextChunkTimerRef.current) {
      clearTimeout(nextChunkTimerRef.current);
      nextChunkTimerRef.current = null;
    }
  };

  const clearHeygenPoll = () => {
    if (heygenPollRef.current) {
      clearTimeout(heygenPollRef.current);
      heygenPollRef.current = null;
    }
  };

  const abortPendingRequests = () => {
    for (const controller of pendingControllersRef.current) controller.abort();
    pendingControllersRef.current = [];
  };

  const revokeActiveObjectUrls = () => {
    for (const url of activeObjectUrlsRef.current) URL.revokeObjectURL(url);
    activeObjectUrlsRef.current = [];
  };

  const stopAmbient = () => {
    for (const player of ambientPlayersRef.current) {
      player.pause();
      player.currentTime = 0;
      player.src = "";
    }
    ambientPlayersRef.current = [];
  };

  const stopAllAudio = async () => {
    playbackSessionRef.current += 1;
    generationDoneRef.current = true;
    chunkQueueRef.current = [];
    clearNextChunkTimer();
    abortPendingRequests();
    revokeActiveObjectUrls();
    clearTimer();

    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      voiceAudioRef.current.currentTime = 0;
      voiceAudioRef.current.src = "";
      voiceAudioRef.current.onended = null;
    }

    stopAmbient();
    setIsPlaying(false);
    setShowSessionScreen(false);

    if (currentSessionId) {
      await fetch("/api/session-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-played", sessionId: currentSessionId, completed: false }),
      });
    }
  };

  const startAmbientMixer = async () => {
    stopAmbient();
    const chosen = soundOptions.filter((option) => selectedSounds.includes(option.value));
    if (chosen.length === 0) return;

    const players = chosen.map((sound) => {
      const player = new Audio(sound.file);
      player.loop = true;
      // Keep ambience clearly beneath narration; tuned for mobile/desktop.
      player.volume = 0.06;
      return player;
    });

    ambientPlayersRef.current = players;
    await Promise.all(
      players.map(async (player) => {
        try {
          await player.play();
        } catch (error) {
          console.error("Ambient playback error:", error);
        }
      })
    );
  };

  const fetchSpeechChunk = async (chunkText: string, sessionId: number, trackUsage: boolean) => {
    if (sessionId !== playbackSessionRef.current) return null;
    const controller = new AbortController();
    pendingControllersRef.current.push(controller);

    try {
      const response = await fetch("/api/generate-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: chunkText,
          voice: selectedVoice,
          mode: sessionMode,
          language,
          // Only some chunks should count against daily narration limits.
          trackUsage,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
        throw new Error(payload?.message || payload?.error || "Failed to generate speech chunk.");
      }

      if (sessionId !== playbackSessionRef.current) return null;
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      activeObjectUrlsRef.current.push(audioUrl);
      return audioUrl;
    } catch (error) {
      if (controller.signal.aborted) return null;
      throw error;
    } finally {
      pendingControllersRef.current = pendingControllersRef.current.filter((p) => p !== controller);
    }
  };

  const finishSession = async () => {
    setIsPlaying(false);
    setShowSessionScreen(false);
    clearTimer();
    stopAmbient();
    if (currentSessionId) {
      await fetch("/api/session-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-played", sessionId: currentSessionId, completed: true }),
      });
      await loadDashboard();
    }
  };

  const playNextChunk = async (sessionId: number) => {
    if (sessionId !== playbackSessionRef.current || !voiceAudioRef.current) return;
    clearNextChunkTimer();
    const nextChunkUrl = chunkQueueRef.current.shift();

    if (nextChunkUrl) {
      try {
        voiceAudioRef.current.src = nextChunkUrl;
        await voiceAudioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Chunk playback error:", error);
        await stopAllAudio();
      }
      return;
    }

    if (generationDoneRef.current) {
      if (remainingSeconds > 0) {
        nextChunkTimerRef.current = setTimeout(() => {
          void playNextChunk(sessionId);
        }, 400);
        return;
      }

      await finishSession();
      return;
    }

    nextChunkTimerRef.current = setTimeout(() => {
      void playNextChunk(sessionId);
    }, 140);
  };

  const playSessionText = async (text: string, sessionId: string | null) => {
    setIsGeneratingSpeech(true);
    await stopAllAudio();

    try {
      const playbackId = playbackSessionRef.current;
      const chunks = splitMeditationIntoChunks(text, CHUNK_CHAR_LIMIT);
      if (chunks.length === 0) {
        setMeditationText("Session text is empty.");
        return;
      }

      generationDoneRef.current = false;
      chunkQueueRef.current = [];
      await startAmbientMixer();

      // First chunk tracks usage; subsequent chunks for the same session do not.
      const firstChunkUrl = await fetchSpeechChunk(chunks[0], playbackId, true);
      if (!firstChunkUrl || playbackId !== playbackSessionRef.current || !voiceAudioRef.current) {
        return;
      }

      voiceAudioRef.current.onended = () => {
        void playNextChunk(playbackId);
      };

      voiceAudioRef.current.src = firstChunkUrl;
      await voiceAudioRef.current.play();

      setIsPlaying(true);
      setShowSessionScreen(true);
      if (sessionId) setCurrentSessionId(sessionId);

      const fallbackSeconds = durationToSeconds(selectedDuration);
      const estimatedSeconds = estimateSessionSeconds(
        text,
        sessionMode,
        fallbackSeconds
      );
      startTimer(estimatedSeconds);

      void (async () => {
        try {
          for (let i = 1; i < chunks.length; i += 1) {
            if (playbackId !== playbackSessionRef.current) return;
            const chunkUrl = await fetchSpeechChunk(chunks[i], playbackId, false);
            if (!chunkUrl) return;
            chunkQueueRef.current.push(chunkUrl);
          }
        } catch (error) {
          console.error("Background chunk generation error:", error);
        } finally {
          if (playbackId === playbackSessionRef.current) generationDoneRef.current = true;
        }
      })();
    } catch (error) {
      console.error("Narration playback error:", error);
      setMeditationText(error instanceof Error ? error.message : "Voice playback could not start.");
      await stopAllAudio();
    } finally {
      setIsGeneratingSpeech(false);
    }
  };

  const handleGenerate = async (overrides?: {
    sessionMode?: SessionMode;
    mood?: string;
    duration?: string;
    meditationType?: string;
    breathingPattern?: string;
    yogaFocus?: string;
    yogaLevel?: "beginner" | "intermediate" | "advanced";
    checkIn?: string;
    voice?: string;
    visual?: string;
    sounds?: string[];
  }) => {
    const requestBody = {
      mood: overrides?.mood ?? selectedMood,
      duration: overrides?.duration ?? selectedDuration,
      mode: overrides?.sessionMode ?? sessionMode,
      meditationType: overrides?.meditationType ?? selectedMeditationType,
      breathingPattern: overrides?.breathingPattern ?? currentPattern.value,
      yogaFocus: overrides?.yogaFocus ?? selectedYogaFocus,
      yogaLevel: overrides?.yogaLevel ?? selectedYogaLevel,
      checkIn: overrides?.checkIn ?? moodCheckIn,
      voice: overrides?.voice ?? selectedVoice,
      visual: overrides?.visual ?? selectedVisual,
      sounds: overrides?.sounds ?? selectedSounds,
      language,
    };

    try {
      setIsGeneratingText(true);
      setMeditationText("Generating your session...");

      const response = await fetch("/api/generate-meditation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json().catch(() => null)) as {
        meditation?: string;
        sessionId?: string;
        error?: string;
        message?: string;
        code?: string;
        signupRequired?: boolean;
      } | null;
      if (!response.ok) {
        if (data?.code === "GUEST_LIMIT_REACHED") {
          setMeditationText(
            data.message ?? "You’ve used your free guest session for today. Create a free account for 3 AI sessions per day."
          );
          setAuthMode("sign-up");
          return;
        }
        setMeditationText(data?.message || data?.error || "Something went wrong.");
        return;
      }

      setMeditationText(data?.meditation || "");
      setCurrentSessionId(data?.sessionId || null);
      await loadDashboard();
    } catch (error) {
      console.error("Session generation error:", error);
      setMeditationText("Something went wrong while generating your session.");
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handlePlay = async () => {
    if (!meditationText) return;
    const isSignedIn = currentUser && !currentUser.isGuest;
    if (isSignedIn && showMoodCheckModal === false) {
      afterMoodCheckRef.current = () => void playSessionText(meditationText, currentSessionId);
      setShowMoodCheckModal(true);
      return;
    }
    await playSessionText(meditationText, currentSessionId);
  };

  const handleMoodCheckSelect = (mood: string | null) => {
    if (mood) {
      setSelectedMood(mood.charAt(0).toUpperCase() + mood.slice(1));
      fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood }),
      }).catch(() => {});
    }
    setShowMoodCheckModal(false);
    const fn = afterMoodCheckRef.current;
    afterMoodCheckRef.current = null;
    if (fn) fn();
  };

  const handleMoodCheckSkip = () => {
    setShowMoodCheckModal(false);
    const fn = afterMoodCheckRef.current;
    afterMoodCheckRef.current = null;
    if (fn) fn();
  };

  const handleQuickBreathingStart = async () => {
    const script = buildQuickBreathingScript(currentPattern, selectedDuration);
    setMeditationText(script);

    const response = await fetch("/api/session-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "create-local-session",
        mode: "breathing",
        meditationType: "quick_calm",
        mood: selectedMood,
        duration: selectedDuration,
        breathingPattern: currentPattern.value,
        voice: selectedVoice,
        visual: selectedVisual,
        sounds: selectedSounds,
        text: script,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { sessionId?: string; error?: string; message?: string } | null;
    if (!response.ok) {
      setMeditationText(payload?.message || payload?.error || "Breathing session could not start.");
      return;
    }

    setCurrentSessionId(payload?.sessionId || null);
    await playSessionText(script, payload?.sessionId || null);
    await loadDashboard();
  };

  const handleStartInstantly = async () => {
    setSessionMode("meditation");
    setSelectedMood("Calm");
    setSelectedDuration("3 min");
    setSelectedMeditationType("quick_calm");
    setSelectedVoiceTone("calm-female");
    setSelectedVisual("mist");
    setSelectedSounds(["Raindrop"]);
    setMoodCheckIn("I want a short reset that feels clear and steady.");
    await handleGenerate({
      sessionMode: "meditation",
      mood: "Calm",
      duration: "3 min",
      meditationType: "quick_calm",
      breathingPattern: "balanced-446",
      checkIn: "I want a short reset that feels clear and steady.",
      voice: "marin",
      visual: "mist",
      sounds: ["Raindrop"],
    });
  };

  const handleAuthSubmit = async () => {
    const fallbackError = authMode === "sign-up"
      ? "Unable to create your account right now."
      : "Unable to sign in right now.";

    try {
      setIsAuthLoading(true);
      setAuthMessage("");
      const endpoint = authMode === "sign-up" ? "/api/auth/sign-up" : "/api/auth/sign-in";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, password: authPassword, displayName: authName }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
      if (!response.ok) {
        setAuthMessage(data?.error || data?.message || fallbackError);
        return;
      }
      setAuthMode(null);
      setAuthPassword("");
      setAuthMessage("");
      await loadDashboard();
    } catch (error) {
      console.error("Auth request failed:", error);
      setAuthMessage(fallbackError);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/sign-out", { method: "POST" });
    setAuthMode(null);
    setAuthName("");
    setAuthEmail("");
    setAuthPassword("");
    setBillingMessage("");
    await loadDashboard();
  };

  const handleUpgrade = async () => {
    openPrompt({ feature: "longer sessions, premium voices, sound mixer, and HeyGen video generation" });
  };

  const handleBillingPortal = async () => {
    try {
      setIsBillingLoading(true);
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status" }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      setBillingMessage(data.message || data.error || "Billing updated.");
      await loadDashboard();
    } catch (error) {
      console.error("Billing portal failed:", error);
      setBillingMessage("Billing portal request failed.");
    } finally {
      setIsBillingLoading(false);
    }
  };

  const savePreset = async () => {
    const name = `${sessionMode === "breathing" ? "Breath" : "Meditation"} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).replace(/\s/g, "")}`;
    await fetch("/api/session-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save-preset",
        name,
        mode: sessionMode,
        meditationType: selectedMeditationType,
        breathingPattern: sessionMode === "breathing" ? currentPattern.value : null,
        voiceTone: selectedVoiceTone,
        visual: selectedVisual,
        duration: selectedDuration,
        sounds: selectedSounds,
      }),
    });
    await loadDashboard();
  };

  const applyPreset = (preset: Preset) => {
    setSessionMode(preset.mode as SessionMode);
    setSelectedMeditationType(preset.meditationType);
    setSelectedPattern(preset.breathingPattern || "balanced-446");
    setSelectedVoiceTone(preset.voiceTone);
    setSelectedVisual(preset.visual);
    setSelectedDuration(preset.duration);
    setSelectedSounds(preset.sounds);
    setTab("create");
  };

  const deletePresetById = async (presetId: string) => {
    await fetch("/api/session-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-preset", presetId }),
    });
    await loadDashboard();
  };

  const toggleFavorite = async (sessionId: string, currentFavorite: boolean) => {
    await fetch("/api/session-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-favorite", sessionId, favorite: !currentFavorite }),
    });
    await loadDashboard();
  };

  const loadSessionIntoBuilder = async (item: {
    sessionId: string;
    mode: string;
    duration: string;
    text: string;
    isFavorite: boolean;
  }) => {
    try {
      const response = await fetch("/api/session-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-session", sessionId: item.sessionId }),
      });
      const payload = (await response.json().catch(() => null)) as {
        session?: {
          sessionId: string;
          mode: string;
          meditationType: string;
          mood: string;
          duration: string;
          breathingPattern: string | null;
          voice: string;
          visual: string;
          sounds: string[];
          text: string;
        };
      } | null;

      const session = payload?.session;
      const nextMode = session?.mode === "breathing" ? "breathing" : "meditation";
      setSessionMode(nextMode);
      setSelectedMeditationType(session?.meditationType ?? (item.mode === "breathing" ? "quick_calm" : "stress_relief"));
      setSelectedMood(session?.mood ?? "Calm");
      setSelectedDuration(session?.duration ?? item.duration);
      setSelectedPattern(session?.breathingPattern || "balanced-446");
      setSelectedVoiceTone(voiceTones.find((tone) => tone.voice === session?.voice)?.value ?? "calm-female");
      setSelectedVisual(session?.visual ?? "mist");
      setSelectedSounds(Array.isArray(session?.sounds) ? session.sounds : []);
      setMeditationText(session?.text ?? item.text);
      setCurrentSessionId(session?.sessionId ?? item.sessionId);
      setTab("create");
    } catch (error) {
      console.error("Loading session failed:", error);
      setMeditationText(item.text);
      setCurrentSessionId(item.sessionId);
      setTab("create");
    }
  };

  const activeLibraryItems = tab === "favorites" ? favorites : history;
  const planHighlights = currentPlan === "premium" ? copy.premiumHighlights : copy.freeHighlights;
  const planLabel = currentPlan === "premium" ? copy.premium : isGuestView ? "Guest" : "Free";

  const pollHeyGenVideo = useCallback(async (videoId: string) => {
    clearHeygenPoll();

    try {
      const response = await fetch(`/api/heygen/status?videoId=${encodeURIComponent(videoId)}`, {
        cache: "no-store",
      });

      const data = (await response.json().catch(() => null)) as
        | {
            status?: string;
            videoUrl?: string | null;
            error?: string;
          }
        | null;

      if (!response.ok) {
        setVideoStatusMessage(data?.error || "Unable to check video status.");
        setIsGeneratingVideo(false);
        return;
      }

      const status = data?.status || "processing";

      if (status === "completed" && data?.videoUrl) {
        setMeditationVideoUrl(data.videoUrl);
        setVideoStatusMessage("Your HeyGen meditation video is ready.");
        setIsGeneratingVideo(false);
        return;
      }

      if (status === "failed") {
        setVideoStatusMessage("HeyGen could not finish this video. Try again.");
        setIsGeneratingVideo(false);
        return;
      }

      setVideoStatusMessage("HeyGen is still rendering your short meditation video...");
      heygenPollRef.current = setTimeout(() => {
        void pollHeyGenVideo(videoId);
      }, 5000);
    } catch (error) {
      setVideoStatusMessage(
        error instanceof Error ? error.message : "Unable to poll HeyGen video status."
      );
      setIsGeneratingVideo(false);
    }
  }, []);

  const handleGenerateVideo = useCallback(async () => {
    if (!meditationText.trim()) {
      setVideoStatusMessage("Generate a meditation script first.");
      return;
    }

    if (currentPlan === "guest") {
      openPrompt({ feature: "HeyGen meditation videos with subtitles" });
      return;
    }

    if (currentPlan !== "premium") {
      openPrompt({ feature: "HeyGen meditation videos with subtitles" });
      return;
    }

    try {
      clearHeygenPoll();
      setIsGeneratingVideo(true);
      setMeditationVideoUrl(null);
      setHeygenVideoId(null);
      setVideoStatusMessage("Sending your meditation to HeyGen...");

      const response = await fetch("/api/heygen/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script: meditationText,
          mood: selectedMood,
          duration: selectedDuration,
          language,
          visual: selectedVisual,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | {
            videoId?: string;
            error?: string;
          }
        | null;

      if (!response.ok || !data?.videoId) {
        setVideoStatusMessage(data?.error || "HeyGen video generation failed.");
        setIsGeneratingVideo(false);
        return;
      }

      setHeygenVideoId(data.videoId);
      setVideoStatusMessage("HeyGen accepted the request. Rendering your short video...");
      void pollHeyGenVideo(data.videoId);
    } catch (error) {
      setVideoStatusMessage(
        error instanceof Error ? error.message : "Unable to start HeyGen video generation."
      );
      setIsGeneratingVideo(false);
    }
  }, [currentPlan, language, meditationText, openPrompt, pollHeyGenVideo, selectedDuration, selectedMood, selectedVisual]);

  return (
    <main
      className={`relative min-h-screen overflow-x-hidden px-4 py-5 transition-colors sm:px-5 sm:py-6 md:px-6 md:py-8 ${
        darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-100 text-slate-900"
      } app-bottom-nav-pad`}
    >
      <ZenBackground theme={currentVisual.breathingTheme} isActive={isPlaying} darkMode={darkMode} />
      <BreathingCircle
        isActive={showSessionScreen}
        inhaleSeconds={currentPattern.inhale}
        holdSeconds={currentPattern.hold}
        exhaleSeconds={currentPattern.exhale}
        theme={currentVisual.breathingTheme}
        onPhaseChange={setBreathingPhase}
      />

      {showSessionScreen && (
        <section className="fixed inset-0 z-30 flex flex-col items-center justify-center px-6">
          <div className="absolute inset-0" style={{ background: `${currentVisual.overlay}, ${currentVisual.background}` }} />
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" />
          <div className="relative mb-8 text-center" data-no-translate="true">
            <p className="text-2xl font-semibold text-white">{breathingPhase}</p>
            <p className="mt-1 text-lg text-white/90">{formatTime(remainingSeconds)} remaining</p>
          </div>
          <SessionTimerVisual style={selectedTimerStyle} progressRatio={progressRatio} />
          <button
            onClick={() => void stopAllAudio()}
            className="relative mt-8 rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-900"
          >
            {copy.endSession}
          </button>
        </section>
      )}

      <div className="relative z-10 mx-auto max-w-5xl app-container">
        <div className="space-y-6">
          <section className={`${surfaceClass} overflow-hidden p-6`}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${secondaryTextClass}`}>{copy.startHere}</p>
                <div className="mt-4 flex items-center gap-4">
                  {logoLoadFailed ? (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                      CA
                    </div>
                  ) : (
                    <img
                      src="/chimaura-mark.png"
                      alt="ChimAura"
                      className="h-14 w-14 rounded-2xl object-cover shadow-lg"
                      onError={() => setLogoLoadFailed(true)}
                    />
                  )}
                  <div>
                    <h1 className={`text-3xl font-semibold tracking-tight ${darkMode ? "text-white" : "text-slate-950"}`}>
                      {copy.headline}
                    </h1>
                    <p className={`mt-2 max-w-3xl text-sm leading-6 ${secondaryTextClass}`}>{copy.subtext}</p>
                  </div>
                </div>

                <p className={`mt-4 text-sm ${secondaryTextClass}`}>
                  {isGuestView
                    ? copy.guestTagline
                    : currentPlan === "premium"
                      ? copy.premiumHighlights[0]
                      : copy.signUpForPresets}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => void handleStartInstantly()}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {copy.startMyQuickSession}
                  </button>
                  {isGuestView ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setAuthMode("sign-up")}
                        className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white"
                      >
                        {copy.createFreeAccount}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMode("sign-in")}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold ${darkMode ? "border border-white/10 bg-slate-800 text-slate-100" : "bg-slate-200 text-slate-900"}`}
                      >
                        Sign In
                      </button>
                    </>
                  ) : currentPlan === "premium" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleBillingPortal()}
                        disabled={isBillingLoading}
                        className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {isBillingLoading ? "Opening..." : copy.manageBilling}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSignOut()}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold ${darkMode ? "border border-white/10 bg-slate-800 text-slate-100" : "bg-slate-200 text-slate-900"}`}
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleUpgrade()}
                        disabled={isBillingLoading}
                        className="rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {isBillingLoading ? "Opening..." : copy.upgradeToPremium}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSignOut()}
                        className={`rounded-xl px-4 py-2 text-sm font-semibold ${darkMode ? "border border-white/10 bg-slate-800 text-slate-100" : "bg-slate-200 text-slate-900"}`}
                      >
                        Sign Out
                      </button>
                    </>
                  )}
                  <Link
                    href={isGuestView ? "/pricing" : "/settings/account"}
                    className={`rounded-xl px-4 py-2 text-sm font-semibold ${darkMode ? "border border-white/10 bg-slate-800 text-slate-100" : "bg-white text-slate-900"}`}
                  >
                    {isGuestView ? copy.openPricing : copy.account}
                  </Link>
                </div>

                {billingMessage ? (
                  <p className={`mt-4 text-sm ${secondaryTextClass}`}>{billingMessage}</p>
                ) : null}
              </div>

              <div className="grid gap-4">
                <div className={`rounded-2xl border p-4 ${darkMode ? "border-white/10 bg-slate-800/80" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm font-semibold ${darkMode ? "text-slate-100" : "text-slate-900"}`}>Workspace</p>
                    <button
                      type="button"
                      onClick={() => setDarkMode((current) => !current)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold ${darkMode ? "bg-slate-100 text-slate-900" : "bg-slate-900 text-white"}`}
                    >
                      {darkMode ? "Light" : "Dark"}
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <LanguageSelector compact />
                    {currentUser?.role === "admin" || currentUser?.role === "super_admin" ? (
                      <AdminButton compact />
                    ) : null}
                  </div>
                </div>

                <div className={`rounded-2xl border p-4 ${darkMode ? "border-white/10 bg-slate-800/80" : "border-slate-200 bg-slate-50"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${secondaryTextClass}`}>Account</p>
                  <p className={`mt-2 text-lg font-semibold ${darkMode ? "text-white" : "text-slate-950"}`}>
                    {isGuestView ? "Guest session" : currentUser?.displayName || "Member"}
                  </p>
                  <p className={`mt-2 text-sm ${secondaryTextClass}`}>
                    {isGuestView
                      ? "You can generate sessions now, then create a free account whenever you want to save progress."
                      : currentUser?.email || "Signed in"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}`}>
                      {planLabel}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}`}>
                      {entitlements.maxDurationMinutes} min max
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${darkMode ? "bg-slate-900 text-slate-100" : "bg-white text-slate-800"}`}>
                      {entitlements.allowedSounds.length} sounds
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Total sessions", value: stats.totalSessions.toString(), detail: "Generated and saved across this account." },
              { label: "Completed", value: stats.completedSessions.toString(), detail: "Fully played or completed meditations." },
              { label: "Streak", value: `${stats.streakDays}`, detail: "Current calm streak in days." },
            ].map((card) => (
              <div
                key={card.label}
                className={`${surfaceClass} p-5`}
              >
                <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${secondaryTextClass}`}>{card.label}</p>
                <p className={`mt-3 text-3xl font-semibold ${darkMode ? "text-white" : "text-slate-950"}`}>{card.value}</p>
                <p className={`mt-2 text-sm ${secondaryTextClass}`}>{card.detail}</p>
              </div>
            ))}
          </section>

          <section className={`${surfaceClass} p-5`}>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${secondaryTextClass}`}>{copy.dailyHoroscope}</p>
                <h2 className={`mt-2 ${sectionHeadingClass}`}>{copy.todaysReflection}</h2>
                <p className={`mt-2 text-sm ${secondaryTextClass}`}>
                  {currentPlan === "premium"
                    ? copy.horoscopePremiumNote
                    : isGuestView
                      ? copy.horoscopeGuestNote
                      : copy.horoscopeFreeNote}
                </p>
              </div>
              <select
                value={selectedHoroscopeSign}
                onChange={(event) => setSelectedHoroscopeSign(event.target.value)}
                className={`w-full sm:w-48 ${fieldClass}`}
              >
                {zodiacSigns.map((sign) => (
                  <option key={sign.value} value={sign.value}>
                    {sign.label}
                  </option>
                ))}
              </select>
            </div>

            {reflectionError ? (
              <p className={`mb-4 text-sm ${secondaryTextClass}`}>{reflectionError}</p>
            ) : null}

            {dailyReflection ? (
              <DailyReflectionCard
                reflection={dailyReflection}
                onRefresh={() => void loadDailyReflection(selectedHoroscopeSign)}
                isRefreshing={isLoadingReflection}
                refreshDisabled={isLoadingReflection}
                refreshHint={copy.horoscopeSubtext}
              />
            ) : (
              <div className={`rounded-3xl border p-6 text-sm ${darkMode ? "border-white/10 bg-slate-900/80 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                Loading today&apos;s reflection...
              </div>
            )}
          </section>

          <HomeCreatePanel
            darkMode={darkMode}
            surfaceClass={surfaceClass}
            sectionHeadingClass={sectionHeadingClass}
            secondaryTextClass={secondaryTextClass}
            fieldClass={fieldClass}
            sessionMode={sessionMode}
            selectedMeditationType={selectedMeditationType}
            selectedMood={selectedMood}
            selectedDuration={selectedDuration}
            selectedPattern={selectedPattern}
            selectedYogaFocus={selectedYogaFocus}
            selectedYogaLevel={selectedYogaLevel}
            selectedVisual={selectedVisual}
            selectedTimerStyle={selectedTimerStyle}
            selectedSounds={selectedSounds}
            meditationText={meditationText}
            isGeneratingText={isGeneratingText}
            isGeneratingSpeech={isGeneratingSpeech}
            isGeneratingVideo={isGeneratingVideo}
            videoStatusMessage={videoStatusMessage}
            meditationVideoUrl={meditationVideoUrl}
            isPlaying={isPlaying}
            meditationTypes={landingMeditationTypes}
            moods={landingMoods}
            durations={landingDurations}
            voiceTones={voiceTonesForUser}
            breathingPatterns={landingBreathingPatterns}
            visualScenes={visualScenesForUserTranslated}
            timerStyles={timerStylesForUserTranslated}
            soundOptions={landingSoundOptions}
            currentPattern={currentPattern}
            entitlements={entitlements}
            presets={presets}
            currentPlan={currentPlan}
            onSessionModeChange={setSessionMode}
            onMeditationTypeChange={setSelectedMeditationType}
            onMoodChange={setSelectedMood}
            onDurationChange={setSelectedDuration}
            onPatternChange={setSelectedPattern}
            onYogaFocusChange={setSelectedYogaFocus}
            onYogaLevelChange={setSelectedYogaLevel}
            onVisualChange={setSelectedVisual}
            onTimerStyleChange={setSelectedTimerStyle}
            onSoundChange={(value) => setSelectedSounds(value ? [value] : [])}
            yogaFocusOptions={yogaFocusOptions}
            yogaLevelOptions={yogaLevelOptions}
            onGenerate={() => void handleGenerate()}
            onGenerateVideo={() => void handleGenerateVideo()}
            onPlay={() => void handlePlay()}
            onQuickBreathingStart={() => void handleQuickBreathingStart()}
            onStop={() => void stopAllAudio()}
            onSavePreset={() => void savePreset()}
            onApplyPreset={applyPreset}
            onDeletePreset={(presetId) => void deletePresetById(presetId)}
            onCreateAccount={() => setAuthMode("sign-up")}
            onUpgrade={() => void handleUpgrade()}
          />

          <section className={`${surfaceClass} p-5`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${secondaryTextClass}`}>Library</p>
                <h2 className={`mt-2 ${sectionHeadingClass}`}>Return to a recent calm</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["create", "history", "favorites"] as Tab[]).map((nextTab) => (
                  <button
                    key={nextTab}
                    type="button"
                    onClick={() => setTab(nextTab)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold ${
                      tab === nextTab
                        ? "bg-slate-900 text-white"
                        : darkMode
                          ? "bg-slate-800 text-slate-100"
                          : "bg-slate-200 text-slate-900"
                    }`}
                  >
                    {nextTab === "create" ? "Highlights" : nextTab === "history" ? "History" : "Favorites"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              {tab === "create" ? (
                <div className="grid gap-3 md:grid-cols-3">
                  {planHighlights.map((item) => (
                    <div
                      key={item}
                      className={`rounded-2xl border p-4 text-sm ${darkMode ? "border-white/10 bg-slate-800/70 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"}`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              ) : !entitlements.sessionHistory ? (
                <div className={`rounded-2xl border p-5 ${darkMode ? "border-fuchsia-400/20 bg-fuchsia-500/10 text-fuchsia-100" : "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900"}`}>
                  <p className="text-sm font-semibold">History and favorites are part of Premium.</p>
                  <p className="mt-2 text-sm">
                    Upgrade when you want saved session browsing, favorites, and longer flows in one place.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleUpgrade()}
                    className="mt-4 rounded-xl bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white"
                  >
                    {copy.upgradeNow}
                  </button>
                </div>
              ) : (
                <HomeSessionList
                  items={activeLibraryItems}
                  darkMode={darkMode}
                  onToggleFavorite={(sessionId, currentFavorite) => void toggleFavorite(sessionId, currentFavorite)}
                  onLoadSession={(item) => void loadSessionIntoBuilder(item)}
                />
              )}
            </div>
          </section>
        </div>
      </div>

      {authMode && (
        <section className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl p-6 ${darkMode ? "border border-white/10 bg-slate-900 text-slate-100" : "bg-white text-slate-900 shadow-2xl"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${secondaryTextClass}`}>
                  {authMode === "sign-up" ? "Create account" : "Sign in"}
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {authMode === "sign-up" ? "Save your calm setup" : "Welcome back"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAuthMode(null)}
                className={`rounded-lg px-3 py-1 text-sm font-semibold ${darkMode ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-800"}`}
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {authMode === "sign-up" ? (
                <input
                  value={authName}
                  onChange={(event) => setAuthName(event.target.value)}
                  placeholder="Display name"
                  className={`w-full ${fieldClass}`}
                />
              ) : null}
              <input
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="Email"
                type="email"
                className={`w-full ${fieldClass}`}
              />
              <div className="relative">
                <input
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="Password"
                  type={showAuthPassword ? "text" : "password"}
                  className={`w-full pr-11 ${fieldClass}`}
                />
                <button
                  type="button"
                  onClick={() => setShowAuthPassword((current) => !current)}
                  aria-label={showAuthPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  {showAuthPassword ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                      <path d="M2 12s3.5-6 10-6c2.1 0 3.9.6 5.4 1.5M22 12s-3.5 6-10 6c-2.1 0-3.9-.6-5.4-1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {authMessage ? (
              <p className={`mt-4 text-sm ${secondaryTextClass}`}>{authMessage}</p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleAuthSubmit()}
                disabled={isAuthLoading}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isAuthLoading ? "Working..." : authMode === "sign-up" ? "Create Account" : "Sign In"}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode(authMode === "sign-up" ? "sign-in" : "sign-up")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${darkMode ? "bg-slate-800 text-slate-100" : "bg-slate-100 text-slate-900"}`}
              >
                {authMode === "sign-up" ? "Already have an account?" : "Need a free account?"}
              </button>
            </div>
          </div>
        </section>
      )}

      {showMoodCheckModal && (
        <MoodCheckModal onSelect={handleMoodCheckSelect} onSkip={handleMoodCheckSkip} />
      )}

      <audio ref={voiceAudioRef} />
    </main>
  );
}

