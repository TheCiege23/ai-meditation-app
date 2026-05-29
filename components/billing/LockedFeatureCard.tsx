type LockedFeatureCardProps = {
  title: string;
  description: string;
};

export default function LockedFeatureCard({ title, description }: LockedFeatureCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/75 p-5 shadow-[0_18px_60px_-38px_rgba(46,66,132,0.4)] backdrop-blur dark:border-white/10 dark:bg-slate-950/50">
      <div className="pointer-events-none absolute inset-0 bg-white/20 backdrop-blur-[2px] dark:bg-slate-900/20" />
      <div className="relative z-10">
        <span className="inline-flex rounded-full bg-amber-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-950">
          Premium
        </span>
        <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{description}</p>
        <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          Upgrade to unlock this ritual.
        </p>
      </div>
    </div>
  );
}