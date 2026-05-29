/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import ChartCard from "@/components/admin/ChartCard";
import DataTable from "@/components/admin/DataTable";
import StatCard from "@/components/admin/StatCard";
import UsageTrendChart from "@/components/admin/UsageTrendChart";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getNotificationsAdminPageData } from "@/lib/admin-metrics";

export default async function AdminNotificationsPage() {
  const viewer = await requireAdminViewer();
  const data = await getNotificationsAdminPageData();

  return (
    <div className="space-y-6">
      <AdminHeader title="Notifications" description="Track push subscriptions, reminder preferences, send outcomes, and recent delivery behavior across web and future mobile channels." viewer={viewer} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Active subscriptions" value={data.metrics.activeSubscriptions} tone="success" />
        <StatCard label="Push enabled users" value={data.metrics.pushEnabledUsers} />
        <StatCard label="Sent today" value={data.metrics.deliveriesToday} />
        <StatCard label="Click rate" value={`${data.metrics.clickRate}%`} tone="success" />
        <StatCard label="Failures today" value={data.metrics.failedToday} tone={data.metrics.failedToday > 0 ? "warning" : "default"} />
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Subscriptions by platform">
          <UsageTrendChart data={data.subscriptionsByPlatform.map((item) => ({ label: item.platform, value: item.count }))} primaryLabel="Subscriptions" />
        </ChartCard>
        <ChartCard title="Reminder preferences">
          <UsageTrendChart data={Object.entries(data.remindersEnabled).map(([label, value]) => ({ label, value }))} primaryLabel="Enabled users" />
        </ChartCard>
      </section>
      <ChartCard title="Recent deliveries">
        <DataTable columns={["User", "Title", "Campaign", "Status", "When"]} rows={data.history.map((item) => [item.user?.email ?? "Unknown", item.title, item.campaign?.title ?? "Direct", item.status, new Date(item.createdAt).toLocaleString()])} />
      </ChartCard>
    </div>
  );
}



