"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/components/language/LanguageContext";
import { getEntitlements } from "@/lib/entitlements";
import type { SubscriptionTier } from "@/lib/types";

// ─── Feature tiles config ─────────────────────────────────────────────────────
type FeatureTile = {
  id: string;
  gradientFrom: string;
  gradientTo: string;
  icon: string;
  labelEn: string;
  labelEs: string;
  sublabelEn: string;
  sublabelEs: string;
  href: string;
  premiumRequired: boolean;
};

const FEATURE_TILES: FeatureTile[] = [
  { id: "meditation", gradientFrom: "#7c3aed", gradientTo: "#6d28d9", icon: "✦", labelEn: "Meditate",  labelEs: "Meditar",  sublabelEn: "Guided sessions",      sublabelEs: "Sesiones guiadas",      href: "/meditation", premiumRequired: false },
  { id: "breathing",  gradientFrom: "#0891b2", gradientTo: "#0e7490", icon: "◎", labelEn: "Breathe",   labelEs: "Respirar", sublabelEn: "Breathing exercises",  sublabelEs: "Ejercicios",            href: "/breathing",  premiumRequired: false },
  { id: "yoga",       gradientFrom: "#16a34a", gradientTo: "#15803d", icon: "🧘", labelEn: "Yoga",      labelEs: "Yoga",     sublabelEn: "Pose flow builder",    sublabelEs: "Constructor de flujo",  href: "/yoga",       premiumRequired: false },
  { id: "sounds",     gradientFrom: "#059669", gradientTo: "#047857", icon: "♪", labelEn: "Sounds",    labelEs: "Sonidos",  sublabelEn: "Ambient audio",        sublabelEs: "Audio ambiental",       href: "/sounds",     premiumRequired: false },
  { id: "horoscope",  gradientFrom: "#d97706", gradientTo: "#b45309", icon: "◇", labelEn: "Horoscope", labelEs: "Horóscopo",sublabelEn: "Daily cosmic guide",   sublabelEs: "Guía cósmica",          href: "/horoscope",  premiumRequired: false },
  { id: "sleep",      gradientFrom: "#4f46e5", gradientTo: "#3730a3", icon: "☽", labelEn: "Sleep",     labelEs: "Dormir",   sublabelEn: "Wind-down sessions",   sublabelEs: "Sesiones nocturnas",    href: "/sleep",      premiumRequired: true  },
  { id: "journal",    gradientFrom: "#db2777", gradientTo: "#be185d", icon: "✎", labelEn: "Journal",   labelEs: "Diario",   sublabelEn: "Daily reflections",    sublabelEs: "Reflexiones",           href: "/journal",    premiumRequired: false },
  { id: "courses",    gradientFrom: "#0284c7", gradientTo: "#0369a1", icon: "❋", labelEn: "Courses",   labelEs: "Cursos",   sublabelEn: "Guided programs",      sublabelEs: "Programas",             href: "/courses",    premiumRequired: true  },
  { id: "progress",   gradientFrom: "#475569", gradientTo: "#334155", icon: "◈", labelEn: "Progress",  labelEs: "Progreso", sublabelEn: "Your journey",         sublabelEs: "Tu camino",             href: "/progress",   premiumRequired: false },
];

const FREE_FEATURES = [
  "3 guided meditations per day",
  "Sessions up to 5 minutes",
  "3 ambient sounds (Rain, Ocean, Forest)",
  "Daily horoscope",
  "Basic breathing exercises",
  "Daily journal entry",
  "Emergency calm session",
];

const PREMIUM_FEATURES = [
  "Unlimited meditations & sessions",
  "Sessions up to 60 minutes",
  "All 10 ambient sounds",
  "Weekly & monthly horoscopes",
  "Sleep wind-down sessions",
  "Sleep stories",
  "Full journal with AI prompts",
  "Premium voice guides",
  "Sound mixer – up to 6 sounds",
  "Guided courses & programs",
  "Full session history",
];

type Overview = {
  overview: {
    hero: {
      greeting: string;
      subtitle: string;
      displayName: string;
      tier: SubscriptionTier;
      streakDays: number;
    };
    progressStats?: { totalMindfulMinutes: number; weeklyMindfulMinutes: number };
    streaks?: { currentStreak: number; longestStreak: number };
    todayMood?: { mood: string } | null;
    dailyWisdom?: { text: string; author?: string };
    todayReset?: {
      title: string;
      subtitle: string;
      mode: string;
      duration: string;
      locked: boolean;
    };
    reflection?: { mood?: string; focus?: string } | null;
    recommendations?: Array<{ title: string; description: string; ctaLabel: string; href: string; locked: boolean }>;
  };
};

export default function DashboardPage() {
  const { language } = useLanguage();
  const isEs = language === "es";
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/overview", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          setError(isEs ? "Inicia sesión para ver tu panel." : "Sign in to view your dashboard.");
          return;
        }
        setError(isEs ? "No se pudo cargar el panel." : "Failed to load dashboard.");
        return;
      }
      const json = (await res.json()) as Overview;
      setData(json);
    } catch {
      setError(isEs ? "No se pudo cargar el panel." : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [isEs]);

  useEffect(() => {
    void load();
  }, [load]);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#0f0a1e] via-[#0d1220] to-[#0a0f1e] px-4 py-6 app-bottom-nav-pad sm:py-8">
        <div className="mx-auto max-w-2xl animate-pulse space-y-5">
          <div className="flex items-center justify-between">
            <div className="h-8 w-44 rounded-xl bg-white/10" />
            <div className="h-7 w-20 rounded-full bg-white/10" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-white/10" />)}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <div key={i} className="h-24 rounded-2xl bg-white/10" />)}
          </div>
          <div className="h-36 rounded-2xl bg-white/10" />
          <div className="h-28 rounded-2xl bg-white/10" />
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !data?.overview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-[#0f0a1e] via-[#0d1220] to-[#0a0f1e] p-6 app-bottom-nav-pad">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
          <p className="text-slate-300">{error ?? "Not found."}</p>
          <div className="mt-4 flex justify-center gap-3">
            {error?.includes("Sign in") || error?.includes("Inicia") ? (
              <Link href="/" className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white">
                {isEs ? "Ir al inicio" : "Go Home"}
              </Link>
            ) : (
              <button
                onClick={() => void load()}
                className="rounded-xl bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white"
              >
                {isEs ? "Reintentar" : "Retry"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Resolved data ─────────────────────────────────────────────────────────
  const o = data.overview;
  const hero = o.hero;
  const progress = o.progressStats ?? { totalMindfulMinutes: 0, weeklyMindfulMinutes: 0 };
  const streaks = o.streaks ?? { currentStreak: 0, longestStreak: 0 };
  const entitlements = getEntitlements(hero.tier);
  const isPremium = hero.tier === "premium";

  const isTileLocked = (tile: FeatureTile): boolean => {
    if (!tile.premiumRequired) return false;
    if (tile.id === "sleep") return !entitlements.sleepMode;
    if (tile.id === "courses") return !entitlements.courses;
    return false;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#0f0a1e] via-[#0d1220] to-[#0a0f1e] px-4 py-6 app-bottom-nav-pad sm:py-8">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-violet-600/10 blur-[80px]" />
        <div className="absolute right-0 top-1/3 h-56 w-56 rounded-full bg-indigo-600/10 blur-[80px]" />
        <div className="absolute bottom-20 left-1/4 h-40 w-40 rounded-full bg-cyan-600/8 blur-[60px]" />
      </div>

      <div className="relative mx-auto max-w-2xl space-y-5">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">
              {hero.greeting}, {hero.displayName || (isEs ? "amigo" : "friend")} 👋
            </h1>
            <p className="text-xs text-slate-400">{hero.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                isPremium
                  ? "border border-amber-500/40 bg-amber-500/15 text-amber-300"
                  : "border border-slate-600/40 bg-slate-700/40 text-slate-400"
              }`}
            >
              {isPremium ? "✦ Premium" : "Free"}
            </span>
            <Link
              href="/settings/account"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-400 text-sm hover:bg-white/10"
              aria-label="Account settings"
            >
              ◎
            </Link>
          </div>
        </header>

        {/* ── Stats strip ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-3 text-center backdrop-blur">
            <div className="text-2xl font-bold text-violet-300">{streaks.currentStreak}</div>
            <div className="text-[11px] text-slate-400">{isEs ? "Racha" : "Day Streak"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur">
            <div className="text-2xl font-bold text-slate-200">{progress.totalMindfulMinutes}</div>
            <div className="text-[11px] text-slate-400">{isEs ? "Min totales" : "Total Min"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center backdrop-blur">
            <div className="text-2xl font-bold text-slate-200">{progress.weeklyMindfulMinutes}</div>
            <div className="text-[11px] text-slate-400">{isEs ? "Esta semana" : "This Week"}</div>
          </div>
        </div>

        {/* ── Emergency Calm ────────────────────────────────────────────── */}
        <Link
          href="/calm"
          className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 backdrop-blur transition-all hover:bg-rose-500/15"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-xl text-rose-300">
            ◐
          </span>
          <div className="min-w-0">
            <div className="font-semibold text-rose-200">
              {isEs ? "¿Necesitas un momento?" : "Need a moment?"}
            </div>
            <p className="text-xs text-rose-300/70">
              {isEs ? "Sesión de calma de emergencia · 60 seg" : "Emergency calm session · 60 sec"}
            </p>
          </div>
          <span className="ml-auto shrink-0 text-rose-400">→</span>
        </Link>

        {/* ── Feature grid ──────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {isEs ? "Explorar" : "Explore"}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FEATURE_TILES.map((tile) => {
              const locked = isTileLocked(tile);
              return (
                <Link
                  key={tile.id}
                  href={locked ? "/pricing" : tile.href}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition-all hover:border-white/20 hover:bg-white/8"
                >
                  <div
                    className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl text-xl text-white shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${tile.gradientFrom}, ${tile.gradientTo})` }}
                  >
                    {tile.icon}
                  </div>
                  <div className="text-sm font-semibold text-slate-200">
                    {isEs ? tile.labelEs : tile.labelEn}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {isEs ? tile.sublabelEs : tile.sublabelEn}
                  </div>
                  {locked && (
                    <div className="absolute right-2 top-2 rounded-full border border-amber-500/30 bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                      ✦ Pro
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {isEs ? "Acceso rápido" : "Quick Start"}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/meditation?mode=breathing&pattern=box-444"
              className="flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/8 p-3 backdrop-blur hover:bg-cyan-500/12"
            >
              <span className="text-xl text-cyan-300">◎</span>
              <div>
                <div className="text-sm font-semibold text-slate-200">
                  {isEs ? "Respiración en caja" : "Box Breathing"}
                </div>
                <div className="text-[11px] text-slate-500">4-4-4-4 · 5 min</div>
              </div>
            </Link>
            <Link
              href="/meditation?mode=meditation&duration=5&sound=rain"
              className="flex items-center gap-3 rounded-xl border border-violet-500/20 bg-violet-500/8 p-3 backdrop-blur hover:bg-violet-500/12"
            >
              <span className="text-xl text-violet-300">✦</span>
              <div>
                <div className="text-sm font-semibold text-slate-200">
                  {isEs ? "Meditación rápida" : "Quick Meditate"}
                </div>
                <div className="text-[11px] text-slate-500">5 min · Rain</div>
              </div>
            </Link>
            <Link
              href="/sounds"
              className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-3 backdrop-blur hover:bg-emerald-500/12"
            >
              <span className="text-xl text-emerald-300">♪</span>
              <div>
                <div className="text-sm font-semibold text-slate-200">
                  {isEs ? "Sonidos ambientales" : "Ambient Sounds"}
                </div>
                <div className="text-[11px] text-slate-500">
                  {isEs ? "10 sonidos" : "10 sounds available"}
                </div>
              </div>
            </Link>
            <Link
              href={entitlements.sleepMode ? "/sleep" : "/pricing"}
              className="flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/8 p-3 backdrop-blur hover:bg-indigo-500/12"
            >
              <span className="text-xl text-indigo-300">☽</span>
              <div>
                <div className="text-sm font-semibold text-slate-200">
                  {isEs ? "Modo sueño" : "Sleep Mode"}
                </div>
                <div className="text-[11px] text-slate-500">
                  {entitlements.sleepMode
                    ? isEs ? "Sesiones nocturnas" : "Wind-down sessions"
                    : "✦ Premium"}
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* ── Today's recommendation ────────────────────────────────────── */}
        {o.todayReset && (
          <section className="rounded-2xl border border-violet-500/20 bg-linear-to-br from-violet-900/25 to-indigo-900/25 p-5 backdrop-blur">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-violet-400">
              {isEs ? "Recomendado hoy" : "Recommended Today"}
            </h2>
            <p className="font-semibold text-slate-100">{o.todayReset.title}</p>
            <p className="mt-0.5 text-sm text-slate-400">{o.todayReset.subtitle}</p>
            <Link
              href={`/meditation?mode=${o.todayReset.mode}&duration=${o.todayReset.duration}`}
              className="mt-4 inline-block rounded-xl bg-violet-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-violet-500"
            >
              {isEs ? "Comenzar sesión" : "Start Session"} →
            </Link>
          </section>
        )}

        {/* ── Daily wisdom ──────────────────────────────────────────────── */}
        {o.dailyWisdom && (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
              {isEs ? "Sabiduría del día" : "Daily Wisdom"}
            </h2>
            <blockquote className="text-sm italic leading-relaxed text-slate-300">
              &quot;{o.dailyWisdom.text}&quot;
            </blockquote>
            {o.dailyWisdom.author && (
              <p className="mt-2 text-xs text-slate-500">— {o.dailyWisdom.author}</p>
            )}
          </section>
        )}

        {/* ── Premium upgrade CTA for free users ───────────────────────── */}
        {!isPremium && (
          <section className="rounded-2xl border border-amber-500/30 bg-linear-to-br from-amber-900/20 to-orange-900/15 p-5 backdrop-blur">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl text-amber-300">✦</span>
              <h2 className="font-bold text-amber-200">
                {isEs ? "Desbloquea todo con Premium" : "Unlock Everything with Premium"}
              </h2>
            </div>
            {/* Free vs Premium comparison */}
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/8 bg-black/20 p-3">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {isEs ? "Plan Gratis" : "Free Plan"}
                </div>
                <ul className="space-y-1.5">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px] text-slate-500">
                      <span className="mt-0.5">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-amber-500/20 bg-amber-900/10 p-3">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-400">
                  ✦ Premium
                </div>
                <ul className="space-y-1.5">
                  {PREMIUM_FEATURES.slice(0, 7).map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11px] text-amber-100/70">
                      <span className="mt-0.5 text-amber-400">✓</span>
                      {f}
                    </li>
                  ))}
                  <li className="text-[11px] text-amber-400/70">
                    +{PREMIUM_FEATURES.length - 7} {isEs ? "más beneficios" : "more benefits"}
                  </li>
                </ul>
              </div>
            </div>
            <Link
              href="/pricing"
              className="block w-full rounded-xl bg-linear-to-r from-amber-500 to-orange-500 py-3 text-center text-sm font-bold text-white shadow-lg hover:from-amber-400 hover:to-orange-400"
            >
              {isEs ? "Ver planes Premium →" : "See Premium Plans →"}
            </Link>
          </section>
        )}

        {/* ── Premium plan summary for premium users ────────────────────── */}
        {isPremium && (
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-900/10 p-5 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400">✦</span>
                <h2 className="text-sm font-semibold text-emerald-300">
                  {isEs ? "Tu plan Premium incluye" : "Your Premium Plan Includes"}
                </h2>
              </div>
              <Link href="/settings/account" className="text-xs text-slate-500 underline hover:text-slate-300">
                {isEs ? "Gestionar" : "Manage"}
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {PREMIUM_FEATURES.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-emerald-400">✓</span>
                  {f}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Today's mood ──────────────────────────────────────────────── */}
        {o.todayMood?.mood && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            <span className="text-xl">🌿</span>
            <div>
              <span className="text-xs text-slate-500">
                {isEs ? "Estado de hoy" : "Today's mood"}
              </span>
              <div className="font-semibold capitalize text-slate-200">{o.todayMood.mood}</div>
            </div>
          </div>
        )}

        {/* ── Longest streak + footer links ─────────────────────────────── */}
        <p className="text-center text-xs text-slate-600">
          {isEs ? "Racha más larga" : "Longest streak"}: {streaks.longestStreak}{" "}
          {isEs ? "días" : "days"}
        </p>

        <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 pb-2 text-xs text-slate-600">
          <Link href="/history" className="hover:text-slate-400">
            {isEs ? "Historial" : "History"}
          </Link>
          <Link href="/yoga" className="hover:text-slate-400">
            {isEs ? "Yoga" : "Yoga"}
          </Link>
          <Link href="/progress" className="hover:text-slate-400">
            {isEs ? "Progreso" : "Progress"}
          </Link>
          <Link href="/journal" className="hover:text-slate-400">
            {isEs ? "Diario" : "Journal"}
          </Link>
          {isPremium && (
            <Link href="/courses" className="hover:text-slate-400">
              {isEs ? "Cursos" : "Courses"}
            </Link>
          )}
          <Link href="/settings/account" className="hover:text-slate-400">
            {isEs ? "Mi cuenta" : "My Account"}
          </Link>
        </div>
      </div>
    </div>
  );
}
