import type { AppLanguage } from "@/lib/types";
import { MESSAGES, type Messages } from "@/lib/i18n-data";

function getNested(messages: Messages, key: string): unknown {
  const parts = key.split(".");
  let current: unknown = messages;
  for (const part of parts) {
    if (current == null) return undefined;
    if (typeof current !== "object") return undefined;
    const record = current as Record<string, unknown>;
    current = record[part];
  }
  return current;
}

export function t(language: AppLanguage, key: string, defaultText?: string): string {
  const messages = MESSAGES[language] ?? MESSAGES.en;
  const value = getNested(messages, key);
  if (typeof value === "string") return value;
  const fallback = getNested(MESSAGES.en, key);
  if (typeof fallback === "string") return fallback;
  return defaultText ?? key;
}

