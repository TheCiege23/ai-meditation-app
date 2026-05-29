import { NextResponse } from "next/server";

import { attachAuthSession, authenticateUserCredentials, getAuthUserRecordByEmail } from "@/lib/auth";
import { errorResponse, tooManyRequestsResponse } from "@/lib/api-response";
import { getEffectiveEntitlements } from "@/lib/entitlements";
import { getClientIp, hashIp } from "@/lib/identity";
import { applyRateLimit } from "@/lib/rate-limit";
import { logApiRequest } from "@/lib/user-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "[invalid-email]";
  if (local.length <= 2) return `**@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ipHash = hashIp(ip);
  const rateLimit = await applyRateLimit("authSensitive", `signin:${ipHash}`);

  if (!rateLimit.success) {
    await logApiRequest({
      route: "/api/auth/sign-in",
      method: "POST",
      ipHash,
      userAgent: req.headers.get("user-agent"),
      statusCode: 429,
      provider: null,
    });

    return tooManyRequestsResponse(rateLimit);
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      await logApiRequest({
        route: "/api/auth/sign-in",
        method: "POST",
        ipHash,
        userAgent: req.headers.get("user-agent"),
        statusCode: 400,
        provider: null,
      });

      return errorResponse("Email and password are required.", 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const authRecord = await getAuthUserRecordByEmail(normalizedEmail).catch(() => null);

    const account = await authenticateUserCredentials({
      email: String(email),
      password: String(password),
    });

    if (!account) {
      await logApiRequest({
        route: "/api/auth/sign-in",
        method: "POST",
        ipHash,
        userAgent: req.headers.get("user-agent"),
        statusCode: 401,
        provider: null,
      });

      if (!authRecord) {
        console.warn("[auth/sign-in] Rejected: account not found", {
          email: maskEmail(normalizedEmail),
        });
        return errorResponse("No account found for this email. Create a free account first.", 401);
      }

      if (authRecord && !authRecord.passwordHash) {
        console.warn("[auth/sign-in] Rejected: account has no password hash", {
          userId: authRecord.userId,
          email: maskEmail(normalizedEmail),
        });
        return errorResponse(
          "This account does not have a password set. Reset your password to continue.",
          401
        );
      }

      console.warn("[auth/sign-in] Rejected: password mismatch", {
        userId: authRecord.userId,
        email: maskEmail(normalizedEmail),
        hashPrefix: authRecord.passwordHash?.slice(0, 4) ?? null,
      });

      return errorResponse("Incorrect password. Use 'Forgot your password?' to reset it.", 401);
    }

    const response = NextResponse.json({
      user: account.viewer,
      entitlements: getEffectiveEntitlements(account.viewer),
    });

    await attachAuthSession(response, account.userId);

    await logApiRequest({
      userId: account.userId,
      route: "/api/auth/sign-in",
      method: "POST",
      ipHash,
      userAgent: req.headers.get("user-agent"),
      statusCode: 200,
      provider: null,
    });

    return response;
  } catch (error) {
    await logApiRequest({
      route: "/api/auth/sign-in",
      method: "POST",
      ipHash,
      userAgent: req.headers.get("user-agent"),
      statusCode: 500,
      provider: null,
    });

    return errorResponse(
      "Unable to sign in.",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
