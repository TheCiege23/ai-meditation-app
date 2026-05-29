/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { prisma } from "@/lib/db";

export async function getEligibleAudience(campaign: any) {
  const filters = (campaign.audienceFilterJson ?? {}) as Record<string, unknown>;

  const users = await prisma.user.findMany({
    where: {
      ...(campaign.audienceType === "premium" ? { subscription: { is: { tier: "premium" } } } : {}),
      ...(campaign.audienceType === "free" ? { OR: [{ subscription: { is: null } }, { subscription: { is: { tier: "free" } } }] } : {}),
      ...(campaign.audienceType === "inactive"
        ? {
            OR: [
              { apiRequestLogs: { none: { createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14) } } } },
              { pushSubscriptions: { none: { isActive: true } } },
            ],
          }
        : {}),
      ...(filters.timezone ? { profile: { is: { timezone: filters.timezone as string } } } : {}),
      ...(filters.zodiacSign ? { profile: { is: { zodiacSign: filters.zodiacSign as string } } } : {}),
      ...(filters.preferredMood ? { profile: { is: { preferredMood: filters.preferredMood as string } } } : {}),
      ...(filters.missingBirthdate ? { profile: { is: { birthdate: null } } } : {}),
    },
    include: {
      notificationPreference: true,
      pushSubscriptions: { where: { isActive: true } },
      profile: true,
      subscription: true,
    },
    take: 1000,
  });

  return users.filter((user) => user.pushSubscriptions.length > 0);
}




