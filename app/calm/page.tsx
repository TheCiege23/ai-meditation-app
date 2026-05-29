"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BreathingCircle from "@/components/BreathingCircle";
import ZenBackground from "@/components/ZenBackground";
import { useLanguage } from "@/components/language/LanguageContext";
import { useAmbientSound } from "@/hooks/useAmbientSound";
import { useNarrationPlayer } from "@/hooks/useNarrationPlayer";
import { getDailyWisdom } from "@/lib/wisdom";

const EMERGENCY_DURATION_SECONDS = 60;
const INHALE = 4;
const HOLD = 4;
const EXHALE = 4;

export default function CalmPage() {
  const { language } = useLanguage();
  const wisdom = getDailyWisdom(language);
  const [remaining, setRemaining] = useState(EMERGENCY_DURATION_SECONDS);
  const [active, setActive] = useState(true);
  const [needsAudioTap, setNeedsAudioTap] = useState(false);
  const { play: playAmbient, stop: stopAmbient } = useAmbientSound("ocean");
  const {
    sourceReady,
    prepare: prepareNarration,
    play: playNarration,
    stop: stopNarration,
  } = useNarrationPlayer();

  const narrationText =
    language === "es"
      ? "Estás a salvo en este minuto. Inhala lentamente por cuatro. Sostén por cuatro. Exhala por cuatro. Suelta tensión en hombros, mandíbula y pecho. Quédate aquí, una respiración a la vez."
      : "You are safe in this minute. Inhale slowly for four. Hold for four. Exhale for four. Soften your shoulders, jaw, and chest. Stay here, one breath at a time.";

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          setActive(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active]);

  useEffect(() => {
    if (!active) {
      stopAmbient();
      stopNarration();
      return;
    }

    let cancelled = false;

    const startAudio = async () => {
      const ambientStarted = await playAmbient();
      const narrationReady = sourceReady
        ? true
        : await prepareNarration({ text: narrationText, voice: "marin" });
      if (narrationReady) {
        await playNarration();
      }

      if (!cancelled) {
        // The tap gate should only depend on whether ambient audio was unlocked.
        // Narration is best-effort and may be blocked independently by browser/network.
        setNeedsAudioTap(!ambientStarted);
      }
    };

    void startAudio();

    return () => {
      cancelled = true;
    };
  }, [active, narrationText, playAmbient, playNarration, prepareNarration, sourceReady, stopAmbient, stopNarration]);

  const handleEnableAudio = async () => {
    const ambientStarted = await playAmbient();
    const narrationReady = sourceReady
      ? true
      : await prepareNarration({ text: narrationText, voice: "marin" });
    if (narrationReady) {
      await playNarration();
    }
    setNeedsAudioTap(!ambientStarted);
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-linear-to-b from-slate-900 to-slate-950">
      <ZenBackground theme="night" isActive={active} darkMode={true} />
      <BreathingCircle
        isActive={active}
        inhaleSeconds={INHALE}
        holdSeconds={HOLD}
        exhaleSeconds={EXHALE}
        theme="night"
      />
      <div className="relative z-10 flex flex-col items-center px-6 text-center">
        <p className="text-2xl font-semibold text-white">
          {remaining > 0 ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}` : "0:00"}
        </p>
        <p className="mt-4 max-w-sm text-lg italic text-white/90">&quot;{wisdom.text}&quot;</p>
        {wisdom.author && <p className="mt-2 text-sm text-white/70">— {wisdom.author}</p>}
        {needsAudioTap && active ? (
          <button
            type="button"
            onClick={handleEnableAudio}
            className="mt-6 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur"
          >
            {language === "es" ? "Toca para activar audio" : "Tap to enable audio"}
          </button>
        ) : null}
        {remaining <= 0 && (
          <Link
            href="/"
            className="mt-8 rounded-xl bg-white/20 px-6 py-3 font-semibold text-white backdrop-blur"
          >
            Done
          </Link>
        )}
      </div>
    </div>
  );
}
