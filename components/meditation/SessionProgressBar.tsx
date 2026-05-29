export default function SessionProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
        <span>Session progress</span>
        <span>{Math.round(safeValue)}%</span>
      </div>
      <div className="h-3 rounded-full bg-slate-200/70 dark:bg-white/10">
        <div
          className="h-3 rounded-full bg-linear-to-r from-cyan-400 via-sky-500 to-indigo-500 transition-[width] duration-500"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}