import { NextResponse } from "next/server";

import { getAuthUserRecordById, resolveViewer } from "@/lib/auth";
import { errorResponse, tooManyRequestsResponse } from "@/lib/api-response";
import { getClientIp, hashIp } from "@/lib/identity";
import { applyRateLimit } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";
import type { AppLanguage } from "@/lib/types";
import { createEmailVerificationToken } from "@/lib/verification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);

  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Not authenticated.", 401);
  }

  const ipHash = hashIp(getClientIp(req));
  const rateLimit = await applyRateLimit("authSensitive", `resend-verification:${viewer.userId}:${ipHash}`);
  if (!rateLimit.success) {
    return tooManyRequestsResponse(rateLimit);
  }

  try {
    const user = await getAuthUserRecordById(viewer.userId);
    if (!user) {
      return errorResponse("User not found.", 404);
    }

    if (user.emailVerified) {
      return errorResponse("Email is already verified.", 400);
    }

    const profileLanguageHeader = req.headers.get("x-chimaura-language");
    const language: AppLanguage = profileLanguageHeader === "es" ? "es" : "en";

    await sendVerificationEmail({
      to: user.email,
      token: createEmailVerificationToken({
        userId: user.userId,
        email: user.email,
        emailVerified: user.emailVerified,
      }),
      language,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return errorResponse("Unable to resend verification.", 500);
  }
}

