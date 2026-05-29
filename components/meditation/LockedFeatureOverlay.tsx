type LockedFeatureOverlayProps = {
  title: string;
  description: string;
  onUpgrade: () => void;
};

export default function LockedFeatureOverlay({
  title,
  description,
  onUpgrade,
}: LockedFeatureOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end rounded-[1.75rem] bg-slate-950/70 p-5 text-white backdrop-blur-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100/70">Premium</p>
      <h3 className="mt-2 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-200/80">{description}</p>
      <button
        type="button"
        onClick={onUpgrade}
        className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
      >
        Upgrade to unlock
      </button>
    </div>
  );
}