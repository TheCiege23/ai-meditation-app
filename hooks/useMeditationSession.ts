"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DEFAULT_MEDITATION_SETUP,
  type MeditationCompletionState,
  type MeditationSessionRecord,
  type MeditationSetupState,
} from "@/lib/meditation-types";

function getErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  const maybeMessage = "message" in data ? data.message : undefined;
  const maybeError = "error" in data ? data.error : undefined;

  if (typeof maybeMessage === "string" && maybeMessage.trim()) {
    return maybeMessage;
  }

  if (typeof maybeError === "string" && maybeError.trim()) {
    return maybeError;
  }

  return fallback;
}

async function requestJson<T>(input: string, init?: RequestInit) {
  const response = await fetch(input, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Something went wrong."));
  }

  return data as T;
}

type SessionScreenState = "setup" | "preparing" | "active" | "complete";

export function useMeditationSession(initialSetup?: Partial<MeditationSetupState>) {
  const [setup, setSetup] = useState<MeditationSetupState>({
    ...DEFAULT_MEDITATION_SETUP,
    ...(initialSetup ?? {}),
  });
  const [screen, setScreen] = useState<SessionScreenState>("setup");
  const [session, setSession] = useState<MeditationSessionRecord | null>(null);
  const [generatedScript, setGeneratedScript] = useState("");
  const [generatedSource, setGeneratedSource] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [mixerOpen, setMixerOpen] = useState(false);
  const [endModalOpen, setEndModalOpen] = useState(false);
  const [completion, setCompletion] = useState<MeditationCompletionState | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completionTriggered, setCompletionTriggered] = useState(false);
  const timerRef = useRef<number | null>(null);
  const syncRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);

  const totalSeconds = useMemo(() => (session?.durationMinutes ?? 0) * 60, [session]);
  const sessionStatus = session?.status ?? "ready";
  const isPlaying = sessionStatus === "playing";
  const isPaused = sessionStatus === "paused";
  const isReady = sessionStatus === "ready";
  const isActive = screen === "active" && Boolean(session);

  const clearTimers = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (syncRef.current !== null) {
      window.clearInterval(syncRef.current);
      syncRef.current = null;
    }
  }, []);

  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  const setSetupField = useCallback(<K extends keyof MeditationSetupState>(key: K, value: MeditationSetupState[K]) => {
    setSetup((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const resetChoices = useCallback(() => {
    setSetup({ ...DEFAULT_MEDITATION_SETUP, ...(initialSetup ?? {}) });
    setGeneratedScript("");
    setGeneratedSource(null);
    setError("");
    setMessage("Choices reset.");
  }, [initialSetup]);

  const generateMeditation = useCallback(async () => {
    setIsGenerating(true);
    setError("");
    setMessage("");

    try {
      const data = await requestJson<{ meditation: string; source?: string }>(
        "/api/generate-meditation",
        {
          method: "POST",
          body: JSON.stringify({
            mode: setup.mode,
            mood: setup.mood,
            duration: setup.duration,
            meditationType: setup.meditationType,
            breathingPattern: setup.breathingStyle === "none" ? null : setup.breathingStyle,
            voice: setup.voice,
            visual: setup.visual,
            sounds: setup.sound === "none" ? [] : [setup.sound],
            checkIn: setup.checkIn,
          }),
        }
      );

      setGeneratedScript(data.meditation);
      setGeneratedSource(data.source ?? "generated");
      setMessage("Meditation script is ready.");
      return data.meditation;
    } catch (nextError) {
      const messageText = nextError instanceof Error ? nextError.message : "Meditation could not be generated.";
      setError(messageText);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [setup]);

  const startSession = useCallback(async () => {
    setScreen("preparing");
    setError("");
    setMessage("");
    setCompletion(null);
    setCompletionTriggered(false);

    try {
      const data = await requestJson<{ ok: true; session: MeditationSessionRecord }>(
        "/api/meditation/session/start",
        {
          method: "POST",
          body: JSON.stringify({
            ...setup,
            scriptText: generatedScript || undefined,
            sound: setup.sound,
          }),
        }
      );

      setSession(data.session);
      setElapsedSeconds(data.session.elapsedSeconds ?? 0);
      setScreen("active");
      setTranscriptOpen(false);
      setMixerOpen(false);
      setMessage("Session prepared.");
      return data.session;
    } catch (nextError) {
      const messageText = nextError instanceof Error ? nextError.message : "Session could not be started.";
      setError(messageText);
      setScreen("setup");
      return null;
    }
  }, [generatedScript, setup]);

  const syncSessionState = useCallback(
    async (payload: {
      status?: "ready" | "playing" | "paused";
      elapsedSeconds?: number;
      metadataPatch?: Record<string, unknown>;
    }) => {
      if (!session) {
        return null;
      }

      const data = await requestJson<{ ok: true; session: MeditationSessionRecord }>(
        "/api/meditation/session/state",
        {
          method: "POST",
          body: JSON.stringify({
            sessionId: session.id,
            ...payload,
          }),
        }
      );

      setSession(data.session);
      return data.session;
    },
    [session]
  );

  const setPlaying = useCallback(async () => {
    if (!session) {
      return null;
    }
    setMessage("");
    return syncSessionState({ status: "playing", elapsedSeconds });
  }, [elapsedSeconds, session, syncSessionState]);

  const pauseSession = useCallback(async () => {
    if (!session) {
      return null;
    }
    return syncSessionState({ status: "paused", elapsedSeconds });
  }, [elapsedSeconds, session, syncSessionState]);

  const restartSession = useCallback(async () => {
    if (!session) {
      return null;
    }

    setElapsedSeconds(0);
    setCompletionTriggered(false);
    const next = await syncSessionState({
      status: "ready",
      elapsedSeconds: 0,
      metadataPatch: {
        stoppedEarly: false,
      },
    });

    if (next) {
      const playing = await syncSessionState({ status: "playing", elapsedSeconds: 0 });
      return playing ?? next;
    }

    return next;
  }, [session, syncSessionState]);

  const refreshSessionState = useCallback(async () => {
    if (!session) {
      return null;
    }

    const data = await requestJson<{ ok: true; session: MeditationSessionRecord | null }>(
      `/api/meditation/session/state?sessionId=${session.id}`,
      {
        method: "GET",
      }
    );

    if (data.session) {
      setSession(data.session);
      setElapsedSeconds(data.session.elapsedSeconds ?? 0);
    }

    return data.session;
  }, [session]);

  const resumeSession = useCallback(async () => {
    if (!session) {
      return null;
    }

    const data = await requestJson<{ ok: true; session: MeditationSessionRecord }>(
      "/api/meditation/session/resume",
      {
        method: "POST",
        body: JSON.stringify({ sessionId: session.id }),
      }
    );

    setSession(data.session);
    return data.session;
  }, [session]);

  const completeSession = useCallback(async (completionReason = "completed") => {
    if (!session) {
      return null;
    }

    setIsSaving(true);
    try {
      const data = await requestJson<{
        ok: true;
        session: MeditationSessionRecord;
        historyEntry: unknown;
        streaks: MeditationCompletionState["streaks"];
      }>("/api/meditation/session/complete", {
        method: "POST",
        body: JSON.stringify({
          sessionId: session.id,
          elapsedSeconds,
          completionReason,
        }),
      });

      setSession(data.session);
      setCompletion({
        kind: "completed",
        session: data.session,
        streaks: data.streaks ?? null,
      });
      setScreen("complete");
      setMessage("Session completed.");
      return data.session;
    } catch (nextError) {
      const messageText = nextError instanceof Error ? nextError.message : "Completion could not be saved.";
      setError(messageText);
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [elapsedSeconds, session]);

  const stopSession = useCallback(async (action: "resume_later" | "end_now" | "discard") => {
    if (!session) {
      return null;
    }

    setIsSaving(true);
    try {
      const data = await requestJson<{
        ok: true;
        action: "resume_later" | "ended" | "discarded";
        session?: MeditationSessionRecord;
        sessionId?: string;
      }>("/api/meditation/session/stop", {
        method: "POST",
        body: JSON.stringify({
          sessionId: session.id,
          action,
          elapsedSeconds,
        }),
      });

      if (data.action === "discarded") {
        setSession(null);
        setElapsedSeconds(0);
        setScreen("setup");
        setCompletion(null);
        setMessage("Session discarded.");
        return data;
      }

      if (data.action === "resume_later") {
        if (data.session) {
          setSession(data.session);
        }
        setMessage("Session saved so you can resume later.");
        return data;
      }

      if (data.session) {
        setSession(data.session);
        setCompletion({
          kind: "stopped",
          session: data.session,
          streaks: null,
        });
        setScreen("complete");
      }

      return data;
    } catch (nextError) {
      const messageText = nextError instanceof Error ? nextError.message : "Session could not be stopped.";
      setError(messageText);
      return null;
    } finally {
      setIsSaving(false);
      setEndModalOpen(false);
    }
  }, [elapsedSeconds, session]);

  const startAnotherSession = useCallback(() => {
    clearTimers();
    setScreen("setup");
    setSession(null);
    setElapsedSeconds(0);
    setCompletion(null);
    setCompletionTriggered(false);
    setGeneratedScript("");
    setGeneratedSource(null);
    setMessage("");
    setError("");
    setTranscriptOpen(false);
    setMixerOpen(false);
    setEndModalOpen(false);
  }, [clearTimers]);

  const resetAfterResumeLater = useCallback(() => {
    clearTimers();
    setScreen("setup");
    setSession(null);
    setElapsedSeconds(0);
    setCompletion(null);
    setCompletionTriggered(false);
    setTranscriptOpen(false);
    setMixerOpen(false);
    setEndModalOpen(false);
  }, [clearTimers]);

  useEffect(() => {
    clearTimers();

    if (!isActive || !session || session.status !== "playing") {
      return;
    }

    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    syncRef.current = window.setInterval(() => {
      void syncSessionState({ status: "playing", elapsedSeconds: elapsedRef.current });
    }, 5000);

    return () => {
      clearTimers();
    };
  }, [clearTimers, isActive, session, syncSessionState]);

  useEffect(() => {
    if (!session || !isActive || completionTriggered || totalSeconds <= 0) {
      return;
    }

    if (elapsedSeconds >= totalSeconds) {
      setCompletionTriggered(true);
      void completeSession();
    }
  }, [completeSession, completionTriggered, elapsedSeconds, isActive, session, totalSeconds]);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    setup,
    setSetup,
    setSetupField,
    resetChoices,
    screen,
    session,
    sessionStatus,
    isActive,
    isPlaying,
    isPaused,
    isReady,
    elapsedSeconds,
    totalSeconds,
    generatedScript,
    generatedSource,
    isGenerating,
    isSaving,
    error,
    message,
    transcriptOpen,
    mixerOpen,
    endModalOpen,
    completion,
    setTranscriptOpen,
    setMixerOpen,
    setEndModalOpen,
    generateMeditation,
    startSession,
    setPlaying,
    pauseSession,
    resumeSession,
    restartSession,
    completeSession,
    stopSession,
    refreshSessionState,
    syncSessionState,
    startAnotherSession,
    resetAfterResumeLater,
  };
}