import { NextResponse } from "next/server";

import { getAuthUserRecordById, updateAuthUserRecord } from "@/lib/auth";
import { decodeEmailVerificationToken, getEmailVerificationState } from "@/lib/verification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function redirectToConfirmation(req: Request, status: "success" | "expired" | "invalid" | "error") {
  const url = new URL("/auth/confirmed", req.url);
  url.searchParams.set("verified", status);
  return NextResponse.redirect(url);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawToken = url.searchParams.get("token");

  if (!rawToken) {
    return redirectToConfirmation(req, "invalid");
  }

  const payload = decodeEmailVerificationToken(rawToken);
  if (!payload) {
    return redirectToConfirmation(req, "invalid");
  }

  if (payload.exp <= Date.now()) {
    return redirectToConfirmation(req, "expired");
  }

  try {
    const user = await getAuthUserRecordById(payload.sub);

    if (!user) {
      return redirectToConfirmation(req, "invalid");
    }

    if (user.emailVerified) {
      return redirectToConfirmation(req, "success");
    }

    if (getEmailVerificationState(user.email, user.emailVerified) !== payload.state) {
      return redirectToConfirmation(req, "invalid");
    }

    await updateAuthUserRecord(user.userId, {
      emailVerified: true,
    });

    return redirectToConfirmation(req, "success");
  } catch {
    return redirectToConfirmation(req, "error");
  }
}

