import { NextResponse } from "next/server";

import type { RateLimitResult } from "@/lib/rate-limit";
import type { Entitlements } from "@/lib/entitlements";
import type { RateLimitResponseBody } from "@/types/api";

export function tooManyRequestsResponse(result: RateLimitResult) {
  const body: RateLimitResponseBody = {
    error: "Too many requests",
    message: "Please slow down and try again shortly.",
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };

  return NextResponse.json(body, { status: 429 });
}

export function usageLimitResponse(
  message: string,
  entitlements: Entitlements,
  feature?: "meditation" | "speech" | "horoscope"
) {
  return NextResponse.json(
    {
      error: "Usage limit reached",
      message,
      tier: entitlements.tier,
      feature,
      upgradeRequired: entitlements.tier === "free",
    },
    { status: 403 }
  );
}

export function errorResponse(error: string, status = 400, message?: string) {
  return NextResponse.json(
    {
      error,
      ...(message ? { message } : {}),
    },
    { status }
  );
}