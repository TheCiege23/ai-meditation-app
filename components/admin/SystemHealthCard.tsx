type SystemHealthCardProps = {
  label: string;
  status: "healthy" | "warning" | "critical";
  description: string;
};

const statusClassMap = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-300/15 dark:bg-emerald-400/10 dark:text-emerald-100",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-300/15 dark:bg-amber-400/10 dark:text-amber-100",
  critical: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-300/15 dark:bg-rose-400/10 dark:text-rose-100",
} as const;

export default function SystemHealthCard({ label, status, description }: SystemHealthCardProps) {
  return (
    <section className={`rounded-[1.6rem] border p-5 ${statusClassMap[status]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] opacity-80">{label}</p>
      <p className="mt-3 text-lg font-semibold capitalize">{status}</p>
      <p className="mt-2 text-sm leading-6 opacity-90">{description}</p>
    </section>
  );
}
