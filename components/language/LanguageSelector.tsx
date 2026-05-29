"use client";

import { useLanguage } from "@/components/language/LanguageContext";

const LABELS: Record<"en" | "es", { label: string; optionEn: string; optionEs: string }> = {
  en: {
    label: "Language",
    optionEn: "English",
    optionEs: "Español",
  },
  es: {
    label: "Idioma",
    optionEn: "Inglés",
    optionEs: "Español",
  },
};

type LanguageSelectorProps = {
  compact?: boolean;
};

export default function LanguageSelector({ compact }: LanguageSelectorProps) {
  const { language, setLanguage, isSaving } = useLanguage();
  const copy = LABELS[language] ?? LABELS.en;

  return (
    <div
      data-deepl-control="true"
      className={compact ? "flex items-center gap-2" : "flex flex-col gap-1 text-sm"}
    >
      {!compact ? (
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          {copy.label}
        </span>
      ) : null}
      <div className="flex items-center gap-2">
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value === "es" ? "es" : "en")}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-slate-100"
          aria-label={copy.label}
        >
          <option value="en">{copy.optionEn}</option>
          <option value="es">{copy.optionEs}</option>
        </select>
        {isSaving ? (
          <span className="text-xs text-slate-500 dark:text-slate-400">…</span>
        ) : null}
      </div>
    </div>
  );
}

