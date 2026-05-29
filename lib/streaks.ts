import { prisma } from "@/lib/db";
import { getDateKey } from "@/lib/usage";

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  lastActiveDate: string | null;
  badges: Badge[];
  todayCompleted: boolean;
};

export type Badge = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  earnedAt: string | null;
  locked: boolean;
};

const BADGE_THRESHOLDS: Omit<Badge, "earnedAt" | "locked">[] = [
  { id: "beginner", label: "Beginner", emoji: "🌱", description: "3 day streak" },
  { id: "zen_builder", label: "Zen Builder", emoji: "🧘", description: "7 day streak" },
  { id: "aura_master", label: "Aura Master", emoji: "✨", description: "30 day streak" },
  { id: "cosmic_mind", label: "Cosmic Mind", emoji: "🌌", description: "100 day streak" },
];

const BADGE_DAYS: Record<string, number> = {
  beginner: 3,
  zen_builder: 7,
  aura_master: 30,
  cosmic_mind: 100,
};

export async function getUserStreakSummary(userId: string): Promise<StreakData> {
  try {
    const [streak, totalDays] = await Promise.all([
      prisma.userStreak.findUnique({ where: { userId } }),
      prisma.dailyUsage.count({ where: { userId } }),
    ]);

    const currentStreak = streak?.currentStreak ?? 0;
    const longestStreak = streak?.longestStreak ?? 0;
    const lastActiveDate = streak?.lastActiveDate ?? null;
    const todayCompleted = lastActiveDate === getDateKey();

    const badges: Badge[] = BADGE_THRESHOLDS.map((badge) => {
      const required = BADGE_DAYS[badge.id] ?? 999;
      const earned = longestStreak >= required;
      return {
        ...badge,
        locked: !earned,
        earnedAt: earned ? (streak?.updatedAt?.toISOString() ?? null) : null,
      };
    });

    return { currentStreak, longestStreak, totalDays, lastActiveDate, badges, todayCompleted };
  } catch {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalDays: 0,
      lastActiveDate: null,
      badges: BADGE_THRESHOLDS.map((badge) => ({ ...badge, locked: true, earnedAt: null })),
      todayCompleted: false,
    };
  }
}

export async function incrementStreak(userId: string): Promise<StreakData> {
  const today = getDateKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().split("T")[0];

  const existing = await prisma.userStreak.findUnique({ where: { userId } });
  const lastDate = existing?.lastActiveDate ?? null;

  if (lastDate === today) {
    return getUserStreakSummary(userId);
  }

  const continued = lastDate === yesterdayKey;
  const newCurrent = continued ? (existing?.currentStreak ?? 0) + 1 : 1;
  const newLongest = Math.max(newCurrent, existing?.longestStreak ?? 0);

  await prisma.userStreak.upsert({
    where: { userId },
    update: {
      currentStreak: newCurrent,
      longestStreak: newLongest,
      lastActiveDate: today,
    },
    create: {
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveDate: today,
    },
  });

  return getUserStreakSummary(userId);
}