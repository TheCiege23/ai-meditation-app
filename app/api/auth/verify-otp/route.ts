import { NextResponse } from "next/server";

import {
  deletePhoneOtpRecord,
  getPhoneOtpRecord,
  resolveViewer,
  updateAuthUserRecord,
  updatePhoneOtpAttemptCount,
} from "@/lib/auth";
import { errorResponse, tooManyRequestsResponse } from "@/lib/api-response";
import { getClientIp, hashIp } from "@/lib/identity";
import { applyRateLimit } from "@/lib/rate-limit";
import { hashToken } from "@/lib/verification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);

  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Not authenticated.", 401);
  }

  const ipHash = hashIp(getClientIp(req));
  const rateLimit = await applyRateLimit("authSensitive", `verify-otp:${viewer.userId}:${ipHash}`);
  if (!rateLimit.success) {
    return tooManyRequestsResponse(rateLimit);
  }

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!/^\d{6}$/.test(code)) {
    return errorResponse("Enter the 6-digit verification code.", 400);
  }

  const record = await getPhoneOtpRecord(viewer.userId);

  if (!record) {
    return errorResponse("No active verification code.", 400);
  }

  if (record.expiresAt < new Date()) {
    await deletePhoneOtpRecord(viewer.userId);
    return errorResponse("Code has expired.", 400);
  }

  if (record.attemptCount >= MAX_ATTEMPTS) {
    await deletePhoneOtpRecord(viewer.userId);
    return errorResponse("Too many attempts. Please request a new code.", 400);
  }

  const codeHash = hashToken(code);
  if (codeHash !== record.codeHash) {
    const nextAttemptCount = record.attemptCount + 1;
    if (nextAttemptCount >= MAX_ATTEMPTS) {
      await deletePhoneOtpRecord(viewer.userId);
      return errorResponse("Too many attempts. Please request a new code.", 400);
    }

    await updatePhoneOtpAttemptCount(viewer.userId, nextAttemptCount);
    return errorResponse("Invalid code.", 400);
  }

  await updateAuthUserRecord(viewer.userId, {
    phoneVerified: true,
  });
  await deletePhoneOtpRecord(viewer.userId);

  return NextResponse.json({ ok: true });
}

