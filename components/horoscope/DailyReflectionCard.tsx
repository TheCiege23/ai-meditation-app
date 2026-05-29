import type { DailyReflection } from "@/components/horoscope/types";

type DailyReflectionCardProps = {
  reflection: DailyReflection;
  onRefresh: () => void;
  isRefreshing?: boolean;
  refreshDisabled?: boolean;
  refreshHint?: string;
};

function InsightChip({
  label,
  value,
  subtle = false,
}: {
  label: string;
  value?: string;
  subtle?: boolean;
}) {
  if (!value) {
    return null;
  }

  return (
    <div
      className={`rounded-full border px-3 py-2 text-xs font-medium ${
        subtle
          ? "border-slate-200/80 bg-white/60 text-slate-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-200"
          : "border-cyan-200/70 bg-cyan-50 text-cyan-900 dark:border-cyan-300/15 dark:bg-cyan-400/10 dark:text-cyan-100"
      }`}
    >
      <span className="mr-1 text-[11px] uppercase tracking-[0.16em] opacity-70">
        {label}
      </span>
      {value}
    </div>
  );
}

export default function DailyReflectionCard({
  reflection,
  onRefresh,
  isRefreshing = false,
  refreshDisabled = false,
  refreshHint,
}: DailyReflectionCardProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/85 p-6 shadow-[0_30px_70px_rgba(148,163,184,0.16)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/65 dark:shadow-[0_30px_70px_rgba(2,6,23,0.42)]">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-300/60 to-transparent" />
      <div className="absolute -right-10 top-2 h-40 w-40 rounded-full bg-linear-to-br from-amber-200/40 to-transparent blur-3xl dark:from-amber-100/10" />

      <div className="relative z-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Daily reflection
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
              A softer reading for today
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {reflection.date} | Source: {reflection.source}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshDisabled || isRefreshing}
              className="rounded-full border border-slate-300/80 bg-white/70 px-4 py-2 text-sm font-medium text-slate-800 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:bg-white/10"
            >
              {isRefreshing ? "Refreshing..." : "Refresh Reflection"}
            </button>
            <p className="max-w-xs text-right text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              {refreshHint ?? "Designed as an intentional refresh to help protect limited provider calls later."}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-white/70 bg-linear-to-br from-slate-950 via-slate-900 to-cyan-950 p-5 text-white shadow-[0_18px_50px_rgba(15,23,42,0.36)]">
          <p className="text-sm leading-8 text-slate-100/90">{reflection.overview}</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <InsightChip label="Energy" value={reflection.energy} />
          <InsightChip label="Focus" value={reflection.focus} />
          <InsightChip label="Rest" value={reflection.rest} />
          <InsightChip label="Mood" value={reflection.mood} />
          <InsightChip label="Color" value={reflection.luckyColor} subtle />
          <InsightChip label="Number" value={reflection.luckyNumber} subtle />
        </div>
      </div>
    </section>
  );
}