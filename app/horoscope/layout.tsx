import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily horoscope reflection & astrology meditation | ChimAura",
  description:
    "Explore calm daily horoscope reflections, spiritual insight, and astrology‑inspired meditation prompts to support your mindfulness routine.",
};

export default function HoroscopeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

