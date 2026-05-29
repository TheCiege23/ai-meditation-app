import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium guided meditation & mindfulness plan | ChimAura",
  description:
    "Upgrade to ChimAura Premium for longer guided meditations, more calming voices, breathing exercises, sleep meditations, and full horoscope insights.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

