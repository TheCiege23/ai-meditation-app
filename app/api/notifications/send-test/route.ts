import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { sendPushToUser } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in first.", 401);
  }

  const body = await req.json().catch(() => ({}));
  const result = await sendPushToUser(viewer.userId, {
    title: typeof body.title === "string" ? body.title : "Your calm is ready",
    message:
      typeof body.message === "string"
        ? body.message
        : "Take a soft breath with ChimAura. Your next reset is waiting.",
    metadata: {
      type: "test_notification",
    },
  });

  return NextResponse.json({ ok: true, result });
}
