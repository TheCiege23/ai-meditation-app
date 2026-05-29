"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import type { AppLanguage, UserProfileSnapshot } from "@/lib/types";
import {
  DEFAULT_LANGUAGE,
  getLanguageFromStorage,
  normalizeLanguage,
  persistLanguageToStorage,
} from "@/lib/language";

export type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  isSaving: boolean;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

type LanguageProviderProps = {
  initialProfile?: UserProfileSnapshot | null;
  children: React.ReactNode;
};

export function LanguageProvider({ initialProfile, children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window === "undefined") {
      return (initialProfile?.preferredLanguage && normalizeLanguage(initialProfile.preferredLanguage)) || DEFAULT_LANGUAGE;
    }
    const fromProfile = initialProfile?.preferredLanguage;
    if (fromProfile) return normalizeLanguage(fromProfile);
    return getLanguageFromStorage();
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    persistLanguageToStorage(language);
    document.documentElement.lang = language;
    document.cookie = `chimaura.language=${language}; path=/; max-age=31536000; samesite=lax`;
  }, [language]);

  const setLanguage = useCallback((next: AppLanguage) => {
    setLanguageState(next);
    persistLanguageToStorage(next);

    void (async () => {
      try {
        setIsSaving(true);
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferredLanguage: next }),
        });
        if (!response.ok) {
          // silent failure; storage still updated locally
        }
      } catch {
        // ignore network errors, local preference still applied
      } finally {
        setIsSaving(false);
      }
    })();
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isSaving,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

const DEFAULT_CTX: LanguageContextValue = {
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  isSaving: false,
};

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  return ctx ?? DEFAULT_CTX;
}

