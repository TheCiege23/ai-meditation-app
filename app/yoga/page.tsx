"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "@/components/language/LanguageContext";
import type { YogaFocus, YogaLevel, YogaSessionPlan } from "@/lib/types";

type YogaStepResponse = {
  order: number;
  poseId: string;
  poseName: string;
  holdSeconds: number;
  cues: string[];
};

type YogaPlanResponse = {
  ok: boolean;
  sessionId: string;
  displayTitle: string;
  plan: YogaSessionPlan;
  steps: YogaStepResponse[];
};

const FOCUS_OPTIONS: Array<{ value: YogaFocus; labelEn: string; labelEs: string }> = [
  { value: "stress_relief", labelEn: "Stress Relief", labelEs: "Alivio del estres" },
  { value: "sleep_wind_down", labelEn: "Sleep Wind-Down", labelEs: "Relajacion para dormir" },
  { value: "lower_back", labelEn: "Lower Back", labelEs: "Zona lumbar" },
  { value: "morning_flow", labelEn: "Morning Flow", labelEs: "Flujo matutino" },
  { value: "desk_reset", labelEn: "Desk Reset", labelEs: "Reinicio de escritorio" },
  { value: "full_body_reset", labelEn: "Full Body Reset", labelEs: "Reinicio corporal" },
];

const LEVEL_OPTIONS: Array<{ value: YogaLevel; labelEn: string; labelEs: string }> = [
  { value: "beginner", labelEn: "Beginner", labelEs: "Principiante" },
  { value: "intermediate", labelEn: "Intermediate", labelEs: "Intermedio" },
  { value: "advanced", labelEn: "Advanced", labelEs: "Avanzado" },
];

export default function YogaPage() {
  const { language } = useLanguage();
  const isEs = language === "es";

  const [focus, setFocus] = useState<YogaFocus>("stress_relief");
  const [level, setLevel] = useState<YogaLevel>("beginner");
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<YogaPlanResponse | null>(null);
  const [trackingMessage, setTrackingMessage] = useState<string | null>(null);
  const [trackingLoading, setTrackingLoading] = useState<"start" | "complete" | null>(null);

  const durationLabel = useMemo(() => `${durationMinutes} ${isEs ? "min" : "min"}`, [durationMinutes, isEs]);

  const generatePlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/yoga/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus,
          level,
          durationMinutes,
          language,
        }),
      });

      const json = (await response.json().catch(() => null)) as YogaPlanResponse | { error?: string } | null;

      if (!response.ok) {
        setError(
          (json && "error" in json && json.error) ||
            (isEs ? "No se pudo generar la sesion de yoga." : "Could not generate yoga session.")
        );
        return;
      }

      setData(json as YogaPlanResponse);
      setTrackingMessage(null);
    } catch {
      setError(isEs ? "No se pudo generar la sesion de yoga." : "Could not generate yoga session.");
    } finally {
      setLoading(false);
    }
  };

  const markYogaProgress = async (completed: boolean) => {
    if (!data?.sessionId) return;
    setTrackingLoading(completed ? "complete" : "start");
    setTrackingMessage(null);

    try {
      const response = await fetch("/api/session-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "mark-played",
          sessionId: data.sessionId,
          completed,
        }),
      });

      const json = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setTrackingMessage(
          json?.error ||
            (isEs
              ? "No se pudo actualizar el progreso de yoga."
              : "Could not update yoga progress.")
        );
        return;
      }

      setTrackingMessage(
        completed
          ? isEs
            ? "Sesion de yoga marcada como completada."
            : "Yoga session marked as completed."
          : isEs
            ? "Sesion de yoga iniciada."
            : "Yoga session started."
      );
    } catch {
      setTrackingMessage(
        isEs
          ? "No se pudo actualizar el progreso de yoga."
          : "Could not update yoga progress."
      );
    } finally {
      setTrackingLoading(null);
    }
  };

  return (
    <main className="app-bottom-nav-pad min-h-screen bg-linear-to-br from-[#0f172a] via-[#12233c] to-[#1e1b4b] px-4 py-6 text-slate-100">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="flex items-center justify-between gap-4">
          <Link href="/dashboard" className="text-sm font-semibold text-slate-300 hover:underline">
            {isEs ? "Volver al panel" : "Back to dashboard"}
          </Link>
          <span className="rounded-full border border-violet-400/30 bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-200">
            {isEs ? "Yoga" : "Yoga"}
          </span>
        </header>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEs ? "Generador de sesion de yoga" : "Yoga Session Generator"}
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            {isEs
              ? "Crea una secuencia personalizada segun enfoque, nivel y duracion."
              : "Generate a personalized sequence by focus, level, and duration."}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="text-xs font-semibold text-slate-300">
              {isEs ? "Enfoque" : "Focus"}
              <select
                value={focus}
                onChange={(event) => setFocus(event.target.value as YogaFocus)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
              >
                {FOCUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {isEs ? option.labelEs : option.labelEn}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-300">
              {isEs ? "Nivel" : "Level"}
              <select
                value={level}
                onChange={(event) => setLevel(event.target.value as YogaLevel)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
              >
                {LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {isEs ? option.labelEs : option.labelEn}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-slate-300">
              {isEs ? "Duracion" : "Duration"}
              <input
                type="range"
                min={5}
                max={30}
                step={5}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(Number(event.target.value))}
                className="mt-2 w-full"
              />
              <span className="text-xs text-slate-400">{durationLabel}</span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => void generatePlan()}
            disabled={loading}
            className="mt-5 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {loading
              ? isEs ? "Generando..." : "Generating..."
              : isEs ? "Generar plan" : "Generate plan"}
          </button>

          {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        </section>

        {data ? (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-100">{data.displayTitle}</h2>
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                {Math.round(data.plan.totalSeconds / 60)} {isEs ? "min" : "min"}
              </span>
            </div>

            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
              {isEs ? "Sesion guardada en historial" : "Session saved to history"}: {data.sessionId}
              <Link href="/history" className="ml-2 underline hover:text-emerald-100">
                {isEs ? "Ver historial" : "View history"}
              </Link>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void markYogaProgress(false)}
                disabled={trackingLoading !== null}
                className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
              >
                {trackingLoading === "start"
                  ? isEs ? "Guardando..." : "Saving..."
                  : isEs ? "Marcar iniciada" : "Mark started"}
              </button>
              <button
                type="button"
                onClick={() => void markYogaProgress(true)}
                disabled={trackingLoading !== null}
                className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {trackingLoading === "complete"
                  ? isEs ? "Guardando..." : "Saving..."
                  : isEs ? "Marcar completada" : "Mark completed"}
              </button>
            </div>

            {trackingMessage ? (
              <p className="mb-4 text-xs text-slate-300">{trackingMessage}</p>
            ) : null}

            <div className="space-y-3">
              {data.steps.map((step) => (
                <article key={`${step.poseId}-${step.order}`} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-100">
                      {step.order}. {step.poseName}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {step.holdSeconds}s
                    </span>
                  </div>
                  {step.cues.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-xs text-slate-300">
                      {step.cues.map((cue) => (
                        <li key={cue}>{cue}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
