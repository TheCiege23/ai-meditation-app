import OpenAI from "openai";

import type { AppLanguage } from "@/lib/types";

type SupportedLanguage = AppLanguage;

type Provider = "deepl" | "google" | "openai-fallback" | "none";

const deeplApiKey = process.env.DEEPL_API_KEY ?? process.env.DEEPL_AUTH_KEY;
const googleApiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

const openaiClient = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

const cache = new Map<string, string>();

function getProvider(): Provider {
  if (deeplApiKey) return "deepl";
  if (googleApiKey) return "google";
  if (openaiClient) return "openai-fallback";
  return "none";
}

function buildCacheKey(text: string, target: SupportedLanguage) {
  return `${target}::${text}`;
}

function mapLanguageToIso(targetLanguage: SupportedLanguage) {
  return targetLanguage === "es" ? "es" : "en";
}

async function deeplTranslate(texts: string[], targetLanguage: SupportedLanguage): Promise<string[]> {
  const target = mapLanguageToIso(targetLanguage).toUpperCase();
  const body = new URLSearchParams();
  texts.forEach((t) => body.append("text", t));
  body.append("target_lang", target);

  const response = await fetch("https://api.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${deeplApiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`DeepL translation failed with status ${response.status}`);
  }

  const json = (await response.json()) as { translations: Array<{ text: string }> };
  return json.translations.map((t) => t.text);
}

async function googleTranslate(texts: string[], targetLanguage: SupportedLanguage): Promise<string[]> {
  const target = mapLanguageToIso(targetLanguage);
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(googleApiKey ?? "")}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: texts, target, format: "text" }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google Translate failed with status ${response.status}`);
  }

  const json = (await response.json()) as {
    data?: { translations?: Array<{ translatedText: string }> };
  };
  const items = json.data?.translations ?? [];
  return items.map((t) => t.translatedText);
}

async function openAiTranslate(texts: string[], targetLanguage: SupportedLanguage): Promise<string[]> {
  if (!openaiClient) return texts;
  const target = targetLanguage === "es" ? "Spanish" : "English";

  const joined = texts.join("\n---CHIMAURA_SPLIT---\n");
  const prompt = `Translate the following UI strings into natural, concise ${target} suitable for a calm wellness app. Keep button labels short. Preserve any placeholders like {interval}.\n\n${joined}`;

  const response = await openaiClient.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });
  const raw = response.output_text ?? joined;
  const parts = raw.split(/-+CHIMAURA_SPLIT-+\s*/i);
  if (parts.length >= texts.length) {
    return parts.slice(0, texts.length).map((p) => p.trim());
  }
  // Fallback: return original texts if splitting failed
  return texts;
}

export async function translateText(text: string, targetLanguage: SupportedLanguage): Promise<string> {
  if (!text.trim()) return text;
  const key = buildCacheKey(text, targetLanguage);
  const cached = cache.get(key);
  if (cached) return cached;

  const provider = getProvider();
  let translated = text;

  try {
    if (provider === "deepl") {
      [translated] = await deeplTranslate([text], targetLanguage);
    } else if (provider === "google") {
      [translated] = await googleTranslate([text], targetLanguage);
    } else if (provider === "openai-fallback") {
      [translated] = await openAiTranslate([text], targetLanguage);
    }
  } catch {
    translated = text;
  }

  cache.set(key, translated);
  return translated;
}

export async function translateBatch(texts: string[], targetLanguage: SupportedLanguage): Promise<string[]> {
  if (texts.length === 0) return [];

  const results: string[] = new Array(texts.length);
  const missing: { index: number; text: string }[] = [];

  texts.forEach((text, index) => {
    if (!text.trim()) {
      results[index] = text;
      return;
    }
    const key = buildCacheKey(text, targetLanguage);
    const cached = cache.get(key);
    if (cached) {
      results[index] = cached;
    } else {
      missing.push({ index, text });
    }
  });

  if (missing.length === 0) {
    return results;
  }

  const provider = getProvider();
  let translated: string[] = [];

  try {
    if (provider === "deepl") {
      translated = await deeplTranslate(
        missing.map((m) => m.text),
        targetLanguage
      );
    } else if (provider === "google") {
      translated = await googleTranslate(
        missing.map((m) => m.text),
        targetLanguage
      );
    } else if (provider === "openai-fallback") {
      translated = await openAiTranslate(
        missing.map((m) => m.text),
        targetLanguage
      );
    } else {
      translated = missing.map((m) => m.text);
    }
  } catch {
    translated = missing.map((m) => m.text);
  }

  missing.forEach((item, i) => {
    const value = translated[i] ?? item.text;
    const key = buildCacheKey(item.text, targetLanguage);
    cache.set(key, value);
    results[item.index] = value;
  });

  return results;
}

export async function detectLanguage(text: string): Promise<SupportedLanguage> {
  const trimmed = text.trim();
  if (!trimmed) return "en";

  // Quick heuristic: look for common Spanish characters
  if (/[ñáéíóúü¿¡]/i.test(trimmed)) {
    return "es";
  }

  const provider = getProvider();

  if (provider === "google" && googleApiKey) {
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2/detect?key=${encodeURIComponent(googleApiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ q: [trimmed] }),
        }
      );
      if (response.ok) {
        const json = (await response.json()) as {
          data?: { detections?: Array<Array<{ language: string }>> };
        };
        const code = json.data?.detections?.[0]?.[0]?.language;
        if (code && code.toLowerCase().startsWith("es")) return "es";
        if (code && code.toLowerCase().startsWith("en")) return "en";
      }
    } catch {
      // ignore and fall back
    }
  }

  return "en";
}

