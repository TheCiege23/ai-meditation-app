import type { BreathingStyle } from "@/lib/meditation-types";

export default function BreathingOrb({
  orbScale,
  phaseLabel,
  secondsRemaining,
  breathingStyle,
}: {
  orbScale: number;
  phaseLabel: string;
  secondsRemaining: number;
  breathingStyle: BreathingStyle;
}) {
  const visualTone = breathingStyle === "4-7-8" ? "night" : breathingStyle === "deep-reset" ? "sunrise" : breathingStyle === "box" ? "forest" : "mist";

  return (
    <div className="relative flex flex-col items-center justify-center gap-6 py-6">
      <div className={`breathing-ring breathing-ring-${visualTone} absolute h-72 w-72 rounded-full`} />
      <div
        className={`breathing-core breathing-core-${visualTone} relative flex h-52 w-52 items-center justify-center rounded-full transition-transform duration-500 ease-in-out`}
        style={{ transform: `scale(${orbScale})` }}
      >
        <div className="text-center text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-white/75">{phaseLabel}</p>
          <p className="mt-2 text-4xl font-semibold">{secondsRemaining}</p>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{breathingStyle === "none" ? "Ambient breathing glow" : `Breathing style: ${breathingStyle}`}</p>
      </div>
    </div>
  );
}