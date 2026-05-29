"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { BreathingStyle } from "@/lib/meditation-types";

type BreathingPhase = "inhale" | "hold" | "exhale" | "rest";

type BreathingStep = {
  phase: BreathingPhase;
  durationSeconds: number;
};

const BREATHING_PATTERNS: Record<Exclude<BreathingStyle, "none">, BreathingStep[]> = {
  calm: [
    { phase: "inhale", durationSeconds: 4 },
    { phase: "exhale", durationSeconds: 6 },
  ],
  box: [
    { phase: "inhale", durationSeconds: 4 },
    { phase: "hold", durationSeconds: 4 },
    { phase: "exhale", durationSeconds: 4 },
    { phase: "rest", durationSeconds: 4 },
  ],
  "4-7-8": [
    { phase: "inhale", durationSeconds: 4 },
    { phase: "hold", durationSeconds: 7 },
    { phase: "exhale", durationSeconds: 8 },
  ],
  "deep-reset": [
    { phase: "inhale", durationSeconds: 3 },
    { phase: "hold", durationSeconds: 2 },
    { phase: "exhale", durationSeconds: 5 },
  ],
};

function getPhaseLabel(phase: BreathingPhase) {
  switch (phase) {
    case "inhale":
      return "Inhale";
    case "hold":
      return "Hold";
    case "exhale":
      return "Exhale";
    default:
      return "Rest";
  }
}

function getOrbScale(phase: BreathingPhase, progress: number) {
  const clamped = Math.max(0, Math.min(progress, 1));

  switch (phase) {
    case "inhale":
      return 0.82 + clamped * 0.28;
    case "hold":
      return 1.1;
    case "exhale":
      return 1.1 - clamped * 0.26;
    default:
      return 0.84;
  }
}

export function useBreathingCycle(style: BreathingStyle, isActive: boolean, isPaused: boolean) {
  const pattern = useMemo(() => {
    if (style === "none") {
      return [{ phase: "rest" as const, durationSeconds: 6 }];
    }
    return BREATHING_PATTERNS[style];
  }, [style]);

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseElapsedMs, setPhaseElapsedMs] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const currentStep = pattern[phaseIndex] ?? pattern[0];
  const phaseDurationMs = currentStep.durationSeconds * 1000;
  const phaseProgress = phaseDurationMs > 0 ? phaseElapsedMs / phaseDurationMs : 0;

  const reset = useCallback(() => {
    setPhaseIndex(0);
    setPhaseElapsedMs(0);
  }, []);

  useEffect(() => {
    if (!isActive || isPaused) {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const tickMs = 200;
    intervalRef.current = window.setInterval(() => {
      setPhaseElapsedMs((current) => {
        const next = current + tickMs;
        if (next >= phaseDurationMs) {
          setPhaseIndex((currentIndex) => (currentIndex + 1) % pattern.length);
          return 0;
        }
        return next;
      });
    }, tickMs);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, isPaused, pattern, phaseDurationMs]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      reset();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [reset, style]);

  return {
    pattern,
    phase: currentStep.phase,
    phaseLabel: getPhaseLabel(currentStep.phase),
    phaseIndex,
    secondsRemaining: Math.max(1, Math.ceil((phaseDurationMs - phaseElapsedMs) / 1000)),
    orbScale: getOrbScale(currentStep.phase, phaseProgress),
    isAmbient: style === "none",
    reset,
  };
}