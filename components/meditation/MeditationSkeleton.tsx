export default function MeditationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="aura-shimmer h-36 rounded-[2rem] bg-white/70 dark:bg-white/6" />
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="aura-shimmer h-[520px] rounded-[2rem] bg-white/70 dark:bg-white/6" />
        <div className="space-y-6">
          <div className="aura-shimmer h-48 rounded-[2rem] bg-white/70 dark:bg-white/6" />
          <div className="aura-shimmer h-48 rounded-[2rem] bg-white/70 dark:bg-white/6" />
        </div>
      </div>
    </div>
  );
}