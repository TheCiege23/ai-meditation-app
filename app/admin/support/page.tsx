/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import ChartCard from "@/components/admin/ChartCard";
import DataTable from "@/components/admin/DataTable";
import StatCard from "@/components/admin/StatCard";
import UsageTrendChart from "@/components/admin/UsageTrendChart";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getSupportAdminPageData } from "@/lib/admin-metrics";

export default async function AdminSupportPage() {
  const viewer = await requireAdminViewer();
  const data = await getSupportAdminPageData();

  return (
    <div className="space-y-6">
      <AdminHeader title="Support" description="Review customer conversations, ticket volume, priority queues, and assignment scaffolds for billing, bugs, accounts, and feature requests." viewer={viewer} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open" value={data.summary.open} />
        <StatCard label="In progress" value={data.summary.inProgress} tone="warning" />
        <StatCard label="Resolved" value={data.summary.resolved} tone="success" />
        <StatCard label="High priority" value={data.summary.highPriority} tone={data.summary.highPriority > 0 ? "critical" : "default"} />
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Issue categories">
          <UsageTrendChart data={data.categoryCounts.map((item) => ({ label: item.category, value: Number(item.count) }))} primaryLabel="Tickets" />
        </ChartCard>
        <ChartCard title="Recent messages">
          <DataTable columns={["Subject", "Sender", "When"]} rows={data.recentMessages.map((item) => [item.ticket.subject, item.senderUser?.email ?? item.senderType, new Date(item.createdAt).toLocaleString()])} />
        </ChartCard>
      </section>
      <DataTable columns={["Subject", "Email", "Category", "Priority", "Status", "Assigned", "Updated"]} rows={data.tickets.map((ticket) => [ticket.subject, ticket.user?.email ?? ticket.email ?? "Unknown", ticket.category, ticket.priority, ticket.status, ticket.assignedAdmin?.email ?? "Unassigned", new Date(ticket.updatedAt).toLocaleString()])} />
    </div>
  );
}



