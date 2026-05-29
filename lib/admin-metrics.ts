/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { prisma } from "@/lib/db";
import { getEntitlements } from "@/lib/entitlements";
import { getDateKey } from "@/lib/usage";
import { ADMIN_CONTENT_SCAFFOLD, maskStripeReference } from "@/lib/admin";
import { getNotificationAnalytics, getRecentNotificationHistory } from "@/lib/notifications";
import { getAdminAlertSummary, getUnresolvedAdminAlerts } from "@/lib/admin-alerts";

function startOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildDateBuckets(days: number) {
  const today = startOfDay(new Date());
  return Array.from({ length: days }, (_, index) => {
    const date = addDays(today, -(days - index - 1));
    return {
      date,
      key: formatDateKey(date),
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });
}

function sumValues(items: Array<number | null | undefined>) {
  return items.reduce((total, value) => total + (value ?? 0), 0);
}

export async function getAdminOverviewMetrics() {
  const today = startOfDay();
  const weekStart = addDays(today, -6);
  const monthStart = addDays(today, -29);
  const todayKey = getDateKey();

  const [
    totalUsers,
    newUsersToday,
    newUsersWeek,
    newUsersMonth,
    activeSubscribers,
    subscriptions,
    todayUsage,
    apiErrorsToday,
    rateLimitHitsToday,
    webhookEventsToday,
    recentAlertsRaw,
    userGrowthRows,
    churnedMonth,
    supportOpen,
    notificationAnalytics,
    alertSummary,
    horoscopeLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: today } } }),
    prisma.user.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.subscription.count({ where: { tier: "premium", status: { in: ["active", "trialing"] } } }),
    prisma.subscription.findMany({ select: { tier: true, status: true, billingInterval: true } }),
    prisma.dailyUsage.aggregate({
      where: { dateKey: todayKey },
      _sum: {
        meditationCount: true,
        speechCount: true,
        horoscopeCount: true,
        breathingCount: true,
        sleepCount: true,
      },
    }),
    prisma.apiRequestLog.count({ where: { createdAt: { gte: today }, statusCode: { gte: 500 } } }),
    prisma.apiRequestLog.count({ where: { createdAt: { gte: today }, statusCode: 429 } }),
    prisma.webhookEvent.count({ where: { createdAt: { gte: today } } }),
    prisma.apiRequestLog.findMany({
      where: {
        createdAt: { gte: addDays(today, -2) },
        OR: [{ statusCode: { gte: 500 } }, { statusCode: 429 }],
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { route: true, statusCode: true, provider: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: monthStart } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.subscription.count({ where: { updatedAt: { gte: monthStart }, status: "canceled" } }),
    prisma.supportTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    getNotificationAnalytics(),
    getAdminAlertSummary(),
    prisma.apiRequestLog.findMany({
      where: { route: "/api/horoscope/daily", createdAt: { gte: addDays(today, -14) } },
      select: { provider: true },
    }),
  ]);

  const freeUsers = subscriptions.filter((item) => item.tier === "free").length;
  const premiumUsers = subscriptions.filter((item) => item.tier === "premium").length;
  const monthlyActive = subscriptions.filter(
    (item) => item.tier === "premium" && item.status === "active" && item.billingInterval === "monthly"
  ).length;
  const yearlyActive = subscriptions.filter(
    (item) => item.tier === "premium" && item.status === "active" && item.billingInterval === "yearly"
  ).length;
  const dau = await prisma.apiRequestLog.groupBy({ by: ["userId"], where: { createdAt: { gte: today }, userId: { not: null } } });
  const wau = await prisma.apiRequestLog.groupBy({ by: ["userId"], where: { createdAt: { gte: weekStart }, userId: { not: null } } });
  const mau = await prisma.apiRequestLog.groupBy({ by: ["userId"], where: { createdAt: { gte: monthStart }, userId: { not: null } } });

  const growthBuckets = buildDateBuckets(30).map((bucket) => ({
    label: bucket.label,
    value: userGrowthRows.filter((row) => formatDateKey(row.createdAt) === bucket.key).length,
  }));

  const cacheHits = horoscopeLogs.filter((item) => String(item.provider ?? "").startsWith("cache:")).length;
  const cacheMisses = horoscopeLogs.filter((item) => String(item.provider ?? "").startsWith("provider:")).length;

  return {
    cards: {
      totalUsers,
      newUsersToday,
      newUsersWeek,
      newUsersMonth,
      dau: dau.length,
      wau: wau.length,
      mau: mau.length,
      activeSubscribers,
      freeUsers,
      premiumUsers,
      meditationToday: todayUsage._sum.meditationCount ?? 0,
      speechToday: todayUsage._sum.speechCount ?? 0,
      horoscopeToday: todayUsage._sum.horoscopeCount ?? 0,
      breathingToday: todayUsage._sum.breathingCount ?? 0,
      sleepToday: todayUsage._sum.sleepCount ?? 0,
      pushSentToday: notificationAnalytics.deliveriesToday,
      pushClickRate: notificationAnalytics.clickRate,
      apiErrorsToday,
      rateLimitHitsToday,
      webhookEventsToday,
      supportOpen,
      unresolvedAlerts: alertSummary.openCount,
      cacheHits,
      cacheMisses,
      monthlyActive,
      yearlyActive,
      churnedMonth,
    },
    userGrowth: growthBuckets,
    recentAlerts: recentAlertsRaw.map((item) => ({
      title: `${item.statusCode} on ${item.route}`,
      description: item.provider ? `Provider: ${item.provider}` : "Application route issue detected.",
      timestamp: item.createdAt.toISOString(),
      tone: item.statusCode >= 500 ? "critical" : "warning",
    })),
  };
}

export async function getAdminUsersData(filters = {}) {
  const todayKey = getDateKey();
  const query = String(filters.query ?? "").trim();

  const users = await prisma.user.findMany({
    where: {
      ...(query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { displayName: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(filters.role && filters.role !== "all" ? { role: filters.role } : {}),
      ...(filters.tier && filters.tier !== "all" ? { subscription: { is: { tier: filters.tier } } } : {}),
      ...(filters.push === "enabled" ? { notificationPreference: { is: { enablePush: true } } } : {}),
      ...(filters.push === "disabled" ? { OR: [{ notificationPreference: { is: null } }, { notificationPreference: { is: { enablePush: false } } }] } : {}),
      ...(filters.zodiacSign ? { profile: { is: { zodiacSign: filters.zodiacSign } } } : {}),
      ...(filters.missingBirthdate ? { profile: { is: { birthdate: null } } } : {}),
    },
    include: {
      profile: true,
      subscription: true,
      featureFlags: true,
      notificationPreference: true,
      pushSubscriptions: { where: { isActive: true } },
      dailyUsages: { where: { dateKey: todayKey }, take: 1 },
      apiRequestLogs: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return users.map((user) => {
    const usage = user.dailyUsages[0];
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscription?.tier ?? "free",
      subscriptionStatus: user.subscription?.status ?? "inactive",
      zodiacSign: user.profile?.zodiacSign ?? "-",
      hasBirthdate: Boolean(user.profile?.birthdate),
      createdAt: user.createdAt.toISOString(),
      lastActiveAt: user.apiRequestLogs[0]?.createdAt?.toISOString() ?? null,
      pushEnabled: Boolean(user.notificationPreference?.enablePush),
      activePlatforms: user.pushSubscriptions.map((item) => item.platform),
      usageSummary: usage
        ? `${usage.meditationCount} med | ${usage.speechCount} voice | ${usage.horoscopeCount} astro | ${usage.breathingCount} breath`
        : "0 med | 0 voice | 0 astro | 0 breath",
      featureFlags: user.featureFlags,
    };
  });
}

export async function getAdminSubscriptionsData(filters = {}) {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      ...(filters.status && filters.status !== "all" ? { status: filters.status } : {}),
      ...(filters.interval && filters.interval !== "all" ? { billingInterval: filters.interval } : {}),
      ...(filters.query
        ? {
            OR: [
              { stripeCustomerId: { contains: filters.query, mode: "insensitive" } },
              { stripeSubscriptionId: { contains: filters.query, mode: "insensitive" } },
              { user: { is: { email: { contains: filters.query, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: {
      user: { select: { email: true, displayName: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return {
    summary: {
      active: subscriptions.filter((item) => item.status === "active").length,
      canceled: subscriptions.filter((item) => item.status === "canceled").length,
      pastDue: subscriptions.filter((item) => item.status === "past_due").length,
      trialing: subscriptions.filter((item) => item.status === "trialing").length,
      monthly: subscriptions.filter((item) => item.billingInterval === "monthly").length,
      yearly: subscriptions.filter((item) => item.billingInterval === "yearly").length,
    },
    rows: subscriptions.map((subscription) => ({
      id: subscription.id,
      email: subscription.user.email,
      displayName: subscription.user.displayName,
      tier: subscription.tier,
      status: subscription.status,
      billingInterval: subscription.billingInterval ?? "-",
      customer: maskStripeReference(subscription.stripeCustomerId),
      subscriptionRef: maskStripeReference(subscription.stripeSubscriptionId),
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      updatedAt: subscription.updatedAt.toISOString(),
    })),
  };
}

export async function getAdminUsageAnalytics() {
  const buckets = buildDateBuckets(14);
  const usageRows = await prisma.dailyUsage.findMany({
    where: { dateKey: { gte: buckets[0]?.key } },
    include: {
      user: { select: { email: true, subscription: { select: { tier: true } } } },
    },
  });

  const requestCounts = await prisma.apiRequestLog.groupBy({
    by: ["route"],
    _count: { route: true },
    where: { createdAt: { gte: addDays(startOfDay(), -14) } },
    orderBy: { _count: { route: "desc" } },
  });

  const rateLimitCounts = await prisma.apiRequestLog.groupBy({
    by: ["route"],
    _count: { route: true },
    where: { createdAt: { gte: addDays(startOfDay(), -14) }, statusCode: 429 },
    orderBy: { _count: { route: "desc" } },
  });

  const dailyTrend = buckets.map((bucket) => {
    const rows = usageRows.filter((row) => row.dateKey === bucket.key);
    return {
      label: bucket.label,
      meditation: sumValues(rows.map((row) => row.meditationCount)),
      speech: sumValues(rows.map((row) => row.speechCount)),
      horoscope: sumValues(rows.map((row) => row.horoscopeCount)),
      breathing: sumValues(rows.map((row) => row.breathingCount)),
      sleep: sumValues(rows.map((row) => row.sleepCount)),
    };
  });

  const usageByUser = new Map();
  for (const row of usageRows) {
    const existing = usageByUser.get(row.userId) ?? {
      email: row.user.email,
      tier: row.user.subscription?.tier ?? "free",
      meditation: 0,
      speech: 0,
      horoscope: 0,
      breathing: 0,
      sleep: 0,
    };
    existing.meditation += row.meditationCount;
    existing.speech += row.speechCount;
    existing.horoscope += row.horoscopeCount;
    existing.breathing += row.breathingCount;
    existing.sleep += row.sleepCount;
    usageByUser.set(row.userId, existing);
  }

  const topUsers = Array.from(usageByUser.entries())
    .map(([userId, value]) => ({ userId, ...value, total: value.meditation + value.speech + value.horoscope + value.breathing + value.sleep }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);

  const freeVsPremium = Array.from(usageByUser.values()).reduce(
    (totals, item) => {
      const key = item.tier === "premium" ? "premium" : "free";
      totals[key] += item.meditation + item.speech + item.horoscope + item.breathing + item.sleep;
      return totals;
    },
    { free: 0, premium: 0 }
  );

  return {
    dailyTrend,
    topUsers,
    freeVsPremium,
    requestCounts: requestCounts.map((item) => ({ route: item.route, count: item._count.route })),
    rateLimitCounts: rateLimitCounts.map((item) => ({ route: item.route, count: item._count.route })),
  };
}

export async function getHoroscopeAdminMetrics() {
  const start = addDays(startOfDay(), -14);
  const logs = await prisma.apiRequestLog.findMany({
    where: { route: "/api/horoscope/daily", createdAt: { gte: start } },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { email: true, profile: { select: { zodiacSign: true } }, subscription: { select: { tier: true } } } },
    },
  });

  const cacheHits = logs.filter((item) => String(item.provider ?? "").startsWith("cache:")).length;
  const cacheMisses = logs.filter((item) => String(item.provider ?? "").startsWith("provider:")).length;
  const providerFailures = logs.filter((item) => item.statusCode >= 500).length;

  return {
    totals: {
      requests: logs.length,
      cacheHits,
      cacheMisses,
      cacheHitRate: logs.length ? Math.round((cacheHits / logs.length) * 100) : 0,
      providerFailures,
      premiumUsage: logs.filter((item) => item.user?.subscription?.tier === "premium").length,
      freeUsage: logs.filter((item) => item.user?.subscription?.tier !== "premium").length,
    },
    dailyTrend: buildDateBuckets(14).map((bucket) => ({
      label: bucket.label,
      count: logs.filter((log) => formatDateKey(log.createdAt) === bucket.key).length,
    })),
    requestsBySign: Object.entries(
      logs.reduce((totals, item) => {
        const sign = item.user?.profile?.zodiacSign ?? "Unknown";
        totals[sign] = (totals[sign] ?? 0) + 1;
        return totals;
      }, {})
    )
      .map(([sign, count]) => ({ sign, count }))
      .sort((a, b) => Number(b.count) - Number(a.count)),
    recentCalls: logs.slice(0, 20).map((item) => ({
      email: item.user?.email ?? "Guest",
      sign: item.user?.profile?.zodiacSign ?? "Unknown",
      tier: item.user?.subscription?.tier ?? "free",
      statusCode: item.statusCode,
      provider: item.provider ?? "-",
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

export async function getSystemHealthMetrics() {
  const since = addDays(startOfDay(), -7);
  const [routeCounts, errorCounts, webhookEvents, rateLimitEvents, recentErrors, alerts] = await Promise.all([
    prisma.apiRequestLog.groupBy({ by: ["route"], _count: { route: true }, where: { createdAt: { gte: since } }, orderBy: { _count: { route: "desc" } } }),
    prisma.apiRequestLog.groupBy({ by: ["route"], _count: { route: true }, where: { createdAt: { gte: since }, statusCode: { gte: 500 } }, orderBy: { _count: { route: "desc" } } }),
    prisma.webhookEvent.findMany({ take: 20, orderBy: { createdAt: "desc" } }),
    prisma.apiRequestLog.findMany({ where: { createdAt: { gte: since }, statusCode: 429 }, take: 20, orderBy: { createdAt: "desc" } }),
    prisma.apiRequestLog.findMany({ where: { createdAt: { gte: since }, statusCode: { gte: 500 } }, take: 20, orderBy: { createdAt: "desc" } }),
    getUnresolvedAdminAlerts(12),
  ]);

  return {
    routeHealth: routeCounts.map((item) => {
      const errors = errorCounts.find((error) => error.route === item.route)?._count.route ?? 0;
      const successRate = item._count.route ? Math.round(((item._count.route - errors) / item._count.route) * 100) : 100;
      return { route: item.route, requests: item._count.route, errors, successRate };
    }),
    webhookEvents: webhookEvents.map((item) => ({ provider: item.provider, eventType: item.eventType, status: item.status, errorMessage: item.errorMessage, createdAt: item.createdAt.toISOString() })),
    rateLimitEvents: rateLimitEvents.map((item) => ({ route: item.route, provider: item.provider, createdAt: item.createdAt.toISOString() })),
    recentErrors: recentErrors.map((item) => ({ route: item.route, provider: item.provider, statusCode: item.statusCode, createdAt: item.createdAt.toISOString() })),
    alerts: alerts.map((item) => ({ level: item.level, title: item.title, message: item.message, createdAt: item.createdAt.toISOString() })),
    environment: {
      database: Boolean(process.env.DATABASE_URL),
      stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
      astro: Boolean(process.env.FREE_ASTRO_API_KEY && process.env.FREE_ASTRO_API_BASE_URL),
      redis: Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
      push: Boolean(process.env.WEB_PUSH_PUBLIC_KEY && process.env.WEB_PUSH_PRIVATE_KEY),
    },
  };
}

export async function getAdminContentData() {
  const [flags, contentEntries] = await Promise.all([
    prisma.featureFlag.findMany({
      include: { user: { select: { id: true, email: true, role: true, subscription: { select: { tier: true } } } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.contentEntry.findMany({ orderBy: { updatedAt: "desc" }, take: 50 }),
  ]);

  return {
    flags: flags.map((flag) => ({
      userId: flag.user.id,
      email: flag.user.email,
      role: flag.user.role,
      tier: flag.user.subscription?.tier ?? "free",
      allowPremiumPreview: flag.allowPremiumPreview,
      allowWeeklyHoroscope: flag.allowWeeklyHoroscope,
      allowAdvancedAstrology: flag.allowAdvancedAstrology,
      updatedAt: flag.updatedAt.toISOString(),
    })),
    caps: { free: getEntitlements("free"), premium: getEntitlements("premium") },
    fallbackContent: ADMIN_CONTENT_SCAFFOLD,
    contentEntries,
  };
}

export async function getAdminLogsData(filters = {}) {
  const apiLogs = await prisma.apiRequestLog.findMany({
    where: {
      ...(filters.route && filters.route !== "all" ? { route: filters.route } : {}),
      ...(filters.status && filters.status !== "all" ? { statusCode: Number(filters.status) } : {}),
      ...(filters.provider && filters.provider !== "all" ? { provider: filters.provider } : {}),
    },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const [webhookEvents, adminActions, deliveries, supportMessages] = await Promise.all([
    prisma.webhookEvent.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 40, include: { adminUser: { select: { email: true } }, targetUser: { select: { email: true } } } }),
    prisma.notificationDelivery.findMany({ orderBy: { createdAt: "desc" }, take: 40, include: { user: { select: { email: true } }, campaign: { select: { title: true } } } }),
    prisma.supportTicketMessage.findMany({ orderBy: { createdAt: "desc" }, take: 40, include: { ticket: { select: { subject: true } }, senderUser: { select: { email: true } } } }),
  ]);

  return {
    apiLogs: apiLogs.map((item) => ({ route: item.route, method: item.method, email: item.user?.email ?? "Guest", statusCode: item.statusCode, provider: item.provider ?? "-", createdAt: item.createdAt.toISOString() })),
    webhookEvents: webhookEvents.map((item) => ({ provider: item.provider, eventType: item.eventType, status: item.status, errorMessage: item.errorMessage, createdAt: item.createdAt.toISOString() })),
    adminActions: adminActions.map((item) => ({ adminEmail: item.adminUser.email, targetEmail: item.targetUser?.email ?? "-", action: item.action, createdAt: item.createdAt.toISOString() })),
    deliveries: deliveries.map((item) => ({ email: item.user.email, title: item.title, status: item.status, campaign: item.campaign?.title ?? "Direct", createdAt: item.createdAt.toISOString() })),
    supportMessages: supportMessages.map((item) => ({ subject: item.ticket.subject, sender: item.senderUser?.email ?? item.senderType, createdAt: item.createdAt.toISOString() })),
  };
}

export async function getNotificationsAdminPageData() {
  const [metrics, history, subscriptions, prefs] = await Promise.all([
    getNotificationAnalytics(),
    getRecentNotificationHistory(40),
    prisma.pushSubscription.groupBy({ by: ["platform"], _count: { platform: true }, where: { isActive: true } }),
    prisma.notificationPreference.findMany(),
  ]);

  const quietHoursEnabled = prefs.filter((item) => item.quietHoursStart && item.quietHoursEnd).length;
  return {
    metrics,
    history,
    subscriptionsByPlatform: subscriptions.map((item) => ({ platform: item.platform, count: item._count.platform })),
    quietHoursEnabled,
    remindersEnabled: {
      daily: prefs.filter((item) => item.dailyReminder).length,
      meditation: prefs.filter((item) => item.meditationReminder).length,
      sleep: prefs.filter((item) => item.sleepReminder).length,
      streak: prefs.filter((item) => item.streakReminder).length,
      horoscope: prefs.filter((item) => item.horoscopeReminder).length,
    },
  };
}

export async function getCampaignsAdminPageData() {
  const campaigns = await prisma.notificationCampaign.findMany({
    include: { deliveries: true, createdByAdmin: { select: { email: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return {
    summary: {
      drafts: campaigns.filter((item) => item.status === "draft").length,
      scheduled: campaigns.filter((item) => item.status === "scheduled").length,
      sending: campaigns.filter((item) => item.status === "sending").length,
      sent: campaigns.filter((item) => item.status === "sent").length,
      failed: campaigns.filter((item) => item.status === "failed").length,
    },
    rows: campaigns.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      audienceType: item.audienceType,
      status: item.status,
      scheduledFor: item.scheduledFor?.toISOString() ?? null,
      sentAt: item.sentAt?.toISOString() ?? null,
      creator: item.createdByAdmin.email,
      deliveries: item.deliveries.length,
      clicked: item.deliveries.filter((delivery) => delivery.status === "clicked").length,
      failed: item.deliveries.filter((delivery) => delivery.status === "failed").length,
    })),
  };
}

export async function getSupportAdminPageData() {
  const [tickets, recentMessages] = await Promise.all([
    prisma.supportTicket.findMany({
      include: {
        user: { select: { email: true } },
        assignedAdmin: { select: { email: true } },
        messages: { take: 1, orderBy: { createdAt: "desc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.supportTicketMessage.findMany({
      include: { ticket: { select: { subject: true } }, senderUser: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return {
    summary: {
      open: tickets.filter((item) => item.status === "open").length,
      inProgress: tickets.filter((item) => item.status === "in_progress").length,
      resolved: tickets.filter((item) => item.status === "resolved").length,
      highPriority: tickets.filter((item) => item.priority === "high").length,
    },
    categoryCounts: Object.entries(
      tickets.reduce((totals, item) => {
        totals[item.category] = (totals[item.category] ?? 0) + 1;
        return totals;
      }, {})
    ).map(([category, count]) => ({ category, count })),
    tickets,
    recentMessages,
  };
}

export async function getReleasesAdminPageData() {
  const [releaseNotes, appVersions] = await Promise.all([
    prisma.releaseNote.findMany({
      include: { createdByAdmin: { select: { email: true } } },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.appVersion.findMany({
      orderBy: [{ platform: "asc" }, { createdAt: "desc" }],
      take: 50,
    }),
  ]);

  return {
    releaseNotes,
    appVersions,
  };
}

export async function getFlagsAdminPageData() {
  const [globalFlags, userFlags] = await Promise.all([
    prisma.featureFlagRule.findMany({ orderBy: { updatedAt: "desc" }, take: 50 }),
    prisma.featureFlag.findMany({ include: { user: { select: { email: true } } }, take: 50, orderBy: { updatedAt: "desc" } }),
  ]);

  return {
    globalFlags,
    userFlags,
  };
}

export async function getModerationAdminPageData() {
  const [providerFailures, abuseSignals] = await Promise.all([
    prisma.apiRequestLog.findMany({
      where: { OR: [{ statusCode: { gte: 500 } }, { provider: { contains: "mock" } }] },
      orderBy: { createdAt: "desc" },
      take: 40,
    }),
    prisma.apiRequestLog.findMany({
      where: { statusCode: 429 },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { user: { select: { email: true } } },
    }),
  ]);

  return {
    providerFailures,
    abuseSignals,
  };
}

export async function getMobileAdminPageData() {
  const [subscriptions, versions, deliveries] = await Promise.all([
    prisma.pushSubscription.groupBy({ by: ["platform"], _count: { platform: true }, where: { isActive: true } }),
    prisma.appVersion.findMany({ where: { platform: { in: ["ios", "android"] } }, orderBy: { createdAt: "desc" } }),
    prisma.notificationDelivery.groupBy({ by: ["platform", "status"], _count: { status: true }, where: { platform: { in: ["ios", "android"] } } }),
  ]);

  return {
    subscriptions,
    versions,
    deliveries,
  };
}

export async function getFinanceAdminPageData() {
  const [subscriptions, failedInvoices, webhookEvents] = await Promise.all([
    prisma.subscription.findMany({ orderBy: { updatedAt: "desc" }, take: 200 }),
    prisma.webhookEvent.count({ where: { provider: "stripe", eventType: "invoice.payment_failed" } }),
    prisma.webhookEvent.findMany({ where: { provider: "stripe" }, orderBy: { createdAt: "desc" }, take: 30 }),
  ]);

  return {
    summary: {
      premiumCount: subscriptions.filter((item) => item.tier === "premium").length,
      monthlyCount: subscriptions.filter((item) => item.billingInterval === "monthly" && item.tier === "premium").length,
      yearlyCount: subscriptions.filter((item) => item.billingInterval === "yearly" && item.tier === "premium").length,
      failedInvoices,
      churned: subscriptions.filter((item) => item.status === "canceled").length,
    },
    webhookEvents,
  };
}



