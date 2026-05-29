import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "1-minute breathing exercise for anxiety | ChimAura Calm",
  description:
    "Use ChimAura Calm for a quick 60‑second guided breathing exercise to ease stress, soften anxiety, and return to a more grounded state.",
};

export const dynamic = "force-dynamic";

export default function CalmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
