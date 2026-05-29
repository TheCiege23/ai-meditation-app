import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { deleteHistoryItem, getActivityFeed } from "@/lib/history";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to view history.", 401);
  }

  const history = await getActivityFeed(viewer.userId);
  return NextResponse.json(history);
}

export async function DELETE(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to delete history.", 401);
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId")?.trim();
  if (!sessionId) {
    return errorResponse("sessionId is required.", 400);
  }

  await deleteHistoryItem(viewer.userId, sessionId);
  return NextResponse.json({ ok: true, message: "History item removed." });
}
