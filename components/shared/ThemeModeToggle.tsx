"use client";

import { useState } from "react";

import { useLanguage } from "@/components/language/LanguageContext";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "chimaura.theme";

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

export default function ThemeModeToggle() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial: ThemeMode = stored === "dark" ? "dark" : "light";
    applyTheme(initial);
    return initial;
  });

  const selectTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
  };

  return (
    <div className="fixed bottom-24 left-4 z-40 rounded-full border border-slate-200/80 bg-white/85 p-1 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/85 sm:left-6">
      <div className="relative grid grid-cols-2 rounded-full">
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-full bg-slate-900 transition-transform duration-300 dark:bg-slate-100 ${
            theme === "dark" ? "translate-x-full" : "translate-x-0"
          }`}
        />

      <button
        type="button"
        onClick={() => selectTheme("light")}
        className={`relative z-10 flex min-w-[78px] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:min-w-[92px] ${
          theme === "light"
            ? "text-white dark:text-slate-900"
            : "text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
        }`}
        aria-pressed={theme === "light"}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 2v3M12 19v3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M2 12h3M19 12h3M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        {isSpanish ? "Claro" : "Light"}
      </button>
      <button
        type="button"
        onClick={() => selectTheme("dark")}
        className={`relative z-10 flex min-w-[78px] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition sm:min-w-[92px] ${
          theme === "dark"
            ? "text-white dark:text-slate-900"
            : "text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
        }`}
        aria-pressed={theme === "dark"}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {isSpanish ? "Oscuro" : "Dark"}
      </button>
      </div>
    </div>
  );
}
