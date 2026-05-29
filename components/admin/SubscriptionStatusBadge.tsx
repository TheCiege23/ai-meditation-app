type SubscriptionStatusBadgeProps = {
  status: string;
};

const statusClassMap: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-900 dark:bg-emerald-400/15 dark:text-emerald-100",
  trialing: "bg-sky-100 text-sky-900 dark:bg-sky-400/15 dark:text-sky-100",
  past_due: "bg-amber-100 text-amber-900 dark:bg-amber-300/15 dark:text-amber-100",
  canceled: "bg-rose-100 text-rose-900 dark:bg-rose-400/15 dark:text-rose-100",
  inactive: "bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-200",
};

export default function SubscriptionStatusBadge({ status }: SubscriptionStatusBadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassMap[status] ?? statusClassMap.inactive}`}>
      {status.replace("_", " ")}
    </span>
  );
}
