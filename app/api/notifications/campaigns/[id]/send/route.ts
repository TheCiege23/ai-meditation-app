import { NextResponse } from "next/server";

import { requireAdminApiViewer } from "@/lib/admin-auth";
import { createAdminAuditLog } from "@/lib/admin-logs";
import { sendCampaign } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const viewer = await requireAdminApiViewer(req);
  if (viewer instanceof NextResponse) {
    return viewer;
  }

  const { id } = await context.params;
  const result = await sendCampaign(id);

  await createAdminAuditLog({
    adminUserId: viewer.userId!,
    action: "notification-campaign.sent",
    entityType: "notification_campaign",
    entityId: id,
    metadataJson: { recipients: result.length },
  });

  return NextResponse.json({ ok: true, result });
}
