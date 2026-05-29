/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import DataTable from "@/components/admin/DataTable";
import StatCard from "@/components/admin/StatCard";
import SubscriptionStatusBadge from "@/components/admin/SubscriptionStatusBadge";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getAdminSubscriptionsData } from "@/lib/admin-metrics";

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireAdminViewer();
  const params = await searchParams;
  const data = await getAdminSubscriptionsData({
    query: toSingle(params.q),
    status: toSingle(params.status),
    interval: toSingle(params.interval),
  });

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Subscriptions"
        description="Track billing state, active premium accounts, renewal windows, and which subscriptions need attention."
        viewer={viewer}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Active" value={data.summary.active} tone="success" />
        <StatCard label="Trialing" value={data.summary.trialing} />
        <StatCard label="Past due" value={data.summary.pastDue} tone="warning" />
        <StatCard label="Canceled" value={data.summary.canceled} tone="critical" />
        <StatCard label="Monthly" value={data.summary.monthly} />
        <StatCard label="Yearly" value={data.summary.yearly} />
      </section>

      <form className="grid gap-3 rounded-[1.8rem] border border-slate-200/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.14)] dark:border-white/10 dark:bg-slate-950/55 md:grid-cols-3">
        <input name="q" placeholder="Search email or Stripe ref" defaultValue={toSingle(params.q) ?? ""} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950" />
        <select name="status" defaultValue={toSingle(params.status) ?? "all"} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past due</option>
          <option value="canceled">Canceled</option>
        </select>
        <select name="interval" defaultValue={toSingle(params.interval) ?? "all"} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950">
          <option value="all">All intervals</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-sky-200 dark:text-slate-950">Apply filters</button>
      </form>

      <DataTable
        columns={["Customer", "Status", "Interval", "Stripe", "Renewal", "Updated"]}
        rows={data.rows.map((subscription) => [
          <div key={`${subscription.id}-customer`}>
            <p className="font-semibold">{subscription.email}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{subscription.displayName ?? "ChimAura user"}</p>
          </div>,
          <SubscriptionStatusBadge key={`${subscription.id}-status`} status={subscription.status} />,
          <span key={`${subscription.id}-interval`} className="capitalize">{subscription.billingInterval}</span>,
          <div key={`${subscription.id}-stripe`} className="space-y-1 text-sm">
            <p>Customer: {subscription.customer}</p>
            <p>Subscription: {subscription.subscriptionRef}</p>
          </div>,
          <span key={`${subscription.id}-renewal`}>{subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "-"}</span>,
          <span key={`${subscription.id}-updated`}>{new Date(subscription.updatedAt).toLocaleString()}</span>,
        ])}
      />
    </div>
  );
}






