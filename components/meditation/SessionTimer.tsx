function formatSeconds(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function SessionTimer({
  elapsedSeconds,
  totalSeconds,
}: {
  elapsedSeconds: number;
  totalSeconds: number;
}) {
  const remaining = Math.max(0, totalSeconds - elapsedSeconds);

  return (
    <div className="grid grid-cols-3 gap-3 rounded-[1.5rem] border border-white/10 bg-white/70 p-4 text-center shadow-[0_14px_40px_rgba(15,23,42,0.08)] dark:bg-slate-950/45 dark:shadow-[0_18px_42px_rgba(2,6,23,0.35)]">
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Elapsed</p>
        <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{formatSeconds(elapsedSeconds)}</p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Remaining</p>
        <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{formatSeconds(remaining)}</p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Total</p>
        <p className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">{formatSeconds(totalSeconds)}</p>
      </div>
    </div>
  );
}