import type { ActionTile } from "@/components/horoscope/types";

type HoroscopeActionsProps = {
  actions: ActionTile[];
  onAction?: (id: string) => void;
};

export default function HoroscopeActions({ actions, onAction }: HoroscopeActionsProps) {
  return (
    <section className="rounded-[2rem] border border-white/15 bg-white/80 p-6 shadow-[0_24px_80px_-40px_rgba(46,68,134,0.45)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
        Today&apos;s Reset
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => onAction?.(action.id)}
            className="rounded-[1.5rem] border border-slate-200/70 bg-white/75 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.1)] dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">{action.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{action.description}</p>
              </div>
              {action.premium ? (
                <span className="rounded-full bg-amber-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-950">
                  Premium
                </span>
              ) : null}
            </div>
            <p className="mt-4 text-sm font-semibold text-cyan-700 dark:text-cyan-200">{action.cta}</p>
          </button>
        ))}
      </div>
    </section>
  );
}