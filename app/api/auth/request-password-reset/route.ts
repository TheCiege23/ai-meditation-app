import { NextResponse } from "next/server";

import { getAuthUserRecordByEmail } from "@/lib/auth";
import { errorResponse, tooManyRequestsResponse } from "@/lib/api-response";
import { sendPasswordResetEmail } from "@/lib/email";
import { getClientIp, hashIp } from "@/lib/identity";
import { applyRateLimit } from "@/lib/rate-limit";
import type { AppLanguage } from "@/lib/types";
import { createPasswordResetToken } from "@/lib/verification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "[invalid-email]";
  if (local.length <= 2) return `**@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const language: AppLanguage = body?.language === "es" ? "es" : "en";

    if (!email) {
      return errorResponse("Email is required.", 400);
    }

    const ipHash = hashIp(getClientIp(req));
    const rateLimit = await applyRateLimit("authSensitive", `password-reset:${ipHash}`);
    if (!rateLimit.success) {
      return tooManyRequestsResponse(rateLimit);
    }

    const emailServiceConfigured = Boolean(
      process.env.RESEND_API_KEY?.trim() &&
      (process.env.RESEND_FROM_EMAIL?.trim() || process.env.EMAIL_FROM?.trim())
    );

    if (!emailServiceConfigured) {
      console.error("[auth/request-password-reset] Email service not configured", {
        resendApiKeyConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
        resendFromConfigured: Boolean(process.env.RESEND_FROM_EMAIL?.trim() || process.env.EMAIL_FROM?.trim()),
      });
      return errorResponse(
        "Password reset email service is not configured.",
        503,
        "Set RESEND_API_KEY and RESEND_FROM_EMAIL in environment variables."
      );
    }

    const user = await getAuthUserRecordByEmail(email);
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    try {
      await sendPasswordResetEmail({
        to: user.email,
        token: createPasswordResetToken({
          userId: user.userId,
          passwordHash: user.passwordHash,
        }),
        language,
      });
    } catch (error) {
      console.error("[auth/request-password-reset] Email provider send failed", {
        userId: user.userId,
        email: maskEmail(user.email),
        error: error instanceof Error ? error.message : error,
      });
      return errorResponse(
        "Unable to send reset email right now.",
        502,
        error instanceof Error ? error.message : undefined
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[auth/request-password-reset] Route failed", {
      error: error instanceof Error ? error.message : error,
    });
    return errorResponse(
      "Unable to start password reset.",
      400,
      error instanceof Error ? error.message : undefined
    );
  }
}

