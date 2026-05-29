import UsageChart from "@/components/admin/UsageChart";

type UsageTrendChartProps = {
  title?: string;
  data: Array<{ label: string; value: number; secondaryValue?: number; tertiaryValue?: number }>;
  primaryLabel?: string;
  secondaryLabel?: string;
  tertiaryLabel?: string;
};

export default function UsageTrendChart({ title, data, primaryLabel, secondaryLabel, tertiaryLabel }: UsageTrendChartProps) {
  return (
    <div className="space-y-4">
      {title ? <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{title}</h3> : null}
      <UsageChart data={data} primaryLabel={primaryLabel} secondaryLabel={secondaryLabel} tertiaryLabel={tertiaryLabel} />
    </div>
  );
}
