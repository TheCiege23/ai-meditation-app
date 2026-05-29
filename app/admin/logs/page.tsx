/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import ChartCard from "@/components/admin/ChartCard";
import DataTable from "@/components/admin/DataTable";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getAdminLogsData } from "@/lib/admin-metrics";

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireAdminViewer();
  const params = await searchParams;
  const data = await getAdminLogsData({
    query: toSingle(params.q),
    route: toSingle(params.route),
    status: toSingle(params.status),
    provider: toSingle(params.provider),
  });

  return (
    <div className="space-y-6">
      <AdminHeader title="Logs" description="Review API traffic, Stripe webhook activity, admin actions, notification deliveries, and support activity in one operational workspace." viewer={viewer} />
      <form className="grid gap-3 rounded-[1.8rem] border border-slate-200/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.14)] dark:border-white/10 dark:bg-slate-950/55 md:grid-cols-4">
        <input name="q" placeholder="Search logs" defaultValue={toSingle(params.q) ?? ""} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" />
        <input name="route" placeholder="Route filter" defaultValue={toSingle(params.route) ?? ""} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" />
        <input name="provider" placeholder="Provider filter" defaultValue={toSingle(params.provider) ?? ""} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" />
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-sky-200 dark:text-slate-950">Apply filters</button>
      </form>
      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="API request logs">
          <DataTable columns={["Route", "Method", "User", "Status", "Provider", "When"]} rows={data.apiLogs.map((item) => [item.route, item.method, item.email, item.statusCode, item.provider, new Date(item.createdAt).toLocaleString()])} />
        </ChartCard>
        <ChartCard title="Stripe webhooks">
          <DataTable columns={["Provider", "Event", "Status", "Error", "When"]} rows={data.webhookEvents.map((item) => [item.provider, item.eventType, item.status, item.errorMessage ?? "-", new Date(item.createdAt).toLocaleString()])} />
        </ChartCard>
        <ChartCard title="Admin actions">
          <DataTable columns={["Admin", "Target", "Action", "When"]} rows={data.adminActions.map((item) => [item.adminEmail, item.targetEmail, item.action, new Date(item.createdAt).toLocaleString()])} />
        </ChartCard>
        <ChartCard title="Push deliveries">
          <DataTable columns={["User", "Title", "Campaign", "Status", "When"]} rows={data.deliveries.map((item) => [item.email, item.title, item.campaign, item.status, new Date(item.createdAt).toLocaleString()])} />
        </ChartCard>
      </section>
      <ChartCard title="Recent support activity">
        <DataTable columns={["Subject", "Sender", "When"]} rows={data.supportMessages.map((item) => [item.subject, item.sender, new Date(item.createdAt).toLocaleString()])} />
      </ChartCard>
    </div>
  );
}



