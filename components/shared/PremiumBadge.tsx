type PremiumBadgeProps = {
  label?: string;
  subtle?: boolean;
};

export default function PremiumBadge({
  label = "Premium Insight",
  subtle = false,
}: PremiumBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase ${
        subtle
          ? "border-white/20 bg-white/10 text-white/80"
          : "border-amber-300/30 bg-amber-200/85 text-slate-950 shadow-[0_12px_32px_rgba(251,191,36,0.16)]"
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}