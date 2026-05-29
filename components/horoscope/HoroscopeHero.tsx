import PremiumBadge from "@/components/shared/PremiumBadge";
import SoftGlowBackground from "@/components/shared/SoftGlowBackground";
import type { CosmicProfile } from "@/components/horoscope/types";

type HoroscopeHeroProps = {
  profile: CosmicProfile;
  currentDateLabel: string;
  showPremiumBadge?: boolean;
};

export default function HoroscopeHero({
  profile,
  currentDateLabel,
  showPremiumBadge = true,
}: HoroscopeHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 px-6 py-8 text-white shadow-[0_26px_80px_rgba(15,23,42,0.45)] sm:px-8 sm:py-10">
      <SoftGlowBackground tone="cosmic" />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100/70">
            Daily Aura Insight
          </p>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Your Daily Cosmic Reflection
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200/80 sm:text-base">
            A gentle look at today&apos;s energy, paired with calming rituals for your mind and body.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-200/75">
            <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2">
              {currentDateLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2">
              {profile.signLabel} aura
            </span>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          {showPremiumBadge && profile.premium ? (
            <PremiumBadge label="Premium Cosmic Layer" />
          ) : null}
          <div className="rounded-3xl border border-white/10 bg-white/8 px-5 py-4 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/60">
              Today&apos;s quiet note
            </p>
            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-100/85">
              {profile.cosmicLine}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}