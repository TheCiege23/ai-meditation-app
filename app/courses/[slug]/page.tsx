"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLanguage } from "@/components/language/LanguageContext";
import { getWellnessCopy } from "@/lib/wellness-translations";

type CourseStep = { id: string; dayIndex: number; title: string; description: string | null; type: string };
type Course = { id: string; slug: string; title: string; description: string | null; durationDays: number };

export default function CourseDetailPage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const { language } = useLanguage();
  const copy = getWellnessCopy(language);
  const [course, setCourse] = useState<Course | null>(null);
  const [steps, setSteps] = useState<CourseStep[]>([]);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${slug}?language=${language}`, { cache: "no-store" });
      if (!res.ok) {
        setCourse(null);
        setSteps([]);
        return;
      }
      const data = (await res.json()) as { course: Course; steps: CourseStep[]; locked?: boolean };
      setCourse(data.course);
      setSteps(data.steps ?? []);
      setLocked(data.locked ?? false);
    } catch {
      setCourse(null);
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }, [slug, language]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-8 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-2xl">
          <div className="animate-pulse h-10 w-48 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-8 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/courses" className="text-sm font-medium text-slate-500 dark:text-slate-400">
            ← {copy.courses}
          </Link>
        </header>

        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{course.title}</h1>
        {course.description && (
          <p className="text-slate-600 dark:text-slate-400">{course.description}</p>
        )}
        <p className="text-sm text-slate-500 dark:text-slate-500">
          {course.durationDays} {copy.day}s
        </p>

        {locked && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="font-semibold text-amber-800 dark:text-amber-200">{copy.premiumLock}</p>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">{copy.upgradeToUnlock}</p>
            <Link href="/pricing" className="mt-4 inline-block rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white">
              {copy.upgradeToUnlock}
            </Link>
          </div>
        )}

        {!locked && steps.length > 0 && (
          <ul className="space-y-3">
            {steps.map((s) => (
              <li
                key={s.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <span className="text-xs font-medium text-slate-500 dark:text-slate-500">
                  {copy.day} {s.dayIndex + 1}
                </span>
                <h2 className="font-semibold text-slate-900 dark:text-slate-100">{s.title}</h2>
                {s.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{s.description}</p>}
                <span className="mt-2 inline-block text-xs text-slate-500 dark:text-slate-500">{s.type}</span>
              </li>
            ))}
          </ul>
        )}

        {!locked && steps.length === 0 && (
          <p className="text-slate-500 dark:text-slate-500">No steps in this course yet.</p>
        )}
      </div>
    </div>
  );
}
