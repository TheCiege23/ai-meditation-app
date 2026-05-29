"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PWAContextValue = {
  isOnline: boolean;
  isInstallable: boolean;
  promptInstall: () => Promise<boolean>;
  swRegistration: ServiceWorkerRegistration | null;
};

const PWAContext = createContext<PWAContextValue>({
  isOnline: true,
  isInstallable: false,
  promptInstall: async () => false,
  swRegistration: null,
});

export const INSTALL_DISMISS_KEY = "chimaura-install-dismissed";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installable, setInstallable] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const setInitial = () => setIsOnline(navigator.onLine);
    queueMicrotask(setInitial);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/chimaura-sw.js", { scope: "/" })
      .then((reg) => {
        setSwRegistration(reg);
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      const dismissed = sessionStorage.getItem(INSTALL_DISMISS_KEY);
      if (!dismissed) setInstallable(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false;
    const { outcome } = await installPrompt.prompt();
    const accepted = outcome === "accepted";
    if (accepted) {
      setInstallable(false);
      setInstallPrompt(null);
    }
    return accepted;
  }, [installPrompt]);

  const value = useMemo<PWAContextValue>(
    () => ({
      isOnline,
      isInstallable: installable && Boolean(installPrompt),
      promptInstall,
      swRegistration,
    }),
    [isOnline, installable, installPrompt, promptInstall, swRegistration]
  );

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

export function usePWA() {
  return useContext(PWAContext);
}

export function setInstallBannerDismissed() {
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem(INSTALL_DISMISS_KEY, "1");
  }
}
