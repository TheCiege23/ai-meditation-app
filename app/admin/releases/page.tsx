/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getReleasesAdminPageData } from "@/lib/admin-metrics";

export default async function AdminReleasesPage() {
  const viewer = await requireAdminViewer();
  const data = await getReleasesAdminPageData();

  return (
    <div className="space-y-6">
      <AdminHeader title="Releases" description="Manage release notes, current platform versions, and future What’s New publishing workflows for web and mobile." viewer={viewer} />
      <DataTable columns={["Version", "Title", "Platform", "Published", "Author", "Updated"]} rows={data.releaseNotes.map((item) => [item.version, item.title, item.platform, item.isPublished ? "Published" : "Draft", item.createdByAdmin.email, new Date(item.updatedAt).toLocaleString()])} />
      <DataTable columns={["Platform", "Version", "Build", "Current", "Release date"]} rows={data.appVersions.map((item) => [item.platform, item.version, item.buildNumber ?? "-", item.isCurrent ? "Current" : "Historic", item.releaseDate ? new Date(item.releaseDate).toLocaleDateString() : "-"])} />
    </div>
  );
}



