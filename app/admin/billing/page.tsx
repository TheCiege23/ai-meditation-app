/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import BillingResyncButton from "@/components/admin/BillingResyncButton";
import ChartCard from "@/components/admin/ChartCard";
import DataTable from "@/components/admin/DataTable";
import SubscriptionStatusBadge from "@/components/admin/SubscriptionStatusBadge";
import { maskStripeReference } from "@/lib/admin";
import { requireAdminViewer } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
  findUserByStripeCustomerId,
  getUserByEmail,
  getUserById,
} from "@/lib/user-store";

function toSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function lookupBillingUser(q: string) {
  if (!q) return null;

  if (q.startsWith("cus_")) {
    return findUserByStripeCustomerId(q);
  }

  if (q.startsWith("sub_")) {
    const sub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: q },
      select: { userId: true },
    });
    return sub ? getUserById(sub.userId) : null;
  }

  return getUserByEmail(q);
}

async function getWebhookEvents(
  stripeCustomerId: string | null | undefined,
  stripeSubscriptionId: string | null | undefined
) {
  if (!stripeCustomerId && !stripeSubscriptionId) return [];

  const recentEvents = await prisma.webhookEvent.findMany({
    where: { provider: "stripe" },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return recentEvents
    .filter((ev) => {
      const payload = JSON.stringify(ev.payloadJson ?? "");
      return (
        (stripeCustomerId ? payload.includes(stripeCustomerId) : false) ||
        (stripeSubscriptionId ? payload.includes(stripeSubscriptionId) : false)
      );
    })
    .slice(0, 15);
}

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireAdminViewer();
  const params = await searchParams;
  const q = toSingle(params.q)?.trim() ?? "";

  const user = q ? await lookupBillingUser(q) : null;
  const notFound = q && !user;

  const stripeCustomerId = user?.subscription?.stripeCustomerId ?? null;
  const stripeSubscriptionId = user?.subscription?.stripeSubscriptionId ?? null;

  const webhookEvents =
    user && (stripeCustomerId || stripeSubscriptionId)
      ? await getWebhookEvents(stripeCustomerId, stripeSubscriptionId)
      : [];

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Billing Lookup"
        description="Find a user by email, Stripe customer ID, or subscription ID. View their subscription state and recent webhook events. Resync from Stripe if the local state is stale."
        viewer={viewer}
      />

      {/* Search form */}
      <form className="flex gap-3 rounded-[1.8rem] border border-slate-200/70 bg-white/80 p-5 shadow-[0_18px_50px_rgba(148,163,184,0.14)] dark:border-white/10 dark:bg-slate-950/55">
        <input
          name="q"
          placeholder="Email, cus_…, or sub_…"
          defaultValue={q}
          autoComplete="off"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950"
        />
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white dark:bg-sky-200 dark:text-slate-950"
        >
          Look up
        </button>
      </form>

      {/* Not found banner */}
      {notFound && (
        <div className="rounded-[1.8rem] border border-rose-200/70 bg-rose-50/80 px-6 py-4 text-sm text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300">
          No user found for <strong>{q}</strong>.
        </div>
      )}

      {/* Results */}
      {user && (
        <div className="space-y-6">
          {/* User card */}
          <ChartCard title="User" description="Account details for the matched user.">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Email
                </dt>
                <dd className="mt-1 font-medium">{user.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Display name
                </dt>
                <dd className="mt-1">{user.displayName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  User ID
                </dt>
                <dd className="mt-1 font-mono text-xs">{user.id}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Role
                </dt>
                <dd className="mt-1 capitalize">{user.role}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Email verified
                </dt>
                <dd className="mt-1">{user.emailVerified ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Registered
                </dt>
                <dd className="mt-1">
                  {new Date(user.createdAt).toLocaleString()}
                </dd>
              </div>
            </dl>
          </ChartCard>

          {/* Subscription card */}
          <ChartCard
            title="Subscription"
            description="Local subscription record. Use Resync to pull the latest state from Stripe."
          >
            {user.subscription ? (
              <div className="space-y-5">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                      Tier
                    </dt>
                    <dd className="mt-1 capitalize font-semibold">
                      {user.subscription.tier}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                      Status
                    </dt>
                    <dd className="mt-1">
                      <SubscriptionStatusBadge
                        status={user.subscription.status}
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                      Billing interval
                    </dt>
                    <dd className="mt-1 capitalize">
                      {user.subscription.billingInterval ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                      Current period end
                    </dt>
                    <dd className="mt-1">
                      {user.subscription.currentPeriodEnd
                        ? new Date(
                            user.subscription.currentPeriodEnd
                          ).toLocaleDateString()
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                      Stripe customer
                    </dt>
                    <dd className="mt-1 font-mono text-xs">
                      {maskStripeReference(stripeCustomerId)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                      Stripe subscription
                    </dt>
                    <dd className="mt-1 font-mono text-xs">
                      {maskStripeReference(stripeSubscriptionId)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                      Last updated
                    </dt>
                    <dd className="mt-1">
                      {new Date(user.subscription.updatedAt).toLocaleString()}
                    </dd>
                  </div>
                </dl>

                {stripeSubscriptionId && (
                  <div className="border-t border-slate-200/70 pt-4 dark:border-white/10">
                    <p className="mb-3 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                      Manual resync
                    </p>
                    <BillingResyncButton userId={user.id} />
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No subscription record found for this user.
              </p>
            )}
          </ChartCard>

          {/* Webhook events */}
          <ChartCard
            title="Recent webhook events"
            description="Stripe webhook events referencing this customer or subscription (most recent 15)."
          >
            {webhookEvents.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No webhook events found for this subscription.
              </p>
            ) : (
              <DataTable
                columns={[
                  "Event type",
                  "Status",
                  "External ID",
                  "Error",
                  "When",
                ]}
                rows={webhookEvents.map((ev) => [
                  ev.eventType,
                  ev.status,
                  ev.externalId ?? "—",
                  ev.errorMessage ?? "—",
                  new Date(ev.createdAt).toLocaleString(),
                ])}
              />
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}
