/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import ChartCard from "@/components/admin/ChartCard";
import DataTable from "@/components/admin/DataTable";
import StatCard from "@/components/admin/StatCard";
import UsageChart from "@/components/admin/UsageChart";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getHoroscopeAdminMetrics } from "@/lib/admin-metrics";

export default async function AdminHoroscopePage() {
  const viewer = await requireAdminViewer();
  const data = await getHoroscopeAdminMetrics();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Horoscope"
        description="Track demand for daily cosmic reflections, cache behavior, zodiac distribution, and provider stability."
        viewer={viewer}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Requests" value={data.totals.requests} />
        <StatCard label="Cache hits" value={data.totals.cacheHits} tone="success" />
        <StatCard label="Cache misses" value={data.totals.cacheMisses} />
        <StatCard label="Hit rate" value={`${data.totals.cacheHitRate}%`} tone="success" />
        <StatCard label="Provider failures" value={data.totals.providerFailures} tone={data.totals.providerFailures > 0 ? "warning" : "default"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Daily request trend">
          <UsageChart data={data.dailyTrend.map((item) => ({ label: item.label, value: item.count }))} primaryLabel="Requests" />
        </ChartCard>
        <ChartCard title="Requests by sign">
          <UsageChart data={data.requestsBySign.slice(0, 12).map((item) => ({ label: item.sign.slice(0, 8), value: item.count }))} primaryLabel="Requests" />
        </ChartCard>
      </section>

      <DataTable
        columns={["User", "Sign", "Provider", "Status", "When"]}
        rows={data.recentCalls.map((call) => [call.email, call.sign, call.provider, call.statusCode, new Date(call.createdAt).toLocaleString()])}
      />
    </div>
  );
}




