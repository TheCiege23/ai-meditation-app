import { NextResponse } from "next/server";
import { getDailyWisdom } from "@/lib/wisdom";
import type { AppLanguage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const language = (url.searchParams.get("language") ?? "en") as AppLanguage;
  const wisdom = getDailyWisdom(language);
  return NextResponse.json(wisdom);
}
