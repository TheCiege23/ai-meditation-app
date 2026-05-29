"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/language/LanguageContext";
import { getWellnessCopy } from "@/lib/wellness-translations";

type Course = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  durationDays: number;
  isPremium: boolean;
  progress?: { currentStepIndex: number; startedAt: string; completedAt: string | null };
};

export default function CoursesPage() {
  const { language } = useLanguage();
  const copy = getWellnessCopy(language);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses?language=${language}`, { cache: "no-store" });
      if (!res.ok) {
        setCourses([]);
        return;
      }
      const data = (await res.json()) as { courses: Course[] };
      setCourses(data.courses ?? []);
      const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
      if (sessionRes.ok) {
        const session = (await sessionRes.json()) as { user?: { subscriptionTier?: string } };
        setIsPremium(session?.user?.subscriptionTier === "premium");
      }
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white px-4 py-6 dark:from-slate-950 dark:to-slate-900 app-bottom-nav-pad sm:py-8">
      <div className="app-container mx-auto max-w-2xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-slate-500 dark:text-slate-400">
            ← {copy.dashboard}
          </Link>
        </header>

        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{copy.courses}</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">{copy.multiDayPrograms}</p>

        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        )}

        {!loading && courses.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-slate-500 dark:text-slate-500">No courses available yet.</p>
            <Link href="/" className="mt-3 inline-block text-sm font-medium text-sky-600 dark:text-sky-400">
              Browse sessions →
            </Link>
          </div>
        )}

        {!loading && courses.length > 0 && (
          <ul className="space-y-4">
            {courses.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900 dark:text-slate-100">{c.title}</h2>
                    {c.description && (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{c.description}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
                      {c.durationDays} {copy.day}s
                    </p>
                  </div>
                  {c.isPremium && !isPremium ? (
                    <Link
                      href="/pricing"
                      className="rounded-xl border border-amber-400 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-200"
                    >
                      {copy.upgradeToUnlock}
                    </Link>
                  ) : (
                    <Link
                      href={`/courses/${c.slug}`}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900"
                    >
                      {c.progress && c.progress.currentStepIndex > 0 ? copy.continueCourse : copy.startCourse}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
