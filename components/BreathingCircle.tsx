import { useEffect, useRef } from "react";

export type BreathingTheme = "mist" | "sunrise" | "forest" | "night";
export type BreathingPhase = "Inhale" | "Hold" | "Exhale";

type BreathingCircleProps = {
  isActive: boolean;
  inhaleSeconds?: number;
  holdSeconds?: number;
  exhaleSeconds?: number;
  theme?: BreathingTheme;
  onPhaseChange?: (phase: BreathingPhase) => void;
};

const MIN_SCALE = 0.84;
const MAX_SCALE = 1.12;

const easeInOut = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;

export default function BreathingCircle({
  isActive,
  inhaleSeconds = 4,
  holdSeconds = 4,
  exhaleSeconds = 6,
  theme = "mist",
  onPhaseChange,
}: BreathingCircleProps) {
  const coreRef = useRef<HTMLDivElement | null>(null);
  const phaseRef = useRef<BreathingPhase>("Inhale");

  useEffect(() => {
    const core = coreRef.current;

    if (!core) return;

    let rafId = 0;
    const inhaleMs = inhaleSeconds * 1000;
    const holdMs = holdSeconds * 1000;
    const exhaleMs = exhaleSeconds * 1000;
    const totalMs = inhaleMs + holdMs + exhaleMs;
    const amplitude = MAX_SCALE - MIN_SCALE;

    if (!isActive) {
      core.style.transform = `scale(${MIN_SCALE})`;
      phaseRef.current = "Inhale";
      onPhaseChange?.("Inhale");
      return;
    }

    const setPhase = (nextPhase: BreathingPhase) => {
      if (phaseRef.current !== nextPhase) {
        phaseRef.current = nextPhase;
        onPhaseChange?.(nextPhase);
      }
    };

    const start = performance.now();
    setPhase("Inhale");

    const tick = (now: number) => {
      const phaseMs = (now - start) % totalMs;
      let scale = MIN_SCALE;

      if (phaseMs < inhaleMs) {
        setPhase("Inhale");
        const t = easeInOut(phaseMs / inhaleMs);
        scale = MIN_SCALE + amplitude * t;
      } else if (phaseMs < inhaleMs + holdMs) {
        setPhase("Hold");
        scale = MAX_SCALE;
      } else {
        setPhase("Exhale");
        const exhaleProgress = (phaseMs - inhaleMs - holdMs) / exhaleMs;
        const t = easeInOut(exhaleProgress);
        scale = MAX_SCALE - amplitude * t;
      }

      core.style.transform = `scale(${scale})`;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [isActive, inhaleSeconds, holdSeconds, exhaleSeconds, onPhaseChange]);

  return (
    <div
      aria-hidden={!isActive}
      className={`pointer-events-none fixed inset-0 z-20 flex items-center justify-center transition-opacity duration-500 ${
        isActive ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="relative h-56 w-56 sm:h-72 sm:w-72">
        <div
          className={`breathing-ring breathing-ring-${theme} absolute inset-0 rounded-full`}
        />
        <div
          ref={coreRef}
          className={`breathing-core breathing-core-${theme} absolute inset-0 rounded-full`}
        />
      </div>
    </div>
  );
}
