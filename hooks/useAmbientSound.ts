"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { resolveSoundOption } from "@/lib/audio";

export function useAmbientSound(initialSoundId = "none") {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundId, setSoundId] = useState(initialSoundId);
  const [volume, setVolumeState] = useState(0.22);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");

  const selectedSound = useMemo(() => resolveSoundOption(soundId), [soundId]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.preload = "auto";
      audioRef.current.addEventListener("play", () => setIsPlaying(true));
      audioRef.current.addEventListener("pause", () => setIsPlaying(false));
      audioRef.current.addEventListener("ended", () => setIsPlaying(false));
      audioRef.current.addEventListener("error", () => {
        setError("That sound could not be played on this device.");
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.volume = isMuted ? 0 : volume;
  }, [isMuted, volume]);

  useEffect(() => {
    const player = audioRef.current;
    if (!player) {
      return;
    }

    if (!selectedSound.file) {
      player.pause();
      player.src = "";
      return;
    }

    const wasPlaying = !player.paused;
    player.pause();
    player.src = selectedSound.file;
    player.load();

    if (wasPlaying) {
      void player.play().catch(() => {
        setError("Tap play to allow ambient sound in this browser.");
      });
    }
  }, [selectedSound.file]);

  const play = useCallback(async () => {
    if (!audioRef.current) {
      return false;
    }
    if (!selectedSound.file) {
      return true;
    }

    try {
      await audioRef.current.play();
      setError("");
      return true;
    } catch {
      setError("Tap play again if your browser is blocking audio playback.");
      return false;
    }
  }, [selectedSound.file]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const restart = useCallback(async () => {
    if (!audioRef.current) {
      return false;
    }
    audioRef.current.currentTime = 0;
    return play();
  }, [play]);

  const stop = useCallback(() => {
    if (!audioRef.current) {
      return;
    }
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  }, []);

  const preview = useCallback(async (nextSoundId?: string) => {
    if (nextSoundId) {
      setSoundId(nextSoundId);
      return true;
    }

    if (isPlaying) {
      pause();
      return true;
    }

    return play();
  }, [isPlaying, pause, play]);

  const setVolume = useCallback((nextVolume: number) => {
    setVolumeState(Math.max(0, Math.min(nextVolume, 1)));
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((current) => !current);
  }, []);

  return {
    selectedSound,
    soundId,
    setSoundId,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    isPlaying,
    error,
    play,
    pause,
    restart,
    stop,
    preview,
  };
}