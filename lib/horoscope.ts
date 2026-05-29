import OpenAI from "openai";

import type { AppLanguage } from "@/lib/types";
import type { UserProfileSnapshot } from "@/lib/types";
import type { DailyHoroscopePayload } from "@/types/api";

const FALLBACK_MESSAGE =
  "Your cosmic reflection is taking a moment to settle. Here is a gentle reset instead: slow your pace, protect your energy, and choose one small ritual that helps you feel anchored today.";

type FreeAstroDailyResponse = {
  overview?: string;
  description?: string;
  horoscope?: string;
  energy?: string;
  love?: string;
  focus?: string;
  rest?: string;
  mood?: string;
  luckyColor?: string;
  luckyNumber?: string | number;
  date?: string;
  sign?: string;
  sun_sign?: string;
};

export function normalizeHoroscopeResponse(raw: FreeAstroDailyResponse, sign: string, dateKey: string): DailyHoroscopePayload {
  return {
    sign,
    date: raw.date ?? dateKey,
    overview: raw.overview ?? raw.description ?? raw.horoscope ?? FALLBACK_MESSAGE,
    energy: raw.energy,
    love: raw.love,
    focus: raw.focus,
    rest: raw.rest,
    mood: raw.mood,
    luckyColor: raw.luckyColor,
    luckyNumber: raw.luckyNumber ? String(raw.luckyNumber) : undefined,
    source: "freeastroapi",
  };
}

export function buildFallbackHoroscope(sign: string, dateKey: string): DailyHoroscopePayload {
  return {
    sign,
    date: dateKey,
    overview: FALLBACK_MESSAGE,
    energy: "Gentle reset",
    focus: "Return to one simple priority",
    rest: "Create softer edges around your day",
    mood: "Steady and reflective",
    luckyColor: "Soft Lavender",
    luckyNumber: "8",
    source: "mock",
  };
}

function getFreeAstroApiConfig() {
  const apiKey = process.env.FREE_ASTRO_API_KEY ?? process.env.FREE_ASTRO_KEY;
  const explicitDailyUrl = process.env.FREE_ASTRO_API_DAILY_URL?.trim();
  const baseUrl = process.env.FREE_ASTRO_API_BASE_URL?.trim();

  if (!apiKey) {
    return null;
  }

  if (explicitDailyUrl) {
    return {
      apiKey,
      urlTemplate: explicitDailyUrl,
    };
  }

  if (baseUrl) {
    return {
      apiKey,
      urlTemplate: baseUrl,
    };
  }

  return null;
}

function buildFreeAstroDailyUrl(urlTemplate: string, sign: string, dateKey: string) {
  if (urlTemplate.includes("{sign}") || urlTemplate.includes("{date}")) {
    return urlTemplate
      .replaceAll("{sign}", encodeURIComponent(sign.toLowerCase()))
      .replaceAll("{date}", encodeURIComponent(dateKey));
  }

  const url = new URL(urlTemplate);
  url.searchParams.set("sign", sign.toLowerCase());
  url.searchParams.set("date", dateKey);
  return url.toString();
}

export async function getDailyHoroscopeBySign(sign: string, dateKey: string) {
  const config = getFreeAstroApiConfig();

  if (!config) {
    return buildFallbackHoroscope(sign, dateKey);
  }

  const response = await fetch(buildFreeAstroDailyUrl(config.urlTemplate, sign, dateKey), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "X-API-Key": config.apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`FreeAstroAPI daily horoscope request failed with ${response.status}.`);
  }

  const raw = (await response.json()) as FreeAstroDailyResponse;
  return normalizeHoroscopeResponse(raw, sign, dateKey);
}

export async function getPersonalAstroSnapshot(profile: UserProfileSnapshot) {
  const birthdate = profile.birthdate ? new Date(profile.birthdate) : null;
  const derivedSunSign =
    profile.zodiacSign ?? (birthdate ? profile.zodiacSign ?? null : null);

  return {
    sunSign: derivedSunSign,
    moonSign: null,
    risingSign: null,
    timezone: profile.timezone,
    location: profile.birthLocation,
    birthdate: profile.birthdate,
    readyForAdvancedChart: Boolean(
      profile.birthdate && profile.birthTime && profile.latitude !== null && profile.longitude !== null && profile.timezone
    ),
    source: "profile+freeastro-ready",
  };
}

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

/** Translate horoscope payload text fields to Spanish. Falls back to original if OpenAI is unavailable. */
export async function translateHoroscopePayload(
  payload: DailyHoroscopePayload,
  targetLanguage: AppLanguage
): Promise<DailyHoroscopePayload> {
  if (targetLanguage !== "es" || !openai) {
    return payload;
  }

  const textBlock = {
    overview: payload.overview ?? "",
    energy: payload.energy ?? "",
    love: payload.love ?? "",
    focus: payload.focus ?? "",
    rest: payload.rest ?? "",
    mood: payload.mood ?? "",
    luckyColor: payload.luckyColor ?? "",
  };

  const hasAny = Object.values(textBlock).some((s) => s.length > 0);
  if (!hasAny) return payload;

  try {
    const prompt = `Translate this horoscope text block into natural, warm Spanish (Spain). Keep the same tone (calm, reflective). Return a single JSON object with exactly these keys and Spanish values: overview, energy, love, focus, rest, mood, luckyColor. For any empty string keep it as "". No other keys. No markdown.\n\n${JSON.stringify(textBlock)}`;
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });
    const raw = response.output_text?.trim();
    if (!raw) return payload;

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}") + 1;
    const jsonStr = start >= 0 && end > start ? raw.slice(start, end) : raw;
    const translated = JSON.parse(jsonStr) as Record<string, string>;

    return {
      ...payload,
      overview: (translated.overview ?? "").trim() || payload.overview,
      energy: (translated.energy ?? "").trim() || payload.energy,
      love: (translated.love ?? "").trim() || payload.love,
      focus: (translated.focus ?? "").trim() || payload.focus,
      rest: (translated.rest ?? "").trim() || payload.rest,
      mood: (translated.mood ?? "").trim() || payload.mood,
      luckyColor: (translated.luckyColor ?? "").trim() || payload.luckyColor,
    };
  } catch (error) {
    console.error("Horoscope translation failed, returning original:", error);
    return payload;
  }
}

export async function enhanceHoroscopeWithAiContext(input: {
  payload: DailyHoroscopePayload;
  profile: UserProfileSnapshot | null;
  targetLanguage: AppLanguage;
  rangeLabel: string;
}) {
  const { payload, profile, targetLanguage, rangeLabel } = input;

  if (!openai) {
    return payload;
  }

  try {
    const prompt = `
You are ChimAura's calm astrology reflection writer.

Use the provider horoscope below as the source of truth.
Lightly refine it with personal context from the user's profile.
Do not invent astrology placements that are not provided.
Do not mention that you used AI or a provider.
Keep the tone warm, grounded, and reflective.
Keep the structure as a JSON object with exactly these keys:
overview, energy, love, focus, rest, mood, luckyColor, luckyNumber

Rules:
- Write in ${targetLanguage === "es" ? "Spanish" : "English"}.
- Keep "overview" to 2-4 sentences.
- Keep all other fields concise.
- Preserve the original meaning from the provider response.
- If personal profile context is missing, still improve clarity and usefulness.
- Do not add markdown.

Profile context:
${JSON.stringify({
  zodiacSign: profile?.zodiacSign ?? null,
  birthdate: profile?.birthdate ?? null,
  timezone: profile?.timezone ?? null,
  preferredMood: profile?.preferredMood ?? null,
  birthLocation: profile?.birthLocation ?? null,
})}

Provider horoscope:
${JSON.stringify({
  sign: payload.sign,
  date: payload.date,
  rangeLabel,
  overview: payload.overview,
  energy: payload.energy ?? "",
  love: payload.love ?? "",
  focus: payload.focus ?? "",
  rest: payload.rest ?? "",
  mood: payload.mood ?? "",
  luckyColor: payload.luckyColor ?? "",
  luckyNumber: payload.luckyNumber ?? "",
  source: payload.source,
})}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const raw = response.output_text?.trim();
    if (!raw) {
      return payload;
    }

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}") + 1;
    const jsonStr = start >= 0 && end > start ? raw.slice(start, end) : raw;
    const enhanced = JSON.parse(jsonStr) as Record<string, string>;

    return {
      ...payload,
      overview: enhanced.overview?.trim() || payload.overview,
      energy: enhanced.energy?.trim() || payload.energy,
      love: enhanced.love?.trim() || payload.love,
      focus: enhanced.focus?.trim() || payload.focus,
      rest: enhanced.rest?.trim() || payload.rest,
      mood: enhanced.mood?.trim() || payload.mood,
      luckyColor: enhanced.luckyColor?.trim() || payload.luckyColor,
      luckyNumber: enhanced.luckyNumber?.trim() || payload.luckyNumber,
    };
  } catch (error) {
    console.error("Horoscope AI enhancement failed, returning provider result:", error);
    return payload;
  }
}

