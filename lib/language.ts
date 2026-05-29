import type { AppLanguage, UserProfileSnapshot } from "@/lib/types";

export const DEFAULT_LANGUAGE: AppLanguage = "en";

export function normalizeLanguage(value: unknown): AppLanguage {
  if (value === "es") return "es";
  return "en";
}

export function getLanguageFromProfile(profile: UserProfileSnapshot | null | undefined): AppLanguage {
  if (!profile) return DEFAULT_LANGUAGE;
  return normalizeLanguage(profile.preferredLanguage);
}

export function getLanguageFromStorage(): AppLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const raw = window.localStorage.getItem("chimaura.language");
  return normalizeLanguage(raw);
}

export function persistLanguageToStorage(language: AppLanguage) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("chimaura.language", language);
}

