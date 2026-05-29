import type { DailyUsage } from "@prisma/client";

import { isPrismaMissingTableError, prisma } from "@/lib/db";

let warnedMissingDailyUsageTable = false;

function warnMissingDailyUsageTable() {
  if (warnedMissingDailyUsageTable) {
    return;
  }

  warnedMissingDailyUsageTable = true;
  console.warn("Daily usage table is missing; usage caps are temporarily skipped until migrations are applied.");
}

export function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function getOrCreateDailyUsage(userId: string, dateKey = getDateKey()) {
  try {
    return await prisma.dailyUsage.upsert({
      where: {
        userId_dateKey: {
          userId,
          dateKey,
        },
      },
      update: {},
      create: {
        userId,
        dateKey,
      },
    });
  } catch (error) {
    if (isPrismaMissingTableError(error, "daily_usage")) {
      warnMissingDailyUsageTable();
      return null;
    }

    throw error;
  }
}

export async function getTodayUsage(userId: string) {
  return getOrCreateDailyUsage(userId, getDateKey());
}

async function incrementUsage(
  userId: string,
  field: keyof Pick<DailyUsage, "meditationCount" | "speechCount" | "horoscopeCount" | "breathingCount" | "sleepCount">,
  dateKey = getDateKey()
) {
  const usage = await getOrCreateDailyUsage(userId, dateKey);
  if (!usage) {
    return null;
  }

  try {
    return await prisma.dailyUsage.update({
      where: {
        userId_dateKey: {
          userId,
          dateKey,
        },
      },
      data: {
        [field]: {
          increment: 1,
        },
      },
    });
  } catch (error) {
    if (isPrismaMissingTableError(error, "daily_usage")) {
      warnMissingDailyUsageTable();
      return null;
    }

    throw error;
  }
}

export async function incrementMeditationUsage(userId: string, dateKey = getDateKey()) {
  return incrementUsage(userId, "meditationCount", dateKey);
}

export async function incrementSpeechUsage(userId: string, dateKey = getDateKey()) {
  return incrementUsage(userId, "speechCount", dateKey);
}

export async function incrementHoroscopeUsage(userId: string, dateKey = getDateKey()) {
  return incrementUsage(userId, "horoscopeCount", dateKey);
}

export async function incrementBreathingUsage(userId: string, dateKey = getDateKey()) {
  return incrementUsage(userId, "breathingCount", dateKey);
}

export async function incrementSleepUsage(userId: string, dateKey = getDateKey()) {
  return incrementUsage(userId, "sleepCount", dateKey);
}
