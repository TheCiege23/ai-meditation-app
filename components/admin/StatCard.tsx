type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warning" | "critical";
};

const toneMap = {
  default: "from-white to-slate-50/90 dark:from-white/6 dark:to-white/4",
  success: "from-emerald-50 to-white dark:from-emerald-400/10 dark:to-white/4",
  warning: "from-amber-50 to-white dark:from-amber-300/10 dark:to-white/4",
  critical: "from-rose-50 to-white dark:from-rose-400/10 dark:to-white/4",
} as const;

export default function StatCard({ label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <section className={`rounded-[1.6rem] border border-slate-200/70 bg-linear-to-br p-5 shadow-[0_18px_50px_rgba(148,163,184,0.16)] dark:border-white/10 ${toneMap[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{value}</p>
      {hint ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{hint}</p> : null}
    </section>
  );
}
