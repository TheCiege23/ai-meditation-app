"use client";

import { useState } from "react";

import ManageSubscriptionButton from "@/components/billing/ManageSubscriptionButton";
import { useSubscription } from "@/hooks/useSubscription";

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
  feature: string;
};

export default function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
  const { user } = useSubscription();
  const [loadingInterval, setLoadingInterval] = useState<"monthly" | "yearly" | null>(null);
  const [billingMessage, setBillingMessage] = useState("");

  const isPremium = user?.subscriptionTier === "premium";
  const isSignedIn = Boolean(user?.userId && !user?.isGuest);

  if (!open) {
    return null;
  }

  const startCheckout = async (interval: "monthly" | "yearly") => {
    try {
      setLoadingInterval(interval);
      setBillingMessage("");

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });

      const data = (await response.json().catch(() => null)) as {
        error?: string;
        url?: string;
      } | null;

      if (!response.ok) {
        setBillingMessage(
          data?.error ?? "Unable to start checkout. Please try again."
        );
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setBillingMessage(
        "Stripe checkout is missing a redirect URL. Please try again or contact support."
      );
    } catch (error) {
      console.error("Linked checkout failed:", error);
      setBillingMessage("Unable to start checkout. Please try again.");
    } finally {
      setLoadingInterval(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6">
      <div className="w-full max-w-3xl rounded-4xl border border-white/15 bg-[linear-gradient(180deg,#f7fbff_0%,#eef2ff_100%)] p-6 shadow-2xl dark:border-white/10 dark:bg-[linear-gradient(180deg,#0b1324_0%,#121a30_100%)]">
        <div className="flex items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
              Premium Unlock
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
              Unlock {feature}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
              ChimAura Premium unlocks longer meditation sessions, richer voices, layered
              soundscapes, sleep wind-down mode, extended horoscope ranges, saved session
              history, and a calmer daily flow without free-plan limits.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-200"
          >
            Close
          </button>
        </div>

        {billingMessage ? (
          <div className="mt-6 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100">
            {billingMessage}
          </div>
        ) : null}

        {!isSignedIn ? (
          <div className="mt-6 rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-100">
            Sign in first for the most reliable checkout. Your premium access will be
            linked to your account email.
          </div>
        ) : null}

        {isPremium ? (
          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100">
            Premium is already active on this account. Use Stripe&apos;s secure billing
            portal below to update your payment method, switch plans, or cancel.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <button
              type="button"
              onClick={() => void startCheckout("monthly")}
              disabled={loadingInterval !== null}
              className="rounded-3xl bg-slate-900 px-5 py-4 text-left text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Monthly</p>
              <p className="mt-2 text-xl font-semibold">Premium Monthly</p>
              <p className="mt-2 text-sm text-slate-200/80">
                {loadingInterval === "monthly"
                  ? "Preparing your Stripe session..."
                  : "$7.99 / month · recurring monthly subscription via Stripe"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => void startCheckout("yearly")}
              disabled={loadingInterval !== null}
              className="rounded-3xl bg-cyan-300 px-5 py-4 text-left text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-slate-700">Yearly &mdash; Save 33%</p>
              <p className="mt-2 text-xl font-semibold">Premium Yearly</p>
              <p className="mt-2 text-sm text-slate-700">
                {loadingInterval === "yearly"
                  ? "Preparing your Stripe session..."
                  : "$49 / year · recurring annual subscription via Stripe"}
              </p>
            </button>
          </div>
        )}

        <div className="mt-6 rounded-3xl border border-white/20 bg-slate-900 px-5 py-4 text-sm text-slate-200 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
            Checkout Workflow
          </p>
          <ol className="mt-3 space-y-2 text-sm leading-7 text-slate-200/85">
            <li>1. Sign in to ChimAura before purchasing for the cleanest account-linked experience.</li>
            <li>2. Choose monthly or yearly &mdash; both create a Stripe-hosted checkout session linked to your account.</li>
            <li>3. Premium activates after Stripe confirms payment. Manage billing, switch plans, or cancel any time through the Stripe portal.</li>
          </ol>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <ManageSubscriptionButton />
          <a
            href="/pricing"
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
          >
            See Full Pricing
          </a>
        </div>
      </div>
    </div>
  );
}
