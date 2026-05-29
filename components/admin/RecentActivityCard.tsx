type RecentActivityItem = {
  title: string;
  description: string;
  timestamp: string;
  tone?: "neutral" | "warning" | "critical";
};

type RecentActivityCardProps = {
  title: string;
  items: RecentActivityItem[];
};

const toneClassMap = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-300/15 dark:text-amber-100",
  critical: "bg-rose-100 text-rose-900 dark:bg-rose-300/15 dark:text-rose-100",
} as const;

export default function RecentActivityCard({ title, items }: RecentActivityCardProps) {
  return (
    <section className="rounded-[1.8rem] border border-slate-200/70 bg-white/80 p-6 shadow-[0_24px_70px_rgba(148,163,184,0.16)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
      <h3 className="text-xl font-semibold text-slate-950 dark:text-white">{title}</h3>
      <div className="mt-5 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No recent events.</p>
        ) : (
          items.map((item) => {
            const tone = item.tone ?? "neutral";
            return (
              <div key={`${item.title}-${item.timestamp}`} className="rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneClassMap[tone]}`}>{tone}</span>
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{new Date(item.timestamp).toLocaleString()}</p>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
