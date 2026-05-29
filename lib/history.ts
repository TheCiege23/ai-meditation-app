import {
  deleteSessionRecord,
  getMostRecentSession,
  getSessionById,
  getSessionDashboard,
} from "@/lib/cache-db";
import { prisma } from "@/lib/db";

export type SessionHistoryItem = {
  sessionId: string;
  mode: string;
  meditationType: string;
  mood: string;
  duration: string;
  breathingPattern: string | null;
  voice: string;
  visual: string;
  sounds: string[];
  text: string;
  isFavorite: boolean;
  playCount: number;
  completedCount: number;
  lastPlayedAt?: string | null;
  createdAt: string;
};

type PrismaMeditationSessionRow = {
  id: string;
  mood: string;
  durationMinutes: number;
  voice: string;
  sound: string | null;
  breathingStyle: string | null;
  scriptText: string;
  status: string;
  elapsedSeconds: number;
  metadataJson: unknown;
  createdAt: Date;
  updatedAt: Date;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mapMeditationSessionToContinueItem(session: PrismaMeditationSessionRow) {
  const metadata = isRecord(session.metadataJson) ? session.metadataJson : {};
  const mode = typeof metadata.sessionMode === "string" ? metadata.sessionMode : "meditation";
  const duration =
    typeof metadata.durationLabel === "string"
      ? metadata.durationLabel
      : `${session.durationMinutes} min`;
  const meditationType =
    typeof metadata.meditationType === "string"
      ? metadata.meditationType
      : mode === "sleep"
        ? "sleep"
        : "stress_relief";
  const visual = typeof metadata.visual === "string" ? metadata.visual : mode === "sleep" ? "night" : "mist";

  return {
    sessionId: session.id,
    sessionType: mode,
    mode,
    meditationType,
    mood: session.mood,
    duration,
    breathingPattern: session.breathingStyle,
    voice: session.voice,
    visual,
    sounds: session.sound ? [session.sound] : [],
    text: session.scriptText,
    isFavorite: false,
    playCount: 0,
    completedCount: session.status === "completed" ? 1 : 0,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    elapsedSeconds: session.elapsedSeconds,
    status: session.status,
    title: typeof metadata.title === "string" ? metadata.title : null,
  };
}

export async function getRecentSessionHistory(userId: string, limit = 12) {
  const dashboard = await getSessionDashboard(userId);
  return dashboard.recent.slice(0, limit) as SessionHistoryItem[];
}

export async function getFavoriteSessions(userId: string, limit = 6) {
  const dashboard = await getSessionDashboard(userId);
  return dashboard.favorites.slice(0, limit) as SessionHistoryItem[];
}

export async function getContinueSession(userId: string) {
  const state = await prisma.dashboardState.findUnique({
    where: { userId },
  });

  if (state?.lastSessionId) {
    const activeMeditationSession = await prisma.meditationSession.findFirst({
      where: {
        id: state.lastSessionId,
        userId,
        status: {
          in: ["ready", "playing", "paused"],
        },
      },
    });

    if (activeMeditationSession) {
      return mapMeditationSessionToContinueItem(activeMeditationSession);
    }

    const cachedSession = await getSessionById(state.lastSessionId, userId);
    if (cachedSession) {
      return {
        ...cachedSession,
        sessionType: state.lastSessionType ?? cachedSession.mode,
      };
    }
  }

  const latestMeditationSession = await prisma.meditationSession.findFirst({
    where: {
      userId,
      status: {
        in: ["ready", "playing", "paused"],
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (latestMeditationSession) {
    return mapMeditationSessionToContinueItem(latestMeditationSession);
  }

  const latest = await getMostRecentSession(userId);
  if (!latest) {
    return null;
  }

  return {
    ...latest,
    sessionType: latest.mode,
  };
}

export async function setDashboardState(
  userId: string,
  input: {
    lastSessionType?: string | null;
    lastSessionId?: string | null;
    lastViewedSection?: string | null;
  }
) {
  return prisma.dashboardState.upsert({
    where: { userId },
    update: {
      lastSessionType: input.lastSessionType ?? undefined,
      lastSessionId: input.lastSessionId ?? undefined,
      lastViewedSection: input.lastViewedSection ?? undefined,
    },
    create: {
      userId,
      lastSessionType: input.lastSessionType ?? null,
      lastSessionId: input.lastSessionId ?? null,
      lastViewedSection: input.lastViewedSection ?? null,
    },
  });
}

export async function deleteHistoryItem(userId: string, sessionId: string) {
  await deleteSessionRecord(sessionId, userId);
  await prisma.sessionHistory.deleteMany({
    where: {
      userId,
      OR: [{ sessionId }, { id: sessionId }],
    },
  });
  await prisma.meditationSession.deleteMany({
    where: {
      id: sessionId,
      userId,
    },
  });

  const state = await prisma.dashboardState.findUnique({ where: { userId } });
  if (state?.lastSessionId === sessionId) {
    await setDashboardState(userId, {
      lastSessionId: null,
      lastViewedSection: "history",
    });
  }
}

export async function getActivityFeed(userId: string) {
  const [sessions, affirmations, prompts] = await Promise.all([
    getRecentSessionHistory(userId, 8),
    prisma.savedAffirmation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.savedPrompt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  return {
    sessions,
    affirmations,
    prompts,
  };
}
