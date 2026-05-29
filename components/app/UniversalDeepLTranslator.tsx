"use client";

import { useEffect } from "react";

import { useLanguage } from "@/components/language/LanguageContext";

export default function UniversalDeepLTranslator() {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
