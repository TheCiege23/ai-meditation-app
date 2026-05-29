"use client";

type FilterField = {
  name: string;
  label: string;
  placeholder?: string;
};

type FilterBarProps = {
  fields: FilterField[];
};

export default function FilterBar({ fields }: FilterBarProps) {
  return (
    <form className="grid gap-3 rounded-[1.8rem] border border-slate-200/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.14)] dark:border-white/10 dark:bg-slate-950/55 md:grid-cols-4">
      {fields.map((field) => (
        <label key={field.name} className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{field.label}</span>
          <input name={field.name} placeholder={field.placeholder} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" />
        </label>
      ))}
      <button type="submit" className="self-end rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-sky-200 dark:text-slate-950">Apply filters</button>
    </form>
  );
}
