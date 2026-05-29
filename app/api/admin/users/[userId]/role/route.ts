import { NextResponse } from "next/server";

import { requireAdminApiViewer } from "@/lib/admin-auth";
import { createAdminAuditLog } from "@/lib/admin-logs";
import { prisma } from "@/lib/db";
import { updateUserRole } from "@/lib/user-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_ROLES = new Set(["user", "admin", "super_admin"]);

export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const viewer = await requireAdminApiViewer(req);
  if (viewer instanceof NextResponse) {
    return viewer;
  }

  const { userId } = await context.params;
  const body = await req.json().catch(() => ({}));
  const role = typeof body?.role === "string" ? body.role : "user";

  if (!VALID_ROLES.has(role)) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  if (role === "super_admin" && viewer.role !== "super_admin") {
    return NextResponse.json(
      { error: "Forbidden", message: "Only a super admin can grant super admin access." },
      { status: 403 }
    );
  }

  if (viewer.userId === userId && role === "user") {
    return NextResponse.json(
      { error: "Forbidden", message: "You cannot remove your own admin access from this panel." },
      { status: 403 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const updated = await updateUserRole(userId, role as "user" | "admin" | "super_admin");
  await createAdminAuditLog({
    adminUserId: viewer.userId!,
    targetUserId: userId,
    action: "user.role.updated",
    targetType: "user",
    metadataJson: {
      previousRole: target.role,
      nextRole: role,
    },
  });

  return NextResponse.json({ ok: true, role: updated.role });
}
