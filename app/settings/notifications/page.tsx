"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/language/LanguageContext";

type NotificationSettings = {
  timezone: string;
  quietHoursStart: string;
  quietHoursEnd: string;
  breathingReminderEnabled: boolean;
  breathingReminderTime: string;
  meditationReminderEnabled: boolean;
  meditationReminderTime: string;
  sleepReminderEnabled: boolean;
  sleepReminderTime: string;
  horoscopeReminderEnabled: boolean;
  horoscopeReminderTime: string;
  bibleVerseReminderEnabled: boolean;
  bibleVerseReminderTime: string;
};

type FeedbackState = {
  tone: "error" | "success";
  text: string;
} | null;

const DEFAULT_STATE: NotificationSettings = {
  timezone: "America/New_York",
  quietHoursStart: "22:30",
  quietHoursEnd: "07:00",
  breathingReminderEnabled: false,
  breathingReminderTime: "08:00",
  meditationReminderEnabled: false,
  meditationReminderTime: "12:00",
  sleepReminderEnabled: false,
  sleepReminderTime: "21:00",
  horoscopeReminderEnabled: false,
  horoscopeReminderTime: "09:00",
  bibleVerseReminderEnabled: false,
  bibleVerseReminderTime: "07:30",
};

export default function NotificationSettingsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data?.user || data.user.isGuest || !data.user.email) {
          router.replace("/sign-in");
          return;
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          void fetch("/api/notifications/preferences", { cache: "no-store" })
            .then((res) => res.json())
            .then((data) => {
              if (cancelled) return;
              const prefs = data?.preferences;
              if (!prefs) return;

              setSettings({
                timezone:
                  prefs.timezone ||
                  Intl.DateTimeFormat().resolvedOptions().timeZone ||
                  "America/New_York",
                quietHoursStart: prefs.quietHoursStart || "22:30",
                quietHoursEnd: prefs.quietHoursEnd || "07:00",
                breathingReminderEnabled: Boolean(prefs.breathingReminderEnabled),
                breathingReminderTime: prefs.breathingReminderTime || "08:00",
                meditationReminderEnabled: Boolean(prefs.meditationReminderEnabled),
                meditationReminderTime: prefs.meditationReminderTime || "12:00",
                sleepReminderEnabled: Boolean(prefs.sleepReminderEnabled),
                sleepReminderTime: prefs.sleepReminderTime || "21:00",
                horoscopeReminderEnabled: Boolean(prefs.horoscopeReminderEnabled),
                horoscopeReminderTime: prefs.horoscopeReminderTime || "09:00",
                bibleVerseReminderEnabled: Boolean(prefs.bibleVerseReminderEnabled),
                bibleVerseReminderTime: prefs.bibleVerseReminderTime || "07:30",
              });
            })
            .catch(() => {
              if (!cancelled) {
                setFeedback({
                  tone: "error",
                  text:
                    language === "es"
                      ? "No se pudieron cargar tus preferencias."
                      : "We could not load your reminder preferences.",
                });
              }
            })
            .finally(() => {
              if (!cancelled) setLoading(false);
            });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [language, router]);

  const update = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        setFeedback({
          tone: "error",
          text:
            data?.error ||
            (language === "es"
              ? "No se pudieron guardar las preferencias."
              : "Unable to save reminder preferences."),
        });
        return;
      }

      setFeedback({
        tone: "success",
        text:
          language === "es"
            ? "Tus recordatorios fueron guardados."
            : "Your reminder settings were saved.",
      });
    } catch {
      setFeedback({
        tone: "error",
        text:
          language === "es"
            ? "No se pudieron guardar las preferencias."
            : "Unable to save reminder preferences.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-6 text-sm text-slate-600 dark:text-slate-300">
        {language === "es" ? "Cargando recordatorios..." : "Loading reminders..."}
      </main>
    );
  }

  const rows = [
    {
      key: "breathingReminder" as const,
      label: language === "es" ? "Respiración" : "Breathing",
      enabled: settings.breathingReminderEnabled,
      time: settings.breathingReminderTime,
      onEnabledChange: (value: boolean) => update("breathingReminderEnabled", value),
      onTimeChange: (value: string) => update("breathingReminderTime", value),
    },
    {
      key: "meditationReminder" as const,
      label: language === "es" ? "Meditación" : "Meditation",
      enabled: settings.meditationReminderEnabled,
      time: settings.meditationReminderTime,
      onEnabledChange: (value: boolean) => update("meditationReminderEnabled", value),
      onTimeChange: (value: string) => update("meditationReminderTime", value),
    },
    {
      key: "sleepReminder" as const,
      label: language === "es" ? "Sueño" : "Sleep",
      enabled: settings.sleepReminderEnabled,
      time: settings.sleepReminderTime,
      onEnabledChange: (value: boolean) => update("sleepReminderEnabled", value),
      onTimeChange: (value: string) => update("sleepReminderTime", value),
    },
    {
      key: "horoscopeReminder" as const,
      label: language === "es" ? "Horóscopo" : "Horoscope",
      enabled: settings.horoscopeReminderEnabled,
      time: settings.horoscopeReminderTime,
      onEnabledChange: (value: boolean) => update("horoscopeReminderEnabled", value),
      onTimeChange: (value: string) => update("horoscopeReminderTime", value),
    },
    {
      key: "bibleVerseReminder" as const,
      label: language === "es" ? "Versículo bíblico" : "Bible verse",
      enabled: settings.bibleVerseReminderEnabled,
      time: settings.bibleVerseReminderTime,
      onEnabledChange: (value: boolean) => update("bibleVerseReminderEnabled", value),
      onTimeChange: (value: string) => update("bibleVerseReminderTime", value),
    },
  ];

  return (
    <main className="app-bottom-nav-pad min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-950 sm:px-5 lg:px-8">
      <div className="app-container mx-auto max-w-4xl space-y-6">
        <section className="ca-card">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            {language === "es" ? "Recordatorios" : "Reminders"}
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {language === "es"
              ? "Elige qué quieres recibir y a qué hora."
              : "Choose what you want to receive and what time you want it."}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {language === "es" ? "Zona horaria" : "Timezone"}
              </span>
              <input
                className="ca-input"
                value={settings.timezone}
                onChange={(event) => update("timezone", event.target.value)}
                placeholder="America/New_York"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {language === "es" ? "Horas silenciosas: inicio" : "Quiet hours start"}
              </span>
              <input
                className="ca-input"
                type="time"
                value={settings.quietHoursStart}
                onChange={(event) => update("quietHoursStart", event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {language === "es" ? "Horas silenciosas: fin" : "Quiet hours end"}
              </span>
              <input
                className="ca-input"
                type="time"
                value={settings.quietHoursEnd}
                onChange={(event) => update("quietHoursEnd", event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="ca-card">
          <div className="space-y-4">
            {rows.map((row) => (
              <div
                key={row.key}
                className="grid gap-3 rounded-2xl border border-slate-200/70 p-4 dark:border-slate-800/80 sm:grid-cols-[minmax(0,1fr)_120px_120px]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {row.label}
                  </p>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={row.enabled}
                      onChange={(event) => row.onEnabledChange(event.target.checked)}
                    />
                    {language === "es" ? "Activado" : "Enabled"}
                  </label>
                </div>

                <div className="text-sm text-slate-500 dark:text-slate-400">
                  {language === "es" ? "Hora" : "Time"}
                </div>

                <input
                  className="ca-input"
                  type="time"
                  value={row.time}
                  onChange={(event) => row.onTimeChange(event.target.value)}
                  disabled={!row.enabled}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="mt-5 ca-btn ca-btn-primary"
            disabled={saving}
            onClick={save}
          >
            {saving
              ? language === "es"
                ? "Guardando..."
                : "Saving..."
              : language === "es"
                ? "Guardar recordatorios"
                : "Save reminders"}
          </button>

          {feedback ? (
            <p
              className={`mt-4 text-sm ${
                feedback.tone === "error"
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {feedback.text}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
