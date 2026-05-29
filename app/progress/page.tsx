"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/language/LanguageContext";
import { getWellnessCopy } from "@/lib/wellness-translations";

type StreakData = {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  badges: Array<{ id: string; label: string; emoji: string; description: string; locked: boolean }>;
};

type ProgressStats = {
  totalMindfulMinutes: number;
  weeklyMindfulMinutes: number;
  monthlyMindfulMinutes: number;
};

export default function ProgressPage() {
  const { language } = useLanguage();
  const copy = getWellnessCopy(language);
  const [streaks, setStreaks] = useState<StreakData | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, streaksRes] = await Promise.all([
        fetch("/api/dashboard/overview", { cache: "no-store" }),
        fetch("/api/dashboard/streaks", { cache: "no-store" }),
      ]);
      if (overviewRes.ok) {
        const overview = (await overviewRes.json()) as { overview?: { progressStats?: ProgressStats } };
        setStats(overview.overview?.progressStats ?? null);
      }
      if (streaksRes.ok) {
        const data = (await streaksRes.json()) as { streaks?: StreakData };
        setStreaks(data.streaks ?? null);
      }
    } catch {
      setStreaks(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-6 dark:from-slate-950 dark:to-slate-900 app-bottom-nav-pad sm:py-8">
      <div className="app-container mx-auto max-w-2xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 dark:text-slate-400">
            ← {copy.dashboard}
          </Link>
        </header>

        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{copy.progress}</h1>

        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        )}

        {!loading && (
          <>
            {stats && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{copy.totalMindfulMinutes}</h2>
                <p className="mt-2 text-3xl font-bold text-slate-800 dark:text-slate-200">{stats.totalMindfulMinutes}</p>
                <p className="text-sm text-slate-500 dark:text-slate-500">minutes total</p>
                <div className="mt-4 flex gap-4">
                  <div>
                    <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">{stats.weeklyMindfulMinutes}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">{copy.weeklyMinutes}</p>
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-slate-700 dark:text-slate-300">{stats.monthlyMindfulMinutes}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500">{copy.monthlyInsights}</p>
                  </div>
                </div>
              </section>
            )}

            {streaks && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{copy.achievements}</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                  {copy.currentStreak}: <strong>{streaks.currentStreak}</strong> {copy.streakDays}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  {copy.longestStreak}: {streaks.longestStreak} {copy.streakDays}
                </p>
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{copy.badges}</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {streaks.badges.map((b) => (
                      <li
                        key={b.id}
                        className={`rounded-xl px-3 py-2 text-sm ${
                          b.locked ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500" : "bg-sky-50 text-sky-800 dark:bg-sky-900/30 dark:text-sky-200"
                        }`}
                        title={b.description}
                      >
                        {b.emoji} {b.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {!streaks && !stats && (
              <p className="text-slate-500 dark:text-slate-500">Sign in to see your progress.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
