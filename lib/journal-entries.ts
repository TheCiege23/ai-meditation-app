import { prisma } from "@/lib/db";
import { getDateKey } from "@/lib/usage";

export type JournalEntryRecord = {
  id: string;
  type: string;
  prompt: string | null;
  content: string;
  sessionId: string | null;
  dateKey: string;
  createdAt: string;
};

export async function createJournalEntry(
  userId: string,
  input: { type: string; prompt?: string | null; content: string; sessionId?: string | null }
): Promise<JournalEntryRecord> {
  const dateKey = getDateKey();
  const entry = await prisma.journalEntry.create({
    data: {
      userId,
      type: input.type,
      prompt: input.prompt ?? null,
      content: input.content,
      sessionId: input.sessionId ?? null,
      dateKey,
    },
  });
  return {
    id: entry.id,
    type: entry.type,
    prompt: entry.prompt,
    content: entry.content,
    sessionId: entry.sessionId,
    dateKey: entry.dateKey,
    createdAt: entry.createdAt.toISOString(),
  };
}

export async function getJournalEntries(
  userId: string,
  options: { limit?: number; before?: string; type?: string } = {}
): Promise<JournalEntryRecord[]> {
  const { limit = 50, before, type } = options;
  const entries = await prisma.journalEntry.findMany({
    where: { userId, ...(type ? { type } : {}) },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(before ? { cursor: { id: before }, skip: 1 } : {}),
  });
  return entries.map((e) => ({
    id: e.id,
    type: e.type,
    prompt: e.prompt,
    content: e.content,
    sessionId: e.sessionId,
    dateKey: e.dateKey,
    createdAt: e.createdAt.toISOString(),
  }));
}
