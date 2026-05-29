/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getModerationAdminPageData } from "@/lib/admin-metrics";

export default async function AdminModerationPage() {
  const viewer = await requireAdminViewer();
  const data = await getModerationAdminPageData();

  return (
    <div className="space-y-6">
      <AdminHeader title="Moderation & Safety" description="Scaffold future moderation workflows, provider safety signals, abuse detection, and internal review notes without exposing user-private content." viewer={viewer} />
      <DataTable columns={["Route", "Provider", "Status", "When"]} rows={data.providerFailures.map((item) => [item.route, item.provider ?? "-", item.statusCode, new Date(item.createdAt).toLocaleString()])} />
      <DataTable columns={["User", "Route", "Status", "When"]} rows={data.abuseSignals.map((item) => [item.user?.email ?? "Guest", item.route, item.statusCode, new Date(item.createdAt).toLocaleString()])} />
    </div>
  );
}



