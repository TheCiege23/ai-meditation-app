import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitPolicyName =
  | "meditationGenerate"
  | "speechGenerate"
  | "horoscopeDaily"
  | "authSensitive"
  | "genericApi"
  | "anonymousHeavy";

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type PolicyConfig = {
  limit: number;
  window: "1 m";
};

const POLICY_CONFIG: Record<RateLimitPolicyName, PolicyConfig> = {
  meditationGenerate: { limit: 10, window: "1 m" },
  speechGenerate: { limit: 10, window: "1 m" },
  horoscopeDaily: { limit: 20, window: "1 m" },
  authSensitive: { limit: 5, window: "1 m" },
  genericApi: { limit: 60, window: "1 m" },
  anonymousHeavy: { limit: 5, window: "1 m" },
};

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const fallbackStore = new Map<string, { count: number; reset: number }>();

const rateLimiters = redis
  ? {
      meditationGenerate: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          POLICY_CONFIG.meditationGenerate.limit,
          POLICY_CONFIG.meditationGenerate.window
        ),
        prefix: "chimaura:meditation",
      }),
      speechGenerate: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          POLICY_CONFIG.speechGenerate.limit,
          POLICY_CONFIG.speechGenerate.window
        ),
        prefix: "chimaura:speech",
      }),
      horoscopeDaily: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          POLICY_CONFIG.horoscopeDaily.limit,
          POLICY_CONFIG.horoscopeDaily.window
        ),
        prefix: "chimaura:horoscope",
      }),
      authSensitive: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          POLICY_CONFIG.authSensitive.limit,
          POLICY_CONFIG.authSensitive.window
        ),
        prefix: "chimaura:auth",
      }),
      genericApi: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          POLICY_CONFIG.genericApi.limit,
          POLICY_CONFIG.genericApi.window
        ),
        prefix: "chimaura:generic",
      }),
      anonymousHeavy: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(
          POLICY_CONFIG.anonymousHeavy.limit,
          POLICY_CONFIG.anonymousHeavy.window
        ),
        prefix: "chimaura:anonymous",
      }),
    }
  : null;

function applyFallbackRateLimit(policy: RateLimitPolicyName, identifier: string): RateLimitResult {
  const config = POLICY_CONFIG[policy];
  const key = `${policy}:${identifier}`;
  const now = Date.now();
  const current = fallbackStore.get(key);

  if (!current || current.reset <= now) {
    fallbackStore.set(key, {
      count: 1,
      reset: now + 60_000,
    });

    return {
      success: true,
      limit: config.limit,
      remaining: config.limit - 1,
      reset: now + 60_000,
    };
  }

  if (current.count >= config.limit) {
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset: current.reset,
    };
  }

  current.count += 1;
  fallbackStore.set(key, current);

  return {
    success: true,
    limit: config.limit,
    remaining: Math.max(0, config.limit - current.count),
    reset: current.reset,
  };
}

export function resolvePolicyName(
  policy: Exclude<RateLimitPolicyName, "anonymousHeavy">,
  isAuthenticated: boolean
): RateLimitPolicyName {
  if (!isAuthenticated && (policy === "meditationGenerate" || policy === "speechGenerate")) {
    return "anonymousHeavy";
  }

  return policy;
}

export async function applyRateLimit(
  policy: RateLimitPolicyName,
  identifier: string
): Promise<RateLimitResult> {
  if (!rateLimiters) {
    return applyFallbackRateLimit(policy, identifier);
  }

  const result = await rateLimiters[policy].limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}