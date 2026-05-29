"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import HoroscopeActions from "@/components/horoscope/HoroscopeActions";
import HoroscopeCard from "@/components/horoscope/HoroscopeCard";
import type {
  ActionTile,
  AuraInsight,
  BreathworkSuggestion,
  DailyAffirmation,
  DailyReflection,
  JournalPrompt,
} from "@/components/horoscope/types";
import ZodiacBadge from "@/components/horoscope/ZodiacBadge";
import { useSubscriptionPrompt } from "@/components/billing/SubscriptionPromptProvider";
import PremiumBadge from "@/components/shared/PremiumBadge";
import SoftGlowBackground from "@/components/shared/SoftGlowBackground";
import BreathworkSuggestionCard from "@/components/zen/BreathworkSuggestionCard";
import DailyAffirmationCard from "@/components/zen/DailyAffirmationCard";
import HoroscopeSkeleton from "@/components/zen/HoroscopeSkeleton";
import JournalPromptCard from "@/components/zen/JournalPromptCard";
import NoBirthdateState from "@/components/zen/NoBirthdateState";
import { useLanguage } from "@/components/language/LanguageContext";
import type { HoroscopeRange } from "@/lib/date-range";
import { getHoroscopeRanges, getRangeLabel } from "@/lib/date-range";
import { getZenRecommendations } from "@/lib/zenRecommendations";
import { useSubscription } from "@/hooks/useSubscription";
import type { UserProfileSnapshot } from "@/lib/types";

const REFRESH_COOLDOWN_MS = 45_000;

type ProfileResponse = {
  profile: UserProfileSnapshot | null;
};

function buildAuraInsight(reflection: DailyReflection, auraColor?: string): AuraInsight {
  return {
    colorName: auraColor ?? reflection.luckyColor ?? "Soft Lavender",
    theme: reflection.mood ?? "Reflection and Rest",
    description:
      reflection.rest ??
      "Choose slower transitions, softer edges, and fewer inputs so your attention can settle naturally.",
    gradientClassName:
      "from-fuchsia-300/40 via-sky-200/35 to-indigo-300/40 dark:from-fuchsia-400/18 dark:via-sky-300/12 dark:to-indigo-400/18",
    glowClassName:
      "bg-[radial-gradient(circle_at_center,rgba(216,180,254,0.5),transparent_68%)] dark:bg-[radial-gradient(circle_at_center,rgba(192,132,252,0.22),transparent_70%)]",
  };
}

export default function HoroscopePage() {
  const { user, entitlements } = useSubscription();
  const { language } = useLanguage();
  const { openPrompt } = useSubscriptionPrompt();
  const [profile, setProfile] = useState<UserProfileSnapshot | null>(null);
  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [selectedRange, setSelectedRange] = useState<HoroscopeRange>("day");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [birthdateInput, setBirthdateInput] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null);
  const [refreshClock, setRefreshClock] = useState(() => Date.now());

  const availableRanges = useMemo(() => {
    const all = getHoroscopeRanges();
    return entitlements?.weeklyHoroscope ? all : (all.filter((r) => r === "day") as HoroscopeRange[]);
  }, [entitlements?.weeklyHoroscope]);

  const loadProfile = async () => {
    const response = await fetch("/api/profile", { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ProfileResponse;
    setProfile(data.profile);
    if (data.profile?.birthdate) {
      setBirthdateInput(data.profile.birthdate.slice(0, 10));
    }
    return data.profile;
  };

  const loadReflection = useCallback(
    async (sign?: string, range?: HoroscopeRange, lang?: "en" | "es") => {
      const params = new URLSearchParams();
      if (sign) params.set("sign", sign);
      params.set("range", range ?? selectedRange);
      params.set("language", lang ?? language);
      const response = await fetch(`/api/horoscope/daily?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load horoscope.");
      }
      const data = (await response.json()) as DailyReflection;
      setReflection(data);
      return data;
    },
    [selectedRange, language]
  );

  useEffect(() => {
    let active = true;
    const boot = async () => {
      try {
        await loadProfile();
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void boot();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (lastRefreshAt === null) return undefined;
    const interval = window.setInterval(() => setRefreshClock(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [lastRefreshAt]);

  useEffect(() => {
    if (!profile?.birthdate || isLoading) return;
    let active = true;
    const sign = profile.zodiacSign ?? undefined;
    loadReflection(sign, selectedRange, language).finally(() => {
      if (!active) return;
    });
    return () => {
      active = false;
    };
  }, [profile?.birthdate, profile?.zodiacSign, selectedRange, language, isLoading, loadReflection]);

  const cooldownRemaining = lastRefreshAt
    ? Math.max(0, REFRESH_COOLDOWN_MS - (refreshClock - lastRefreshAt))
    : 0;

  const refreshHint =
    cooldownRemaining > 0
      ? `Refresh available in ${Math.ceil(cooldownRemaining / 1000)}s. Same-day caching keeps provider usage calm.`
      : "Refresh is intentional and cache-aware so the astrology provider is not spammed.";

  const recommendations = useMemo(() => {
    if (!reflection) {
      return null;
    }
    return getZenRecommendations(reflection);
  }, [reflection]);

  const affirmation: DailyAffirmation = {
    text: recommendations?.affirmation ?? "I can return to calm one breath at a time.",
    whisper: "Repeat this gently on your next full exhale.",
  };

  const journalPrompt: JournalPrompt = {
    title: "A gentle journaling prompt",
    prompt:
      recommendations?.journalPrompt ??
      "What would help me move through today with more steadiness and less urgency?",
    tone: "Reflective",
  };

  const breathwork: BreathworkSuggestion = {
    title: recommendations?.breathingType === "4-7-8" ? "4-7-8 Breathing" : recommendations?.breathingType === "box" ? "Box Breathing" : recommendations?.breathingType === "deep-reset" ? "Deep Reset" : "Calm Breathing",
    pattern:
      recommendations?.breathingType === "4-7-8"
        ? "Inhale 4 | Hold 7 | Exhale 8"
        : recommendations?.breathingType === "box"
          ? "Inhale 4 | Hold 4 | Exhale 4"
          : recommendations?.breathingType === "deep-reset"
            ? "Inhale 5 | Exhale 5"
            : "Inhale 4 | Hold 4 | Exhale 6",
    duration: "3 minutes",
    reason:
      recommendations?.meditationSuggestion ??
      "A slower breath pattern can help your system match today's calmer energy.",
    guidance:
      recommendations?.soundSuggestion ??
      "Keep your shoulders soft, breathe gently, and let the exhale feel unforced.",
  };

  const aura = reflection ? buildAuraInsight(reflection, recommendations?.auraColor) : null;

  const actions: ActionTile[] = [
    {
      id: "meditation",
      title: "Start Meditation for Today",
      description: recommendations?.meditationSuggestion ?? "Turn this reflection into a guided meditation.",
      cta: "Open meditation",
    },
    {
      id: "breathing",
      title: "Breathing Exercise for Today",
      description: `Recommended breath style: ${breathwork.title}.`,
      cta: "Start breathwork",
    },
    {
      id: "sleep",
      title: "Sleep Wind-Down",
      description: recommendations?.sleepSuggestion ?? "Prepare a softer evening reset.",
      cta: entitlements?.sleepMode ? "Open sleep mode" : "Upgrade to unlock",
      premium: !entitlements?.sleepMode,
    },
    {
      id: "journal",
      title: "Journal Prompt",
      description: "Use today's energy as a writing cue.",
      cta: "Start writing",
    },
  ];

  const handleSaveBirthdate = async () => {
    setSaveMessage("");
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthdate: birthdateInput }),
    });

    const data = await response.json();
    if (!response.ok) {
      setSaveMessage(data.error ?? "Unable to save birthdate.");
      return;
    }

    setProfile(data.profile);
    setSaveMessage("Birthdate saved. Your cosmic reflection is ready.");
    const sign = data.profile?.zodiacSign ?? undefined;
    await loadReflection(sign, selectedRange, language);
  };

  const handleRefresh = async () => {
    if (isRefreshing || cooldownRemaining > 0) return;
    setIsRefreshing(true);
    try {
      const sign = profile?.zodiacSign ?? undefined;
      await loadReflection(sign, selectedRange, language);
      setLastRefreshAt(Date.now());
      setRefreshClock(Date.now());
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRangeChange = (range: HoroscopeRange) => {
    if (!entitlements?.weeklyHoroscope && range !== "day") {
      openPrompt({ feature: "weekly horoscope and advanced cosmic insights" });
      return;
    }
    setSelectedRange(range);
  };

  const handleAction = (id: string) => {
    if (id === "sleep" && !entitlements?.sleepMode) {
      openPrompt({ feature: "sleep mode and night soundscapes" });
      return;
    }

    if (id === "meditation") {
      window.location.href = "/";
      return;
    }

    if (id === "journal") {
      window.location.href = "/";
      return;
    }

    if (id === "breathing") {
      window.location.href = "/";
    }
  };

  const currentDateLabel = useMemo(() => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(new Date());
  }, []);

  if (isLoading) {
    return (
      <main className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#eff6ff_0%,#f7f7ff_46%,#fbfdff_100%)] px-4 py-6 dark:bg-[linear-gradient(180deg,#07111f_0%,#0b1324_42%,#101a30_100%)] app-bottom-nav-pad sm:py-8 sm:px-6 lg:px-8">
        <SoftGlowBackground tone="cosmic" className="opacity-90" />
        <div className="app-container relative mx-auto max-w-7xl">
          <HoroscopeSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#eff6ff_0%,#f7f7ff_46%,#fbfdff_100%)] px-4 py-6 dark:bg-[linear-gradient(180deg,#07111f_0%,#0b1324_42%,#101a30_100%)] app-bottom-nav-pad sm:py-8 sm:px-6 lg:px-8">
      <SoftGlowBackground tone="cosmic" className="opacity-90" />
      <SoftGlowBackground tone="aurora" className="opacity-60" />

      <div className="app-container relative mx-auto max-w-7xl space-y-6 lg:space-y-8">
        <section className="rounded-[2.3rem] border border-white/15 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_100px_-45px_rgba(14,25,56,0.6)] sm:px-8 sm:py-10">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/75">Daily Aura Insight</p>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your Daily Cosmic Reflection</h1>
              <p className="mt-4 text-sm leading-8 text-slate-200/80 sm:text-base">
                A gentle look at today&apos;s energy, paired with calming rituals for your mind and body.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200/75">
                <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2">{currentDateLabel}</span>
                {profile?.zodiacSign ? (
                  <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2">{profile.zodiacSign}</span>
                ) : null}
                {reflection?.rangeLabel ? (
                  <span className="rounded-full border border-white/10 bg-white/8 px-4 py-2">{reflection.rangeLabel}</span>
                ) : null}
              </div>
              {availableRanges.length > 1 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {availableRanges.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRangeChange(r)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        selectedRange === r
                          ? "bg-cyan-400/90 text-slate-950"
                          : "border border-white/15 bg-white/10 text-white/90 hover:bg-white/15"
                      }`}
                    >
                      {getRangeLabel(r, language)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            {user?.subscriptionTier === "premium" ? <PremiumBadge label="Premium Cosmic Layer" /> : null}
          </div>
        </section>

        {!profile?.birthdate ? (
          <div className="space-y-6">
            <NoBirthdateState onSaveBirthdate={handleSaveBirthdate} />
            <section className="rounded-4xl border border-white/15 bg-white/80 p-6 shadow-[0_24px_80px_-40px_rgba(48,72,138,0.45)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Unlock Horoscope</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">Save your birthdate</h2>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <input
                  type="date"
                  value={birthdateInput}
                  onChange={(event) => setBirthdateInput(event.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => void handleSaveBirthdate()}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white dark:bg-sky-200 dark:text-slate-950"
                >
                  Save Birthdate
                </button>
              </div>
              {saveMessage ? <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{saveMessage}</p> : null}
            </section>
          </div>
        ) : reflection ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.88fr)]">
            <div className="space-y-6">
              <section className="rounded-4xl border border-white/15 bg-white/80 p-6 shadow-[0_24px_80px_-40px_rgba(44,70,136,0.42)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
                <div className="flex items-start gap-4">
                  <ZodiacBadge sign={reflection.sign} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Zodiac Profile</p>
                    <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{reflection.sign}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">
                      Birthdate: {birthdateInput}. This reflection is intended as a mindful prompt, not a fixed prediction.
                    </p>
                  </div>
                </div>
              </section>

              <HoroscopeCard
                reflection={reflection}
                onRefresh={() => void handleRefresh()}
                isRefreshing={isRefreshing}
                refreshHint={refreshHint}
              />

              <HoroscopeActions actions={actions} onAction={handleAction} />

              <div className="grid gap-6 lg:grid-cols-2">
                <DailyAffirmationCard affirmation={affirmation} />
                <JournalPromptCard prompt={journalPrompt} />
              </div>
            </div>

            <div className="space-y-6">
              {aura ? (
                <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-slate-950 p-6 text-white shadow-[0_28px_72px_rgba(15,23,42,0.44)]">
                  <div className={`absolute inset-0 bg-linear-to-br ${aura.gradientClassName}`} />
                  <div className={`absolute left-1/2 top-8 h-44 w-44 -translate-x-1/2 rounded-full blur-3xl ${aura.glowClassName}`} />
                  <div className="relative z-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/65">Today&apos;s Aura</p>
                    <h3 className="mt-3 text-3xl font-semibold">{aura.colorName}</h3>
                    <p className="mt-2 text-white/80">{aura.theme}</p>
                    <p className="mt-5 text-sm leading-7 text-white/80">{aura.description}</p>
                  </div>
                </section>
              ) : null}

              <BreathworkSuggestionCard suggestion={breathwork} />

              {!entitlements?.weeklyHoroscope ? (
                <section className="rounded-4xl border border-white/15 bg-white/80 p-6 shadow-[0_24px_80px_-40px_rgba(46,68,134,0.45)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Premium Preview</p>
                      <h3 className="mt-3 text-xl font-semibold text-slate-900 dark:text-white">Weekly and advanced astrology</h3>
                    </div>
                    <PremiumBadge label="Premium" />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
                    Upgrade to unlock future weekly insights, richer personal charts, and deeper zen pairing.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      openPrompt({ feature: "weekly astrology and advanced cosmic insights" })
                    }
                    className="mt-5 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white dark:bg-cyan-300 dark:text-slate-950"
                  >
                    Upgrade to Unlock
                  </button>
                </section>
              ) : null}
            </div>
          </div>
        ) : (
          <NoBirthdateState onSaveBirthdate={handleSaveBirthdate} />
        )}
      </div>

    </main>
  );
}

