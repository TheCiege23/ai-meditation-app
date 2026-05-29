import type { CosmicProfile } from "@/components/horoscope/types";

type ZodiacProfileCardProps = {
  profile: CosmicProfile;
};

export default function ZodiacProfileCard({
  profile,
}: ZodiacProfileCardProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-slate-200/70 bg-white/80 p-6 shadow-[0_24px_60px_rgba(148,163,184,0.18)] backdrop-blur-sm dark:border-white/10 dark:bg-slate-950/60 dark:shadow-[0_24px_60px_rgba(2,6,23,0.45)]">
      <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-linear-to-br from-cyan-200/40 to-transparent blur-2xl dark:from-cyan-300/20" />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Zodiac profile
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
            {profile.signLabel}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {profile.cosmicLine}
          </p>
        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-white/60 bg-linear-to-br from-slate-950 via-slate-800 to-cyan-950 text-xl font-semibold text-white shadow-[0_16px_30px_rgba(15,23,42,0.35)]">
          {profile.sign}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Saved birthdate
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
            {profile.birthdate ?? "Not saved yet"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200/70 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-white/5">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Personality note
          </p>
          <p className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
            Warm intuition, steady grace, and a thoughtful pace.
          </p>
        </div>
      </div>

      <button className="mt-6 inline-flex items-center rounded-full border border-slate-300/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 dark:border-white/10 dark:text-slate-100 dark:hover:bg-white/6">
        Edit Birthdate
      </button>
    </section>
  );
}