"use client";

import { useState } from "react";

export default function TestNotificationButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  const sendTest = async () => {
    setIsLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/notifications/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Your calm is ready",
          message: "Take three soft breaths with ChimAura whenever you have a minute.",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data?.message ?? data?.error ?? "Test notification failed.");
        return;
      }
      setMessage("Test notification sent or queued.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-[1.8rem] border border-slate-200/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(148,163,184,0.16)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
      <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Send yourself a test</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Use a quiet preview before you rely on reminders in your daily flow.</p>
      <button type="button" onClick={() => void sendTest()} disabled={isLoading} className="mt-5 rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {isLoading ? "Sending..." : "Send test notification"}
      </button>
      {message ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{message}</p> : null}
    </div>
  );
}
