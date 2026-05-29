import { NextResponse } from "next/server";

import { errorResponse, tooManyRequestsResponse } from "@/lib/api-response";
import { resolveRequestIdentity } from "@/lib/identity";
import {
  MeditationSessionError,
  resumeMeditationSession,
} from "@/lib/meditation-session";
import { applyRateLimit } from "@/lib/rate-limit";
import { logApiRequest } from "@/lib/user-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sessionErrorResponse(error: MeditationSessionError) {
  return NextResponse.json(
    {
      error: error.message,
      message: error.message,
      upgradeRequired: error.upgradeRequired,
      feature: error.feature,
    },
    { status: error.status }
  );
}

export async function POST(req: Request) {
  const identity = await resolveRequestIdentity(req);
  const route = "/api/meditation/session/resume";

  if (!identity.userId) {
    await logApiRequest({
      route,
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 401,
      provider: null,
    });
    return errorResponse("Please sign in to resume a session.", 401);
  }

  const rateLimit = await applyRateLimit("genericApi", identity.identifier);
  if (!rateLimit.success) {
    await logApiRequest({
      userId: identity.userId,
      route,
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 429,
      provider: null,
    });
    return tooManyRequestsResponse(rateLimit);
  }

  const body = await req.json().catch(() => ({}));

  try {
    const session = await resumeMeditationSession(
      identity.userId,
      typeof body.sessionId === "string" ? body.sessionId.trim() : null
    );

    await logApiRequest({
      userId: identity.userId,
      route,
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 200,
      provider: null,
    });

    return NextResponse.json({ ok: true, session });
  } catch (error) {
    if (error instanceof MeditationSessionError) {
      await logApiRequest({
        userId: identity.userId,
        route,
        method: "POST",
        ipHash: identity.ipHash,
        userAgent: identity.userAgent,
        statusCode: error.status,
        provider: null,
      });
      return sessionErrorResponse(error);
    }

    await logApiRequest({
      userId: identity.userId,
      route,
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 500,
      provider: null,
    });

    return errorResponse(
      "Unable to resume the session right now.",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}