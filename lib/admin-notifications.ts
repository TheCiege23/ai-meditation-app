/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { prisma } from "@/lib/db";
import { getNotificationAnalytics, getRecentNotificationHistory } from "@/lib/notifications";

export async function getAdminNotificationMetrics() {
  const [analytics, history, activeSubscriptionsByPlatform, preferences] = await Promise.all([
    getNotificationAnalytics(),
    getRecentNotificationHistory(30),
    prisma.pushSubscription.groupBy({
      by: ["platform"],
      _count: { platform: true },
      where: { isActive: true },
    }),
    prisma.notificationPreference.findMany(),
  ]);

  return {
    analytics,
    history,
    platformBreakdown: activeSubscriptionsByPlatform.map((item) => ({
      platform: item.platform,
      count: item._count.platform,
    })),
    preferenceDistribution: {
      pushEnabled: preferences.filter((item) => item.enablePush).length,
      dailyReminder: preferences.filter((item) => item.dailyReminder).length,
      sleepReminder: preferences.filter((item) => item.sleepReminder).length,
      horoscopeReminder: preferences.filter((item) => item.horoscopeReminder).length,
    },
  };
}



