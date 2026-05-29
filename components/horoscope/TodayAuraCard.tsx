import type { AuraInsight } from "@/components/horoscope/types";

type TodayAuraCardProps = {
  aura: AuraInsight;
};

export default function TodayAuraCard({ aura }: TodayAuraCardProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950 p-6 text-white shadow-[0_28px_72px_rgba(15,23,42,0.44)]">
      <div
        className={`absolute inset-0 opacity-90 bg-linear-to-br ${aura.gradientClassName}`}
      />
      <div
        className={`absolute left-1/2 top-8 h-44 w-44 -translate-x-1/2 rounded-full blur-3xl ${aura.glowClassName}`}
      />

      <div className="relative z-10">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
          Today&apos;s aura
        </p>
        <h2 className="mt-3 text-3xl font-semibold text-white">
          {aura.colorName}
        </h2>
        <p className="mt-2 text-base text-white/80">{aura.theme}</p>
        <p className="mt-6 max-w-sm text-sm leading-7 text-white/80">
          {aura.description}
        </p>
      </div>
    </section>
  );
}