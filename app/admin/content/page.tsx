/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import FeatureFlagEditor from "@/components/admin/FeatureFlagEditor";
import StatCard from "@/components/admin/StatCard";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getAdminContentData } from "@/lib/admin-metrics";

export default async function AdminContentPage() {
  const viewer = await requireAdminViewer();
  const data = await getAdminContentData();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Content"
        description="Manage fallback wellness copy, premium teaser language, and content entries that power empty states, reminders, and future What’s New surfaces."
        viewer={viewer}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Free meditation cap" value={data.caps.free.meditationsPerDay ?? "Unlimited"} />
        <StatCard label="Free speech cap" value={data.caps.free.speechPerDay ?? "Unlimited"} />
        <StatCard label="Free horoscope cap" value={data.caps.free.horoscopeViewsPerDay ?? "Unlimited"} />
        <StatCard label="Content entries" value={data.contentEntries.length} tone="success" />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[1.8rem] border border-slate-200/70 bg-white/80 p-6 shadow-[0_24px_70px_rgba(148,163,184,0.16)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
          <h3 className="text-xl font-semibold text-slate-950 dark:text-white">Fallback copy scaffold</h3>
          <div className="mt-5 space-y-4 text-sm text-slate-700 dark:text-slate-300">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Reflection</p>
              <p className="mt-1">{data.fallbackContent.fallbackReflection}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Affirmation</p>
              <p className="mt-1">{data.fallbackContent.fallbackAffirmation}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Journal prompt</p>
              <p className="mt-1">{data.fallbackContent.fallbackJournalPrompt}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Upgrade copy</p>
              <p className="mt-1">{data.fallbackContent.upgradeCopy}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[1.8rem] border border-slate-200/70 bg-white/80 p-6 shadow-[0_24px_70px_rgba(148,163,184,0.16)] backdrop-blur dark:border-white/10 dark:bg-slate-950/55">
          <h3 className="text-xl font-semibold text-slate-950 dark:text-white">User-level flag overrides</h3>
          <div className="mt-5 space-y-4">
            {data.flags.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No per-user flags yet.</p>
            ) : (
              data.flags.map((flag) => (
                <div key={flag.userId} className="rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
                  <div className="mb-3">
                    <p className="font-semibold text-slate-900 dark:text-white">{flag.email}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{flag.role} | {flag.tier}</p>
                  </div>
                  <FeatureFlagEditor
                    userId={flag.userId}
                    initialFlags={{
                      allowPremiumPreview: flag.allowPremiumPreview,
                      allowWeeklyHoroscope: flag.allowWeeklyHoroscope,
                      allowAdvancedAstrology: flag.allowAdvancedAstrology,
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <DataTable columns={["Key", "Title", "Type", "Status", "Platform", "Updated"]} rows={data.contentEntries.map((item) => [item.key, item.title, item.type, item.status, item.platform, new Date(item.updatedAt).toLocaleString()])} />
    </div>
  );
}



