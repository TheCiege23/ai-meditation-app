import type { DailyReflection } from "@/components/horoscope/types";

type HoroscopeCardProps = {
  reflection: DailyReflection;
  onRefresh: () => void;
  isRefreshing?: boolean;
  refreshHint?: string;
};

function Chip({ label, value }: { label: string; value?: string }) {
  if (!value) {
    return null;
  }

  return (
    <span className="rounded-full border border-slate-200/70 bg-white/75 px-3 py-2 text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
      <span className="mr-1 uppercase tracking-[0.18em] text-[10px] text-slate-500 dark:text-slate-400">{label}</span>
      {value}
    </span>
  );
}

export default function HoroscopeCard({
  reflection,
  onRefresh,
  isRefreshing = false,
  refreshHint,
}: HoroscopeCardProps) {
  return (
    <section className="rounded-[2rem] border border-white/15 bg-white/80 p-6 shadow-[0_28px_90px_-45px_rgba(44,70,136,0.48)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            Daily Cosmic Reflection
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {reflection.sign}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{reflection.date}</p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-sky-200 dark:text-slate-950 dark:hover:bg-white"
        >
          {isRefreshing ? "Refreshing..." : "Refresh Reflection"}
        </button>
      </div>

      <div className="mt-6 rounded-[1.6rem] bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#0f172a_100%)] p-5 text-white shadow-[0_18px_50px_rgba(15,23,42,0.35)]">
        <p className="text-sm leading-8 text-slate-100/90">{reflection.overview}</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Chip label="Energy" value={reflection.energy} />
        <Chip label="Focus" value={reflection.focus} />
        <Chip label="Rest" value={reflection.rest} />
        <Chip label="Mood" value={reflection.mood} />
        <Chip label="Color" value={reflection.luckyColor} />
        <Chip label="Number" value={reflection.luckyNumber} />
      </div>

      {refreshHint ? <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">{refreshHint}</p> : null}
    </section>
  );
}