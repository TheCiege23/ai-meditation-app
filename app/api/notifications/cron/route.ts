import { NextResponse } from "next/server";
import { Resend } from "resend";

import { prisma } from "@/lib/db";
import { getRandomInspiration } from "@/lib/inspiration";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

type ReminderKind =
  | "breathing"
  | "meditation"
  | "sleep"
  | "horoscope"
  | "bible_verse";

type NotificationPreferenceWithUser = {
  userId: string;
  timezone: string | null;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  breathingReminderEnabled: boolean;
  breathingReminderTime: string | null;
  meditationReminderEnabled: boolean;
  meditationReminderTime: string | null;
  sleepReminderEnabled: boolean;
  sleepReminderTime: string | null;
  horoscopeReminderEnabled: boolean;
  horoscopeReminderTime: string | null;
  bibleVerseReminderEnabled: boolean;
  bibleVerseReminderTime: string | null;
  user: {
    email: string | null;
    profile: {
      timezone: string | null;
      preferredLanguage: string | null;
    } | null;
  };
};

function getLocalParts(timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    currentTime: `${get("hour")}:${get("minute")}`,
  };
}

function isWithinQuietHours(
  currentTime: string,
  quietStart: string | null,
  quietEnd: string | null
) {
  if (!quietStart || !quietEnd) return false;

  if (quietStart < quietEnd) {
    return currentTime >= quietStart && currentTime < quietEnd;
  }

  return currentTime >= quietStart || currentTime < quietEnd;
}

function buildReminder(kind: ReminderKind, language: "en" | "es") {
  if (kind === "breathing") {
    return language === "es"
      ? {
          title: "Hora de respirar",
          message: "Tómate un minuto para una respiración guiada y vuelve a tu centro.",
          ctaUrl: "/meditation?mode=breathing",
        }
      : {
          title: "Time to breathe",
          message: "Take one minute for a guided breath and come back to center.",
          ctaUrl: "/meditation?mode=breathing",
        };
  }

  if (kind === "meditation") {
    return language === "es"
      ? {
          title: "Momento de meditar",
          message: "Tu sesión tranquila de ChimAura está lista cuando quieras bajar el ritmo.",
          ctaUrl: "/meditation?mode=meditation",
        }
      : {
          title: "Meditation moment",
          message: "Your calm ChimAura session is ready whenever you want to slow down.",
          ctaUrl: "/meditation?mode=meditation",
        };
  }

  if (kind === "sleep") {
    return language === "es"
      ? {
          title: "Hora de descansar",
          message: "Prepara tu mente para dormir con una sesión suave de noche.",
          ctaUrl: "/meditation?mode=meditation&meditationType=sleep",
        }
      : {
          title: "Time to wind down",
          message: "Settle into sleep with a softer evening session.",
          ctaUrl: "/meditation?mode=meditation&meditationType=sleep",
        };
  }

  if (kind === "horoscope") {
    return language === "es"
      ? {
          title: "Tu horóscopo diario te espera",
          message: "Revisa tu reflexión cósmica y alinea tu día con más calma.",
          ctaUrl: "/horoscope",
        }
      : {
          title: "Your daily horoscope is ready",
          message: "Check your cosmic reflection and move through the day with more calm.",
          ctaUrl: "/horoscope",
        };
  }

  const verse = getRandomInspiration({
    language,
    category: "bible_proverb",
  });

  return language === "es"
    ? {
        title: "Versículo del día",
        message: verse?.reference
          ? `${verse.text} — ${verse.reference}`
          : verse?.text ?? "Recibe una palabra suave para comenzar tu día con fe.",
        ctaUrl: "/",
      }
    : {
        title: "Verse of the day",
        message: verse?.reference
          ? `${verse.text} — ${verse.reference}`
          : verse?.text ?? "Receive a gentle word to begin your day with faith.",
        ctaUrl: "/",
      };
}

async function sendReminderEmail(input: {
  to: string;
  title: string;
  message: string;
  ctaUrl: string;
}) {
  if (!resend || !process.env.RESEND_FROM_EMAIL) return;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to: input.to,
    subject: input.title,
    html: `
      <div style="font-family:Arial,sans-serif;padding:24px;background:#f8fafc;color:#0f172a">
        <h2 style="margin-bottom:12px;">${input.title}</h2>
        <p style="font-size:16px;line-height:1.6;margin-bottom:20px;">${input.message}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}${input.ctaUrl}"
           style="display:inline-block;padding:12px 18px;border-radius:9999px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:600;">
          Open ChimAura
        </a>
      </div>
    `,
  });
}

export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = process.env.NOTIFICATION_CRON_SECRET;

  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const rawPreferences = await prisma.notificationPreference.findMany({
    include: {
      user: {
        include: {
          profile: true,
        },
      },
    },
  });

  const preferencesUnknown: unknown = rawPreferences;
  const preferences = preferencesUnknown as NotificationPreferenceWithUser[];

  let dispatched = 0;

  for (const rawPreference of preferences) {
    const preference = rawPreference as NotificationPreferenceWithUser;
    const timeZone =
      preference.timezone ||
      preference.user.profile?.timezone ||
      "America/New_York";

    const { dateKey, currentTime } = getLocalParts(timeZone);

    if (
      isWithinQuietHours(
        currentTime,
        preference.quietHoursStart ?? null,
        preference.quietHoursEnd ?? null
      )
    ) {
      continue;
    }

    const language = preference.user.profile?.preferredLanguage === "es" ? "es" : "en";

    const candidates: Array<{
      enabled: boolean;
      time: string | null;
      kind: ReminderKind;
    }> = [
      {
        enabled: preference.breathingReminderEnabled,
        time: preference.breathingReminderTime,
        kind: "breathing",
      },
      {
        enabled: preference.meditationReminderEnabled,
        time: preference.meditationReminderTime,
        kind: "meditation",
      },
      {
        enabled: preference.sleepReminderEnabled,
        time: preference.sleepReminderTime,
        kind: "sleep",
      },
      {
        enabled: preference.horoscopeReminderEnabled,
        time: preference.horoscopeReminderTime,
        kind: "horoscope",
      },
      {
        enabled: preference.bibleVerseReminderEnabled,
        time: preference.bibleVerseReminderTime,
        kind: "bible_verse",
      },
    ];

    for (const candidate of candidates) {
      if (!candidate.enabled || !candidate.time || candidate.time !== currentTime) {
        continue;
      }

      const type = `reminder:${candidate.kind}:${dateKey}`;
      const alreadySent = await prisma.notificationEvent.findFirst({
        where: {
          userId: preference.userId,
          type,
        },
      });

      if (alreadySent) {
        continue;
      }

      const reminder = buildReminder(candidate.kind, language);

      await prisma.notificationEvent.create({
        data: {
          userId: preference.userId,
          type,
          title: reminder.title,
          message: reminder.message,
          status: "unread",
          metadataJson: {
            kind: candidate.kind,
            dateKey,
            timeZone,
            ctaUrl: reminder.ctaUrl,
          },
        },
      });

      if (preference.user.email) {
        await sendReminderEmail({
          to: preference.user.email,
          title: reminder.title,
          message: reminder.message,
          ctaUrl: reminder.ctaUrl,
        });
      }

      dispatched += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    dispatched,
  });
}
