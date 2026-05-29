/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import AdminHeader from "@/components/admin/AdminHeader";
import AlertBanner from "@/components/admin/AlertBanner";
import ChartCard from "@/components/admin/ChartCard";
import RecentActivityCard from "@/components/admin/RecentActivityCard";
import StatCard from "@/components/admin/StatCard";
import UsageTrendChart from "@/components/admin/UsageTrendChart";
import { requireAdminViewer } from "@/lib/admin-auth";
import { getAdminOverviewMetrics } from "@/lib/admin-metrics";

export default async function AdminOverviewPage() {
  const viewer = await requireAdminViewer();
  const overview = await getAdminOverviewMetrics();

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Overview"
        description="A high-level view of ChimAura's growth, subscription health, push engagement, support load, and operational risk signals across web and future app surfaces."
        viewer={viewer}
      />

      {overview.cards.unresolvedAlerts > 0 ? (
        <AlertBanner
          level="warning"
          title="Operator attention needed"
          message={`${overview.cards.unresolvedAlerts} admin alerts are still unresolved. Review system, billing, or provider health before the next campaign push.`}
        />
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={overview.cards.totalUsers} hint={`${overview.cards.newUsersMonth} new this month`} />
        <StatCard label="DAU / WAU / MAU" value={`${overview.cards.dau} / ${overview.cards.wau} / ${overview.cards.mau}`} hint="Active authenticated users" />
        <StatCard label="Active subscribers" value={overview.cards.activeSubscribers} hint={`${overview.cards.monthlyActive} monthly | ${overview.cards.yearlyActive} yearly`} tone="success" />
        <StatCard label="Push sent today" value={overview.cards.pushSentToday} hint={`${overview.cards.pushClickRate}% click rate`} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Meditations today" value={overview.cards.meditationToday} hint={`${overview.cards.speechToday} speech | ${overview.cards.horoscopeToday} horoscope`} />
        <StatCard label="Breathing / Sleep" value={`${overview.cards.breathingToday} / ${overview.cards.sleepToday}`} hint="Daily usage events" />
        <StatCard label="Support open" value={overview.cards.supportOpen} tone={overview.cards.supportOpen > 0 ? "warning" : "default"} />
        <StatCard label="API issues today" value={overview.cards.apiErrorsToday} hint={`${overview.cards.rateLimitHitsToday} rate-limit hits`} tone={overview.cards.apiErrorsToday > 0 ? "critical" : "default"} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <ChartCard title="User growth" description="New account creation across the last 30 days.">
          <UsageTrendChart data={overview.userGrowth} primaryLabel="New users" />
        </ChartCard>
        <RecentActivityCard title="Recent alerts" items={overview.recentAlerts} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Free users" value={overview.cards.freeUsers} />
        <StatCard label="Premium users" value={overview.cards.premiumUsers} tone="success" />
        <StatCard label="Webhook events today" value={overview.cards.webhookEventsToday} />
        <StatCard label="Horoscope cache" value={`${overview.cards.cacheHits} / ${overview.cards.cacheMisses}`} hint="Hits / misses" />
        <StatCard label="Churn this month" value={overview.cards.churnedMonth} tone={overview.cards.churnedMonth > 0 ? "warning" : "default"} />
      </section>
    </div>
  );
}



