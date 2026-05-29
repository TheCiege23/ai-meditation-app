import { NextResponse } from "next/server";

import { requireAdminApiViewer } from "@/lib/admin-auth";
import { createAdminAuditLog } from "@/lib/admin-logs";
import { prisma } from "@/lib/db";
import { updateNotificationCampaign } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const viewer = await requireAdminApiViewer(req);
  if (viewer instanceof NextResponse) {
    return viewer;
  }

  const { id } = await context.params;
  const campaign = await prisma.notificationCampaign.findUnique({
    where: { id },
    include: {
      deliveries: true,
      createdByAdmin: { select: { email: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  return NextResponse.json({ campaign });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const viewer = await requireAdminApiViewer(req);
  if (viewer instanceof NextResponse) {
    return viewer;
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  const campaign = await updateNotificationCampaign(id, body);

  await createAdminAuditLog({
    adminUserId: viewer.userId!,
    action: "notification-campaign.updated",
    entityType: "notification_campaign",
    entityId: id,
    metadataJson: body,
  });

  return NextResponse.json({ ok: true, campaign });
}
