import type { BreathworkSuggestion } from "@/components/horoscope/types";

type BreathworkSuggestionCardProps = {
  suggestion: BreathworkSuggestion;
};

export default function BreathworkSuggestionCard({ suggestion }: BreathworkSuggestionCardProps) {
  return (
    <section className="rounded-[2rem] border border-white/15 bg-white/80 p-6 shadow-[0_24px_80px_-40px_rgba(40,68,130,0.5)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600/80 dark:text-emerald-200/75">
            Breathwork Recommendation
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
            {suggestion.title}
          </h3>
        </div>
        <span className="rounded-full border border-emerald-300/40 bg-emerald-100/70 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-200/20 dark:bg-emerald-300/10 dark:text-emerald-100">
          {suggestion.duration}
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
        {suggestion.reason}
      </p>

      <div className="mt-5 rounded-[1.5rem] border border-white/15 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
          Pattern
        </p>
        <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
          {suggestion.pattern}
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {suggestion.guidance}
        </p>
      </div>

      <button
        type="button"
        className="mt-6 w-full rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-emerald-400"
      >
        Begin Breathwork
      </button>
    </section>
  );
}