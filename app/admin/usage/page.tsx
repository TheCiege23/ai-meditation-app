/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import ChartCard from "@/components/admin/ChartCard";
import DataTable from "@/components/admin/DataTable";
import StatCard from "@/components/admin/StatCard";
import UsageChart from "@/components/admin/UsageChart";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getAdminUsageAnalytics } from "@/lib/admin-metrics";

export default async function AdminUsagePage() {
  const viewer = await requireAdminViewer();
  const data = await getAdminUsageAnalytics();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Usage Analytics"
        description="Monitor how people are using meditation generation, speech, and horoscope features across the platform."
        viewer={viewer}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Free usage" value={data.freeVsPremium.free} />
        <StatCard label="Premium usage" value={data.freeVsPremium.premium} tone="success" />
        <StatCard label="Top users tracked" value={data.topUsers.length} />
      </section>

      <ChartCard title="Daily usage trend" description="Meditation, speech, and horoscope counts for the last two weeks.">
        <UsageChart data={data.dailyTrend.map((item) => ({ label: item.label, value: item.meditation, secondaryValue: item.speech, tertiaryValue: item.horoscope }))} primaryLabel="Meditation" secondaryLabel="Speech" tertiaryLabel="Horoscope" />
      </ChartCard>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Route traffic" description="Most requested API routes over the last 14 days.">
          <UsageChart data={data.requestCounts.slice(0, 10).map((item) => ({ label: item.route.replace("/api/", "").slice(0, 12), value: item.count }))} primaryLabel="Requests" />
        </ChartCard>
        <ChartCard title="429 pressure" description="Routes that are hitting your request caps.">
          <UsageChart data={data.rateLimitCounts.slice(0, 10).map((item) => ({ label: item.route.replace("/api/", "").slice(0, 12), value: item.count }))} primaryLabel="429 responses" />
        </ChartCard>
      </section>

      <DataTable
        columns={["User", "Tier", "Meditation", "Speech", "Horoscope", "Total"]}
        rows={data.topUsers.map((user) => [
          <span key={`${user.userId}-email`} className="font-medium">{user.email}</span>,
          <span key={`${user.userId}-tier`} className="capitalize">{user.tier}</span>,
          user.meditation,
          user.speech,
          user.horoscope,
          user.total,
        ])}
      />
    </div>
  );
}




