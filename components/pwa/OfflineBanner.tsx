"use client";

import { usePWA } from "./PWAProvider";
import { useLanguage } from "@/components/language/LanguageContext";
import { getPWACopy } from "@/lib/pwa-translations";

export default function OfflineBanner() {
  const { isOnline } = usePWA();
  const { language } = useLanguage();
  const copy = getPWACopy(language);

  if (isOnline) return null;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-50 border-b border-amber-200/80 bg-amber-50 px-4 py-3 text-center dark:border-amber-900/50 dark:bg-amber-900/30"
      style={{ paddingTop: "calc(0.75rem + var(--safe-area-inset-top))" }}
    >
      <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
        {copy.offlineTitle} — {copy.offlineMessage}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-2 text-sm font-semibold text-amber-800 underline dark:text-amber-200"
      >
        {copy.offlineRetry}
      </button>
    </div>
  );
}
