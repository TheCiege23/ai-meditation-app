type PricingCardProps = {
  title: string;
  description: string;
  priceLabel: string;
  cadence: string;
  ctaLabel: string;
  onSelect?: () => void;
  highlighted?: boolean;
  badge?: string;
  features: string[];
  disabled?: boolean;
};

export default function PricingCard({
  title,
  description,
  priceLabel,
  cadence,
  ctaLabel,
  onSelect,
  highlighted = false,
  badge,
  features,
  disabled = false,
}: PricingCardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_28px_80px_-40px_rgba(42,69,140,0.45)] backdrop-blur transition duration-300 hover:-translate-y-1 ${
        highlighted
          ? "border-cyan-200/50 bg-slate-950 text-white"
          : "border-white/20 bg-white/80 text-slate-900 dark:border-white/10 dark:bg-slate-950/55 dark:text-white"
      }`}
    >
      {badge ? (
        <span className="absolute right-5 top-5 rounded-full bg-amber-300 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-950">
          {badge}
        </span>
      ) : null}

      <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${highlighted ? "text-cyan-200/80" : "text-slate-500 dark:text-slate-400"}`}>
        {title}
      </p>
      <h2 className="mt-4 text-4xl font-semibold tracking-tight">{priceLabel}</h2>
      <p className={`mt-2 text-sm ${highlighted ? "text-slate-200/80" : "text-slate-600 dark:text-slate-300"}`}>
        {cadence}
      </p>
      <p className={`mt-5 text-sm leading-7 ${highlighted ? "text-slate-200/85" : "text-slate-700 dark:text-slate-300"}`}>
        {description}
      </p>

      <ul className="mt-6 space-y-3 text-sm">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <span className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${highlighted ? "bg-cyan-400/20 text-cyan-200" : "bg-slate-900/10 text-slate-700 dark:bg-white/10 dark:text-slate-100"}`}>
              ✓
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        className={`mt-8 w-full rounded-full px-5 py-3 text-sm font-semibold transition ${
          highlighted
            ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
            : "bg-slate-900 text-white hover:bg-slate-800 dark:bg-sky-200 dark:text-slate-950 dark:hover:bg-white"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {ctaLabel}
      </button>
    </section>
  );
}