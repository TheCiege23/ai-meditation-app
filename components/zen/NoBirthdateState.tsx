type NoBirthdateStateProps = {
  onSaveBirthdate?: () => void;
};

export default function NoBirthdateState({ onSaveBirthdate }: NoBirthdateStateProps) {
  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-white/15 bg-white/80 p-8 shadow-[0_28px_90px_-45px_rgba(34,61,120,0.45)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55 sm:p-10">
      <div className="absolute inset-x-8 top-0 h-32 rounded-full bg-[radial-gradient(circle_at_center,rgba(147,197,253,0.28),transparent_68%)] blur-2xl" />
      <div className="relative mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/70 shadow-lg dark:border-white/10 dark:bg-white/5">
          <svg viewBox="0 0 24 24" className="h-8 w-8 text-slate-900 dark:text-white" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl font-semibold text-slate-900 dark:text-white">
          Add your birthdate to unlock your daily cosmic reflection
        </h2>
        <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">
          ChimAura uses your birthdate to personalize your zodiac profile, daily aura insight, and reflective rituals. It should feel supportive, not overwhelming.
        </p>
        <button
          type="button"
          onClick={onSaveBirthdate}
          className="mt-8 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-sky-200 dark:text-slate-950 dark:hover:bg-white"
        >
          Save Birthdate
        </button>
      </div>
    </section>
  );
}