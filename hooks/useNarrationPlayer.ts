"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/language/LanguageContext";

type PrepareNarrationInput = {
  text: string;
  voice: string;
};

export function useNarrationPlayer() {
  const { language } = useLanguage();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(1);
  const [error, setError] = useState("");
  const [sourceReady, setSourceReady] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
      audioRef.current.addEventListener("play", () => setIsPlaying(true));
      audioRef.current.addEventListener("pause", () => setIsPlaying(false));
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
      audioRef.current.addEventListener("loadedmetadata", () => {
        setDurationSeconds(audioRef.current?.duration ?? 0);
      });
      audioRef.current.addEventListener("error", () => {
        setError(
          language === "es"
            ? "No se pudo preparar la narración. Puedes seguir con la transcripción."
            : "Narration could not be prepared. You can continue with the transcript."
        );
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [language]);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [isMuted, volume]);

  const prepare = useCallback(
    async ({ text, voice }: PrepareNarrationInput) => {
      if (!text.trim()) {
        setError(
          language === "es"
            ? "La narración necesita un texto antes de poder generarse."
            : "Narration needs script text before it can be generated."
        );
        return false;
      }

      setIsPreparing(true);
      setError("");

      try {
        const response = await fetch("/api/generate-speech", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text, voice, language }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          setError(
            typeof data?.message === "string"
              ? data.message
              : typeof data?.error === "string"
                ? data.error
                : language === "es"
                  ? "No se pudo generar la narración. El modo transcripción sigue disponible."
                  : "Narration could not be generated. Transcript mode is still available."
          );
          setSourceReady(false);
          return false;
        }

        const blob = await response.blob();
        const nextUrl = URL.createObjectURL(blob);

        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }

        objectUrlRef.current = nextUrl;
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = nextUrl;
          audioRef.current.load();
        }

        setSourceReady(true);
        return true;
      } catch {
        setError(
          language === "es"
            ? "No se pudo generar la narración. El modo transcripción sigue disponible."
            : "Narration could not be generated. Transcript mode is still available."
        );
        setSourceReady(false);
        return false;
      } finally {
        setIsPreparing(false);
      }
    },
    [language]
  );

  const play = useCallback(async () => {
    if (!audioRef.current || !sourceReady) {
      return false;
    }

    try {
      await audioRef.current.play();
      return true;
    } catch {
      setError(
        language === "es"
          ? "Toca reproducir de nuevo si tu navegador está bloqueando la narración."
          : "Tap play again if your browser is blocking narration playback."
      );
      return false;
    }
  }, [language, sourceReady]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const restart = useCallback(async () => {
    if (!audioRef.current || !sourceReady) {
      return false;
    }

    audioRef.current.currentTime = 0;
    return play();
  }, [play, sourceReady]);

  const stop = useCallback(() => {
    if (!audioRef.current) {
      return;
    }
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  }, []);

  const previewVoice = useCallback(
    async (voice: string) => {
      const success = await prepare({
        text:
          language === "es"
            ? "Bienvenido a ChimAura. Toma una respiración suave y deja que tu cuerpo llegue a este momento."
            : "Welcome to ChimAura. Take one soft breath and let your body arrive.",
        voice,
      });
      if (!success) {
        return false;
      }
      return play();
    },
    [language, play, prepare]
  );

  const setVolume = useCallback((nextVolume: number) => {
    setVolumeState(Math.max(0, Math.min(nextVolume, 1)));
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((current) => !current);
  }, []);

  return {
    isPreparing,
    isPlaying,
    isMuted,
    toggleMute,
    volume,
    setVolume,
    error,
    sourceReady,
    durationSeconds,
    currentTime: audioRef.current?.currentTime ?? 0,
    prepare,
    play,
    pause,
    restart,
    stop,
    previewVoice,
  };
}

