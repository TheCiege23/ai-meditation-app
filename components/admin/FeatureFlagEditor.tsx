"use client";

import { useState } from "react";

type FeatureFlagEditorProps = {
  userId: string;
  initialFlags: {
    allowPremiumPreview: boolean;
    allowWeeklyHoroscope: boolean;
    allowAdvancedAstrology: boolean;
  };
};

export default function FeatureFlagEditor({ userId, initialFlags }: FeatureFlagEditorProps) {
  const [flags, setFlags] = useState(initialFlags);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...flags }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.message ?? data?.error ?? "Flag update failed.");
        return;
      }
      setMessage("Flags updated.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {[
        ["allowPremiumPreview", "Premium preview"],
        ["allowWeeklyHoroscope", "Weekly horoscope"],
        ["allowAdvancedAstrology", "Advanced astrology"],
      ].map(([key, label]) => (
        <label key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200/70 px-4 py-3 dark:border-white/10">
          <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
          <input
            type="checkbox"
            checked={flags[key as keyof typeof flags]}
            onChange={(event) =>
              setFlags((current) => ({
                ...current,
                [key]: event.target.checked,
              }))
            }
          />
        </label>
      ))}
      <button
        type="button"
        onClick={() => void submit()}
        disabled={isLoading}
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-sky-200 dark:text-slate-950"
      >
        {isLoading ? "Saving..." : "Save flags"}
      </button>
      {message ? <p className="text-xs text-slate-500 dark:text-slate-400">{message}</p> : null}
    </div>
  );
}
