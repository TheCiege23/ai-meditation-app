import type { Viewer } from "@/lib/types";

type AdminHeaderProps = {
  title: string;
  description: string;
  viewer: Viewer;
};

export default function AdminHeader({ title, description, viewer }: AdminHeaderProps) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 rounded-[2rem] border border-white/10 bg-slate-950 px-6 py-6 text-white shadow-[0_28px_80px_rgba(2,6,23,0.38)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/65">ChimAura Control Room</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200/80">{description}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-slate-100">
        <p className="font-semibold">{viewer.displayName}</p>
        <p className="capitalize text-slate-300">{viewer.role.replace("_", " ")}</p>
      </div>
    </header>
  );
}
