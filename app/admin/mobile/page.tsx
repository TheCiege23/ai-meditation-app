/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import UsageTrendChart from "@/components/admin/UsageTrendChart";
import ChartCard from "@/components/admin/ChartCard";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getMobileAdminPageData } from "@/lib/admin-metrics";

export default async function AdminMobilePage() {
  const viewer = await requireAdminViewer();
  const data = await getMobileAdminPageData();

  return (
    <div className="space-y-6">
      <AdminHeader title="Mobile" description="Prepare for iOS and Android growth with a dedicated view of mobile subscriptions, versions, and app-side notification delivery scaffolds." viewer={viewer} />
      <section className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Active subscriptions by platform">
          <UsageTrendChart data={data.subscriptions.map((item) => ({ label: item.platform, value: item._count.platform }))} primaryLabel="Devices" />
        </ChartCard>
        <ChartCard title="Notification delivery statuses">
          <UsageTrendChart data={data.deliveries.map((item) => ({ label: `${item.platform}-${item.status}`, value: item._count.status }))} primaryLabel="Deliveries" />
        </ChartCard>
      </section>
      <DataTable columns={["Platform", "Version", "Build", "Current", "Release date"]} rows={data.versions.map((item) => [item.platform, item.version, item.buildNumber ?? "-", item.isCurrent ? "Current" : "Historic", item.releaseDate ? new Date(item.releaseDate).toLocaleDateString() : "-"])} />
    </div>
  );
}



