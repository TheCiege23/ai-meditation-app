"use client";

import { useEffect, useState } from "react";

type NotificationSettings = {
  enablePush: boolean;
  dailyReminder: boolean;
  meditationReminder: boolean;
  sleepReminder: boolean;
  streakReminder: boolean;
  horoscopeReminder: boolean;
  billingAlerts: boolean;
  productAnnouncements: boolean;
  adminBroadcasts: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string | null;
};

const defaultSettings: NotificationSettings = {
  enablePush: false,
  dailyReminder: true,
  meditationReminder: true,
  sleepReminder: true,
  streakReminder: true,
  horoscopeReminder: true,
  billingAlerts: true,
  productAnnouncements: true,
  adminBroadcasts: true,
  quietHoursStart: null,
  quietHoursEnd: null,
  timezone: null,
};

export default function NotificationSettingsForm() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/notifications/preferences", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return;
        setSettings({ ...defaultSettings, ...(data.preferences ?? {}) });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const save = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.message ?? data?.error ?? "Could not save notification preferences.");
        return;
      }
      setMessage("Notification preferences saved.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="ca-card text-sm text-slate-500 dark:text-slate-400">
        Loading notification settings...
      </div>
    );
  }

  return (
    <section className="ca-card">
      <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Reminder settings</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Choose the moments where ChimAura can gently reach out.</p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {[
          ["enablePush", "Enable push notifications"],
          ["dailyReminder", "Daily reminder"],
          ["meditationReminder", "Meditation reminder"],
          ["sleepReminder", "Sleep reminder"],
          ["streakReminder", "Streak reminder"],
          ["horoscopeReminder", "Daily cosmic reflection reminder"],
          ["billingAlerts", "Billing alerts"],
          ["productAnnouncements", "Product updates"],
          ["adminBroadcasts", "Important broadcasts"],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-slate-900/60">
            <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
            <input
              type="checkbox"
              checked={Boolean(settings[key as keyof NotificationSettings])}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  [key]: event.target.checked,
                }))
              }
            />
          </label>
        ))}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm text-slate-700 dark:text-slate-200">Quiet hours start</span>
          <input
            type="time"
            value={settings.quietHoursStart ?? ""}
            onChange={(event) =>
              setSettings((current) => ({ ...current, quietHoursStart: event.target.value || null }))
            }
            className="ca-input"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-700 dark:text-slate-200">Quiet hours end</span>
          <input
            type="time"
            value={settings.quietHoursEnd ?? ""}
            onChange={(event) =>
              setSettings((current) => ({ ...current, quietHoursEnd: event.target.value || null }))
            }
            className="ca-input"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-700 dark:text-slate-200">Timezone</span>
          <input
            value={settings.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}
            onChange={(event) =>
              setSettings((current) => ({ ...current, timezone: event.target.value || null }))
            }
            className="ca-input"
          />
        </label>
      </div>

      <div className="mt-5 rounded-2xl border border-sky-200/50 bg-sky-50/80 px-4 py-3 text-sm text-sky-900 dark:border-sky-200/10 dark:bg-sky-300/10 dark:text-sky-100">
        Preview examples: “Your evening calm is ready”, “Take 3 mindful breaths with ChimAura”, “Your daily cosmic reflection is waiting”.
      </div>

      <button
        type="button"
        onClick={() => void save()}
        disabled={isSaving}
        className="mt-5 ca-btn ca-btn-primary disabled:opacity-60"
      >
        {isSaving ? "Saving..." : "Save settings"}
      </button>
      {message ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
    </section>
  );
}
