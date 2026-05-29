type UsageChartDatum = {
  label: string;
  value: number;
  secondaryValue?: number;
  tertiaryValue?: number;
};

type UsageChartProps = {
  data: UsageChartDatum[];
  primaryLabel?: string;
  secondaryLabel?: string;
  tertiaryLabel?: string;
};

export default function UsageChart({
  data,
  primaryLabel = "Primary",
  secondaryLabel,
  tertiaryLabel,
}: UsageChartProps) {
  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => [item.value, item.secondaryValue ?? 0, item.tertiaryValue ?? 0])
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-sky-500" />{primaryLabel}</span>
        {secondaryLabel ? <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{secondaryLabel}</span> : null}
        {tertiaryLabel ? <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" />{tertiaryLabel}</span> : null}
      </div>
      <div className="grid gap-3">
        {data.map((item) => (
          <div key={item.label} className="grid grid-cols-[72px_1fr] items-center gap-3">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
            <div className="space-y-1">
              <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10">
                <div className="h-2 rounded-full bg-sky-500" style={{ width: `${(item.value / maxValue) * 100}%` }} />
              </div>
              {typeof item.secondaryValue === "number" ? (
                <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(item.secondaryValue / maxValue) * 100}%` }} />
                </div>
              ) : null}
              {typeof item.tertiaryValue === "number" ? (
                <div className="h-2 rounded-full bg-slate-100 dark:bg-white/10">
                  <div className="h-2 rounded-full bg-violet-500" style={{ width: `${(item.tertiaryValue / maxValue) * 100}%` }} />
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
