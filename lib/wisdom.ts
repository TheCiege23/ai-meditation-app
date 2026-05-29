import { getDateKey } from "@/lib/usage";
import type { AppLanguage } from "@/lib/types";

const FALLBACK_QUOTES_EN: { text: string; author?: string }[] = [
  { text: "Peace begins with a single breath.", author: "Anonymous" },
  { text: "The present moment is the only moment available to us.", author: "Thich Nhat Hanh" },
  { text: "Calm mind brings inner strength and self-confidence.", author: "Dalai Lama" },
  { text: "In the midst of movement and chaos, keep stillness inside of you.", author: "Deepak Chopra" },
  { text: "Breath is the bridge which connects life to consciousness.", author: "Thich Nhat Hanh" },
];

const FALLBACK_QUOTES_ES: { text: string; author?: string }[] = [
  { text: "La paz comienza con una sola respiración.", author: "Anónimo" },
  { text: "El momento presente es el único momento que tenemos.", author: "Thich Nhat Hanh" },
  { text: "Una mente tranquila aporta fuerza interior y confianza.", author: "Dalai Lama" },
  { text: "En medio del movimiento y el caos, mantén la calma en tu interior.", author: "Deepak Chopra" },
  { text: "La respiración es el puente que conecta la vida con la consciencia.", author: "Thich Nhat Hanh" },
];

export type WisdomItem = {
  text: string;
  author?: string;
  source: "content" | "fallback";
};

export function getDailyWisdom(language: AppLanguage): WisdomItem {
  const dateKey = getDateKey();
  const quotes = language === "es" ? FALLBACK_QUOTES_ES : FALLBACK_QUOTES_EN;
  const index = dateKey.split("-").reduce((acc, part) => acc + part.charCodeAt(0), 0) % quotes.length;
  const q = quotes[index];
  return { text: q.text, author: q.author, source: "fallback" };
}
