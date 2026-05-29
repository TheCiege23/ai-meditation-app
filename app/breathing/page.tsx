"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language/LanguageContext";

const BREATHING_PATTERNS = [
  {
    id: "box-444",
    icon: "⬜",
    gradientFrom: "#0891b2",
    gradientTo: "#0e7490",
    titleEn: "Box Breathing",
    titleEs: "Respiración en caja",
    descEn: "Equal 4-count inhale, hold, exhale, hold. Reduces stress and improves focus.",
    descEs: "Inhalación, retención, exhalación y pausa de 4 tiempos iguales. Reduce el estrés y mejora la concentración.",
    patternEn: "In 4s → Hold 4s → Out 4s → Hold 4s",
    patternEs: "Inhala 4s → Retén 4s → Exhala 4s → Pausa 4s",
    durationEn: "5 min recommended",
    durationEs: "5 min recomendado",
    href: "/meditation?mode=breathing&pattern=box-444",
    best: "focus",
  },
  {
    id: "balanced-446",
    icon: "◎",
    gradientFrom: "#7c3aed",
    gradientTo: "#6d28d9",
    titleEn: "Balanced Breath",
    titleEs: "Respiración balanceada",
    descEn: "Gentle 4-4-6 rhythm for everyday calm and mental clarity.",
    descEs: "Ritmo suave 4-4-6 para la calma diaria y la claridad mental.",
    patternEn: "In 4s → Hold 4s → Out 6s",
    patternEs: "Inhala 4s → Retén 4s → Exhala 6s",
    durationEn: "5–10 min",
    durationEs: "5–10 min",
    href: "/meditation?mode=breathing&pattern=balanced-446",
    best: "calm",
  },
  {
    id: "relax-478",
    icon: "☽",
    gradientFrom: "#4f46e5",
    gradientTo: "#3730a3",
    titleEn: "4-7-8 Relax Breath",
    titleEs: "Respiración 4-7-8",
    descEn: "The classic sleep and anxiety breath. Inhale 4s, hold 7s, exhale 8s.",
    descEs: "Respiración clásica para el sueño y la ansiedad. Inhala 4s, retén 7s, exhala 8s.",
    patternEn: "In 4s → Hold 7s → Out 8s",
    patternEs: "Inhala 4s → Retén 7s → Exhala 8s",
    durationEn: "5 min (before sleep)",
    durationEs: "5 min (antes de dormir)",
    href: "/meditation?mode=breathing&pattern=relax-478&sound=ocean",
    best: "sleep",
  },
];

const WHEN_TO_BREATHE = [
  {
    en: "Before a difficult meeting or important decision.",
    es: "Antes de una reunión difícil o decisión importante.",
  },
  {
    en: "When you notice tension in your chest, jaw, or shoulders.",
    es: "Al notar tensión en el pecho, la mandíbula o los hombros.",
  },
  {
    en: "To soften anxious thought loops.",
    es: "Para suavizar el ciclo de pensamientos ansiosos.",
  },
  {
    en: "Before sleep to downregulate your nervous system.",
    es: "Antes de dormir para calmar tu sistema nervioso.",
  },
];

export default function BreathingPage() {
  const { language } = useLanguage();
  const isEs = language === "es";

  return (
    <div className="min-h-screen bg-linear-to-br from-[#060d1a] via-[#080f20] to-[#050b17] px-4 py-6 app-bottom-nav-pad sm:py-8">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-0 top-20 h-64 w-64 rounded-full bg-cyan-900/20 blur-[80px]" />
        <div className="absolute right-0 bottom-32 h-48 w-48 rounded-full bg-violet-900/15 blur-[80px]" />
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
        </header>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-cyan-500/20 bg-linear-to-br from-cyan-900/20 to-slate-900/20 p-6 backdrop-blur">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-3xl">
              ◎
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {isEs ? "Ejercicios de respiración" : "Breathing Exercises"}
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                {isEs
                  ? "Técnicas de respiración guiadas para aliviar el estrés y relajar el cuerpo en minutos."
                  : "Guided breathing techniques to release stress and relax your body in minutes."}
              </p>
            </div>
          </div>
        </section>

        {/* ── Breathing patterns ────────────────────────────────────────── */}
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {isEs ? "Técnicas" : "Techniques"}
          </h2>
          <div className="space-y-3">
            {BREATHING_PATTERNS.map((pattern) => (
              <Link
                key={pattern.id}
                href={pattern.href}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition-all hover:border-white/20 hover:bg-white/8"
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl text-white"
                  style={{
                    background: `linear-gradient(135deg, ${pattern.gradientFrom}, ${pattern.gradientTo})`,
                  }}
                >
                  {pattern.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-100">
                    {isEs ? pattern.titleEs : pattern.titleEn}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {isEs ? pattern.descEs : pattern.descEn}
                  </p>
                  <div className="mt-2 rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-mono text-slate-400">
                    {isEs ? pattern.patternEs : pattern.patternEn}
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-600">
                    {isEs ? pattern.durationEs : pattern.durationEn}
                  </div>
                </div>
                <span className="shrink-0 text-slate-600">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Custom session link ───────────────────────────────────────── */}
        <section className="rounded-2xl border border-violet-500/20 bg-linear-to-br from-violet-900/20 to-indigo-900/20 p-5 backdrop-blur">
          <h2 className="mb-1 text-sm font-semibold text-violet-300">
            {isEs ? "Sesión personalizada" : "Custom Breathing Session"}
          </h2>
          <p className="text-xs text-slate-500">
            {isEs
              ? "Abre el estudio completo para configurar duración, sonido y estilo de temporizador."
              : "Open the full studio to configure duration, sound, and timer style."}
          </p>
          <Link
            href="/meditation?mode=breathing"
            className="mt-3 inline-block rounded-xl bg-violet-600 px-5 py-2 text-sm font-bold text-white hover:bg-violet-500"
          >
            {isEs ? "Abrir estudio →" : "Open Studio →"}
          </Link>
        </section>

        {/* ── When to use ───────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {isEs ? "¿Cuándo usar la respiración consciente?" : "When to Use Calm Breathing"}
          </h2>
          <ul className="space-y-2.5">
            {WHEN_TO_BREATHE.map((tip, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                {isEs ? tip.es : tip.en}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Sleep breathing link ──────────────────────────────────────── */}
        <Link
          href="/sleep"
          className="flex items-center gap-3 rounded-2xl border border-indigo-500/20 bg-indigo-500/8 p-4 backdrop-blur hover:bg-indigo-500/12"
        >
          <span className="text-2xl">☽</span>
          <div>
            <div className="font-semibold text-slate-200 text-sm">
              {isEs ? "Respiración para dormir" : "Sleep Breathing"}
            </div>
            <div className="text-xs text-slate-500">
              {isEs ? "Técnicas de relajación nocturna" : "Nighttime wind-down techniques"}
            </div>
          </div>
          <span className="ml-auto text-slate-600">→</span>
        </Link>
      </div>
    </div>
  );
}

