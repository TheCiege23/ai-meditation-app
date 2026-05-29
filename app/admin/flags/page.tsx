/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getFlagsAdminPageData } from "@/lib/admin-metrics";

export default async function AdminFlagsPage() {
  const viewer = await requireAdminViewer();
  const data = await getFlagsAdminPageData();

  return (
    <div className="space-y-6">
      <AdminHeader title="Feature Flags" description="Control staged rollouts, user-specific overrides, and platform-targeted experiments across ChimAura web and future mobile surfaces." viewer={viewer} />
      <DataTable columns={["Key", "Title", "Enabled", "Rollout", "Platform", "Updated"]} rows={data.globalFlags.map((item) => [item.key, item.title, item.isEnabled ? "On" : "Off", `${item.rolloutPercent}%`, item.platform, new Date(item.updatedAt).toLocaleString()])} />
      <DataTable columns={["User", "Premium preview", "Weekly horoscope", "Advanced astrology", "Updated"]} rows={data.userFlags.map((item) => [item.user.email, item.allowPremiumPreview ? "On" : "Off", item.allowWeeklyHoroscope ? "On" : "Off", item.allowAdvancedAstrology ? "On" : "Off", new Date(item.updatedAt).toLocaleString()])} />
    </div>
  );
}



