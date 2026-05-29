import { NextResponse } from "next/server";

import type { AppLanguage } from "@/lib/types";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

type GenerateHeyGenBody = {
  script?: string;
  mood?: string;
  duration?: string;
  language?: AppLanguage;
};

function buildMeditationVideoPrompt(input: {
  script: string;
  mood: string;
  duration: string;
  language: AppLanguage;
}) {
  const baseScript = input.script.replace(/\s+/g, " ").trim().slice(0, 1200);
  const isSpanish = input.language === "es";

  if (isSpanish) {
    return [
      "Crea un video vertical corto, calmante y premium para una app de meditación llamada ChimAura.",
      `Duración objetivo: ${input.duration}.`,
      `Estado de ánimo: ${input.mood}.`,
      "Estilo visual: fondo suave, minimalista, tonos azul oscuro, violeta, cian y brillo sutil.",
      "Debe sentirse como una sesión real de meditación, no como publicidad.",
      "Incluye subtítulos quemados en pantalla durante todo el video.",
      "Usa una voz humana muy tranquila, cálida y lenta.",
      "Mantén el ritmo meditativo y natural.",
      "No uses terapia, HSA o lenguaje clínico.",
      `Guion base: ${baseScript}`,
    ].join(" ");
  }

  return [
    "Create a short vertical calming premium video for a meditation app called ChimAura.",
    `Target duration: ${input.duration}.`,
    `Mood: ${input.mood}.`,
    "Visual style: soft minimal background, dark blue, violet, cyan, subtle glow.",
    "It should feel like a real guided meditation session, not an advertisement.",
    "Include burned-in subtitles throughout the full video.",
    "Use a very calm, warm, human voice and slow meditative pacing.",
    "Keep the flow natural and soothing.",
    "Do not use therapy, HSA, or clinical framing.",
    `Base script: ${baseScript}`,
  ].join(" ");
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "HEYGEN_API_KEY is not configured." },
        { status: 503 }
      );
    }

    const body = (await req.json()) as GenerateHeyGenBody;
    const script = body?.script?.trim();
    const mood = body?.mood?.trim() || "Calm";
    const duration = body?.duration?.trim() || "1 min";
    const language: AppLanguage = body?.language === "es" ? "es" : "en";

    if (!script) {
      return NextResponse.json(
        { error: "Meditation script is required." },
        { status: 400 }
      );
    }

    const prompt = buildMeditationVideoPrompt({
      script,
      mood,
      duration,
      language,
    });

    const response = await fetch("https://api.heygen.com/v1/video_agent/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        prompt,
      }),
      cache: "no-store",
    });

    const data = (await response.json().catch(() => null)) as
      | {
          error?: string;
          message?: string;
          data?: {
            video_id?: string;
            video_url?: string;
          };
        }
      | null;

    if (!response.ok) {
      return NextResponse.json(
        {
          error: data?.message || data?.error || "HeyGen video generation failed.",
        },
        { status: response.status }
      );
    }

    const videoId = data?.data?.video_id;
    if (!videoId) {
      return NextResponse.json(
        { error: "HeyGen did not return a video_id." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      videoId,
      status: "processing",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to start HeyGen video generation.",
        detail: error instanceof Error ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
