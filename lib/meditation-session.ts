import OpenAI from "openai";
import type { Prisma } from "@prisma/client";

import {
  canUseMeditation,
  clampVisualToEntitlements,
  durationLabelToMinutes,
  getEffectiveEntitlements,
} from "@/lib/entitlements";
import { NONE_SOUND, resolveSoundOption } from "@/lib/audio";
import { prisma } from "@/lib/db";
import { createSessionRecord, deleteSessionRecord, markSessionPlayed } from "@/lib/cache-db";
import { setDashboardState } from "@/lib/history";
import {
  getDateKey,
  getOrCreateDailyUsage,
  incrementBreathingUsage,
  incrementMeditationUsage,
  incrementSleepUsage,
} from "@/lib/usage";
import type { Viewer } from "@/lib/types";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export type SessionMode = "meditation" | "breathing" | "sleep";
export type BreathingStyle = "none" | "calm" | "box" | "4-7-8" | "deep-reset";
export type MeditationSessionLifecycleStatus =
  | "preparing"
  | "ready"
  | "playing"
  | "paused"
  | "completed"
  | "stopped"
  | "abandoned";

export type MeditationSessionMetadata = {
  sessionMode: SessionMode;
  durationLabel: string;
  meditationType: string;
  visual: string;
  title: string;
  checkIn: string | null;
  sourceContext: string | null;
  soundLabel: string | null;
  legacySessionId: string | null;
  narrationMode: "voice" | "transcript";
  stoppedEarly?: boolean;
  completionReason?: string;
};

export type StartMeditationSessionInput = {
  mode?: string;
  mood: string;
  duration: string;
  voice?: string;
  sound?: string | null;
  breathingStyle?: string | null;
  meditationType?: string | null;
  visual?: string | null;
  title?: string | null;
  checkIn?: string | null;
  sourceContext?: string | null;
  scriptText?: string | null;
  narrationMode?: "voice" | "transcript";
};

export class MeditationSessionError extends Error {
  status: number;
  upgradeRequired: boolean;
  feature?: string;

  constructor(message: string, status = 400, upgradeRequired = false, feature?: string) {
    super(message);
    this.name = "MeditationSessionError";
    this.status = status;
    this.upgradeRequired = upgradeRequired;
    this.feature = feature;
  }
}

const MEDITATION_WORD_TARGETS: Record<string, number> = {
  "1 min": 120,
  "3 min": 360,
  "5 min": 600,
  "10 min": 1100,
  "15 min": 1500,
  "20 min": 1900,
};

const BREATHING_PATTERNS: Record<Exclude<BreathingStyle, "none">, { label: string; inhale: number; hold?: number; exhale: number; rest?: number }> = {
  calm: { label: "Calm breathing", inhale: 4, exhale: 6 },
  box: { label: "Box breathing", inhale: 4, hold: 4, exhale: 4, rest: 4 },
  "4-7-8": { label: "4-7-8", inhale: 4, hold: 7, exhale: 8 },
  "deep-reset": { label: "Deep reset", inhale: 3, hold: 2, exhale: 5 },
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeMode(value: string | undefined): SessionMode {
  if (value === "breathing" || value === "sleep") {
    return value;
  }
  return "meditation";
}

function normalizeBreathingStyle(value: string | null | undefined): BreathingStyle {
  if (value === "calm" || value === "box" || value === "4-7-8" || value === "deep-reset") {
    return value;
  }
  return "none";
}

function normalizeDurationLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "5 min";
  }
  return trimmed.includes("min") ? trimmed : `${trimmed} min`;
}

function buildTitle(input: { mode: SessionMode; mood: string; meditationType: string }) {
  const mood = input.mood.trim();
  if (input.mode === "sleep") {
    return `${mood || "Evening"} Sleep Wind-Down`;
  }
  if (input.mode === "breathing") {
    return `${mood || "Calm"} Breath Reset`;
  }
  return `${mood || "Calm"} ${input.meditationType.replace(/_/g, " ")}`
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildSummary(scriptText: string) {
  const normalized = scriptText.replace(/\s+/g, " ").trim();
  if (normalized.length <= 180) {
    return normalized;
  }
  return `${normalized.slice(0, 177)}...`;
}

function buildFallbackMeditationScript(input: {
  mode: SessionMode;
  mood: string;
  duration: string;
  meditationType: string;
  breathingStyle: BreathingStyle;
  checkIn: string;
}) {
  if (input.mode === "breathing") {
    return buildGuidedBreathingScript(input.breathingStyle, input.duration, input.mood);
  }

  if (input.mode === "sleep") {
    return `Welcome. This is your ${input.duration} sleep wind-down. Let your body soften against the surface beneath you. There is nothing to solve right now. Let each exhale lengthen a little. If your mind stays busy, meet it gently and return to the sound of your breath. Allow your jaw, shoulders, and belly to loosen. Rest can arrive slowly. You do not need to force it.`;
  }

  const checkInLine = input.checkIn ? ` You are arriving with this in your heart: ${input.checkIn}.` : "";
  return `Welcome to this ${input.duration} ${input.meditationType.replace(/_/g, " ")} meditation for when you feel ${input.mood}.${checkInLine} Let your breathing slow. Notice where your body is holding effort and allow just a little more space there. You do not need to change everything at once. Stay close to one calming anchor: the breath, the body, or the quiet beneath your thoughts. Each time your mind pulls outward, return gently. Let this be enough for now.`;
}

export function buildGuidedBreathingScript(style: BreathingStyle, duration: string, mood: string) {
  const pattern = style === "none" ? BREATHING_PATTERNS.calm : BREATHING_PATTERNS[style as Exclude<BreathingStyle, "none">];
  const holdLine = pattern.hold ? ` Hold for ${pattern.hold}.` : "";
  const restLine = pattern.rest ? ` Rest for ${pattern.rest}.` : "";
  return `Welcome. This is a ${duration} ${pattern.label.toLowerCase()} session for when you feel ${mood}. Inhale for ${pattern.inhale}.${holdLine} Exhale for ${pattern.exhale}.${restLine} Keep the shoulders soft, the jaw easy, and let the breath be steady rather than forced. Continue with this rhythm and let each cycle lower the volume inside you.`;
}

async function generateMeditationScript(input: {
  mode: SessionMode;
  mood: string;
  duration: string;
  meditationType: string;
  breathingStyle: BreathingStyle;
  checkIn: string;
}) {
  if (input.mode === "breathing") {
    return {
      text: buildGuidedBreathingScript(input.breathingStyle, input.duration, input.mood),
      source: "pattern" as const,
    };
  }

  if (!openai) {
    return {
      text: buildFallbackMeditationScript(input),
      source: "fallback" as const,
    };
  }

  const wordTarget = MEDITATION_WORD_TARGETS[input.duration] ?? 650;
  const minWords = Math.max(90, Math.floor(wordTarget * 0.88));
  const maxWords = Math.ceil(wordTarget * 1.12);
  const prompt = `
You are an expert mindfulness writer for ChimAura, a premium wellness app.

Write one ${input.mode} script for a user who feels "${input.mood}" and wants a "${input.duration}" session.
Meditation focus: "${input.meditationType}".
Breathing style: "${input.breathingStyle}".
User check-in note: "${input.checkIn || "none"}".

Hard length requirement:
- Target about ${wordTarget} words
- Minimum ${minWords} words
- Maximum ${maxWords} words

Rules:
- Sound calm, warm, and grounded
- Do not sound clinical or robotic
- Use short paragraphs
- Return only the meditation script
- No title
- No bullet points
- Avoid medical or therapeutic claims
`;

  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
    });

    const meditation = response.output_text?.trim();
    if (!meditation) {
      throw new Error("OpenAI returned an empty meditation.");
    }

    return {
      text: meditation,
      source: "openai" as const,
    };
  } catch {
    return {
      text: buildFallbackMeditationScript(input),
      source: "fallback" as const,
    };
  }
}

function getMetadata(session: { metadataJson: unknown; durationMinutes: number }): MeditationSessionMetadata {
  const metadata = isObjectRecord(session.metadataJson) ? session.metadataJson : {};
  return {
    sessionMode: normalizeMode(typeof metadata.sessionMode === "string" ? metadata.sessionMode : undefined),
    durationLabel: typeof metadata.durationLabel === "string" ? metadata.durationLabel : `${session.durationMinutes ?? 5} min`,
    meditationType: typeof metadata.meditationType === "string" ? metadata.meditationType : "stress_relief",
    visual: typeof metadata.visual === "string" ? metadata.visual : "mist",
    title: typeof metadata.title === "string" ? metadata.title : "Meditation Session",
    checkIn: typeof metadata.checkIn === "string" ? metadata.checkIn : null,
    sourceContext: typeof metadata.sourceContext === "string" ? metadata.sourceContext : null,
    soundLabel: typeof metadata.soundLabel === "string" ? metadata.soundLabel : null,
    legacySessionId: typeof metadata.legacySessionId === "string" ? metadata.legacySessionId : null,
    narrationMode: metadata.narrationMode === "transcript" ? "transcript" : "voice",
    stoppedEarly: metadata.stoppedEarly === true,
    completionReason: typeof metadata.completionReason === "string" ? metadata.completionReason : undefined,
  };
}

function serializeSession(session: {
  id: string;
  mood: string;
  durationMinutes: number;
  voice: string;
  sound: string | null;
  breathingStyle: string | null;
  scriptText: string;
  audioUrl: string | null;
  status: string;
  startedAt: Date | null;
  pausedAt: Date | null;
  completedAt: Date | null;
  elapsedSeconds: number;
  metadataJson: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  const metadata = getMetadata(session);
  return {
    id: session.id,
    mode: metadata.sessionMode,
    title: metadata.title,
    mood: session.mood,
    durationMinutes: session.durationMinutes,
    durationLabel: metadata.durationLabel,
    meditationType: metadata.meditationType,
    voice: session.voice,
    sound: session.sound,
    soundLabel: metadata.soundLabel ?? (session.sound ? resolveSoundOption(session.sound).label : NONE_SOUND.label),
    breathingStyle: session.breathingStyle ?? "none",
    scriptText: session.scriptText,
    audioUrl: session.audioUrl,
    status: session.status as MeditationSessionLifecycleStatus,
    startedAt: session.startedAt?.toISOString() ?? null,
    pausedAt: session.pausedAt?.toISOString() ?? null,
    completedAt: session.completedAt?.toISOString() ?? null,
    elapsedSeconds: session.elapsedSeconds,
    visual: metadata.visual,
    narrationMode: metadata.narrationMode,
    sourceContext: metadata.sourceContext,
    legacySessionId: metadata.legacySessionId,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

function mergeMetadata(
  existing: unknown,
  patch: Partial<MeditationSessionMetadata>
): Prisma.InputJsonValue {
  const current = isObjectRecord(existing) ? existing : {};
  return {
    ...current,
    ...patch,
  };
}

async function getSessionForUser(sessionId: string, userId: string) {
  const session = await prisma.meditationSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
  });

  if (!session) {
    throw new MeditationSessionError("Session not found.", 404);
  }

  return session;
}

export async function startMeditationSession(viewer: Viewer, input: StartMeditationSessionInput) {
  if (!viewer.userId) {
    throw new MeditationSessionError("Please sign in to start a session.", 401);
  }

  const mood = input.mood.trim();
  if (!mood) {
    throw new MeditationSessionError("Mood is required.", 400);
  }

  const requestedMeditationType = typeof input.meditationType === "string" ? input.meditationType.trim() : "";
  const mode = normalizeMode(input.mode ?? (requestedMeditationType === "sleep" ? "sleep" : undefined));
  const durationLabel = normalizeDurationLabel(input.duration);
  const durationMinutes = durationLabelToMinutes(durationLabel);
  if (!durationMinutes) {
    throw new MeditationSessionError("Duration is invalid.", 400);
  }

  const entitlements = getEffectiveEntitlements(viewer);
  if (durationMinutes > entitlements.maxDurationMinutes) {
    throw new MeditationSessionError(
      `Your ${entitlements.tier} plan supports sessions up to ${entitlements.maxDurationMinutes} minutes.`,
      403,
      entitlements.tier === "free",
      "duration"
    );
  }

  const voice = typeof input.voice === "string" && input.voice.trim() ? input.voice.trim() : "marin";
  if (!entitlements.allowedVoices.includes(voice)) {
    throw new MeditationSessionError(
      "That voice is available on ChimAura Premium.",
      403,
      entitlements.tier === "free",
      "voice"
    );
  }

  const soundChoice = resolveSoundOption(input.sound);
  if (soundChoice.id !== "none" && soundChoice.premium && viewer.subscriptionTier !== "premium") {
    throw new MeditationSessionError(
      "That sound is available on ChimAura Premium.",
      403,
      true,
      "sound"
    );
  }

  const meditationType = typeof input.meditationType === "string" && input.meditationType.trim()
    ? input.meditationType.trim()
    : mode === "sleep"
      ? "sleep"
      : "stress_relief";

  const breathingStyle = normalizeBreathingStyle(input.breathingStyle);
  const checkIn = typeof input.checkIn === "string" ? input.checkIn.trim() : "";
  const visual = clampVisualToEntitlements(
    typeof input.visual === "string" && input.visual.trim() ? input.visual.trim() : mode === "sleep" ? "night" : "mist",
    entitlements
  );
  const title = typeof input.title === "string" && input.title.trim()
    ? input.title.trim()
    : buildTitle({ mode, mood, meditationType });
  const sourceContext = typeof input.sourceContext === "string" && input.sourceContext.trim()
    ? input.sourceContext.trim()
    : null;

  if (mode !== "breathing") {
    const usage = await getOrCreateDailyUsage(viewer.userId, getDateKey());
    if (!canUseMeditation(usage, entitlements)) {
      throw new MeditationSessionError(
        "You have reached your free daily limit. Upgrade to ChimAura Premium for more meditation access.",
        403,
        true,
        "meditation"
      );
    }
  }

  if (mode === "sleep" && !entitlements.sleepMode && durationMinutes > 5) {
    throw new MeditationSessionError(
      "Long-form sleep sessions are part of ChimAura Premium.",
      403,
      true,
      "sleep"
    );
  }

  const script = input.scriptText?.trim()
    ? { text: input.scriptText.trim(), source: "provided" as const }
    : await generateMeditationScript({
        mode,
        mood,
        duration: durationLabel,
        meditationType,
        breathingStyle,
        checkIn,
      });

  if (mode === "breathing") {
    await incrementBreathingUsage(viewer.userId);
  } else {
    await incrementMeditationUsage(viewer.userId);
    if (mode === "sleep") {
      await incrementSleepUsage(viewer.userId);
    }
  }

  const legacySessionId = await createSessionRecord(
    {
      mode,
      meditationType,
      mood,
      duration: durationLabel,
      breathingPattern: breathingStyle === "none" ? null : breathingStyle,
      voice,
      visual,
      sounds: soundChoice.id === "none" ? [] : [soundChoice.id],
      text: script.text,
    },
    viewer.userId
  );

  const metadata: MeditationSessionMetadata = {
    sessionMode: mode,
    durationLabel,
    meditationType,
    visual,
    title,
    checkIn: checkIn || null,
    sourceContext,
    soundLabel: soundChoice.label,
    legacySessionId,
    narrationMode: input.narrationMode === "transcript" ? "transcript" : "voice",
  };

  const session = await prisma.meditationSession.create({
    data: {
      userId: viewer.userId,
      mood,
      durationMinutes,
      voice,
      sound: soundChoice.id === "none" ? null : soundChoice.id,
      breathingStyle: breathingStyle === "none" ? null : breathingStyle,
      scriptText: script.text,
      audioUrl: null,
      status: "ready",
      startedAt: new Date(),
      elapsedSeconds: 0,
      metadataJson: {
        ...metadata,
        scriptSource: script.source,
      } as Prisma.InputJsonValue,
    },
  });

  await setDashboardState(viewer.userId, {
    lastSessionType: mode,
    lastSessionId: session.id,
    lastViewedSection: "meditation-session",
  });

  return serializeSession(session);
}

export async function getMeditationSessionState(userId: string, sessionId?: string | null) {
  let session = null;

  if (sessionId) {
    session = await prisma.meditationSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });
  }

  if (!session) {
    const dashboardState = await prisma.dashboardState.findUnique({ where: { userId } });
    if (dashboardState?.lastSessionId) {
      session = await prisma.meditationSession.findFirst({
        where: {
          id: dashboardState.lastSessionId,
          userId,
        },
      });
    }
  }

  if (!session) {
    session = await prisma.meditationSession.findFirst({
      where: {
        userId,
        status: {
          in: ["ready", "playing", "paused"],
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  return session ? serializeSession(session) : null;
}

export async function updateMeditationSessionState(input: {
  userId: string;
  sessionId: string;
  status?: "ready" | "playing" | "paused";
  elapsedSeconds?: number;
  metadataPatch?: Partial<MeditationSessionMetadata>;
}) {
  const session = await getSessionForUser(input.sessionId, input.userId);
  const nextStatus = input.status ?? session.status;
  const nextElapsed = typeof input.elapsedSeconds === "number" && input.elapsedSeconds >= 0
    ? Math.floor(input.elapsedSeconds)
    : session.elapsedSeconds;

  const updated = await prisma.meditationSession.update({
    where: { id: session.id },
    data: {
      status: nextStatus,
      elapsedSeconds: nextElapsed,
      pausedAt: nextStatus === "paused" ? new Date() : null,
      startedAt: nextStatus === "playing" ? session.startedAt ?? new Date() : session.startedAt,
      metadataJson: (input.metadataPatch
        ? mergeMetadata(session.metadataJson, input.metadataPatch)
        : session.metadataJson) as Prisma.InputJsonValue,
    },
  });

  if (nextStatus === "playing" || nextStatus === "paused") {
    const metadata = getMetadata(updated);
    await setDashboardState(input.userId, {
      lastSessionType: metadata.sessionMode,
      lastSessionId: updated.id,
      lastViewedSection: "meditation-session",
    });
  }

  return serializeSession(updated);
}

export async function resumeMeditationSession(userId: string, sessionId?: string | null) {
  const session = sessionId
    ? await getSessionForUser(sessionId, userId)
    : await prisma.meditationSession.findFirst({
        where: {
          userId,
          status: {
            in: ["ready", "paused", "playing"],
          },
        },
        orderBy: { updatedAt: "desc" },
      });

  if (!session) {
    throw new MeditationSessionError("No resumable session was found.", 404);
  }

  const updated = await prisma.meditationSession.update({
    where: { id: session.id },
    data: {
      status: "playing",
      pausedAt: null,
      startedAt: session.startedAt ?? new Date(),
    },
  });

  const metadata = getMetadata(updated);
  await setDashboardState(userId, {
    lastSessionType: metadata.sessionMode,
    lastSessionId: updated.id,
    lastViewedSection: "meditation-session",
  });

  return serializeSession(updated);
}

export async function completeMeditationSession(input: {
  userId: string;
  sessionId: string;
  elapsedSeconds?: number;
  completionReason?: string | null;
}) {
  const session = await getSessionForUser(input.sessionId, input.userId);
  const metadata = getMetadata(session);
  const now = new Date();
  const elapsedSeconds = typeof input.elapsedSeconds === "number" && input.elapsedSeconds > 0
    ? Math.floor(input.elapsedSeconds)
    : session.elapsedSeconds || session.durationMinutes * 60;

  const alreadyCompleted = session.status === "completed";
  const updated = alreadyCompleted
    ? session
    : await prisma.meditationSession.update({
        where: { id: session.id },
        data: {
          status: "completed",
          completedAt: now,
          pausedAt: null,
          elapsedSeconds,
          metadataJson: mergeMetadata(session.metadataJson, {
            completionReason: input.completionReason ?? "completed",
          }),
        },
      });

  const historyEntry = await prisma.sessionHistory.upsert({
    where: { sessionId: session.id },
    update: {
      title: metadata.title,
      summary: buildSummary(updated.scriptText),
      metadataJson: mergeMetadata(updated.metadataJson, {
        completionReason: input.completionReason ?? "completed",
      }),
      startedAt: updated.startedAt ?? updated.createdAt,
      completedAt: updated.completedAt ?? now,
      durationSeconds: elapsedSeconds,
      status: "completed",
      type: metadata.sessionMode,
    },
    create: {
      sessionId: session.id,
      userId: input.userId,
      type: metadata.sessionMode,
      title: metadata.title,
      summary: buildSummary(updated.scriptText),
      metadataJson: updated.metadataJson as Prisma.InputJsonValue,
      startedAt: updated.startedAt ?? updated.createdAt,
      completedAt: updated.completedAt ?? now,
      durationSeconds: elapsedSeconds,
      status: "completed",
    },
  });

  if (!alreadyCompleted && metadata.legacySessionId) {
    await markSessionPlayed(metadata.legacySessionId, true, input.userId);
  }

  await setDashboardState(input.userId, {
    lastSessionType: metadata.sessionMode,
    lastSessionId: null,
    lastViewedSection: "meditation-complete",
  });

  return {
    session: serializeSession(updated),
    historyEntry,
  };
}

export async function stopMeditationSession(input: {
  userId: string;
  sessionId: string;
  elapsedSeconds?: number;
  action: "resume_later" | "end_now" | "discard";
}) {
  const session = await getSessionForUser(input.sessionId, input.userId);
  const metadata = getMetadata(session);
  const elapsedSeconds = typeof input.elapsedSeconds === "number" && input.elapsedSeconds >= 0
    ? Math.floor(input.elapsedSeconds)
    : session.elapsedSeconds;

  if (input.action === "discard") {
    if (metadata.legacySessionId) {
      await deleteSessionRecord(metadata.legacySessionId, input.userId);
    }

    await prisma.sessionHistory.deleteMany({ where: { sessionId: session.id } });
    await prisma.meditationSession.delete({ where: { id: session.id } });
    await setDashboardState(input.userId, {
      lastSessionType: metadata.sessionMode,
      lastSessionId: null,
      lastViewedSection: "meditation-setup",
    });

    return {
      action: "discarded" as const,
      sessionId: session.id,
    };
  }

  if (input.action === "resume_later") {
    const updated = await prisma.meditationSession.update({
      where: { id: session.id },
      data: {
        status: "paused",
        pausedAt: new Date(),
        elapsedSeconds,
        metadataJson: mergeMetadata(session.metadataJson, {
          stoppedEarly: true,
          completionReason: "resume_later",
        }),
      },
    });

    await setDashboardState(input.userId, {
      lastSessionType: metadata.sessionMode,
      lastSessionId: updated.id,
      lastViewedSection: "meditation-session",
    });

    return {
      action: "resume_later" as const,
      session: serializeSession(updated),
    };
  }

  const alreadyStopped = session.status === "stopped" || session.status === "abandoned";
  const updated = alreadyStopped
    ? session
    : await prisma.meditationSession.update({
        where: { id: session.id },
        data: {
          status: "stopped",
          pausedAt: new Date(),
          elapsedSeconds,
          metadataJson: mergeMetadata(session.metadataJson, {
            stoppedEarly: true,
            completionReason: "end_now",
          }),
        },
      });

  await prisma.sessionHistory.upsert({
    where: { sessionId: session.id },
    update: {
      title: metadata.title,
      summary: buildSummary(updated.scriptText),
      metadataJson: mergeMetadata(updated.metadataJson, {
        completionReason: "end_now",
      }),
      startedAt: updated.startedAt ?? updated.createdAt,
      completedAt: new Date(),
      durationSeconds: elapsedSeconds,
      status: "stopped",
      type: metadata.sessionMode,
    },
    create: {
      sessionId: session.id,
      userId: input.userId,
      type: metadata.sessionMode,
      title: metadata.title,
      summary: buildSummary(updated.scriptText),
      metadataJson: updated.metadataJson as Prisma.InputJsonValue,
      startedAt: updated.startedAt ?? updated.createdAt,
      completedAt: new Date(),
      durationSeconds: elapsedSeconds,
      status: "stopped",
    },
  });

  if (!alreadyStopped && metadata.legacySessionId) {
    await markSessionPlayed(metadata.legacySessionId, false, input.userId);
  }

  await setDashboardState(input.userId, {
    lastSessionType: metadata.sessionMode,
    lastSessionId: null,
    lastViewedSection: "meditation-setup",
  });

  return {
    action: "ended" as const,
    session: serializeSession(updated),
  };
}
