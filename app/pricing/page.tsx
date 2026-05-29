"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import LockedFeatureCard from "@/components/billing/LockedFeatureCard";
import ManageSubscriptionButton from "@/components/billing/ManageSubscriptionButton";
import PricingCard from "@/components/billing/PricingCard";
import UpgradeModal from "@/components/billing/UpgradeModal";
import SoftGlowBackground from "@/components/shared/SoftGlowBackground";
import { useSubscription } from "@/hooks/useSubscription";
import { useTranslation } from "@/hooks/useTranslation";

export default function PricingPage() {
  const { user } = useSubscription();
  const { t } = useTranslation();
  const [interval, setInterval] = useState<"monthly" | "yearly">("yearly");
  const [modalOpen, setModalOpen] = useState(false);
  const [billingMessage, setBillingMessage] = useState("");
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [queryNotice, setQueryNotice] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutState = params.get("checkout");

    if (checkoutState === "success") {
      setQueryNotice(t("pricing.query.success"));
      return;
    }

    if (checkoutState === "cancelled") {
      setQueryNotice(t("pricing.query.cancelled"));
      return;
    }

    setQueryNotice("");
  }, [t]);

  const premiumPrice = useMemo(() => {
    if (interval === "monthly") {
      return {
        amount: "$7.99",
        cadence: t("pricing.premium.cadenceMonthly"),
      };
    }

    return {
      amount: "$49",
      cadence: t("pricing.premium.cadenceYearly"),
    };
  }, [interval, t]);

  const startCheckout = async () => {
    try {
      setIsCheckoutLoading(true);
      setBillingMessage("");

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval }),
      });

      const data = (await response.json().catch(() => null)) as { error?: string; url?: string } | null;
      if (!response.ok) {
        setBillingMessage(data?.error ?? t("pricing.linkedError.startFailed"));
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setBillingMessage(t("pricing.linkedError.missingRedirect"));
    } catch (error) {
      console.error("Checkout failed:", error);
      setBillingMessage("Unable to start checkout. Please try again.");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const subscriptionStatusMessage = useMemo(() => {
    const status = user?.subscriptionStatus;
    const tier = user?.subscriptionTier;
    if (tier === "premium" && status === "active") return "Premium active.";
    if (tier === "premium" && status === "trialing") return "Premium trial active.";
    if (status === "past_due") return "Payment issue. Manage billing to keep Premium.";
    if (status === "canceled") return "Subscription canceled. Premium access may end at the current period end.";
    return null;
  }, [user]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#eff5ff_0%,#f7f7ff_46%,#fbfdff_100%)] px-4 py-6 dark:bg-[linear-gradient(180deg,#07111f_0%,#0c1628_40%,#11192f_100%)] app-bottom-nav-pad sm:px-5 sm:py-8 lg:px-8">
      <SoftGlowBackground tone="cosmic" className="opacity-90" />
      <SoftGlowBackground tone="aurora" className="opacity-60" />

      <div className="app-container relative mx-auto max-w-6xl space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-white/20 dark:border-white/20"
          >
            <span className="text-base leading-none">←</span>
            <span>{t("common.actions.goHome")}</span>
          </Link>
        </div>

        <section className="rounded-[2.5rem] border border-white/20 bg-slate-950 px-6 py-10 text-white shadow-[0_30px_100px_-45px_rgba(13,24,56,0.6)] sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/70">
            {t("pricing.heroTag")}
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("pricing.heroTitle")}
          </h1>
          <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-200/80 sm:text-base">
            {t("pricing.heroBody")}
          </p>

          <div className="mt-7 inline-flex rounded-full border border-white/15 bg-white/10 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={`rounded-full px-4 py-2 ${interval === "monthly" ? "bg-white text-slate-950" : "text-slate-200"}`}
            >
              {t("pricing.intervalMonthly")}
            </button>
            <button
              type="button"
              onClick={() => setInterval("yearly")}
              className={`rounded-full px-4 py-2 ${interval === "yearly" ? "bg-cyan-300 text-slate-950" : "text-slate-200"}`}
            >
              {t("pricing.intervalYearly")}
            </button>
          </div>
        </section>

        {queryNotice ? (
          <section className="rounded-[1.8rem] border border-cyan-200 bg-cyan-50 px-5 py-4 text-sm text-cyan-900 shadow-[0_18px_40px_-30px_rgba(56,189,248,0.45)] dark:border-cyan-300/20 dark:bg-cyan-400/10 dark:text-cyan-100">
            {queryNotice}
          </section>
        ) : null}

        {billingMessage ? (
          <section className="rounded-[1.8rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700 shadow-[0_18px_40px_-30px_rgba(244,63,94,0.35)] dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-100">
            {billingMessage}
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <PricingCard
            title={t("pricing.free.title")}
            description={t("pricing.free.description")}
            priceLabel="$0"
            cadence={t("pricing.free.cadence")}
            ctaLabel={t("pricing.free.cta")}
            disabled
            features={[
              "3 AI meditations per day",
              "3 speech generations per day",
              "5 horoscope reflections per day",
              "Basic voice and limited sounds",
              "Sessions up to 5 minutes",
            ]}
          />

          <PricingCard
            title={t("pricing.premium.title")}
            description={t("pricing.premium.description")}
            priceLabel={premiumPrice.amount}
            cadence={premiumPrice.cadence}
            ctaLabel={
              user?.subscriptionTier === "premium"
                ? t("pricing.premium.ctaActive")
                : isCheckoutLoading
                  ? t("pricing.premium.ctaPreparing")
                  : t("pricing.premium.ctaLinked").replace(
                      "{interval}",
                      interval === "monthly" ? t("pricing.intervalMonthly").toLowerCase() : t("pricing.intervalYearly").toLowerCase()
                    )
            }
            onSelect={() => void startCheckout()}
            disabled={user?.subscriptionTier === "premium" || isCheckoutLoading}
            highlighted
            badge={interval === "yearly" ? t("pricing.premium.badgeYearly") : undefined}
            features={[
              "Unlimited AI meditations and narration",
              "Premium voices and multi-sound mixer",
              "Sleep mode and longer guided sessions (up to 60 min)",
              "Extended horoscope ranges and weekly cosmic reflection",
              "Session history, saved rituals, and favorites",
            ]}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <LockedFeatureCard title="Premium Voices" description="Unlock softer premium narration styles like deep male, whisper guide, and richer calming voices." />
          <LockedFeatureCard title="Sleep Wind-Down" description="Access longer bedtime meditations, slower breath pacing, and lower-light wind-down rituals." />
          <LockedFeatureCard title="Advanced Cosmic Insights" description="Future-ready premium astrology layers for more personal reflection and richer daily ritual pairing." />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Meditation Builder",
              description: "Free includes short guided sessions up to 5 min. Premium unlocks flows up to 60 min, more voices, and layered sound.",
            },
            {
              title: "Horoscope",
              description: "Free includes daily reflection. Premium unlocks weekly astrology, monthly ranges, and deeper cosmic pairing.",
            },
            {
              title: "Session Library",
              description: "Free users can generate and listen. Premium unlocks saved history, favorites, and multi-preset management.",
            },
            {
              title: "Yoga & Breathing",
              description: "Guided yoga flows and breathing sessions are available to all users. Premium unlocks longer durations and premium voices.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[1.6rem] border border-white/15 bg-white/80 p-5 shadow-[0_18px_50px_-35px_rgba(46,72,138,0.45)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                App Gating
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
                {item.description}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-4xl border border-white/15 bg-white/80 p-6 shadow-[0_24px_80px_-40px_rgba(48,72,138,0.45)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                Billing
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">
                Manage your subscription
              </h2>
              {subscriptionStatusMessage ? (
                <p className="mt-2 text-sm font-medium text-cyan-700 dark:text-cyan-300">
                  {subscriptionStatusMessage}
                </p>
              ) : null}
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700 dark:text-slate-300">
                Billing changes, card updates, and cancellations should happen through Stripe&apos;s secure customer portal.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <ManageSubscriptionButton />
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
              >
                Upgrade Prompt Preview
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="relative mt-4 max-w-2xl mx-auto text-center text-xs text-slate-400/70 dark:text-slate-500/60 px-4 leading-5">
        ChimAura Premium is a recurring subscription billed monthly or annually via Stripe. You can cancel at any time through the Stripe billing portal and retain access until the end of your current billing period. Prices are subject to change with 30 days&apos; notice.
      </div>

      <div className="relative mt-3 text-center text-xs text-slate-400/80 dark:text-slate-500/70">
        <Link href="/terms" className="hover:underline">Terms of Service</Link>
        {" · "}
        <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
      </div>

      <UpgradeModal open={modalOpen} onClose={() => setModalOpen(false)} feature="premium rituals" />
    </main>
  );
}
