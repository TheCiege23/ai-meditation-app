import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_45%,#fbfdff_100%)] px-4 py-10 dark:bg-[linear-gradient(180deg,#08101d_0%,#0b1526_45%,#0f172a_100%)]">
      <section className="max-w-xl rounded-[2rem] border border-slate-200/70 bg-white/85 p-8 text-center shadow-[0_24px_80px_rgba(148,163,184,0.16)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Unauthorized</p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-950 dark:text-white">Admin access is required</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
          This area is reserved for ChimAura operators. If you should have access, sign in with an admin account.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white dark:bg-sky-200 dark:text-slate-950"
        >
          Return home
        </Link>
      </section>
    </main>
  );
}
