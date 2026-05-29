import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { getEffectiveEntitlements } from "@/lib/entitlements";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await resolveViewer(req);
  return NextResponse.json({ user, entitlements: getEffectiveEntitlements(user) });
}