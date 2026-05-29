import { NextResponse } from "next/server";

import { getAuthUserRecordById, resolveViewer, saveEmailVerificationToken } from "@/lib/auth";
import { errorResponse, tooManyRequestsResponse } from "@/lib/api-response";
import { sendVerificationEmail } from "@/lib/email";
import { getClientIp, hashIp } from "@/lib/identity";
import { applyRateLimit } from "@/lib/rate-limit";
import type { AppLanguage } from "@/lib/types";
import { generateRandomToken, hashToken } from "@/lib/verification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getEmailEnvChecks() {
  return {
    resendApiKeyConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
    resendFromEmailConfigured: Boolean(process.env.RESEND_FROM_EMAIL?.trim() || process.env.EMAIL_FROM?.trim()),
    appUrlConfigured: Boolean(process.env.PUBLIC_APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim()),
  };
}

function getMissingRequirements(checks: ReturnType<typeof getEmailEnvChecks>) {
  const missing: string[] = [];
  if (!checks.resendApiKeyConfigured) missing.push("RESEND_API_KEY");
  if (!checks.resendFromEmailConfigured) missing.push("RESEND_FROM_EMAIL (or EMAIL_FROM)");
  if (!checks.appUrlConfigured) missing.push("PUBLIC_APP_URL (or NEXT_PUBLIC_APP_URL)");
  return missing;
}

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Not authenticated.", 401);
  }

  const checks = getEmailEnvChecks();
  const missing = getMissingRequirements(checks);

  return NextResponse.json({
    ok: missing.length === 0,
    checks,
    missing,
    email: viewer.email,
    note:
      missing.length === 0
        ? "Email delivery configuration looks ready."
        : "Email delivery is not fully configured.",
  });
}

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Not authenticated.", 401);
  }

  const ipHash = hashIp(getClientIp(req));
  const rateLimit = await applyRateLimit("authSensitive", `email-health:${viewer.userId}:${ipHash}`);
  if (!rateLimit.success) {
    return tooManyRequestsResponse(rateLimit);
  }

  const checks = getEmailEnvChecks();
  const missing = getMissingRequirements(checks);
  if (missing.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        checks,
        missing,
        message: "Email delivery is not fully configured.",
      },
      { status: 500 }
    );
  }

  const user = await getAuthUserRecordById(viewer.userId);
  if (!user) {
    return errorResponse("User not found.", 404);
  }

  const languageHeader = req.headers.get("x-chimaura-language");
  const language: AppLanguage = languageHeader === "es" ? "es" : "en";

  try {
    const rawVerificationToken = generateRandomToken(32);
    const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 h

    await saveEmailVerificationToken({
      userId: user.userId,
      tokenHash: hashToken(rawVerificationToken),
      expiresAt: tokenExpiresAt,
    });

    await sendVerificationEmail({
      to: user.email,
      token: rawVerificationToken,
      language,
    });

    return NextResponse.json({
      ok: true,
      checks,
      message: "Verification email test sent.",
      sentTo: user.email,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        checks,
        message: "Email send failed.",
        detail: error instanceof Error ? error.message : "Unknown email provider error.",
      },
      { status: 500 }
    );
  }
}
