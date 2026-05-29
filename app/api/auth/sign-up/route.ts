import { NextResponse } from "next/server";

import { attachAuthSession, registerUserAccount } from "@/lib/auth";
import { errorResponse, tooManyRequestsResponse } from "@/lib/api-response";
import { createUserConsents } from "@/lib/consent";
import { getEffectiveEntitlements } from "@/lib/entitlements";
import { getClientIp, hashIp } from "@/lib/identity";
import { applyRateLimit } from "@/lib/rate-limit";
import { logApiRequest } from "@/lib/user-store";
import { sendVerificationEmail } from "@/lib/email";
import type { AppLanguage } from "@/lib/types";
import { createEmailVerificationToken } from "@/lib/verification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ipHash = hashIp(ip);
  const rateLimit = await applyRateLimit("authSensitive", `signup:${ipHash}`);

  if (!rateLimit.success) {
    await logApiRequest({
      route: "/api/auth/sign-up",
      method: "POST",
      ipHash,
      userAgent: req.headers.get("user-agent"),
      statusCode: 429,
      provider: null,
    });

    return tooManyRequestsResponse(rateLimit);
  }

  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const displayName = typeof body?.displayName === "string" ? body.displayName.trim() : "";
    const language: AppLanguage = body?.language === "es" ? "es" : "en";
    const acceptedTerms = body?.acceptedTerms === true;
    const acceptedPrivacy = body?.acceptedPrivacy === true;

    if (!email || !password || !displayName) {
      return errorResponse("Name, email, and password are required.", 400);
    }

    if (password.length < 8) {
      return errorResponse("Password must be at least 8 characters.", 400);
    }

    if (!acceptedTerms || !acceptedPrivacy) {
      return errorResponse(
        "You must accept the Terms of Service and Privacy Policy to create an account.",
        400
      );
    }

    const account = await registerUserAccount({
      email,
      password,
      displayName,
    });

    await createUserConsents({
      userId: account.userId,
      ipHash,
      userAgent: req.headers.get("user-agent"),
    });

    let verificationEmailSent = true;

    try {
      await sendVerificationEmail({
        to: account.viewer.email ?? email,
        token: createEmailVerificationToken({
          userId: account.userId,
          email: account.viewer.email ?? email,
          emailVerified: account.viewer.emailVerified,
        }),
        language,
      });
    } catch (emailError) {
      console.error("Verification email failed after signup:", emailError);
      verificationEmailSent = false;
    }

    const response = NextResponse.json({
      user: account.viewer,
      entitlements: getEffectiveEntitlements(account.viewer),
      verificationEmailSent,
    });

    await attachAuthSession(response, account.userId);
    if (!verificationEmailSent) {
      response.headers.set("x-chimaura-verification-email", "failed");
    }

    await logApiRequest({
      userId: account.userId,
      route: "/api/auth/sign-up",
      method: "POST",
      ipHash,
      userAgent: req.headers.get("user-agent"),
      statusCode: 200,
      provider: null,
    });

    return response;
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "";
    const normalizedMessage = rawMessage.toLowerCase();
    const message =
      normalizedMessage.includes("unique constraint") || normalizedMessage.includes("already exists")
        ? "An account with that email already exists."
        : rawMessage || "Unable to create account.";

    await logApiRequest({
      route: "/api/auth/sign-up",
      method: "POST",
      ipHash,
      userAgent: req.headers.get("user-agent"),
      statusCode: 400,
      provider: null,
    });

    return errorResponse(message, 400);
  }
}
