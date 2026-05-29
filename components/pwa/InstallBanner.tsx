"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/components/language/LanguageContext";
import { getPWACopy } from "@/lib/pwa-translations";
import { usePWA, setInstallBannerDismissed, INSTALL_DISMISS_KEY } from "./PWAProvider";

export default function InstallBanner() {
  const { language } = useLanguage();
  const copy = getPWACopy(language);
  const { isInstallable, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(() =>
    typeof sessionStorage !== "undefined" ? Boolean(sessionStorage.getItem(INSTALL_DISMISS_KEY)) : false
  );

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem(INSTALL_DISMISS_KEY)) setDismissed(true);
  }, []);
  const [installing, setInstalling] = useState(false);

  if (!isInstallable || dismissed) return null;

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const ok = await promptInstall();
      if (ok) setDismissed(true);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setInstallBannerDismissed();
  };

  return (
    <div
      className="fixed bottom-20 left-0 right-0 z-30 mx-auto max-w-lg px-4 sm:bottom-24"
      style={{ paddingBottom: "var(--safe-area-inset-bottom)" }}
    >
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {copy.installTitle}
            </h3>
            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
              {copy.installDescription}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="tap-target shrink-0 rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label={copy.installDismiss}
          >
            ✕
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            className="tap-target flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
          >
            {installing ? "…" : copy.installCta}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="tap-target rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300"
          >
            {copy.installDismiss}
          </button>
        </div>
      </div>
    </div>
  );
}
