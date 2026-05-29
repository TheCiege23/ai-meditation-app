import { Redis } from "@upstash/redis";

const GUEST_DAILY_LIMIT = 1;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const fallbackStore = new Map<string, { count: number; resetAt: number }>();

function getDayKey(ipHash: string): string {
  const day = new Date().toISOString().slice(0, 10);
  return `chimaura:guest:daily:${day}:${ipHash}`;
}

function getMidnightTtlSeconds(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return Math.max(60, Math.ceil((midnight.getTime() - now.getTime()) / 1000));
}

export async function checkGuestDailyLimit(
  ipHash: string
): Promise<{ allowed: boolean; used: number }> {
  const key = getDayKey(ipHash);

  if (redis) {
    try {
      const raw = await redis.get<string | number>(key);
      const used = raw !== null ? Number(raw) : 0;
      return { allowed: used < GUEST_DAILY_LIMIT, used };
    } catch {
      // fall through to in-memory
    }
  }

  const entry = fallbackStore.get(key);
  const now = Date.now();
  if (!entry || entry.resetAt <= now) {
    return { allowed: true, used: 0 };
  }
  return { allowed: entry.count < GUEST_DAILY_LIMIT, used: entry.count };
}

export async function incrementGuestDailyUsage(ipHash: string): Promise<void> {
  const key = getDayKey(ipHash);
  const ttl = getMidnightTtlSeconds();

  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, ttl);
      }
      return;
    } catch {
      // fall through to in-memory
    }
  }

  const now = Date.now();
  const resetAt = now + ttl * 1000;
  const entry = fallbackStore.get(key);
  if (!entry || entry.resetAt <= now) {
    fallbackStore.set(key, { count: 1, resetAt });
  } else {
    fallbackStore.set(key, { count: entry.count + 1, resetAt: entry.resetAt });
  }
}
