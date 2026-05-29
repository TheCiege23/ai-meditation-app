import type { JournalPrompt } from "@/components/horoscope/types";

type JournalPromptCardProps = {
  prompt: JournalPrompt;
};

export default function JournalPromptCard({ prompt }: JournalPromptCardProps) {
  return (
    <section className="rounded-[2rem] border border-white/15 bg-white/75 p-6 shadow-[0_24px_80px_-40px_rgba(58,76,140,0.45)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600/80 dark:text-sky-200/70">
            Journal Prompt
          </p>
          <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">
            {prompt.title}
          </h3>
        </div>
        <span className="rounded-full border border-white/20 bg-white/60 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          {prompt.tone}
        </span>
      </div>

      <p className="mt-5 text-sm leading-7 text-slate-700 dark:text-slate-300">
        {prompt.prompt}
      </p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Let this be a gentle check-in, not a task list.
        </p>
        <button
          type="button"
          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-sky-200 dark:text-slate-950 dark:hover:bg-white"
        >
          Start Writing
        </button>
      </div>
    </section>
  );
}