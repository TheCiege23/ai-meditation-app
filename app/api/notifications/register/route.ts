import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { getPushPublicConfig, registerPushSubscription } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getPushPublicConfig());
}

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to register for notifications.", 401);
  }

  const body = await req.json().catch(() => null);
  if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
    return errorResponse("A valid push subscription payload is required.", 400);
  }

  const subscription = await registerPushSubscription(viewer.userId, {
    platform: body.platform === "ios" || body.platform === "android" ? body.platform : "web",
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
    deviceLabel: typeof body.deviceLabel === "string" ? body.deviceLabel : null,
    appVersion: typeof body.appVersion === "string" ? body.appVersion : null,
  });

  return NextResponse.json({ ok: true, subscription });
}
