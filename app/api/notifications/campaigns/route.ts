import { NextResponse } from "next/server";

import { requireAdminApiViewer } from "@/lib/admin-auth";
import { createAdminAuditLog } from "@/lib/admin-logs";
import { prisma } from "@/lib/db";
import { createNotificationCampaign } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await requireAdminApiViewer(req);
  if (viewer instanceof NextResponse) {
    return viewer;
  }

  const campaigns = await prisma.notificationCampaign.findMany({
    include: {
      deliveries: true,
      createdByAdmin: { select: { email: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  const viewer = await requireAdminApiViewer(req);
  if (viewer instanceof NextResponse) {
    return viewer;
  }

  const body = await req.json().catch(() => null);
  if (!body?.title || !body?.message) {
    return NextResponse.json({ error: "title and message are required." }, { status: 400 });
  }

  const campaign = await createNotificationCampaign({
    title: body.title,
    message: body.message,
    type: typeof body.type === "string" ? body.type : "admin_broadcast",
    audienceType: typeof body.audienceType === "string" ? body.audienceType : "all",
    audienceFilterJson: typeof body.audienceFilterJson === "object" ? body.audienceFilterJson : {},
    scheduledFor: body.scheduledFor ?? null,
    status: typeof body.status === "string" ? body.status : undefined,
    createdByAdminId: viewer.userId!,
    ctaLabel: typeof body.ctaLabel === "string" ? body.ctaLabel : null,
    ctaUrl: typeof body.ctaUrl === "string" ? body.ctaUrl : null,
    platform: typeof body.platform === "string" ? body.platform : "all",
  });

  await createAdminAuditLog({
    adminUserId: viewer.userId!,
    action: "notification-campaign.created",
    entityType: "notification_campaign",
    entityId: campaign.id,
    metadataJson: { title: campaign.title, audienceType: campaign.audienceType },
  });

  return NextResponse.json({ ok: true, campaign });
}
