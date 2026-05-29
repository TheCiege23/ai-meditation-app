import { NextResponse } from "next/server";

import { getPhoneOtpRecord, resolveViewer, savePhoneOtpRecord, updateAuthUserRecord } from "@/lib/auth";
import { errorResponse, tooManyRequestsResponse } from "@/lib/api-response";
import { getClientIp, hashIp } from "@/lib/identity";
import { applyRateLimit } from "@/lib/rate-limit";
import { isTwilioConfigured, sendOtpSms, sendOtpVoiceCall } from "@/lib/sms";
import type { AppLanguage } from "@/lib/types";
import { generateOtpCode, hashToken, normalizePhoneNumber } from "@/lib/verification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);

  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Not authenticated.", 401);
  }

  const ipHash = hashIp(getClientIp(req));
  const rateLimit = await applyRateLimit("authSensitive", `send-otp:${viewer.userId}:${ipHash}`);
  if (!rateLimit.success) {
    return tooManyRequestsResponse(rateLimit);
  }

  const body = await req.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? normalizePhoneNumber(body.phone) : null;
  const channel = body?.channel === "call" ? "call" : "sms";

  if (!phone) {
    return errorResponse("Enter a valid phone number.", 400);
  }

  const existingOtp = await getPhoneOtpRecord(viewer.userId);
  if (existingOtp && existingOtp.lastSentAt.getTime() + OTP_RESEND_COOLDOWN_MS > Date.now()) {
    return errorResponse("Please wait 60 seconds before requesting another code.", 429);
  }

  const now = new Date();
  const code = generateOtpCode(6);
  const codeHash = hashToken(code);
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  await updateAuthUserRecord(viewer.userId, {
    phoneNumber: phone,
    phoneVerified: false,
  });
  await savePhoneOtpRecord({
    userId: viewer.userId,
    codeHash,
    expiresAt,
    attemptCount: 0,
    lastSentAt: now,
  });

  if (!isTwilioConfigured()) {
    return errorResponse("SMS service is not configured on this server.", 503);
  }

  const profileLanguageHeader = req.headers.get("x-chimaura-language");
  const language: AppLanguage = profileLanguageHeader === "es" ? "es" : "en";
  if (channel === "call") {
    await sendOtpVoiceCall({ to: phone, code, language });
  } else {
    await sendOtpSms({ to: phone, code, language });
  }

  return NextResponse.json({ ok: true, phoneNumber: phone, channel });
}

