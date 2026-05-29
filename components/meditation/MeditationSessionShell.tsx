import type { ReactNode } from "react";

import SoftGlowBackground from "@/components/shared/SoftGlowBackground";

export default function MeditationSessionShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#eef4ff_0%,#f6f4ff_45%,#fbfdff_100%)] text-slate-950 dark:bg-[linear-gradient(180deg,#07111f_0%,#0d1426_40%,#111b30_100%)] dark:text-white">
      <SoftGlowBackground className="opacity-90" tone="cosmic" />
      <SoftGlowBackground className="opacity-70" tone="midnight" />
      <div className="relative mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}