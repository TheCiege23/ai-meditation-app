import { prisma } from "@/lib/db";
import { getDateKey } from "@/lib/usage";

export type MoodOption = {
  value: string;
  emoji: string;
  label: string;
  color: string;
  recommendations: {
    duration: string;
    meditationType: string;
    sound: string;
    breathingStyle: string;
    message: string;
  };
};

export const MOOD_OPTIONS: MoodOption[] = [
  {
    value: "calm",
    emoji: "🙂",
    label: "Calm",
    color: "from-sky-400 to-blue-500",
    recommendations: {
      duration: "10 min",
      meditationType: "focus",
      sound: "forest",
      breathingStyle: "calm",
      message: "You're in a great headspace. A focus session will sharpen your clarity.",
    },
  },
  {
    value: "anxious",
    emoji: "😟",
    label: "Anxious",
    color: "from-amber-400 to-orange-500",
    recommendations: {
      duration: "5 min",
      meditationType: "anxiety_reset",
      sound: "Raindrop",
      breathingStyle: "4-7-8",
      message: "A 4-7-8 breathing reset will calm your nervous system fast.",
    },
  },
  {
    value: "tired",
    emoji: "😴",
    label: "Tired",
    color: "from-indigo-400 to-violet-500",
    recommendations: {
      duration: "5 min",
      meditationType: "energy",
      sound: "Birds",
      breathingStyle: "deep-reset",
      message: "A gentle energy reset will lift your energy without overstimulating.",
    },
  },
  {
    value: "energetic",
    emoji: "⚡",
    label: "Energetic",
    color: "from-emerald-400 to-teal-500",
    recommendations: {
      duration: "10 min",
      meditationType: "focus",
      sound: "forest",
      breathingStyle: "box",
      message: "Channel that energy. Box breathing will keep you sharp and grounded.",
    },
  },
  {
    value: "overwhelmed",
    emoji: "🤯",
    label: "Overwhelmed",
    color: "from-rose-400 to-pink-500",
    recommendations: {
      duration: "3 min",
      meditationType: "stress_relief",
      sound: "Raindrop",
      breathingStyle: "calm",
      message: "Start small. A 3 minute rain reset is all you need right now.",
    },
  },
  {
    value: "stressed",
    emoji: "😤",
    label: "Stressed",
    color: "from-orange-400 to-red-500",
    recommendations: {
      duration: "5 min",
      meditationType: "stress_relief",
      sound: "Raindrop",
      breathingStyle: "balanced-446",
      message: "A short stress relief session can ease tension and restore balance.",
    },
  },
  {
    value: "hopeful",
    emoji: "🌤",
    label: "Hopeful",
    color: "from-amber-300 to-yellow-400",
    recommendations: {
      duration: "5 min",
      meditationType: "focus",
      sound: "forest",
      breathingStyle: "balanced-446",
      message: "Nurture that hope. A focus session will deepen your clarity.",
    },
  },
  {
    value: "grateful",
    emoji: "💜",
    label: "Grateful",
    color: "from-violet-400 to-purple-500",
    recommendations: {
      duration: "5 min",
      meditationType: "quick_calm",
      sound: "ocean",
      breathingStyle: "relax-478",
      message: "A gentle gratitude practice will anchor this feeling.",
    },
  },
  {
    value: "focused",
    emoji: "🎯",
    label: "Focused",
    color: "from-emerald-400 to-teal-500",
    recommendations: {
      duration: "10 min",
      meditationType: "focus",
      sound: "forest",
      breathingStyle: "box-444",
      message: "Channel that focus. Box breathing will keep you sharp and grounded.",
    },
  },
];

export type MoodEntry = {
  id: string;
  mood: string;
  note: string | null;
  dateKey: string;
  createdAt: string;
};

export type MoodTrend = {
  dateKey: string;
  mood: string;
  emoji: string;
};

export async function logMoodEntry(userId: string, mood: string, note?: string): Promise<MoodEntry> {
  const dateKey = getDateKey();

  const entry = await prisma.moodEntry.upsert({
    where: { userId_dateKey: { userId, dateKey } },
    update: { mood, note: note ?? null },
    create: { userId, mood, note: note ?? null, dateKey },
  });

  return {
    id: entry.id,
    mood: entry.mood,
    note: entry.note,
    dateKey: entry.dateKey,
    createdAt: entry.createdAt.toISOString(),
  };
}

export async function getTodayMood(userId: string): Promise<MoodEntry | null> {
  const dateKey = getDateKey();
  const entry = await prisma.moodEntry.findUnique({
    where: { userId_dateKey: { userId, dateKey } },
  });
  if (!entry) return null;
  return {
    id: entry.id,
    mood: entry.mood,
    note: entry.note,
    dateKey: entry.dateKey,
    createdAt: entry.createdAt.toISOString(),
  };
}

export async function getMoodHistory(userId: string, days = 30): Promise<MoodTrend[]> {
  const entries = await prisma.moodEntry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: days,
  });

  return entries.map((e: { dateKey: string; mood: string }) => ({
    dateKey: e.dateKey,
    mood: e.mood,
    emoji: MOOD_OPTIONS.find((m) => m.value === e.mood)?.emoji ?? "🙂",
  }));
}

export function getMoodRecommendation(mood: string) {
  return MOOD_OPTIONS.find((m) => m.value === mood)?.recommendations ?? MOOD_OPTIONS[0].recommendations;
}
