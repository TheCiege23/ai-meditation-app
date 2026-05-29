import type { SubscriptionTier } from "@/lib/types";

export type SoundCategory = "nature" | "ritual" | "motion" | "silence";

export type SoundItem = {
  id: string;
  label: string;
  file: string;
  description: string;
  premium: boolean;
  category: SoundCategory;
  locked?: boolean;
};

export const NONE_SOUND: SoundItem = {
  id: "none",
  label: "None",
  file: "",
  description: "A silent session with only narration or breath pacing.",
  premium: false,
  category: "silence",
};

export const SOUND_LIBRARY: SoundItem[] = [
  {
    id: "rain",
    label: "Rain",
    file: "/sounds/Raindrop.mp3",
    description: "Soft rainfall for a steady, reflective mood.",
    premium: false,
    category: "nature",
  },
  {
    id: "ocean",
    label: "Ocean",
    file: "/sounds/ocean.mp3",
    description: "Rolling waves for focus and evening calm.",
    premium: false,
    category: "nature",
  },
  {
    id: "forest",
    label: "Forest",
    file: "/sounds/forest.mp3",
    description: "A grounded woodland soundscape.",
    premium: false,
    category: "nature",
  },
  {
    id: "campfire",
    label: "Campfire",
    file: "/sounds/Campfire.mp3",
    description: "Warm fire crackle for deeper relaxation.",
    premium: true,
    category: "ritual",
  },
  {
    id: "wind",
    label: "Wind",
    file: "/sounds/Wind.mp3",
    description: "Clean moving air for breathwork and resets.",
    premium: true,
    category: "nature",
  },
  {
    id: "birds",
    label: "Birds",
    file: "/sounds/Birds.mp3",
    description: "A light morning lift with birdsong.",
    premium: true,
    category: "nature",
  },
  {
    id: "bell",
    label: "Bell",
    file: "/sounds/Bell.mp3",
    description: "Gentle bell resonance to frame a session.",
    premium: true,
    category: "ritual",
  },
  {
    id: "walking",
    label: "Walking",
    file: "/sounds/Walking.mp3",
    description: "A soft moving cadence for grounded attention.",
    premium: true,
    category: "motion",
  },
  {
    id: "spiritual",
    label: "Spiritual",
    file: "/sounds/Spiritual.mp3",
    description: "A spacious, meditative ambient layer.",
    premium: true,
    category: "ritual",
  },
  {
    id: "bowl",
    label: "Bowl",
    file: "/sounds/Bowl.mp3",
    description: "A ceremonial singing bowl tone.",
    premium: true,
    category: "ritual",
  },
];

const SOUND_ALIAS_MAP: Record<string, string> = {
  none: "none",
  rain: "rain",
  raindrop: "rain",
  ocean: "ocean",
  forest: "forest",
  campfire: "campfire",
  fire: "campfire",
  wind: "wind",
  birds: "birds",
  bird: "birds",
  bell: "bell",
  walking: "walking",
  spiritual: "spiritual",
  bowl: "bowl",
};

export function getSoundById(soundId: string) {
  if (soundId === "none") {
    return NONE_SOUND;
  }

  return SOUND_LIBRARY.find((item) => item.id === soundId) ?? null;
}

export function resolveSoundOption(value: string | null | undefined) {
  if (!value || value.trim().length === 0) {
    return NONE_SOUND;
  }

  const normalized = value.trim().toLowerCase();
  const alias = SOUND_ALIAS_MAP[normalized] ?? normalized;
  return getSoundById(alias) ?? NONE_SOUND;
}

export function getSoundLibrary(tier: SubscriptionTier = "free") {
  return SOUND_LIBRARY.map((item) => ({
    ...item,
    locked: item.premium && tier !== "premium",
  }));
}

export function getMeditationSoundOptions(tier: SubscriptionTier = "free") {
  return [
    NONE_SOUND,
    ...getSoundLibrary(tier),
  ];
}

export function getRecommendedSound(args: {
  timeOfDay: "morning" | "afternoon" | "evening";
  focus?: string | null;
  prefersSleep?: boolean;
}) {
  if (args.prefersSleep || args.timeOfDay === "evening") {
    return getSoundById("ocean") ?? SOUND_LIBRARY[1];
  }

  const focus = args.focus?.toLowerCase() ?? "";
  if (focus.includes("focus") || focus.includes("clarity")) {
    return getSoundById("wind") ?? SOUND_LIBRARY[4];
  }

  if (args.timeOfDay === "morning") {
    return getSoundById("birds") ?? SOUND_LIBRARY[5];
  }

  return getSoundById("forest") ?? SOUND_LIBRARY[2];
}
