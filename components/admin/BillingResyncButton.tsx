"use client";

import { useState } from "react";

type ResyncResult = {
  ok: boolean;
  stripeStatus?: string;
  mappedStatus?: string;
  billingInterval?: string | null;
  currentPeriodEnd?: string | null;
};

type Props = {
  userId: string;
};

export default function BillingResyncButton({ userId }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResyncResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleResync() {
    setLoading(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/billing/resync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? `Resync failed (HTTP ${res.status})`);
      } else {
        setResult(data as ResyncResult);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={handleResync}
        disabled={loading}
        className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        {loading ? "Syncing from Stripe…" : "Resync from Stripe"}
      </button>

      {errorMsg && (
        <p className="rounded-xl bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:bg-rose-400/10 dark:text-rose-300">
          {errorMsg}
        </p>
      )}

      {result && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
          <p className="font-semibold">Resync complete</p>
          <ul className="mt-1 space-y-0.5 text-xs">
            <li>Stripe status: {result.stripeStatus}</li>
            <li>Mapped status: {result.mappedStatus}</li>
            {result.billingInterval && (
              <li>Interval: {result.billingInterval}</li>
            )}
            {result.currentPeriodEnd && (
              <li>
                Period end:{" "}
                {new Date(result.currentPeriodEnd).toLocaleDateString()}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
