import { NextResponse } from "next/server";

import { clearAllUserSessions, getAuthUserRecordById, hashPassword, updateAuthUserRecord } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { decodePasswordResetToken, getPasswordResetState } from "@/lib/verification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string") {
      return errorResponse("Token is required.", 400);
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return errorResponse("Password must be at least 8 characters.", 400);
    }

    const payload = decodePasswordResetToken(token);
    if (!payload) {
      return errorResponse("Invalid or expired token.", 400);
    }

    if (payload.exp <= Date.now()) {
      return errorResponse("Invalid or expired token.", 400);
    }

    const user = await getAuthUserRecordById(payload.sub);

    if (!user || getPasswordResetState(user.passwordHash) !== payload.state) {
      return errorResponse("Invalid or expired token.", 400);
    }

    const passwordHash = hashPassword(password);

    await updateAuthUserRecord(user.userId, {
      passwordHash,
    });
    await clearAllUserSessions(user.userId);

    return NextResponse.json({ ok: true });
  } catch {
    return errorResponse("Unable to reset password.", 400);
  }
}

