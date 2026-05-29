import { NextResponse } from "next/server";
import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { createJournalEntry, getJournalEntries } from "@/lib/journal-entries";
import { getEffectiveEntitlements } from "@/lib/entitlements";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (!viewer.userId) return errorResponse("Not authenticated.", 401);

  const entitlements = getEffectiveEntitlements(viewer);
  const limit = entitlements.fullJournal ? 50 : 10;
  const url = new URL(req.url);
  const before = url.searchParams.get("before") ?? undefined;
  const type = url.searchParams.get("type") ?? undefined;

  const entries = await getJournalEntries(viewer.userId, { limit, before, type });
  return NextResponse.json({ entries });
}

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (!viewer.userId) return errorResponse("Not authenticated.", 401);

  const body = await req.json();
  const { type, prompt, content, sessionId } = body;

  if (!content || typeof content !== "string") return errorResponse("Content is required.", 400);

  const entry = await createJournalEntry(viewer.userId, {
    type: type ?? "free",
    prompt: prompt ?? null,
    content: content.trim(),
    sessionId: sessionId ?? null,
  });
  return NextResponse.json({ entry });
}
