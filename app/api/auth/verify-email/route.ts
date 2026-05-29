import { NextResponse } from "next/server";

import {
  deleteEmailVerificationTokenByUserId,
  getAuthUserRecordById,
  getEmailVerificationTokenRecord,
  updateAuthUserRecord,
} from "@/lib/auth";
import { hashToken } from "@/lib/verification";

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
    console.warn("[verify-email] token missing from request");
    return redirectToConfirmation(req, "invalid");
  }

  // Look up the stored token record by hash — never compare raw tokens directly.
  const tokenHash = hashToken(rawToken);

  let record: { userId: string; expiresAt: Date } | null = null;
  try {
    record = await getEmailVerificationTokenRecord(tokenHash);
  } catch (err) {
    console.error(
      "[verify-email] DB lookup failed:",
      err instanceof Error ? err.message : String(err)
    );
    return redirectToConfirmation(req, "error");
  }

  if (!record) {
    console.warn("[verify-email] token not found in DB (not issued, already used, or expired row removed)");
    return redirectToConfirmation(req, "invalid");
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    console.warn("[verify-email] token expired for userId:", record.userId);
    return redirectToConfirmation(req, "expired");
  }

  try {
    const user = await getAuthUserRecordById(record.userId);

    if (!user) {
      console.warn("[verify-email] user not found for userId:", record.userId);
      return redirectToConfirmation(req, "invalid");
    }

    if (user.emailVerified) {
      // Already verified — clean up the stale token row and show success.
      await deleteEmailVerificationTokenByUserId(record.userId);
      return redirectToConfirmation(req, "success");
    }

    await updateAuthUserRecord(user.userId, { emailVerified: true });
    await deleteEmailVerificationTokenByUserId(user.userId);

    return redirectToConfirmation(req, "success");
  } catch (err) {
    console.error(
      "[verify-email] DB write failed:",
      err instanceof Error ? err.message : String(err)
    );
    return redirectToConfirmation(req, "error");
  }
}

