import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function createAdminAuditLog(input: {
  adminUserId: string;
  targetUserId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  targetType?: string | null;
  metadataJson?: Record<string, unknown> | null;
}) {
  return prisma.adminAuditLog.create({
    data: {
      adminUserId: input.adminUserId,
      targetUserId: input.targetUserId ?? null,
      action: input.action,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      targetType: input.targetType ?? null,
      metadataJson: (input.metadataJson ?? undefined) as Prisma.InputJsonValue,
    },
  });
}

export async function recordWebhookEvent(input: {
  provider: string;
  eventType: string;
  externalId?: string | null;
  status: string;
  payloadJson?: Record<string, unknown> | null;
  errorMessage?: string | null;
}) {
  if (input.externalId) {
    return prisma.webhookEvent.upsert({
      where: { externalId: input.externalId },
      update: {
        status: input.status,
        payloadJson: (input.payloadJson ?? undefined) as Prisma.InputJsonValue,
        errorMessage: input.errorMessage ?? null,
      },
      create: {
        provider: input.provider,
        eventType: input.eventType,
        externalId: input.externalId,
        status: input.status,
        payloadJson: (input.payloadJson ?? undefined) as Prisma.InputJsonValue,
        errorMessage: input.errorMessage ?? null,
      },
    });
  }

  return prisma.webhookEvent.create({
    data: {
      provider: input.provider,
      eventType: input.eventType,
      externalId: null,
      status: input.status,
      payloadJson: (input.payloadJson ?? undefined) as Prisma.InputJsonValue,
      errorMessage: input.errorMessage ?? null,
    },
  });
}

export async function getRecentAdminActivity(limit = 12) {
  return prisma.adminAuditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      adminUser: {
        select: {
          email: true,
          displayName: true,
          role: true,
        },
      },
      targetUser: {
        select: {
          email: true,
          displayName: true,
        },
      },
    },
  });
}