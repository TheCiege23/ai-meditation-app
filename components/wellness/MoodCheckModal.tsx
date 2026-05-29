"use client";

import { useLanguage } from "@/components/language/LanguageContext";
import { getWellnessCopy } from "@/lib/wellness-translations";
import { MOOD_VALUES } from "@/lib/wellness-translations";

type MoodCheckModalProps = {
  onSelect: (mood: string | null) => void;
  onSkip: () => void;
};

const MOOD_EMOJI: Record<string, string> = {
  calm: "🙂",
  stressed: "😤",
  anxious: "😟",
  hopeful: "🌤",
  tired: "😴",
  grateful: "💜",
  overwhelmed: "🤯",
  focused: "🎯",
};

export default function MoodCheckModal({ onSelect, onSkip }: MoodCheckModalProps) {
  const { language } = useLanguage();
  const copy = getWellnessCopy(language);

  const labels: Record<string, string> = {
    calm: copy.calm,
    stressed: copy.stressed,
    anxious: copy.anxious,
    hopeful: copy.hopeful,
    tired: copy.tired,
    grateful: copy.grateful,
    overwhelmed: copy.overwhelmed,
    focused: copy.focused,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{copy.howAreYouFeeling}</h2>
        <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
          {MOOD_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onSelect(value)}
              className="flex min-h-[4rem] flex-col items-center justify-center rounded-xl border border-slate-200 py-3 transition hover:bg-slate-50 active:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 dark:active:bg-slate-700"
            >
              <span className="text-2xl" aria-hidden>{MOOD_EMOJI[value] ?? "🙂"}</span>
              <span className="mt-1 text-xs font-medium text-slate-700 dark:text-slate-300">{labels[value] ?? value}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="tap-target mt-4 w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-400"
        >
          {copy.skip}
        </button>
      </div>
    </div>
  );
}
