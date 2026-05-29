import type { ReactNode } from "react";

import AdminGuard from "@/components/admin/AdminGuard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireAdminViewer } from "@/lib/admin-auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const viewer = await requireAdminViewer();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_45%,#fbfdff_100%)] px-4 py-6 dark:bg-[linear-gradient(180deg,#08101d_0%,#0b1526_45%,#0f172a_100%)] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <AdminSidebar roleLabel={viewer.role} />
        <AdminGuard roleLabel={viewer.role}>{children}</AdminGuard>
      </div>
    </main>
  );
}
