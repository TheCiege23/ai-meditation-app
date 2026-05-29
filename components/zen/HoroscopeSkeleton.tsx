function SkeletonBlock({ className }: { className: string }) {
  return <div className={`aura-shimmer rounded-3xl bg-white/60 dark:bg-white/5 ${className}`} />;
}

export default function HoroscopeSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-48 w-full" />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <SkeletonBlock className="h-[340px] w-full" />
          <div className="grid gap-6 lg:grid-cols-2">
            <SkeletonBlock className="h-72 w-full" />
            <SkeletonBlock className="h-72 w-full" />
          </div>
          <SkeletonBlock className="h-44 w-full" />
          <SkeletonBlock className="h-56 w-full" />
        </div>

        <div className="space-y-6">
          <SkeletonBlock className="h-64 w-full" />
          <SkeletonBlock className="h-72 w-full" />
          <SkeletonBlock className="h-44 w-full" />
          <SkeletonBlock className="h-44 w-full" />
        </div>
      </div>
    </div>
  );
}