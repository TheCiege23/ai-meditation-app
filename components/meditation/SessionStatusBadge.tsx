import { SESSION_STATUS_LABELS, type MeditationSessionStatus } from "@/lib/meditation-types";

const toneMap: Record<MeditationSessionStatus, string> = {
  preparing: "border-amber-200/70 bg-amber-50 text-amber-900 dark:border-amber-200/20 dark:bg-amber-300/10 dark:text-amber-100",
  ready: "border-slate-200/70 bg-slate-100 text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-slate-100",
  playing: "border-emerald-200/70 bg-emerald-50 text-emerald-900 dark:border-emerald-200/20 dark:bg-emerald-300/10 dark:text-emerald-100",
  paused: "border-sky-200/70 bg-sky-50 text-sky-900 dark:border-sky-200/20 dark:bg-sky-300/10 dark:text-sky-100",
  completed: "border-cyan-200/70 bg-cyan-50 text-cyan-900 dark:border-cyan-200/20 dark:bg-cyan-300/10 dark:text-cyan-100",
  stopped: "border-orange-200/70 bg-orange-50 text-orange-900 dark:border-orange-200/20 dark:bg-orange-300/10 dark:text-orange-100",
  abandoned: "border-rose-200/70 bg-rose-50 text-rose-900 dark:border-rose-200/20 dark:bg-rose-300/10 dark:text-rose-100",
};

export default function SessionStatusBadge({ status }: { status: MeditationSessionStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneMap[status]}`}>
      {SESSION_STATUS_LABELS[status]}
    </span>
  );
}