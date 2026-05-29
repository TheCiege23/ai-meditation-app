import { prisma } from "@/lib/db";
import { getDateKey } from "@/lib/usage";
import type { AppLanguage } from "@/lib/types";
import { getRandomInspiration } from "@/lib/inspiration";

function hashSeed(seed: string) {
  return seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

export async function getDailyAffirmation(input: {
  userId?: string | null;
  sign?: string | null;
  timeOfDay?: string;
  preferredMood?: string | null;
  dateKey?: string;
  language?: AppLanguage;
}) {
  const dateKey = input.dateKey ?? getDateKey();
  const seed = [dateKey, input.sign ?? "", input.timeOfDay ?? "", input.preferredMood ?? ""]
    .join("|")
    .toLowerCase();
  const language: AppLanguage = input.language === "es" ? "es" : "en";
  const random = getRandomInspiration({ language, category: "quote" });
  const fallbackText = language === "es"
    ? "Puedo volver a este momento con suavidad y claridad."
    : "I can return to this moment with softness and clarity.";
  const entry = random ?? {
    id: "fallback-affirmation",
    category: "quote",
    language,
    theme: "hope",
    text: fallbackText,
  };

  let isSaved = false;
  if (input.userId) {
    const saved = await prisma.savedAffirmation.findFirst({
      where: {
        userId: input.userId,
        text: entry.text,
      },
      select: { id: true },
    });
    isSaved = Boolean(saved);
  }

  return {
    text: entry.text,
    theme: entry.theme,
    dateKey,
    isSaved,
  };
}

export async function saveAffirmation(userId: string, text: string, theme?: string | null) {
  const existing = await prisma.savedAffirmation.findFirst({
    where: {
      userId,
      text,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.savedAffirmation.create({
    data: {
      userId,
      text,
      theme: theme ?? null,
    },
  });
}

export async function getSavedAffirmations(userId: string, limit = 10) {
  return prisma.savedAffirmation.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
