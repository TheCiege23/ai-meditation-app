"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import LanguageSelector from "@/components/language/LanguageSelector";
import { useLanguage } from "@/components/language/LanguageContext";

export default function Home() {
  const router = useRouter();
  const { language } = useLanguage();
  const isSpanish = language === "es";

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.user && !data.user.isGuest && data.user.userId) {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        // Keep guests on the public homepage.
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="app-bottom-nav-pad relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_20%_15%,#dbeafe_0%,transparent_40%),radial-gradient(circle_at_80%_10%,#d1fae5_0%,transparent_34%),linear-gradient(180deg,#eef6ff_0%,#f7fafc_55%,#f0fdfa_100%)] px-4 py-6 text-slate-900 dark:bg-[radial-gradient(circle_at_20%_15%,#1e293b_0%,transparent_40%),radial-gradient(circle_at_80%_10%,#0f172a_0%,transparent_34%),linear-gradient(180deg,#020617_0%,#0b1324_55%,#0f172a_100%)] dark:text-slate-100 sm:px-6 sm:py-8">
      <div className="pointer-events-none absolute -top-24 left-8 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/10" />
      <div className="pointer-events-none absolute right-10 top-1/3 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-400/10" />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" aria-label="ChimAura home" className="flex items-center gap-3">
            <Image
              src="/chimaura-mark.png"
              alt="ChimAura logo"
              width={40}
              height={40}
              priority
              className="h-10 w-10 rounded-xl"
            />
            <span className="text-base font-semibold">ChimAura</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/sign-in?callbackUrl=%2Fdashboard"
              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:text-sm"
            >
              {isSpanish ? "Iniciar sesión" : "Sign In"}
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 sm:text-sm"
            >
              {isSpanish ? "Crear cuenta" : "Sign Up"}
            </Link>
            <LanguageSelector compact />
          </div>
        </header>

        <section className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-slate-900/85 dark:ring-white/10 sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {isSpanish
              ? "Meditación guiada para calmar tu mente"
              : "Guided meditation to calm your mind"}
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
            {isSpanish
              ? "ChimAura te ayuda a respirar, meditar y encontrar calma con sesiones simples, horóscopo diario y herramientas de bienestar."
              : "ChimAura helps you breathe, meditate, and reset with simple sessions, daily horoscope, and wellness tools."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/meditation"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
            >
              {isSpanish ? "Empezar meditación" : "Start meditation"}
            </Link>
            <Link
              href="/pricing"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isSpanish ? "Ver precios" : "View pricing"}
            </Link>
            <Link
              href="/sign-in?callbackUrl=%2Fdashboard"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isSpanish ? "Iniciar sesión" : "Sign In"}
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {isSpanish ? "Crear cuenta" : "Sign Up"}
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="overflow-hidden rounded-2xl bg-white/90 shadow-sm ring-1 ring-black/5 dark:bg-slate-900/85 dark:ring-white/10">
            <Image
              src="/meditation-example.svg"
              alt={isSpanish ? "Vista previa de meditación guiada" : "Guided meditation preview"}
              width={900}
              height={540}
              className="h-36 w-full object-cover"
            />
            <div className="p-4">
              <h2 className="text-sm font-semibold">{isSpanish ? "Meditación guiada" : "Guided meditation"}</h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {isSpanish ? "Sesiones rápidas para volver a tu centro." : "Quick sessions to reset your nervous system."}
              </p>
            </div>
          </article>

          <article className="overflow-hidden rounded-2xl bg-white/90 shadow-sm ring-1 ring-black/5 dark:bg-slate-900/85 dark:ring-white/10">
            <Image
              src="/breathing-example.svg"
              alt={isSpanish ? "Vista previa de respiración" : "Breathing exercise preview"}
              width={900}
              height={540}
              className="h-36 w-full object-cover"
            />
            <div className="p-4">
              <h2 className="text-sm font-semibold">{isSpanish ? "Respiración" : "Breathing"}</h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {isSpanish ? "Patrones simples para bajar ansiedad." : "Simple patterns to calm stress quickly."}
              </p>
            </div>
          </article>

          <article className="overflow-hidden rounded-2xl bg-white/90 shadow-sm ring-1 ring-black/5 dark:bg-slate-900/85 dark:ring-white/10">
            <Image
              src="/horoscope-example.svg"
              alt={isSpanish ? "Vista previa del horóscopo diario" : "Daily horoscope preview"}
              width={900}
              height={540}
              className="h-36 w-full object-cover"
            />
            <div className="p-4">
              <h2 className="text-sm font-semibold">{isSpanish ? "Horóscopo diario" : "Daily horoscope"}</h2>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                {isSpanish ? "Reflexiones cortas para enfocar tu día." : "Short reflections to guide your day."}
              </p>
            </div>
          </article>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/breathing"
            className="rounded-2xl bg-white px-4 py-4 text-sm font-medium shadow-sm ring-1 ring-black/5 transition hover:bg-slate-100 dark:bg-slate-900 dark:ring-white/10 dark:hover:bg-slate-800"
          >
            {isSpanish ? "Respiración" : "Breathing"}
          </Link>
          <Link
            href="/horoscope"
            className="rounded-2xl bg-white px-4 py-4 text-sm font-medium shadow-sm ring-1 ring-black/5 transition hover:bg-slate-100 dark:bg-slate-900 dark:ring-white/10 dark:hover:bg-slate-800"
          >
            {isSpanish ? "Horóscopo diario" : "Daily horoscope"}
          </Link>
          <Link
            href="/dashboard"
            className="rounded-2xl bg-white px-4 py-4 text-sm font-medium shadow-sm ring-1 ring-black/5 transition hover:bg-slate-100 dark:bg-slate-900 dark:ring-white/10 dark:hover:bg-slate-800"
          >
            {isSpanish ? "Tu progreso" : "Your progress"}
          </Link>
        </section>
      </div>
    </main>
  );
}
