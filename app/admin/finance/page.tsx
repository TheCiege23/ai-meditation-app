/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import StatCard from "@/components/admin/StatCard";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getFinanceAdminPageData } from "@/lib/admin-metrics";

export default async function AdminFinancePage() {
  const viewer = await requireAdminViewer();
  const data = await getFinanceAdminPageData();

  return (
    <div className="space-y-6">
      <AdminHeader title="Finance" description="A masked billing view for premium counts, interval mix, churn signals, failed invoice activity, and Stripe sync monitoring." viewer={viewer} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Premium" value={data.summary.premiumCount} tone="success" />
        <StatCard label="Monthly" value={data.summary.monthlyCount} />
        <StatCard label="Yearly" value={data.summary.yearlyCount} />
        <StatCard label="Failed invoices" value={data.summary.failedInvoices} tone={data.summary.failedInvoices > 0 ? "warning" : "default"} />
        <StatCard label="Churned" value={data.summary.churned} tone={data.summary.churned > 0 ? "critical" : "default"} />
      </section>
      <DataTable columns={["Provider", "Event", "Status", "When"]} rows={data.webhookEvents.map((item) => [item.provider, item.eventType, item.status, new Date(item.createdAt).toLocaleString()])} />
    </div>
  );
}



