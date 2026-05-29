"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/language/LanguageContext";
import { getWellnessCopy } from "@/lib/wellness-translations";

type JournalEntry = {
  id: string;
  type: string;
  prompt: string | null;
  content: string;
  dateKey: string;
  createdAt: string;
};

export default function JournalPage() {
  const { language } = useLanguage();
  const copy = getWellnessCopy(language);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/journal", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) setError("Sign in to view your journal.");
        else setError("Failed to load journal.");
        return;
      }
      const data = (await res.json()) as { entries: JournalEntry[] };
      setEntries(data.entries ?? []);
    } catch {
      setError("Failed to load journal.");
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

        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{copy.journal}</h1>

        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-slate-600 dark:text-slate-400">{error}</p>
            {error.includes("Sign in") && (
              <Link href="/" className="mt-4 inline-block rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
                Go home
              </Link>
            )}
          </div>
        )}

        {!loading && !error && (
          <>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {copy.pastEntries}. Add reflections after sessions from the home flow.
            </p>
            {entries.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-slate-500 dark:text-slate-500">No entries yet.</p>
                <Link href="/" className="mt-3 inline-block text-sm font-medium text-sky-600 dark:text-sky-400">
                  Start a session →
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {entries.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow dark:border-slate-800 dark:bg-slate-900"
                  >
                    <p className="text-xs text-slate-500 dark:text-slate-500">
                      {e.dateKey} · {e.type}
                    </p>
                    {e.prompt && <p className="mt-1 text-sm italic text-slate-600 dark:text-slate-400">{e.prompt}</p>}
                    <p className="mt-2 text-slate-800 dark:text-slate-200">{e.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
