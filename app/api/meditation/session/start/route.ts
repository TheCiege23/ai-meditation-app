import { NextResponse } from "next/server";

import { errorResponse, tooManyRequestsResponse } from "@/lib/api-response";
import { resolveRequestIdentity } from "@/lib/identity";
import {
  MeditationSessionError,
  startMeditationSession,
} from "@/lib/meditation-session";
import { applyRateLimit, resolvePolicyName } from "@/lib/rate-limit";
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
  const route = "/api/meditation/session/start";

  if (!identity.userId) {
    await logApiRequest({
      route,
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 401,
      provider: null,
    });
    return errorResponse("Please sign in to start a meditation session.", 401);
  }

  const rateLimit = await applyRateLimit(
    resolvePolicyName("meditationGenerate", identity.isAuthenticated),
    identity.identifier
  );

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

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    await logApiRequest({
      userId: identity.userId,
      route,
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 400,
      provider: null,
    });
    return errorResponse("Invalid session payload.", 400);
  }

  try {
    const session = await startMeditationSession(identity.viewer, body);

    await logApiRequest({
      userId: identity.userId,
      route,
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 200,
      provider: "openai",
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
      provider: "openai",
    });

    return errorResponse(
      "Unable to start the session right now.",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}