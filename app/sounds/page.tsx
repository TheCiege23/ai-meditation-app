"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/language/LanguageContext";
import { SOUND_LIBRARY, type SoundItem } from "@/lib/audio";
import { getEntitlements } from "@/lib/entitlements";
import type { SubscriptionTier } from "@/lib/types";

type Category = "all" | "nature" | "ritual" | "motion";

const CATEGORY_LABELS: Record<Category, { en: string; es: string }> = {
  all:    { en: "All",    es: "Todos"    },
  nature: { en: "Nature", es: "Naturaleza" },
  ritual: { en: "Ritual", es: "Ritual"   },
  motion: { en: "Motion", es: "Movimiento" },
};

const SOUND_ICONS: Record<string, string> = {
  rain:      "🌧",
  ocean:     "🌊",
  forest:    "🌲",
  campfire:  "🔥",
  wind:      "🌬",
  birds:     "🐦",
  bell:      "🔔",
  walking:   "👣",
  spiritual: "✨",
  bowl:      "🪘",
};

function SoundCard({
  sound,
  locked,
  isPlaying,
  isLoading,
  onPlay,
}: {
  sound: SoundItem;
  locked: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: (sound: SoundItem) => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "es";

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-4 backdrop-blur transition-all ${
        isPlaying
          ? "border-violet-500/50 bg-violet-500/10"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
      }`}
    >
      {/* Sound icon */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-3xl">{SOUND_ICONS[sound.id] ?? "♪"}</span>
        {locked && (
          <span className="rounded-full border border-amber-500/30 bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-amber-400">
            ✦ Pro
          </span>
        )}
        {!locked && sound.premium && (
          <span className="rounded-full border border-emerald-500/30 bg-emerald-900/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            ✓ {isEs ? "Incluido" : "Included"}
          </span>
        )}
      </div>

      {/* Label + description */}
      <div className="flex-1">
        <div className="font-semibold text-slate-200 text-sm">{sound.label}</div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{sound.description}</p>
      </div>

      {/* Category badge */}
      <div className="mt-2 mb-3">
        <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] capitalize text-slate-500">
          {sound.category}
        </span>
      </div>

      {/* Play / Unlock button */}
      {locked ? (
        <Link
          href="/pricing"
          className="block rounded-xl bg-amber-500/20 py-2 text-center text-xs font-bold text-amber-300 hover:bg-amber-500/30"
        >
          {isEs ? "Desbloquear" : "Unlock ✦"}
        </Link>
      ) : (
        <button
          onClick={() => onPlay(sound)}
          disabled={isLoading}
          className={`rounded-xl py-2 text-xs font-bold transition-all ${
            isPlaying
              ? "bg-violet-500/30 text-violet-200 hover:bg-violet-500/20"
              : "bg-white/10 text-slate-300 hover:bg-white/15"
          }`}
        >
          {isLoading
            ? isEs ? "Cargando…" : "Loading…"
            : isPlaying
            ? isEs ? "⏸ Pausar" : "⏸ Pause"
            : isEs ? "▷ Reproducir" : "▷ Play"}
        </button>
      )}
    </div>
  );
}

export default function SoundsPage() {
  const { language } = useLanguage();
  const isEs = language === "es";

  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loadingTier, setLoadingTier] = useState(true);
  const [category, setCategory] = useState<Category>("all");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load tier from session
  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { user?: { subscriptionTier?: SubscriptionTier } }) => {
        if (data?.user?.subscriptionTier) setTier(data.user.subscriptionTier);
      })
      .catch(() => {})
      .finally(() => setLoadingTier(false));
  }, []);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const entitlements = getEntitlements(tier);
  const isPremium = tier === "premium";

  const handlePlay = (sound: SoundItem) => {
    // Toggle off if same sound
    if (playingId === sound.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // Stop any playing sound
    audioRef.current?.pause();
    setPlayingId(null);

    if (!sound.file) return;

    setLoadingId(sound.id);

    const audio = new Audio(sound.file);
    audio.loop = true;
    audioRef.current = audio;

    audio.addEventListener("canplaythrough", () => {
      setLoadingId(null);
      setPlayingId(sound.id);
      audio.play().catch(() => {
        setPlayingId(null);
        setLoadingId(null);
      });
    }, { once: true });

    audio.addEventListener("error", () => {
      setLoadingId(null);
      setPlayingId(null);
    }, { once: true });

    audio.load();
  };

  const isLocked = (sound: SoundItem): boolean => {
    if (!sound.premium) return false;
    return !isPremium;
  };

  const filteredSounds =
    category === "all"
      ? SOUND_LIBRARY
      : SOUND_LIBRARY.filter((s) => s.category === category);

  const freeSounds = SOUND_LIBRARY.filter((s) => !s.premium);
  const premiumSounds = SOUND_LIBRARY.filter((s) => s.premium);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#030d0a] via-[#051510] to-[#040c09] px-4 py-6 app-bottom-nav-pad sm:py-8">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-emerald-900/20 blur-[80px]" />
        <div className="absolute right-0 bottom-32 h-48 w-48 rounded-full bg-teal-900/15 blur-[80px]" />
      </div>

      <div className="relative mx-auto max-w-2xl space-y-6">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200"
          >
            ← {isEs ? "Panel" : "Dashboard"}
          </Link>
          {!isPremium && !loadingTier && (
            <Link
              href="/pricing"
              className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300"
            >
              ✦ {isEs ? "Obtener Premium" : "Get Premium"}
            </Link>
          )}
        </header>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section>
          <h1 className="text-2xl font-bold text-white">
            {isEs ? "Sonidos ambientales" : "Ambient Sounds"}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isEs
              ? `${freeSounds.length} gratuitos · ${premiumSounds.length} en Premium. Reproduce cualquier sonido mientras meditas.`
              : `${freeSounds.length} free · ${premiumSounds.length} with Premium. Play any sound during your meditation.`}
          </p>

          {/* Now playing bar */}
          {playingId && (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2.5">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((bar) => (
                  <div
                    key={bar}
                    className="w-1 rounded-full bg-violet-400"
                    style={{
                      height: `${8 + bar * 4}px`,
                      animation: `soundWave 0.${bar + 4}s ease-in-out infinite alternate`,
                    }}
                  />
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-violet-200">
                  {SOUND_LIBRARY.find((s) => s.id === playingId)?.label}
                </span>
                <span className="ml-2 text-xs text-slate-500">
                  {isEs ? "reproduciéndose" : "now playing"}
                </span>
              </div>
              <button
                onClick={() => {
                  audioRef.current?.pause();
                  setPlayingId(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ⏹ {isEs ? "Detener" : "Stop"}
              </button>
            </div>
          )}
        </section>

        {/* ── Category filter ───────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", "nature", "ritual", "motion"] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                category === cat
                  ? "bg-emerald-600 text-white"
                  : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {isEs ? CATEGORY_LABELS[cat].es : CATEGORY_LABELS[cat].en}
            </button>
          ))}
        </div>

        {/* ── Sound grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filteredSounds.map((sound) => (
            <SoundCard
              key={sound.id}
              sound={sound}
              locked={isLocked(sound)}
              isPlaying={playingId === sound.id}
              isLoading={loadingId === sound.id}
              onPlay={handlePlay}
            />
          ))}
        </div>

        {/* ── How to use in meditation ──────────────────────────────────── */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {isEs ? "Usar en meditación" : "Use During Meditation"}
          </h2>
          <p className="mb-4 text-sm text-slate-400">
            {isEs
              ? "Combina cualquier sonido con una sesión de meditación guiada para una experiencia más profunda."
              : "Combine any sound with a guided meditation session for a deeper, more immersive experience."}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/meditation?sound=rain"
              className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/8 p-3 text-sm font-semibold text-slate-200 hover:bg-violet-500/12"
            >
              <span>✦</span> {isEs ? "Meditar con lluvia" : "Meditate with Rain"}
            </Link>
            <Link
              href="/meditation?sound=ocean"
              className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/8 p-3 text-sm font-semibold text-slate-200 hover:bg-cyan-500/12"
            >
              <span>🌊</span> {isEs ? "Meditar con océano" : "Meditate with Ocean"}
            </Link>
          </div>
        </section>

        {/* ── Premium upsell ───────────────────────────────────────────── */}
        {!isPremium && !loadingTier && (
          <section className="rounded-2xl border border-amber-500/30 bg-linear-to-br from-amber-900/20 to-orange-900/15 p-5 backdrop-blur">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xl text-amber-300">✦</span>
              <h2 className="font-bold text-amber-200">
                {isEs ? "Desbloquea todos los sonidos" : "Unlock All Sounds with Premium"}
              </h2>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              {isEs
                ? `Accede a los ${premiumSounds.length} sonidos premium y mezcla hasta 6 de forma simultánea.`
                : `Access all ${premiumSounds.length} premium sounds and mix up to 6 simultaneously.`}
            </p>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {premiumSounds.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="text-amber-400">✓</span>
                  <span>{SOUND_ICONS[s.id]} {s.label}</span>
                </div>
              ))}
            </div>
            <Link
              href="/pricing"
              className="block w-full rounded-xl bg-linear-to-r from-amber-500 to-orange-500 py-3 text-center text-sm font-bold text-white shadow-lg"
            >
              {isEs ? "Ver planes Premium →" : "See Premium Plans →"}
            </Link>
          </section>
        )}
      </div>

      {/* Sound wave animation keyframes */}
      <style jsx global>{`
        @keyframes soundWave {
          from { transform: scaleY(0.5); opacity: 0.7; }
          to   { transform: scaleY(1.5); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
