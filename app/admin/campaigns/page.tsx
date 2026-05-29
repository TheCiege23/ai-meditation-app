/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import ChartCard from "@/components/admin/ChartCard";
import DataTable from "@/components/admin/DataTable";
import AdminHeader from "@/components/admin/AdminHeader";
import StatCard from "@/components/admin/StatCard";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getCampaignsAdminPageData } from "@/lib/admin-metrics";

export default async function AdminCampaignsPage() {
  const viewer = await requireAdminViewer();
  const data = await getCampaignsAdminPageData();

  return (
    <div className="space-y-6">
      <AdminHeader title="Campaigns" description="Manage announcement and engagement campaigns, monitor delivery results, and prevent duplicate sends with a clearer operational view." viewer={viewer} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Drafts" value={data.summary.drafts} />
        <StatCard label="Scheduled" value={data.summary.scheduled} />
        <StatCard label="Sending" value={data.summary.sending} tone="warning" />
        <StatCard label="Sent" value={data.summary.sent} tone="success" />
        <StatCard label="Failed" value={data.summary.failed} tone={data.summary.failed > 0 ? "critical" : "default"} />
      </section>
      <ChartCard title="Campaign builder scaffold" description="Use the `/api/notifications/campaigns` routes to create, edit, test, schedule, or send now. The UI scaffold below keeps the fields and preview shape ready.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Fields</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Title, message, CTA label, CTA URL, audience type, audience filters, platform target, schedule time.</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 p-4 dark:border-white/10">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Audience presets</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">All, premium, free, inactive, timezone, zodiac sign, preferred mood, missing birthdate, platform, streak status.</p>
          </div>
        </div>
      </ChartCard>
      <DataTable columns={["Title", "Type", "Audience", "Status", "Deliveries", "Clicks", "Creator", "Timing"]} rows={data.rows.map((item) => [item.title, item.type, item.audienceType, item.status, item.deliveries, item.clicked, item.creator, item.sentAt ? new Date(item.sentAt).toLocaleString() : item.scheduledFor ? new Date(item.scheduledFor).toLocaleString() : "Draft"])} />
    </div>
  );
}



