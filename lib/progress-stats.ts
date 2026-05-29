import { prisma } from "@/lib/db";

export type ProgressStats = {
  totalSessions: number;
  totalMindfulMinutes: number;
  weeklyMindfulMinutes: number;
  monthlyMindfulMinutes: number;
};

export async function getProgressStats(userId: string): Promise<ProgressStats> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now);
  monthStart.setDate(monthStart.getDate() - 30);

  const history = await prisma.sessionHistory.findMany({
    where: { userId, status: "completed", durationSeconds: { not: null } },
    select: { durationSeconds: true, completedAt: true },
  });

  let totalMindfulMinutes = 0;
  let weeklyMindfulMinutes = 0;
  let monthlyMindfulMinutes = 0;

  for (const h of history) {
    const mins = (h.durationSeconds ?? 0) / 60;
    totalMindfulMinutes += mins;
    const completed = h.completedAt ?? new Date(0);
    if (completed >= weekStart) weeklyMindfulMinutes += mins;
    if (completed >= monthStart) monthlyMindfulMinutes += mins;
  }

  return {
    totalSessions: history.length,
    totalMindfulMinutes: Math.round(totalMindfulMinutes),
    weeklyMindfulMinutes: Math.round(weeklyMindfulMinutes),
    monthlyMindfulMinutes: Math.round(monthlyMindfulMinutes),
  };
}
