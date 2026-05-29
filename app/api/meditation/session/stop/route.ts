import { NextResponse } from "next/server";

import { errorResponse, tooManyRequestsResponse } from "@/lib/api-response";
import { resolveRequestIdentity } from "@/lib/identity";
import {
  MeditationSessionError,
  stopMeditationSession,
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
  const route = "/api/meditation/session/stop";

  if (!identity.userId) {
    await logApiRequest({
      route,
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 401,
      provider: null,
    });
    return errorResponse("Please sign in to stop a session.", 401);
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
  const action =
    body.action === "resume_later" || body.action === "discard" || body.action === "end_now"
      ? body.action
      : null;

  if (!sessionId || !action) {
    await logApiRequest({
      userId: identity.userId,
      route,
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 400,
      provider: null,
    });
    return errorResponse("sessionId and a valid action are required.", 400);
  }

  try {
    const result = await stopMeditationSession({
      userId: identity.userId,
      sessionId,
      action,
      elapsedSeconds: typeof body.elapsedSeconds === "number" ? body.elapsedSeconds : undefined,
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

    return NextResponse.json({ ok: true, ...result });
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
      "Unable to stop the session right now.",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}