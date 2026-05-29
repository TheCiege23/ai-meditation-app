import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { getDashboardOverview } from "@/lib/dashboard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to view recommendations.", 401);
  }

  const overview = await getDashboardOverview(viewer);
  return NextResponse.json({ recommendations: overview.recommendations });
}
