"use client";

import { useState } from "react";

type ManageSubscriptionButtonProps = {
  className?: string;
  label?: string;
};

export default function ManageSubscriptionButton({
  className = "",
  label = "Manage Billing",
}: ManageSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "Unable to open billing portal. Please try again.");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setError("No billing portal URL returned. Please try again.");
    } catch {
      setError("Unable to open billing portal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={isLoading}
        className={`rounded-full border border-white/20 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 ${className}`}
      >
        {isLoading ? "Opening…" : label}
      </button>
      {error ? (
        <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
      ) : null}
    </div>
  );
}
