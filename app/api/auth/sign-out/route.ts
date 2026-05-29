import { NextResponse } from "next/server";

import { clearViewerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const response = NextResponse.json({ ok: true });
  await clearViewerSession(req, response);
  return response;
}