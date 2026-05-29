import { NextResponse } from "next/server";
import { resolveViewer } from "@/lib/auth";
import { getCourseBySlug } from "@/lib/courses";
import { getEffectiveEntitlements } from "@/lib/entitlements";
import type { AppLanguage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const viewer = await resolveViewer(req);
  const url = new URL(req.url);
  const language = (url.searchParams.get("language") ?? "en") as AppLanguage;

  const result = await getCourseBySlug(slug, language);
  if (!result) return NextResponse.json({ error: "Course not found." }, { status: 404 });

  const entitlements = getEffectiveEntitlements(viewer);
  if (result.course.isPremium && !entitlements.courses) {
    return NextResponse.json({ course: result.course, steps: [], locked: true });
  }

  return NextResponse.json({ course: result.course, steps: result.steps, locked: false });
}
