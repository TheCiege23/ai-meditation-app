import { prisma } from "@/lib/db";
import { getDateKey } from "@/lib/usage";

const PROMPTS = [
  {
    source: "reset",
    text: "What would it look like to meet today with 10% more softness and 10% less urgency?",
  },
  {
    source: "cosmic",
    text: "Which part of today's energy feels most supportive, and how can I make more room for it?",
  },
  {
    source: "sleep",
    text: "What can I gently set down before tonight so rest has more space to arrive?",
  },
  {
    source: "focus",
    text: "What is worth protecting my attention for today, and what can stay secondary?",
  },
  {
    source: "affirmation",
    text: "Which phrase or belief would most help my nervous system feel steady today?",
  },
  {
    source: "breath",
    text: "When I slow my breathing, what changes first in my body and my thoughts?",
  },
];

function hashSeed(seed: string) {
  return seed.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
}

export async function getDailyJournalPrompt(input: {
  userId?: string | null;
  sign?: string | null;
  timeOfDay?: string;
  preferredMood?: string | null;
  dateKey?: string;
}) {
  const dateKey = input.dateKey ?? getDateKey();
  const seed = [dateKey, input.sign ?? "", input.timeOfDay ?? "", input.preferredMood ?? ""]
    .join("|")
    .toLowerCase();
  const entry = PROMPTS[hashSeed(seed) % PROMPTS.length];

  let isSaved = false;
  if (input.userId) {
    const saved = await prisma.savedPrompt.findFirst({
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
    source: entry.source,
    dateKey,
    isSaved,
  };
}

export async function savePrompt(userId: string, text: string, source?: string | null) {
  const existing = await prisma.savedPrompt.findFirst({
    where: {
      userId,
      text,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.savedPrompt.create({
    data: {
      userId,
      text,
      source: source ?? null,
    },
  });
}

export async function getSavedPrompts(userId: string, limit = 10) {
  return prisma.savedPrompt.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
