/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { prisma } from "@/lib/db";
import { getDateKey } from "@/lib/usage";
import { getEligibleAudience } from "@/lib/notification-audience";
import { getWebPushPublicKey, sendWebPush } from "@/lib/push";

export function buildDefaultNotificationPreferences() {
  return {
    enablePush: false,
    dailyReminder: true,
    meditationReminder: true,
    sleepReminder: true,
    streakReminder: true,
    horoscopeReminder: true,
    billingAlerts: true,
    productAnnouncements: true,
    adminBroadcasts: true,
    quietHoursStart: null,
    quietHoursEnd: null,
    timezone: null,
  };
}

export async function registerPushSubscription(userId: string, payload: {
  platform: "web" | "ios" | "android";
  endpoint: string;
  p256dh: string;
  auth: string;
  deviceLabel?: string | null;
  appVersion?: string | null;
}) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: payload.endpoint },
    update: {
      userId,
      platform: payload.platform,
      p256dh: payload.p256dh,
      auth: payload.auth,
      deviceLabel: payload.deviceLabel ?? null,
      appVersion: payload.appVersion ?? null,
      isActive: true,
      lastSeenAt: new Date(),
    },
    create: {
      userId,
      platform: payload.platform,
      endpoint: payload.endpoint,
      p256dh: payload.p256dh,
      auth: payload.auth,
      deviceLabel: payload.deviceLabel ?? null,
      appVersion: payload.appVersion ?? null,
      isActive: true,
      lastSeenAt: new Date(),
    },
  });
}

export async function getNotificationPreferences(userId: string) {
  const prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  return prefs ?? buildDefaultNotificationPreferences();
}

export async function updateNotificationPreferences(userId: string, prefs: Record<string, unknown>) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    update: {
      enablePush: Boolean(prefs.enablePush),
      dailyReminder: prefs.dailyReminder !== false,
      meditationReminder: prefs.meditationReminder !== false,
      sleepReminder: prefs.sleepReminder !== false,
      streakReminder: prefs.streakReminder !== false,
      horoscopeReminder: prefs.horoscopeReminder !== false,
      billingAlerts: prefs.billingAlerts !== false,
      productAnnouncements: prefs.productAnnouncements !== false,
      adminBroadcasts: prefs.adminBroadcasts !== false,
      quietHoursStart: typeof prefs.quietHoursStart === "string" ? prefs.quietHoursStart : null,
      quietHoursEnd: typeof prefs.quietHoursEnd === "string" ? prefs.quietHoursEnd : null,
      timezone: typeof prefs.timezone === "string" ? prefs.timezone : null,
    },
    create: {
      userId,
      enablePush: Boolean(prefs.enablePush),
      dailyReminder: prefs.dailyReminder !== false,
      meditationReminder: prefs.meditationReminder !== false,
      sleepReminder: prefs.sleepReminder !== false,
      streakReminder: prefs.streakReminder !== false,
      horoscopeReminder: prefs.horoscopeReminder !== false,
      billingAlerts: prefs.billingAlerts !== false,
      productAnnouncements: prefs.productAnnouncements !== false,
      adminBroadcasts: prefs.adminBroadcasts !== false,
      quietHoursStart: typeof prefs.quietHoursStart === "string" ? prefs.quietHoursStart : null,
      quietHoursEnd: typeof prefs.quietHoursEnd === "string" ? prefs.quietHoursEnd : null,
      timezone: typeof prefs.timezone === "string" ? prefs.timezone : null,
    },
  });
}

export function respectQuietHours(preferences: any, now = new Date()) {
  if (!preferences?.quietHoursStart || !preferences?.quietHoursEnd) {
    return true;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMinute] = String(preferences.quietHoursStart).split(":").map(Number);
  const [endHour, endMinute] = String(preferences.quietHoursEnd).split(":").map(Number);
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return true;
  }

  if (start <= end) {
    return !(currentMinutes >= start && currentMinutes <= end);
  }

  return !(currentMinutes >= start || currentMinutes <= end);
}

export async function logNotificationDelivery(input: {
  campaignId?: string | null;
  userId: string;
  pushSubscriptionId?: string | null;
  platform: "web" | "ios" | "android" | "all";
  title: string;
  message: string;
  status: "queued" | "sent" | "failed" | "clicked" | "dismissed";
  errorMessage?: string | null;
  deliveredAt?: Date | null;
  clickedAt?: Date | null;
  metadataJson?: Record<string, unknown> | null;
}) {
  return prisma.notificationDelivery.create({
    data: {
      campaignId: input.campaignId ?? null,
      userId: input.userId,
      pushSubscriptionId: input.pushSubscriptionId ?? null,
      platform: input.platform,
      title: input.title,
      message: input.message,
      status: input.status,
      errorMessage: input.errorMessage ?? null,
      deliveredAt: input.deliveredAt ?? null,
      clickedAt: input.clickedAt ?? null,
      metadataJson: input.metadataJson ?? undefined,
    },
  });
}

export async function markNotificationClicked(deliveryId: string) {
  return prisma.notificationDelivery.update({
    where: { id: deliveryId },
    data: {
      status: "clicked",
      clickedAt: new Date(),
    },
  });
}

export async function sendPushToUser(userId: string, payload: {
  title: string;
  message: string;
  campaignId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const [preferences, subscriptions] = await Promise.all([
    getNotificationPreferences(userId),
    prisma.pushSubscription.findMany({
      where: { userId, isActive: true },
    }),
  ]);

  if (!preferences.enablePush) {
    return [];
  }

  if (!respectQuietHours(preferences)) {
    return [];
  }

  const results = [];
  for (const subscription of subscriptions) {
    const result = await sendWebPush(
      {
        endpoint: subscription.endpoint,
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
      {
        title: payload.title,
        body: payload.message,
        data: payload.metadata ?? {},
      }
    );

    if (!result.success) {
      await prisma.pushSubscription.update({
        where: { id: subscription.id },
        data: { isActive: false },
      }).catch(() => null);
    }

    const delivery = await logNotificationDelivery({
      campaignId: payload.campaignId ?? null,
      userId,
      pushSubscriptionId: subscription.id,
      platform: subscription.platform,
      title: payload.title,
      message: payload.message,
      status: result.success ? "sent" : "failed",
      errorMessage: result.success ? null : result.error,
      deliveredAt: result.success ? new Date() : null,
      metadataJson: payload.metadata ?? null,
    });

    await prisma.notificationEvent.create({
      data: {
        userId,
        type: payload.metadata?.type ? String(payload.metadata.type) : "push",
        title: payload.title,
        message: payload.message,
        status: "unread",
        metadataJson: {
          deliveryId: delivery.id,
          ...(payload.metadata ?? {}),
        },
      },
    });

    results.push({ subscriptionId: subscription.id, result, deliveryId: delivery.id });
  }

  return results;
}

export async function sendPushToAudience(audienceConfig: Record<string, unknown>, payload: {
  title: string;
  message: string;
  campaignId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const campaign = {
    audienceType: audienceConfig.audienceType ?? "all",
    audienceFilterJson: audienceConfig.audienceFilterJson ?? {},
  };
  const users = await getEligibleAudience(campaign);
  const results = [];

  for (const user of users) {
    const deliveries = await sendPushToUser(user.id, payload);
    results.push({ userId: user.id, deliveries });
  }

  return results;
}

export async function createNotificationCampaign(input: {
  title: string;
  message: string;
  type: string;
  audienceType: "all" | "premium" | "free" | "inactive" | "custom";
  audienceFilterJson?: Record<string, unknown> | null;
  scheduledFor?: string | Date | null;
  status?: "draft" | "scheduled" | "sending" | "sent" | "failed" | "canceled";
  createdByAdminId: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  platform?: "web" | "ios" | "android" | "all";
}) {
  return prisma.notificationCampaign.create({
    data: {
      title: input.title,
      message: input.message,
      type: input.type,
      audienceType: input.audienceType,
      audienceFilterJson: input.audienceFilterJson ?? undefined,
      scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
      status: input.status ?? (input.scheduledFor ? "scheduled" : "draft"),
      createdByAdminId: input.createdByAdminId,
      ctaLabel: input.ctaLabel ?? null,
      ctaUrl: input.ctaUrl ?? null,
      platform: input.platform ?? "all",
    },
  });
}

export async function updateNotificationCampaign(campaignId: string, input: Record<string, unknown>) {
  return prisma.notificationCampaign.update({
    where: { id: campaignId },
    data: {
      title: typeof input.title === "string" ? input.title : undefined,
      message: typeof input.message === "string" ? input.message : undefined,
      type: typeof input.type === "string" ? input.type : undefined,
      audienceType: typeof input.audienceType === "string" ? input.audienceType : undefined,
      audienceFilterJson: typeof input.audienceFilterJson === "object" ? input.audienceFilterJson : undefined,
      scheduledFor: input.scheduledFor ? new Date(String(input.scheduledFor)) : undefined,
      status: typeof input.status === "string" ? input.status : undefined,
      ctaLabel: typeof input.ctaLabel === "string" ? input.ctaLabel : undefined,
      ctaUrl: typeof input.ctaUrl === "string" ? input.ctaUrl : undefined,
      platform: typeof input.platform === "string" ? input.platform : undefined,
    },
  });
}

export async function sendCampaign(campaignId: string) {
  const campaign = await prisma.notificationCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  if (campaign.status === "sending" || campaign.status === "sent") {
    throw new Error("Campaign has already been processed.");
  }

  await prisma.notificationCampaign.update({
    where: { id: campaignId },
    data: { status: "sending" },
  });

  try {
    const deliveries = await sendPushToAudience(
      {
        audienceType: campaign.audienceType,
        audienceFilterJson: campaign.audienceFilterJson ?? {},
      },
      {
        title: campaign.title,
        message: campaign.message,
        campaignId: campaign.id,
        metadata: {
          ctaLabel: campaign.ctaLabel,
          ctaUrl: campaign.ctaUrl,
          type: campaign.type,
        },
      }
    );

    await prisma.notificationCampaign.update({
      where: { id: campaignId },
      data: {
        status: "sent",
        sentAt: new Date(),
      },
    });

    return deliveries;
  } catch (error) {
    await prisma.notificationCampaign.update({
      where: { id: campaignId },
      data: { status: "failed" },
    });
    throw error;
  }
}

export async function getRecentNotificationHistory(limit = 25) {
  return prisma.notificationDelivery.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
      campaign: { select: { title: true, type: true } },
    },
  });
}

export async function getNotificationAnalytics() {
  const todayKey = getDateKey();
  const todayStart = new Date(`${todayKey}T00:00:00.000Z`);
  const [
    activeSubscriptions,
    pushEnabledUsers,
    deliveriesToday,
    clickedToday,
    failedToday,
    campaigns,
  ] = await Promise.all([
    prisma.pushSubscription.count({ where: { isActive: true } }),
    prisma.notificationPreference.count({ where: { enablePush: true } }),
    prisma.notificationDelivery.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.notificationDelivery.count({ where: { clickedAt: { gte: todayStart } } }),
    prisma.notificationDelivery.count({ where: { createdAt: { gte: todayStart }, status: "failed" } }),
    prisma.notificationCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  return {
    activeSubscriptions,
    pushEnabledUsers,
    deliveriesToday,
    clickedToday,
    failedToday,
    clickRate: deliveriesToday ? Math.round((clickedToday / deliveriesToday) * 100) : 0,
    campaigns,
  };
}

export function getPushPublicConfig() {
  return {
    publicKey: getWebPushPublicKey(),
    configured: Boolean(getWebPushPublicKey()),
  };
}




