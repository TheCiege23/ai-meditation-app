/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { prisma } from "@/lib/db";

export async function createAdminAlert(input: {
  level: "info" | "warning" | "critical";
  type: string;
  title: string;
  message: string;
}) {
  return prisma.adminAlert.create({
    data: input,
  });
}

export async function resolveAdminAlert(alertId: string, adminUserId: string) {
  return prisma.adminAlert.update({
    where: { id: alertId },
    data: {
      isResolved: true,
      resolvedByAdminId: adminUserId,
      resolvedAt: new Date(),
    },
  });
}

export async function getUnresolvedAdminAlerts(limit = 10) {
  return prisma.adminAlert.findMany({
    where: { isResolved: false },
    take: limit,
    orderBy: [{ level: "desc" }, { createdAt: "desc" }],
  });
}

export async function getAdminAlertSummary() {
  const [openCount, warningCount, criticalCount] = await Promise.all([
    prisma.adminAlert.count({ where: { isResolved: false } }),
    prisma.adminAlert.count({ where: { isResolved: false, level: "warning" } }),
    prisma.adminAlert.count({ where: { isResolved: false, level: "critical" } }),
  ]);

  return {
    openCount,
    warningCount,
    criticalCount,
  };
}



