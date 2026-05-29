import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "HEYGEN_API_KEY is not configured." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get("videoId")?.trim();

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId is required." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,
      {
        method: "GET",
        headers: {
          "X-API-KEY": apiKey,
        },
        cache: "no-store",
      }
    );

    const data = (await response.json().catch(() => null)) as
      | {
          error?: string;
          message?: string;
          data?: {
            status?: string;
            video_url?: string;
            thumbnail_url?: string;
          };
        }
      | null;

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.message || data?.error || "Failed to get HeyGen video status.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      status: data?.data?.status || "processing",
      videoUrl: data?.data?.video_url || null,
      thumbnailUrl: data?.data?.thumbnail_url || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch HeyGen video status.",
        detail: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
