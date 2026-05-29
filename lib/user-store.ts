/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import type { Prisma } from "@prisma/client";

import {
  isPrismaMissingColumnError,
  isPrismaMissingTableError,
  isPrismaUnavailableError,
  prisma,
} from "@/lib/db";
import type {
  SubscriptionStatus as AppSubscriptionStatus,
  SubscriptionTier as AppSubscriptionTier,
  UserProfileSnapshot,
  UserRole as AppUserRole,
  Viewer,
  AppLanguage,
} from "@/lib/types";

const userWithRelations = {
  profile: true,
  subscription: true,
  featureFlags: true,
} satisfies Prisma.UserInclude;

let warnedMissingApiRequestLogsTable = false;
let warnedPrismaUnavailableForApiRequestLogs = false;
let warnedApiRequestLogsSchemaMismatch = false;

function warnMissingApiRequestLogsTable() {
  if (warnedMissingApiRequestLogsTable) {
    return;
  }

  warnedMissingApiRequestLogsTable = true;
  console.warn("API request log table is missing; request logging is being skipped for now.");
}

function warnPrismaUnavailableForApiRequestLogs() {
  if (warnedPrismaUnavailableForApiRequestLogs) {
    return;
  }

  warnedPrismaUnavailableForApiRequestLogs = true;
  console.warn("Primary Prisma database is unavailable; request logging is being skipped for now.");
}

function warnApiRequestLogsSchemaMismatch() {
  if (warnedApiRequestLogsSchemaMismatch) {
    return;
  }

  warnedApiRequestLogsSchemaMismatch = true;
  console.warn("API request log schema is out of date; request logging is being skipped for now.");
}

type UserWithRelations = Prisma.UserGetPayload<{
  include: typeof userWithRelations;
}>;

function deriveDisplayName(user: UserWithRelations) {
  return (
    user.displayName ??
    user.profile?.fullName ??
    user.email.split("@")[0] ??
    "ChimAura Member"
  );
}

function deriveViewerRole(user: Pick<UserWithRelations, "role" | "isAdmin">): AppUserRole {
  if (user.role && user.role !== "user") {
    return user.role as AppUserRole;
  }

  return user.isAdmin ? "admin" : "user";
}

export function mapUserToViewer(user: UserWithRelations): Viewer {
  const role = deriveViewerRole(user);

  return {
    userId: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
    displayName: deriveDisplayName(user),
    isGuest: false,
    isAdmin: role !== "user",
    role,
    subscriptionTier: (user.subscription?.tier ?? "free") as AppSubscriptionTier,
    subscriptionStatus: (user.subscription?.status ?? "inactive") as AppSubscriptionStatus,
    currentPeriodEnd: user.subscription?.currentPeriodEnd?.toISOString() ?? null,
    stripeCustomerId: user.subscription?.stripeCustomerId ?? null,
    stripeSubscriptionId: user.subscription?.stripeSubscriptionId ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export function getGuestViewer(): Viewer {
  return {
    userId: null,
    email: null,
    emailVerified: false,
    phoneNumber: null,
    phoneVerified: false,
    displayName: "Guest",
    isGuest: true,
    isAdmin: false,
    role: "user",
    subscriptionTier: "free",
    subscriptionStatus: "inactive",
    currentPeriodEnd: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: null,
  };
}

export async function getUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: userWithRelations,
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: userWithRelations,
  });
}

export async function createUserAccount(input: {
  email: string;
  passwordHash: string;
  displayName: string;
}) {
  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash: input.passwordHash,
        displayName,
        isAdmin: false,
        role: "user",
        profile: {
          create: {
            fullName: displayName,
          },
        },
        subscription: {
          create: {
            tier: "free",
            status: "inactive",
          },
        },
      },
      include: userWithRelations,
    });

    return user;
  });
}

export async function updateUserRole(userId: string, role: AppUserRole) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      role,
      isAdmin: role !== "user",
    },
    include: userWithRelations,
  });
}

export async function getUserSubscription(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
  });
}

export async function getUserProfile(userId: string) {
  return prisma.profile.findUnique({
    where: { userId },
  });
}

export async function getUserProfileSnapshot(userId: string): Promise<UserProfileSnapshot | null> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
  });

  if (!profile) {
    return null;
  }

  return {
    fullName: profile.fullName,
    birthdate: profile.birthdate?.toISOString() ?? null,
    zodiacSign: profile.zodiacSign,
    birthTime: profile.birthTime,
    birthLocation: profile.birthLocation,
    latitude: profile.latitude,
    longitude: profile.longitude,
    timezone: profile.timezone,
    preferredMood: profile.preferredMood,
    preferredLanguage: (profile.preferredLanguage as AppLanguage | null) ?? null,
  };
}

export async function upsertUserProfile(input: {
  userId: string;
  fullName?: string | null;
  birthdate?: Date | string | null;
  zodiacSign?: string | null;
  birthTime?: string | null;
  birthLocation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
  preferredMood?: string | null;
   preferredLanguage?: AppLanguage | null;
}) {
  return prisma.profile.upsert({
    where: { userId: input.userId },
    update: {
      fullName: input.fullName ?? undefined,
      birthdate: input.birthdate ? new Date(input.birthdate) : input.birthdate === null ? null : undefined,
      zodiacSign: input.zodiacSign ?? undefined,
      birthTime: input.birthTime ?? undefined,
      birthLocation: input.birthLocation ?? undefined,
      latitude: input.latitude ?? undefined,
      longitude: input.longitude ?? undefined,
      timezone: input.timezone ?? undefined,
      preferredMood: input.preferredMood ?? undefined,
      preferredLanguage: input.preferredLanguage ?? undefined,
    },
    create: {
      userId: input.userId,
      fullName: input.fullName ?? null,
      birthdate: input.birthdate ? new Date(input.birthdate) : null,
      zodiacSign: input.zodiacSign ?? null,
      birthTime: input.birthTime ?? null,
      birthLocation: input.birthLocation ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      timezone: input.timezone ?? null,
      preferredMood: input.preferredMood ?? null,
      preferredLanguage: input.preferredLanguage ?? "en",
    },
  });
}

export async function upsertUserSubscription(input: {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  tier: AppSubscriptionTier;
  status: AppSubscriptionStatus;
  billingInterval?: string | null;
  currentPeriodEnd?: string | Date | null;
}) {
  return prisma.subscription.upsert({
    where: { userId: input.userId },
    update: {
      stripeCustomerId: input.stripeCustomerId ?? undefined,
      stripeSubscriptionId: input.stripeSubscriptionId ?? undefined,
      tier: input.tier,
      status: input.status,
      billingInterval: input.billingInterval ?? undefined,
      currentPeriodEnd: input.currentPeriodEnd
        ? new Date(input.currentPeriodEnd)
        : null,
    },
    create: {
      userId: input.userId,
      stripeCustomerId: input.stripeCustomerId ?? null,
      stripeSubscriptionId: input.stripeSubscriptionId ?? null,
      tier: input.tier,
      status: input.status,
      billingInterval: input.billingInterval ?? null,
      currentPeriodEnd: input.currentPeriodEnd
        ? new Date(input.currentPeriodEnd)
        : null,
    },
  });
}

export async function findUserByStripeCustomerId(stripeCustomerId: string) {
  return prisma.user.findFirst({
    where: {
      subscription: {
        stripeCustomerId,
      },
    },
    include: userWithRelations,
  });
}

export async function updateSubscriptionByStripeCustomerId(input: {
  stripeCustomerId: string;
  stripeSubscriptionId?: string | null;
  tier: AppSubscriptionTier;
  status: AppSubscriptionStatus;
  billingInterval?: string | null;
  currentPeriodEnd?: string | Date | null;
}) {
  const user = await findUserByStripeCustomerId(input.stripeCustomerId);
  if (!user) {
    return null;
  }

  await upsertUserSubscription({
    userId: user.id,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    tier: input.tier,
    status: input.status,
    billingInterval: input.billingInterval ?? null,
    currentPeriodEnd: input.currentPeriodEnd ?? null,
  });

  return getUserById(user.id);
}

export async function createAuthSessionRecord(input: {
  userId: string;
  sessionToken: string;
  expiresAt: Date;
}) {
  return prisma.authSession.create({
    data: input,
  });
}

export async function getAuthSessionByToken(sessionToken: string) {
  return prisma.authSession.findUnique({
    where: { sessionToken },
    include: {
      user: {
        include: userWithRelations,
      },
    },
  });
}

export async function deleteAuthSessionRecord(sessionToken: string) {
  return prisma.authSession.deleteMany({
    where: { sessionToken },
  });
}

export async function deleteExpiredAuthSessions() {
  return prisma.authSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}

export async function logApiRequest(input: {
  userId?: string | null;
  route: string;
  method: string;
  ipHash: string;
  userAgent?: string | null;
  statusCode: number;
  provider?: string | null;
}) {
  try {
    return await prisma.apiRequestLog.create({
      data: {
        userId: input.userId ?? null,
        route: input.route,
        method: input.method,
        ipHash: input.ipHash,
        userAgent: input.userAgent ?? null,
        statusCode: input.statusCode,
        provider: input.provider ?? null,
      },
    });
  } catch (error) {
    if (isPrismaMissingTableError(error, "api_request_logs")) {
      warnMissingApiRequestLogsTable();
      return null;
    }

    if (isPrismaMissingColumnError(error, "api_request_logs", "platform")) {
      warnApiRequestLogsSchemaMismatch();
      return null;
    }

    if (isPrismaUnavailableError(error)) {
      warnPrismaUnavailableForApiRequestLogs();
      return null;
    }

    throw error;
  }
}

export async function getUsageAdminSnapshot(dateKey: string) {
  const rows = await prisma.dailyUsage.findMany({
    where: { dateKey },
    select: {
      userId: true,
      meditationCount: true,
      speechCount: true,
      horoscopeCount: true,
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: [
      { meditationCount: "desc" },
      { speechCount: "desc" },
      { horoscopeCount: "desc" },
    ],
  });

  return rows.map((row) => ({
    userId: row.userId,
    email: row.user.email,
    meditationCount: row.meditationCount,
    speechCount: row.speechCount,
    horoscopeCount: row.horoscopeCount,
  }));
}




