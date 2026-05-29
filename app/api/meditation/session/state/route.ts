import { NextResponse } from "next/server";

import { errorResponse, tooManyRequestsResponse } from "@/lib/api-response";
import { resolveRequestIdentity } from "@/lib/identity";
import {
  MeditationSessionError,
  getMeditationSessionState,
  updateMeditationSessionState,
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

export async function GET(req: Request) {
  const identity = await resolveRequestIdentity(req);
  const route = "/api/meditation/session/state";

  if (!identity.userId) {
    await logApiRequest({
      route,
      method: "GET",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 401,
      provider: null,
    });
    return errorResponse("Please sign in to load session state.", 401);
  }

  const rateLimit = await applyRateLimit("genericApi", identity.identifier);
  if (!rateLimit.success) {
    await logApiRequest({
      userId: identity.userId,
      route,
      method: "GET",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 429,
      provider: null,
    });
    return tooManyRequestsResponse(rateLimit);
  }

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId")?.trim() ?? null;
    const session = await getMeditationSessionState(identity.userId, sessionId);

    await logApiRequest({
      userId: identity.userId,
      route,
      method: "GET",
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
        method: "GET",
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
      method: "GET",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 500,
      provider: null,
    });

    return errorResponse(
      "Unable to load the session state.",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}

export async function POST(req: Request) {
  const identity = await resolveRequestIdentity(req);
  const route = "/api/meditation/session/state";

  if (!identity.userId) {
    await logApiRequest({
      route,
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 401,
      provider: null,
    });
    return errorResponse("Please sign in to update session state.", 401);
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
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.trim() : "";
  const status =
    body.status === "ready" || body.status === "playing" || body.status === "paused"
      ? body.status
      : undefined;
  const metadataPatch = body.metadataPatch && typeof body.metadataPatch === "object"
    ? body.metadataPatch
    : undefined;

  if (!sessionId) {
    await logApiRequest({
      userId: identity.userId,
      route,
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 400,
      provider: null,
    });
    return errorResponse("sessionId is required.", 400);
  }

  try {
    const session = await updateMeditationSessionState({
      userId: identity.userId,
      sessionId,
      status,
      elapsedSeconds: typeof body.elapsedSeconds === "number" ? body.elapsedSeconds : undefined,
      metadataPatch,
    });

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
      "Unable to update the session state.",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}