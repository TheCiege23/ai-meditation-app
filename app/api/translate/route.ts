import { NextResponse } from "next/server";

import type { AppLanguage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TranslateRequestBody = {
  texts?: string[];
  targetLanguage?: AppLanguage;
};

const DEEPL_FREE_URL = "https://api-free.deepl.com/v2/translate";
const DEEPL_PRO_URL = "https://api.deepl.com/v2/translate";

function getDeepLUrl(apiKey: string) {
  return apiKey.endsWith(":fx") ? DEEPL_FREE_URL : DEEPL_PRO_URL;
}

function normalizeTexts(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 100);
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "DEEPL_API_KEY is not configured." },
        { status: 503 }
      );
    }

    const body = (await req.json()) as TranslateRequestBody;
    const texts = normalizeTexts(body?.texts);
    const targetLanguage: AppLanguage =
      body?.targetLanguage === "es" ? "es" : "en";

    if (texts.length === 0) {
      return NextResponse.json({ translations: [] });
    }

    if (targetLanguage === "en") {
      return NextResponse.json({ translations: texts });
    }

    const params = new URLSearchParams();
    params.set("target_lang", "ES");
    params.set("preserve_formatting", "1");
    params.set("formality", "prefer_less");
    params.set("tag_handling", "xml");
    params.set("ignore_tags", "keep");
    for (const text of texts) {
      params.append("text", text);
    }

    const response = await fetch(getDeepLUrl(apiKey), {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | { translations?: Array<{ text?: string }>; message?: string }
      | null;

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.message || "DeepL translation failed." },
        { status: response.status }
      );
    }

    const translations =
      payload?.translations?.map((item) => item.text?.trim() || "") ?? [];

    return NextResponse.json({ translations });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Translation failed.",
        detail: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
