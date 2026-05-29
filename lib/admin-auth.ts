import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import { AUTH_COOKIE_NAME, resolveViewer } from "@/lib/auth";
import { isAdminRole } from "@/lib/admin";
import { deleteAuthSessionRecord, getAuthSessionByToken, getGuestViewer, mapUserToViewer } from "@/lib/user-store";

export async function getServerViewer() {
  const sessionToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
  if (!sessionToken) {
    return getGuestViewer();
  }

  const session = await getAuthSessionByToken(sessionToken);
  if (!session) {
    return getGuestViewer();
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await deleteAuthSessionRecord(sessionToken);
    return getGuestViewer();
  }

  return mapUserToViewer(session.user);
}

export async function requireAdminViewer() {
  const viewer = await getServerViewer();
  if (viewer.isGuest || !isAdminRole(viewer.role)) {
    redirect("/unauthorized");
  }

  return viewer;
}

export async function requireAdminApiViewer(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !isAdminRole(viewer.role)) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Admin access is required for this route.",
      },
      { status: 403 }
    );
  }

  return viewer;
}
