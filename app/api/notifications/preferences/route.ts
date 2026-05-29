import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function normalizeTime(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return /^\d{2}:\d{2}$/.test(trimmed) ? trimmed : null;
}

function normalizeTimezone(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in first.", 401);
  }

  const preference = await prisma.notificationPreference.findUnique({
    where: { userId: viewer.userId },
  });

  return NextResponse.json({
    preferences: {
      enablePush: preference?.enablePush ?? false,
      dailyReminder: preference?.dailyReminder ?? true,
      meditationReminder: preference?.meditationReminder ?? true,
      sleepReminder: preference?.sleepReminder ?? true,
      streakReminder: preference?.streakReminder ?? true,
      horoscopeReminder: preference?.horoscopeReminder ?? true,
      billingAlerts: preference?.billingAlerts ?? true,
      productAnnouncements: preference?.productAnnouncements ?? true,
      adminBroadcasts: preference?.adminBroadcasts ?? true,
      quietHoursStart: preference?.quietHoursStart ?? null,
      quietHoursEnd: preference?.quietHoursEnd ?? null,
      timezone: preference?.timezone ?? "America/New_York",

      breathingReminderEnabled: preference?.breathingReminderEnabled ?? false,
      breathingReminderTime: preference?.breathingReminderTime ?? "08:00",
      meditationReminderEnabled: preference?.meditationReminderEnabled ?? false,
      meditationReminderTime: preference?.meditationReminderTime ?? "12:00",
      sleepReminderEnabled: preference?.sleepReminderEnabled ?? false,
      sleepReminderTime: preference?.sleepReminderTime ?? "21:00",
      horoscopeReminderEnabled: preference?.horoscopeReminderEnabled ?? false,
      horoscopeReminderTime: preference?.horoscopeReminderTime ?? "09:00",
      bibleVerseReminderEnabled: preference?.bibleVerseReminderEnabled ?? false,
      bibleVerseReminderTime: preference?.bibleVerseReminderTime ?? "07:30",
    },
  });
}

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in first.", 401);
  }

  const body = await req.json();

  const preference = await prisma.notificationPreference.upsert({
    where: { userId: viewer.userId },
    update: {
      enablePush: Boolean(body?.enablePush),
      dailyReminder: body?.dailyReminder !== false,
      meditationReminder: body?.meditationReminder !== false,
      sleepReminder: body?.sleepReminder !== false,
      streakReminder: body?.streakReminder !== false,
      horoscopeReminder: body?.horoscopeReminder !== false,
      billingAlerts: body?.billingAlerts !== false,
      productAnnouncements: body?.productAnnouncements !== false,
      adminBroadcasts: body?.adminBroadcasts !== false,
      quietHoursStart: normalizeTime(body?.quietHoursStart),
      quietHoursEnd: normalizeTime(body?.quietHoursEnd),
      timezone: normalizeTimezone(body?.timezone),

      breathingReminderEnabled: Boolean(body?.breathingReminderEnabled),
      breathingReminderTime: normalizeTime(body?.breathingReminderTime),
      meditationReminderEnabled: Boolean(body?.meditationReminderEnabled),
      meditationReminderTime: normalizeTime(body?.meditationReminderTime),
      sleepReminderEnabled: Boolean(body?.sleepReminderEnabled),
      sleepReminderTime: normalizeTime(body?.sleepReminderTime),
      horoscopeReminderEnabled: Boolean(body?.horoscopeReminderEnabled),
      horoscopeReminderTime: normalizeTime(body?.horoscopeReminderTime),
      bibleVerseReminderEnabled: Boolean(body?.bibleVerseReminderEnabled),
      bibleVerseReminderTime: normalizeTime(body?.bibleVerseReminderTime),
    },
    create: {
      userId: viewer.userId,
      enablePush: Boolean(body?.enablePush),
      dailyReminder: body?.dailyReminder !== false,
      meditationReminder: body?.meditationReminder !== false,
      sleepReminder: body?.sleepReminder !== false,
      streakReminder: body?.streakReminder !== false,
      horoscopeReminder: body?.horoscopeReminder !== false,
      billingAlerts: body?.billingAlerts !== false,
      productAnnouncements: body?.productAnnouncements !== false,
      adminBroadcasts: body?.adminBroadcasts !== false,
      quietHoursStart: normalizeTime(body?.quietHoursStart),
      quietHoursEnd: normalizeTime(body?.quietHoursEnd),
      timezone: normalizeTimezone(body?.timezone),

      breathingReminderEnabled: Boolean(body?.breathingReminderEnabled),
      breathingReminderTime: normalizeTime(body?.breathingReminderTime),
      meditationReminderEnabled: Boolean(body?.meditationReminderEnabled),
      meditationReminderTime: normalizeTime(body?.meditationReminderTime),
      sleepReminderEnabled: Boolean(body?.sleepReminderEnabled),
      sleepReminderTime: normalizeTime(body?.sleepReminderTime),
      horoscopeReminderEnabled: Boolean(body?.horoscopeReminderEnabled),
      horoscopeReminderTime: normalizeTime(body?.horoscopeReminderTime),
      bibleVerseReminderEnabled: Boolean(body?.bibleVerseReminderEnabled),
      bibleVerseReminderTime: normalizeTime(body?.bibleVerseReminderTime),
    },
  });

  return NextResponse.json({ preferences: preference });
}
