import PremiumBadge from "@/components/shared/PremiumBadge";
import type { ActionTile } from "@/components/horoscope/types";

type HoroscopeActionButtonsProps = {
  actions: ActionTile[];
};

function ActionGlyph({ id }: { id: string }) {
  if (id === "meditation") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 6c0 2 1.8 3 4 3s4-1 4-3" />
        <path d="M5.5 19.5c1.8-1.2 3.4-2 6.5-2s4.7.8 6.5 2" />
        <circle cx="12" cy="7" r="3.5" />
      </svg>
    );
  }
  if (id === "breath") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 12c2.5-3 5.3-4.5 8-4.5S17.5 9 20 12" />
        <path d="M4 12c2.5 3 5.3 4.5 8 4.5s5.5-1.5 8-4.5" />
      </svg>
    );
  }
  if (id === "sleep") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 7.5c0 4.1 3.4 7.5 7.5 7.5 1.3 0 2.6-.3 3.7-.9A8 8 0 1 1 9 4.3c-.6 1-.9 2.1-.9 3.2Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 5.5h12" />
      <path d="M8 10h8" />
      <path d="M8 14.5h8" />
      <path d="M8 19h5" />
    </svg>
  );
}

export default function HoroscopeActionButtons({
  actions,
}: HoroscopeActionButtonsProps) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(148,163,184,0.16)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_24px_60px_rgba(2,6,23,0.45)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Zen actions
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
            Choose your next ritual
          </h2>
        </div>
        <PremiumBadge label="Wellness Flow" subtle />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action.id}
            className="group rounded-[1.5rem] border border-slate-200/70 bg-linear-to-br from-white to-slate-50/80 p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)] dark:border-white/10 dark:from-white/7 dark:to-white/3 dark:hover:shadow-[0_18px_40px_rgba(2,6,23,0.38)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.24)] dark:bg-white/10 dark:text-slate-100">
                <ActionGlyph id={action.id} />
              </div>
              {action.premium && <PremiumBadge label="Premium" subtle />}
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-950 dark:text-white">
              {action.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {action.description}
            </p>
            <span className="mt-4 inline-flex text-sm font-medium text-cyan-700 dark:text-cyan-200">
              {action.cta}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}