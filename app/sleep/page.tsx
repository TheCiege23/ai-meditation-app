"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/components/language/LanguageContext";
import { getEntitlements } from "@/lib/entitlements";
import type { SubscriptionTier } from "@/lib/types";

// ─── Session presets ──────────────────────────────────────────────────────────
const WIND_DOWN_SESSIONS = [
  {
    id: "4-7-8",
    icon: "◎",
    color: "#0891b2",
    titleEn: "4-7-8 Sleep Breath",
    titleEs: "Respiración 4-7-8",
    descEn: "The classic sleep-inducing breath pattern. Inhale 4s, hold 7s, exhale 8s.",
    descEs: "El patrón de respiración clásico para dormir. Inhala 4s, retén 7s, exhala 8s.",
    durationEn: "5 min",
    durationEs: "5 min",
    href: "/meditation?mode=breathing&pattern=relax-478&sound=ocean",
    premium: false,
  },
  {
    id: "body-scan",
    icon: "✦",
    color: "#7c3aed",
    titleEn: "Body Scan",
    titleEs: "Escaneo corporal",
    descEn: "Progressive muscle relaxation from head to toe for deeper rest.",
    descEs: "Relajación muscular progresiva de la cabeza a los pies para un descanso más profundo.",
    durationEn: "10 min",
    durationEs: "10 min",
    href: "/meditation?mode=meditation&duration=10&sound=rain&visual=mist",
    premium: false,
  },
  {
    id: "sleep-meditation",
    icon: "☽",
    color: "#4f46e5",
    titleEn: "Sleep Meditation",
    titleEs: "Meditación para dormir",
    descEn: "Full guided wind-down with calming visualizations and narration.",
    descEs: "Relajación guiada completa con visualizaciones calmantes y narración.",
    durationEn: "20 min",
    durationEs: "20 min",
    href: "/meditation?mode=meditation&duration=20&sound=ocean&visual=night",
    premium: true,
  },
  {
    id: "starfield",
    icon: "◇",
    color: "#1e40af",
    titleEn: "Night Sky Journey",
    titleEs: "Viaje al cielo nocturno",
    descEn: "Drift into sleep under a star-filled sky. Deep immersive session.",
    descEs: "Quédate dormido bajo un cielo estrellado. Sesión profunda e inmersiva.",
    durationEn: "30 min",
    durationEs: "30 min",
    href: "/meditation?mode=meditation&duration=30&sound=wind&visual=starfield",
    premium: true,
  },
];

// ─── Sleep sounds ─────────────────────────────────────────────────────────────
const SLEEP_SOUNDS = [
  {
    id: "ocean",
    icon: "🌊",
    labelEn: "Ocean Waves",
    labelEs: "Olas del mar",
    descEn: "Deep rolling waves for drifting off",
    descEs: "Olas profundas para quedarte dormido",
    href: "/sounds?play=ocean",
    premium: false,
  },
  {
    id: "rain",
    icon: "🌧",
    labelEn: "Rain",
    labelEs: "Lluvia",
    descEn: "Steady rainfall to quiet the mind",
    descEs: "Lluvia constante para calmar la mente",
    href: "/sounds?play=rain",
    premium: false,
  },
  {
    id: "bowl",
    icon: "🪘",
    labelEn: "Singing Bowl",
    labelEs: "Cuenco tibetano",
    descEn: "Ceremonial tones for deep rest",
    descEs: "Tonos ceremoniales para el descanso profundo",
    href: "/sounds?play=bowl",
    premium: true,
  },
  {
    id: "spiritual",
    icon: "✨",
    labelEn: "Ambient",
    labelEs: "Ambiental",
    descEn: "Spacious meditative layer for sleep",
    descEs: "Capa meditativa espaciosa para dormir",
    href: "/sounds?play=spiritual",
    premium: true,
  },
];

// ─── Sleep stories ────────────────────────────────────────────────────────────
const SLEEP_STORIES = [
  {
    id: "forest",
    emoji: "🌲",
    titleEn: "Forest at Midnight",
    titleEs: "Bosque a medianoche",
    descEn: "A peaceful walk through an ancient, moonlit forest.",
    descEs: "Un paseo tranquilo por un bosque antiguo iluminado por la luna.",
    durationEn: "20 min",
    durationEs: "20 min",
    href: "/meditation?mode=meditation&duration=20&sound=forest&visual=forest&note=Sleep+Story%3A+Forest+at+Midnight",
  },
  {
    id: "ocean",
    emoji: "🌊",
    titleEn: "Ocean Voyage",
    titleEs: "Viaje al océano",
    descEn: "Drift across calm midnight waters on a quiet vessel.",
    descEs: "Deriva por aguas tranquilas de medianoche en un barco silencioso.",
    durationEn: "25 min",
    durationEs: "25 min",
    href: "/meditation?mode=meditation&duration=25&sound=ocean&visual=ocean-dusk&note=Sleep+Story%3A+Ocean+Voyage",
  },
  {
    id: "mountain",
    emoji: "🏔",
    titleEn: "Mountain Sanctuary",
    titleEs: "Santuario de montaña",
    descEn: "Find rest in a high-altitude retreat above the clouds.",
    descEs: "Descansa en un retiro de gran altitud sobre las nubes.",
    durationEn: "30 min",
    durationEs: "30 min",
    href: "/meditation?mode=meditation&duration=30&sound=wind&visual=starfield&note=Sleep+Story%3A+Mountain+Sanctuary",
  },
];

// ─── Sleep tips ───────────────────────────────────────────────────────────────
const SLEEP_TIPS = [
  { en: "Dim your screen brightness 30 minutes before bed.", es: "Reduce el brillo de tu pantalla 30 minutos antes de dormir." },
  { en: "Keep your room cool – 65–68°F (18–20°C) is ideal.", es: "Mantén tu habitación fresca – 18–20°C es ideal." },
  { en: "Avoid caffeine after 2pm for better sleep quality.", es: "Evita la cafeína después de las 2pm para mejor calidad de sueño." },
  { en: "Try the 4-7-8 breath if you wake up at night.", es: "Intenta la respiración 4-7-8 si te despiertas por la noche." },
];

export default function SleepPage() {
  const { language } = useLanguage();
  const isEs = language === "es";
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [loadingTier, setLoadingTier] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: { user?: { subscriptionTier?: SubscriptionTier } }) => {
        if (data?.user?.subscriptionTier) setTier(data.user.subscriptionTier);
      })
      .catch(() => {})
      .finally(() => setLoadingTier(false));
  }, []);

  const entitlements = getEntitlements(tier);
  const isPremium = tier === "premium";

  return (
    <div className="min-h-screen bg-linear-to-br from-[#06051a] via-[#0b0c27] to-[#080715] px-4 py-6 app-bottom-nav-pad sm:py-8">
      {/* Star-like bg dots */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-16 h-1 w-1 rounded-full bg-white/30" />
        <div className="absolute left-3/4 top-32 h-1 w-1 rounded-full bg-white/20" />
        <div className="absolute left-1/2 top-24 h-0.5 w-0.5 rounded-full bg-white/40" />
        <div className="absolute left-1/6 top-48 h-0.5 w-0.5 rounded-full bg-white/20" />
        <div className="absolute right-12 top-10 h-0.5 w-0.5 rounded-full bg-white/30" />
        <div className="absolute -left-16 top-1/3 h-56 w-56 rounded-full bg-indigo-900/30 blur-[80px]" />
        <div className="absolute right-0 bottom-20 h-48 w-48 rounded-full bg-violet-900/20 blur-[80px]" />
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
          {!isPremium && (
            <Link
              href="/pricing"
              className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300"
            >
              ✦ {isEs ? "Regístrate en Premium" : "Upgrade to Premium"}
            </Link>
          )}
        </header>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-indigo-500/20 bg-linear-to-br from-indigo-900/30 to-slate-900/30 p-6 backdrop-blur">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-3xl">
              ☽
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isEs ? "Modo Sueño" : "Sleep Mode"}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {isEs
                  ? "Sesiones de relajación guiadas para prepararte para dormir."
                  : "Guided wind-down sessions to prepare your mind and body for sleep."}
              </p>
              {!isPremium && (
                <div className="mt-2 rounded-lg border border-amber-500/20 bg-amber-900/15 px-3 py-1.5 text-xs text-amber-300">
                  {isEs
                    ? "Algunas sesiones requieren Premium. Las básicas son gratuitas."
                    : "Some sessions require Premium. Basic sessions are free."}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Wind-down sessions ────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {isEs ? "Sesiones nocturnas" : "Wind-Down Sessions"}
          </h2>
          <div className="space-y-3">
            {WIND_DOWN_SESSIONS.map((session) => {
              const locked = session.premium && !entitlements.sleepMode;
              return (
                <Link
                  key={session.id}
                  href={locked ? "/pricing" : session.href}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition-all hover:border-white/20 hover:bg-white/8"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl text-white"
                    style={{ background: `linear-gradient(135deg, ${session.color}cc, ${session.color}88)` }}
                  >
                    {session.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 text-sm">
                        {isEs ? session.titleEs : session.titleEn}
                      </span>
                      {locked && (
                        <span className="rounded-full border border-amber-500/30 bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                          ✦ Pro
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {isEs ? session.descEs : session.descEn}
                    </p>
                    <div className="mt-1 text-[11px] text-slate-600">
                      {isEs ? session.durationEs : session.durationEn}
                    </div>
                  </div>
                  <span className="shrink-0 text-slate-600">→</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Sleep sounds ──────────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {isEs ? "Sonidos para dormir" : "Sleep Sounds"}
            </h2>
            <Link href="/sounds" className="text-xs text-slate-500 hover:text-slate-300">
              {isEs ? "Ver todos →" : "View all →"}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {SLEEP_SOUNDS.map((sound) => {
              const locked = sound.premium && !entitlements.soundMixer;
              return (
                <Link
                  key={sound.id}
                  href={locked ? "/pricing" : sound.href}
                  className="relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur hover:bg-white/8"
                >
                  <div className="mb-2 text-2xl">{sound.icon}</div>
                  <div className="text-sm font-semibold text-slate-200">
                    {isEs ? sound.labelEs : sound.labelEn}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isEs ? sound.descEs : sound.descEn}
                  </div>
                  {locked && (
                    <div className="absolute right-2 top-2 rounded-full border border-amber-500/30 bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      ✦
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Sleep stories ─────────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {isEs ? "Historias para dormir" : "Sleep Stories"}
            </h2>
            {!isPremium && (
              <span className="rounded-full border border-amber-500/30 bg-amber-900/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                ✦ Premium
              </span>
            )}
          </div>

          {!isPremium && !loadingTier ? (
            /* Locked overlay for free users */
            <div className="rounded-2xl border border-amber-500/20 bg-linear-to-br from-amber-900/15 to-slate-900/30 p-6 text-center backdrop-blur">
              <div className="mb-2 text-3xl">🔒</div>
              <h3 className="font-bold text-amber-200">
                {isEs ? "Historias para dormir — Premium" : "Sleep Stories — Premium"}
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                {isEs
                  ? "Desbloquea historias narradas para guiarte suavemente hacia el sueño."
                  : "Unlock narrated sleep stories to gently guide you into deep sleep."}
              </p>
              <Link
                href="/pricing"
                className="mt-4 inline-block rounded-xl bg-linear-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow"
              >
                {isEs ? "Ver planes →" : "See Plans →"}
              </Link>
              {/* Preview blurred */}
              <div className="mt-5 space-y-2 opacity-40 blur-sm pointer-events-none select-none">
                {SLEEP_STORIES.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-left"
                  >
                    <span className="text-2xl">{s.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold text-slate-200">
                        {isEs ? s.titleEs : s.titleEn}
                      </div>
                      <div className="text-xs text-slate-500">{isEs ? s.durationEs : s.durationEn}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {SLEEP_STORIES.map((story) => (
                <Link
                  key={story.id}
                  href={story.href}
                  className="flex items-center gap-4 rounded-2xl border border-indigo-500/20 bg-indigo-900/10 p-4 backdrop-blur hover:bg-indigo-900/20"
                >
                  <span className="text-3xl">{story.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-100 text-sm">
                      {isEs ? story.titleEs : story.titleEn}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {isEs ? story.descEs : story.descEn}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600">
                      {isEs ? story.durationEs : story.durationEn}
                    </div>
                  </div>
                  <span className="shrink-0 text-slate-600">→</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Sleep tips ────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {isEs ? "Consejos de sueño" : "Sleep Tips"}
          </h2>
          <ul className="space-y-2.5">
            {SLEEP_TIPS.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                {isEs ? tip.es : tip.en}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Upgrade CTA ───────────────────────────────────────────────── */}
        {!isPremium && (
          <section className="rounded-2xl border border-amber-500/30 bg-linear-to-br from-amber-900/20 to-orange-900/15 p-5 text-center backdrop-blur">
            <div className="mb-1 text-2xl">✦</div>
            <h3 className="font-bold text-amber-200">
              {isEs ? "Desbloquea el Modo Sueño completo" : "Unlock Full Sleep Mode"}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              {isEs
                ? "Sesiones de sueño de larga duración, historias narradas y mezcla de sonidos."
                : "Long-form sleep sessions, narrated stories, and ambient sound mixing."}
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-block rounded-xl bg-linear-to-r from-amber-500 to-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg"
            >
              {isEs ? "Ver planes Premium →" : "See Premium Plans →"}
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
