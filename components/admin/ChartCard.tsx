import type { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <section className="rounded-[1.8rem] border border-slate-200/70 bg-white/80 p-6 shadow-[0_24px_70px_rgba(148,163,184,0.16)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
      <div className="mb-5">
        <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{title}</h3>
        {description ? <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
