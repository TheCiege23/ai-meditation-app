import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { markNotificationClicked } from "@/lib/notifications";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in first.", 401);
  }

  const deliveries = await prisma.notificationDelivery.findMany({
    where: { userId: viewer.userId },
    include: {
      campaign: { select: { title: true, type: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ deliveries });
}

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in first.", 401);
  }

  const body = await req.json().catch(() => ({}));
  if (typeof body.deliveryId !== "string") {
    return errorResponse("deliveryId is required.", 400);
  }

  const delivery = await markNotificationClicked(body.deliveryId);
  return NextResponse.json({ ok: true, delivery });
}
