import OpenAI from "openai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export async function POST(req: Request) {
  const openai = getOpenAI();
  if (!openai) {
    return NextResponse.json({ error: "OpenAI is not configured." }, { status: 503 });
  }

  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "Transcript is required." }, { status: 400 });
    }

    const prompt = `
You are mapping spoken user intent into app options.
Return strict JSON only.

Allowed values:
- mood: Calm | Overwhelmed | Unfocused | Low Energy
- mode: meditation | breathing
- meditationType: stress_relief | focus | sleep | energy | anxiety_reset | quick_calm
- duration: 1 min | 3 min | 5 min | 10 min
- voiceTone: calm-female | deep-male | soft-guide | whisper-guide
- visual: mist | sunrise | forest | night
- breathingPattern: balanced-446 | box-444 | relax-478
- sounds: array of any from [Raindrop, ocean, forest, Campfire, Birds, Wind]

If a field is not mentioned, set it to null.

User transcript:
"""
${transcript}
"""

Output format:
{
  "mode": string | null,
  "mood": string | null,
  "meditationType": string | null,
  "duration": string | null,
  "voiceTone": string | null,
  "visual": string | null,
  "breathingPattern": string | null,
  "sounds": string[]
}
`;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const text = response.output_text?.trim() || "{}";

    let parsed: {
      mode: string | null;
      mood: string | null;
      meditationType: string | null;
      duration: string | null;
      voiceTone: string | null;
      visual: string | null;
      breathingPattern: string | null;
      sounds: string[];
    };

    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = {
        mode: null,
        mood: null,
        meditationType: null,
        duration: null,
        voiceTone: null,
        visual: null,
        breathingPattern: null,
        sounds: [],
      };
    }

    return NextResponse.json({ command: parsed });
  } catch (error) {
    console.error("interpret-command error", error);
    return NextResponse.json({ error: "Failed to interpret command." }, { status: 500 });
  }
}
