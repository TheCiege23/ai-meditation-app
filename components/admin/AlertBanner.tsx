type AlertBannerProps = {
  level: "info" | "warning" | "critical";
  title: string;
  message: string;
};

const toneMap = {
  info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-200/10 dark:bg-sky-300/10 dark:text-sky-100",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-300/10 dark:bg-amber-300/10 dark:text-amber-100",
  critical: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-300/10 dark:bg-rose-300/10 dark:text-rose-100",
} as const;

export default function AlertBanner({ level, title, message }: AlertBannerProps) {
  return (
    <div className={`rounded-[1.4rem] border px-4 py-3 ${toneMap[level]}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm opacity-90">{message}</p>
    </div>
  );
}
