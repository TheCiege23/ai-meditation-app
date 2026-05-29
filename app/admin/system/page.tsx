/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import ChartCard from "@/components/admin/ChartCard";
import DataTable from "@/components/admin/DataTable";
import SystemHealthCard from "@/components/admin/SystemHealthCard";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getSystemHealthMetrics } from "@/lib/admin-metrics";

export default async function AdminSystemPage() {
  const viewer = await requireAdminViewer();
  const data = await getSystemHealthMetrics();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="System Health"
        description="A compact operational view of route reliability, webhook traffic, rate-limit pressure, and environment readiness."
        viewer={viewer}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SystemHealthCard label="Database" status={data.environment.database ? "healthy" : "critical"} description={data.environment.database ? "DATABASE_URL is configured." : "Database environment is missing."} />
        <SystemHealthCard label="Stripe" status={data.environment.stripe ? "healthy" : "warning"} description={data.environment.stripe ? "Stripe secret and webhook secret are present." : "Stripe keys still need attention."} />
        <SystemHealthCard label="Astrology provider" status={data.environment.astro ? "healthy" : "warning"} description={data.environment.astro ? "FreeAstro settings are present." : "Fallback-only mode is active."} />
        <SystemHealthCard label="Redis / Upstash" status={data.environment.redis ? "healthy" : "warning"} description={data.environment.redis ? "Rate limiting can use Redis." : "In-memory fallback is in use."} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Route health summary">
          <DataTable
            columns={["Route", "Requests", "Errors", "Success rate"]}
            rows={data.routeHealth.map((route) => [route.route, route.requests, route.errors, `${route.successRate}%`])}
          />
        </ChartCard>
        <ChartCard title="Recent webhook activity">
          <DataTable
            columns={["Provider", "Event", "Status", "When"]}
            rows={data.webhookEvents.map((event) => [event.provider, event.eventType, event.status, new Date(event.createdAt).toLocaleString()])}
          />
        </ChartCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Recent 429 events">
          <DataTable
            columns={["Route", "Provider", "When"]}
            rows={data.rateLimitEvents.map((event) => [event.route, event.provider ?? "-", new Date(event.createdAt).toLocaleString()])}
          />
        </ChartCard>
        <ChartCard title="Recent server errors">
          <DataTable
            columns={["Route", "Provider", "Status", "When"]}
            rows={data.recentErrors.map((event) => [event.route, event.provider ?? "-", event.statusCode, new Date(event.createdAt).toLocaleString()])}
          />
        </ChartCard>
      </section>
    </div>
  );
}




