import OpenAI from "openai";

import { errorResponse, tooManyRequestsResponse, usageLimitResponse } from "@/lib/api-response";
import { canUseSpeech, getEffectiveEntitlements } from "@/lib/entitlements";
import { resolveRequestIdentity } from "@/lib/identity";
import { applyRateLimit, resolvePolicyName } from "@/lib/rate-limit";
import { incrementSpeechUsage, getOrCreateDailyUsage } from "@/lib/usage";
import { logApiRequest } from "@/lib/user-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

const DEFAULT_SPEECH_SPEED = 0.64;

function clampSpeechSpeed(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return DEFAULT_SPEECH_SPEED;
  }

  return Math.min(0.78, Math.max(0.56, value));
}

export async function POST(req: Request) {
  const identity = await resolveRequestIdentity(req);
  const policy = resolvePolicyName("speechGenerate", identity.isAuthenticated);
  const rateLimit = await applyRateLimit(policy, identity.identifier);

  if (!rateLimit.success) {
    await logApiRequest({
      userId: identity.userId,
      route: "/api/generate-speech",
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 429,
      provider: null,
    });

    return tooManyRequestsResponse(rateLimit);
  }

  const openai = getOpenAI();

  try {
    if (!openai) {
      return errorResponse("Speech generation is not configured.", 503);
    }

    const entitlements = getEffectiveEntitlements(identity.viewer);
    const body = await req.json();
    const {
      text,
      voice,
      speed,
      trackUsage,
      mode,
      language,
    } = body ?? {};

    const normalizedText = typeof text === "string" ? text.trim() : "";
    if (!normalizedText) {
      return errorResponse("Text is required.", 400);
    }

    const selectedVoice = typeof voice === "string" ? voice : "marin";
    if (!entitlements.allowedVoices.includes(selectedVoice)) {
      return usageLimitResponse(
        "That voice is available on ChimAura Premium.",
        entitlements,
        "speech"
      );
    }

    const shouldTrackUsage = trackUsage !== false;
    if (shouldTrackUsage && identity.userId) {
      const usage = await getOrCreateDailyUsage(identity.userId);
      if (!canUseSpeech(usage, entitlements)) {
        return usageLimitResponse(
          "You have reached your free daily limit. Upgrade to ChimAura Premium for more narration access.",
          entitlements,
          "speech"
        );
      }
    }

    const normalizedLanguage = language === "es" ? "es" : "en";
    const languageLine =
      normalizedLanguage === "es"
        ? "Speak entirely in natural, warm, and clear Spanish. Do not mix English."
        : "Speak entirely in natural, warm, and clear English. Do not mix Spanish.";

    const modeKey: "meditation" | "breathing" =
      mode === "breathing" ? "breathing" : "meditation";

    const baseSpeed =
      typeof speed === "number"
        ? speed
        : modeKey === "breathing"
          ? 0.68
          : 0.62;

    const effectiveSpeed = clampSpeechSpeed(baseSpeed);

    let instructions: string;
    if (modeKey === "breathing") {
      instructions = [
        "Speak like a calm human breathing coach, not a narrator or announcer.",
        languageLine,
        "Keep the pacing slow, steady, and reassuring.",
        "Leave natural breathing room between inhale, hold, and exhale cues.",
        "Do not rush the count.",
        "Let the voice feel warm, soft, fluid, and meditative.",
      ].join(" ");
    } else {
      instructions = [
        "Speak like a compassionate human meditation guide.",
        languageLine,
        "Keep the delivery warm, fluid, grounded, and emotionally natural.",
        "Read slowly enough for meditation, with gentle space between paragraphs and phrases.",
        "Do not sound robotic, commercial, dramatic, or rushed.",
        "Let the voice feel like a real guided session, not a fast read-through.",
      ].join(" ");
    }

    const speechResponse = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: selectedVoice,
      input: normalizedText,
      instructions,
      response_format: "mp3",
      speed: effectiveSpeed,
    });

    const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());

    if (shouldTrackUsage && identity.userId) {
      await incrementSpeechUsage(identity.userId);
    }

    await logApiRequest({
      userId: identity.userId,
      route: "/api/generate-speech",
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 200,
      provider: "openai",
    });

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    await logApiRequest({
      userId: identity.userId,
      route: "/api/generate-speech",
      method: "POST",
      ipHash: identity.ipHash,
      userAgent: identity.userAgent,
      statusCode: 500,
      provider: "openai",
    });

    return errorResponse(
      "Failed to generate speech.",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
