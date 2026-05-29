/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import SubscriptionStatusBadge from "@/components/admin/SubscriptionStatusBadge";
import UserRoleControl from "@/components/admin/UserRoleControl";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getAdminUsersData } from "@/lib/admin-metrics";

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireAdminViewer();
  const params = await searchParams;
  const data = await getAdminUsersData({
    query: toSingle(params.q),
    tier: toSingle(params.tier),
    role: toSingle(params.role),
    push: toSingle(params.push),
    zodiacSign: toSingle(params.zodiac),
    missingBirthdate: toSingle(params.missingBirthdate),
  });

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Users"
        description="Search and manage ChimAura members, inspect role and billing state, review notification readiness, and spot profile gaps before they affect engagement flows."
        viewer={viewer}
      />

      <form className="grid gap-3 rounded-[1.8rem] border border-slate-200/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.14)] dark:border-white/10 dark:bg-slate-950/55 md:grid-cols-5">
        <input name="q" placeholder="Search email" defaultValue={toSingle(params.q) ?? ""} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" />
        <select name="tier" defaultValue={toSingle(params.tier) ?? "all"} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950"><option value="all">All tiers</option><option value="free">Free</option><option value="premium">Premium</option></select>
        <select name="role" defaultValue={toSingle(params.role) ?? "all"} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950"><option value="all">All roles</option><option value="user">User</option><option value="admin">Admin</option><option value="super_admin">Super admin</option></select>
        <select name="push" defaultValue={toSingle(params.push) ?? "all"} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950"><option value="all">Push any</option><option value="enabled">Push enabled</option><option value="disabled">Push disabled</option></select>
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-sky-200 dark:text-slate-950">Apply filters</button>
      </form>

      <DataTable
        columns={["User", "Role", "Plan", "Profile", "Push", "Usage", "Dates", "Actions"]}
        rows={data.map((user) => [
          <div key={`${user.id}-user`}>
            <p className="font-semibold">{user.email}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.id}</p>
          </div>,
          <div key={`${user.id}-role`} className="space-y-2">
            <p className="capitalize">{user.role.replace("_", " ")}</p>
            <UserRoleControl userId={user.id} currentRole={user.role} />
          </div>,
          <div key={`${user.id}-plan`} className="space-y-2">
            <p className="capitalize font-medium">{user.subscriptionTier}</p>
            <SubscriptionStatusBadge status={user.subscriptionStatus} />
          </div>,
          <div key={`${user.id}-profile`} className="space-y-1 text-sm">
            <p>Zodiac: {user.zodiacSign}</p>
            <p>Birthdate: {user.hasBirthdate ? "Saved" : "Missing"}</p>
          </div>,
          <div key={`${user.id}-push`} className="space-y-1 text-sm">
            <p>{user.pushEnabled ? "Enabled" : "Disabled"}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.activePlatforms.length ? user.activePlatforms.join(", ") : "No active devices"}</p>
          </div>,
          <span key={`${user.id}-usage`}>{user.usageSummary}</span>,
          <div key={`${user.id}-dates`} className="space-y-1 text-sm">
            <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>
            <p>Last active: {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "No recent activity"}</p>
          </div>,
          <div key={`${user.id}-actions`} className="text-sm text-slate-500 dark:text-slate-400">
            Notification prefs scaffold<br />
            Support/send-test scaffold
          </div>,
        ])}
      />
    </div>
  );
}



