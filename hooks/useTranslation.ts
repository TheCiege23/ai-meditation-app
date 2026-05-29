"use client";

import { useCallback } from "react";

import { useLanguage } from "@/components/language/LanguageContext";
import { t as baseT } from "@/lib/i18n";

export function useTranslation() {
  const { language } = useLanguage();

  const t = useCallback(
    (key: string, defaultText?: string) => baseT(language, key, defaultText),
    [language]
  );

  return { t, language };
}

