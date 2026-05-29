import { NextResponse } from "next/server";

import { errorResponse, tooManyRequestsResponse, usageLimitResponse } from "@/lib/api-response";
import type { HoroscopeRange } from "@/lib/date-range";
import {
  getRangeApiDate,
  getRangeCacheKey,
  getRangeLabel,
  isValidHoroscopeRange,
} from "@/lib/date-range";
import { canUseHoroscope, getEffectiveEntitlements } from "@/lib/entitlements";
import {
  buildFallbackHoroscope,
  enhanceHoroscopeWithAiContext,
  getDailyHoroscopeBySign,
  translateHoroscopePayload,
} from "@/lib/horoscope";
import { getCachedHoroscope, saveCachedHoroscope } from "@/lib/horoscope-cache";
import { resolveRequestIdentity } from "@/lib/identity";
import type { AppLanguage, HoroscopeSource } from "@/lib/types";
import { applyRateLimit } from "@/lib/rate-limit";
import { getDateKey, getOrCreateDailyUsage, incrementHoroscopeUsage } from "@/lib/usage";
import { getUserProfileSnapshot, logApiRequest } from "@/lib/user-store";
import { getZodiacSign } from "@/lib/zodiac";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_SIGNS = new Set([
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
]);

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

async function resolveSign(req: Request, userId: string | null) {
  const url = new URL(req.url);
  const fromQuery = url.searchParams.get("sign")?.trim();

  if (fromQuery) {
    return fromQuery;
  }

  const cloned = req.clone();
  const body = await cloned.json().catch(() => null);
  if (body?.sign && typeof body.sign === "string") {
    return body.sign.trim();
  }

  if (!userId) {
    return null;
  }

  const profile = await getUserProfileSnapshot(userId);
  if (!profile?.birthdate) {
    return profile?.zodiacSign ?? null;
  }

  return profile.zodiacSign ?? getZodiacSign(new Date(profile.birthdate));
}

async function handleRequest(req: Request) {
  const identity = await resolveRequestIdentity(req);
  const rateLimit = await applyRateLimit(
    identity.isAuthenticated ? "horoscopeDaily" : "anonymousHeavy",
    identity.identifier
  );

  if (!rateLimit.success) {
    await logApiRequest({
      userId: identity.userId,
      route: "/api/horoscope/daily",
      method: req.method,
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 429,
      provider: null,
    });

    return tooManyRequestsResponse(rateLimit);
  }

  try {
    const url = new URL(req.url);
    const rangeParam = url.searchParams.get("range")?.trim();
    const range = isValidHoroscopeRange(rangeParam) ? rangeParam : "day";
    let language: AppLanguage = url.searchParams.get("language")?.trim() === "es" ? "es" : "en";
    const profile = identity.userId ? await getUserProfileSnapshot(identity.userId) : null;
    if (language === "en" && profile?.preferredLanguage === "es") {
      language = "es";
    }

    const entitlements = getEffectiveEntitlements(identity.viewer);
    if (range !== "day" && !entitlements.weeklyHoroscope) {
      return usageLimitResponse(
        "Week, month, and longer ranges are available on ChimAura Premium.",
        entitlements,
        "horoscope"
      );
    }

    const rawSign = await resolveSign(req, identity.userId);
    if (!rawSign) {
      return errorResponse("Add a birthdate or provide a zodiac sign to view your cosmic reflection.", 400);
    }

    const normalizedSign = rawSign.trim().toLowerCase();
    if (!VALID_SIGNS.has(normalizedSign)) {
      return errorResponse("A valid zodiac sign is required.", 400);
    }

    const sign = toTitleCase(normalizedSign);
    const dateKeyForUsage = getDateKey();
    const dateKeyForApi = getRangeApiDate(range);
    const dateKeyForCache = getRangeCacheKey(range) + (language === "es" ? "-es" : "");

    if (identity.userId) {
      const usage = await getOrCreateDailyUsage(identity.userId, dateKeyForUsage);
      if (!canUseHoroscope(usage, entitlements)) {
        return usageLimitResponse(
          "You have reached your free daily limit. Upgrade to ChimAura Premium for more access.",
          entitlements,
          "horoscope"
        );
      }
    }

    const cachedProvider = await getCachedHoroscope(sign, dateKeyForCache, "freeastroapi");
    const cachedMock = await getCachedHoroscope(sign, dateKeyForCache, "mock");
    const cached = cachedProvider ?? cachedMock;

    if (cached) {
      if (identity.userId) {
        await incrementHoroscopeUsage(identity.userId, dateKeyForUsage);
      }

      await logApiRequest({
        userId: identity.userId,
        route: "/api/horoscope/daily",
        method: req.method,
        ipHash: identity.ipHash,
        userAgent: identity.userAgent,
        statusCode: 200,
        provider: `cache:${String(cached.source)}`,
      });

      const payload = cached.payloadJson as import("@/types/api").DailyHoroscopePayload;
      const withLabel = {
        ...payload,
        rangeLabel: getRangeLabel(range as HoroscopeRange, language),
        range,
      };
      return NextResponse.json(withLabel);
    }

    let payload: import("@/types/api").DailyHoroscopePayload;
    let source: HoroscopeSource = "freeastroapi";

    try {
      payload = await getDailyHoroscopeBySign(sign, dateKeyForApi);
      if (payload.source === "mock") {
        source = "mock";
      }
    } catch (error) {
      console.error("FreeAstroAPI daily horoscope failed:", error);
      payload = buildFallbackHoroscope(sign, dateKeyForApi);
      source = "mock";
    }

    if (language === "es") {
      payload = await translateHoroscopePayload(payload, "es");
    }

    payload = await enhanceHoroscopeWithAiContext({
      payload,
      profile,
      targetLanguage: language,
      rangeLabel: getRangeLabel(range as HoroscopeRange, language),
    });

    payload.rangeLabel = getRangeLabel(range as HoroscopeRange, language);
    payload.range = range;

    await saveCachedHoroscope(sign, dateKeyForCache, payload, source);

    if (identity.userId) {
      await incrementHoroscopeUsage(identity.userId, dateKeyForUsage);
    }

    await logApiRequest({
      userId: identity.userId,
      route: "/api/horoscope/daily",
      method: req.method,
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 200,
      provider: payload.source === "mock" ? "provider:mock" : "provider:freeastroapi",
    });

    return NextResponse.json(payload);
  } catch (error) {
    await logApiRequest({
      userId: identity.userId,
      route: "/api/horoscope/daily",
      method: req.method,
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 500,
      provider: "freeastroapi",
    });

    return errorResponse(
      "Unable to load today's horoscope.",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

export async function GET(req: Request) {
  return handleRequest(req);
}

export async function POST(req: Request) {
  return handleRequest(req);
}


