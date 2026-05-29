import { NextResponse } from "next/server";
import { resolveViewer } from "@/lib/auth";
import { getCoursesForUser } from "@/lib/courses";
import { getEffectiveEntitlements } from "@/lib/entitlements";
import type { AppLanguage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  const url = new URL(req.url);
  const language = (url.searchParams.get("language") ?? "en") as AppLanguage;
  const entitlements = getEffectiveEntitlements(viewer);
  const includePremium = entitlements.courses;

  const courses = await getCoursesForUser(viewer?.userId ?? null, language, includePremium);
  return NextResponse.json({ courses });
}
