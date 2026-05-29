import { NextResponse } from "next/server";

import { requireAdminApiViewer } from "@/lib/admin-auth";
import { createAdminAuditLog } from "@/lib/admin-logs";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const viewer = await requireAdminApiViewer(req);
  if (viewer instanceof NextResponse) {
    return viewer;
  }

  const body = await req.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId : "";

  if (!userId) {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const featureFlags = await prisma.featureFlag.upsert({
    where: { userId },
    update: {
      allowPremiumPreview: Boolean(body?.allowPremiumPreview),
      allowWeeklyHoroscope: Boolean(body?.allowWeeklyHoroscope),
      allowAdvancedAstrology: Boolean(body?.allowAdvancedAstrology),
    },
    create: {
      userId,
      allowPremiumPreview: Boolean(body?.allowPremiumPreview),
      allowWeeklyHoroscope: Boolean(body?.allowWeeklyHoroscope),
      allowAdvancedAstrology: Boolean(body?.allowAdvancedAstrology),
    },
  });

  await createAdminAuditLog({
    adminUserId: viewer.userId!,
    targetUserId: userId,
    action: "feature-flags.updated",
    targetType: "feature_flags",
    metadataJson: {
      allowPremiumPreview: featureFlags.allowPremiumPreview,
      allowWeeklyHoroscope: featureFlags.allowWeeklyHoroscope,
      allowAdvancedAstrology: featureFlags.allowAdvancedAstrology,
    },
  });

  return NextResponse.json({ ok: true, featureFlags });
}
