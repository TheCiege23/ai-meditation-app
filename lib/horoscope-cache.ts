import { isPrismaMissingTableError, prisma } from "@/lib/db";
import type { HoroscopeSource } from "@/lib/types";
import type { DailyHoroscopePayload } from "@/types/api";

let warnedMissingHoroscopeCacheTable = false;

function getDefaultExpiry() {
  return new Date(Date.now() + 1000 * 60 * 60 * 30);
}

function warnMissingHoroscopeCacheTable() {
  if (warnedMissingHoroscopeCacheTable) {
    return;
  }

  warnedMissingHoroscopeCacheTable = true;
  console.warn("Horoscope cache table is missing; continuing without persisted horoscope caching.");
}

export async function getCachedHoroscope(
  sign: string,
  dateKey: string,
  source: HoroscopeSource = "freeastroapi"
) {
  try {
    return await prisma.horoscopeCache.findFirst({
      where: {
        sign,
        dateKey,
        source,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  } catch (error) {
    if (isPrismaMissingTableError(error, "horoscope_cache")) {
      warnMissingHoroscopeCacheTable();
      return null;
    }

    throw error;
  }
}

export async function saveCachedHoroscope(
  sign: string,
  dateKey: string,
  payload: DailyHoroscopePayload,
  source: HoroscopeSource = "freeastroapi",
  expiresAt = getDefaultExpiry()
) {
  try {
    return await prisma.horoscopeCache.upsert({
      where: {
        sign_dateKey_source: {
          sign,
          dateKey,
          source,
        },
      },
      update: {
        payloadJson: payload,
        expiresAt,
      },
      create: {
        sign,
        dateKey,
        source,
        payloadJson: payload,
        expiresAt,
      },
    });
  } catch (error) {
    if (isPrismaMissingTableError(error, "horoscope_cache")) {
      warnMissingHoroscopeCacheTable();
      return null;
    }

    throw error;
  }
}

export async function cleanupExpiredHoroscopeCache() {
  try {
    return await prisma.horoscopeCache.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });
  } catch (error) {
    if (isPrismaMissingTableError(error, "horoscope_cache")) {
      warnMissingHoroscopeCacheTable();
      return { count: 0 };
    }

    throw error;
  }
}
