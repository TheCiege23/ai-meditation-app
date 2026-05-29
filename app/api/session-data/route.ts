import { NextResponse } from "next/server";
import { resolveViewer } from "@/lib/auth";
import {
  createPreset,
  createSessionRecord,
  deletePreset,
  getPresets,
  getSessionById,
  getSessionDashboard,
  getUserPreferences,
  markSessionPlayed,
  saveUserPreferences,
  toggleSessionFavorite,
} from "@/lib/cache-db";
import {
  clampTimerStyleToEntitlements,
  clampVisualToEntitlements,
  clampVoiceToneToEntitlements,
  clampVoiceToEntitlements,
  getEffectiveEntitlements,
} from "@/lib/entitlements";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await resolveViewer(req);
    const entitlements = getEffectiveEntitlements(user);
    const ownerId = user.userId ?? undefined;
    const [dashboard, rawPresets, rawPreferences] = await Promise.all([
      getSessionDashboard(ownerId),
      getPresets(ownerId),
      getUserPreferences(ownerId),
    ]);

    const presets = rawPresets.map((preset) => ({
      ...preset,
      voiceTone: clampVoiceToneToEntitlements(preset.voiceTone, entitlements),
      visual: clampVisualToEntitlements(preset.visual, entitlements),
      sounds: (preset.sounds ?? [])
        .filter((sound: string) => entitlements.allowedSounds.includes(sound))
        .slice(0, entitlements.maxSounds),
    }));

    const preferences = rawPreferences
      ? {
          ...rawPreferences,
          preferredVoiceTone: clampVoiceToneToEntitlements(rawPreferences.preferredVoiceTone, entitlements),
          preferredVisual: clampVisualToEntitlements(rawPreferences.preferredVisual, entitlements),
          preferredTimerStyle: clampTimerStyleToEntitlements(rawPreferences.preferredTimerStyle, entitlements),
          preferredSounds: (rawPreferences.preferredSounds ?? [])
            .filter((s: string) => entitlements.allowedSounds.includes(s))
            .slice(0, entitlements.maxSounds),
        }
      : rawPreferences;

    return NextResponse.json({
      recent: entitlements.sessionHistory ? dashboard.recent : [],
      favorites: entitlements.sessionHistory ? dashboard.favorites : [],
      stats: dashboard.stats,
      presets,
      preferences,
      currentUser: user,
      entitlements,
    });
  } catch (error) {
    console.error("Failed to load session data:", error);
    return NextResponse.json({ error: "Failed to load session data." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await resolveViewer(req);
    const body = await req.json();
    const action = body?.action;
    const ownerId = user.userId ?? undefined;

    if (action === "create-local-session") {
      const entitlements = getEffectiveEntitlements(user);
      const { mode, meditationType, mood, duration, breathingPattern, voice, visual, sounds, text } = body;
      const rawSounds = Array.isArray(sounds) ? sounds : [];
      const allowedSounds = rawSounds.filter((s: string) => entitlements.allowedSounds.includes(s)).slice(0, entitlements.maxSounds);
      const sessionId = await createSessionRecord(
        {
          mode: mode || "breathing",
          meditationType: meditationType || "quick_calm",
          mood: mood || "Calm",
          duration: duration || "3 min",
          breathingPattern: breathingPattern || null,
          voice: clampVoiceToEntitlements(voice, entitlements),
          visual: clampVisualToEntitlements(visual, entitlements),
          sounds: allowedSounds,
          text: text || "",
        },
        ownerId
      );
      return NextResponse.json({ ok: true, sessionId });
    }

    if (action === "toggle-favorite") {
      const { sessionId, favorite } = body;
      if (!sessionId) return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
      await toggleSessionFavorite(sessionId, Boolean(favorite), ownerId);
      return NextResponse.json({ ok: true });
    }

    if (action === "mark-played") {
      const { sessionId, completed } = body;
      if (!sessionId) return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
      await markSessionPlayed(sessionId, Boolean(completed), ownerId);
      return NextResponse.json({ ok: true });
    }

    if (action === "save-preset") {
      const entitlements = getEffectiveEntitlements(user);
      const { name, mode, meditationType, breathingPattern, voiceTone, visual, duration, sounds } = body;
      if (!name) return NextResponse.json({ error: "Preset name is required." }, { status: 400 });
      const rawSounds = Array.isArray(sounds) ? sounds : [];
      const allowedSounds = rawSounds.filter((s: string) => entitlements.allowedSounds.includes(s)).slice(0, entitlements.maxSounds);

      const presetId = await createPreset(
        {
          name,
          mode: mode || "meditation",
          meditationType: meditationType || "stress_relief",
          breathingPattern: breathingPattern || null,
          voiceTone: clampVoiceToneToEntitlements(voiceTone, entitlements),
          visual: clampVisualToEntitlements(visual, entitlements),
          duration: duration || "5 min",
          sounds: allowedSounds,
        },
        ownerId
      );

      return NextResponse.json({ ok: true, presetId });
    }

    if (action === "delete-preset") {
      const { presetId } = body;
      if (!presetId) return NextResponse.json({ error: "presetId is required." }, { status: 400 });
      await deletePreset(presetId, ownerId);
      return NextResponse.json({ ok: true });
    }

    if (action === "save-preferences") {
      const entitlements = getEffectiveEntitlements(user);
      const { preferredVoiceTone, preferredVisual, preferredDuration, preferredSounds, preferredTimerStyle } = body;
      const rawSounds = Array.isArray(preferredSounds) ? preferredSounds : [];
      const allowedSounds = rawSounds.filter((s: string) => entitlements.allowedSounds.includes(s)).slice(0, entitlements.maxSounds);

      await saveUserPreferences(
        {
          preferredVoiceTone: clampVoiceToneToEntitlements(preferredVoiceTone, entitlements),
          preferredVisual: clampVisualToEntitlements(preferredVisual, entitlements),
          preferredDuration: preferredDuration || "5 min",
          preferredSounds: allowedSounds,
          preferredTimerStyle: clampTimerStyleToEntitlements(preferredTimerStyle, entitlements),
        },
        ownerId
      );
      return NextResponse.json({ ok: true });
    }

    if (action === "get-session") {
      const { sessionId } = body;
      if (!sessionId) return NextResponse.json({ error: "sessionId is required." }, { status: 400 });
      const session = await getSessionById(sessionId, ownerId);
      if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });
      return NextResponse.json({ session });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("Session action failed:", error);
    return NextResponse.json({ error: "Session action failed." }, { status: 500 });
  }
}


