DO $$ BEGIN
  CREATE TYPE "PlatformType" AS ENUM ('web', 'ios', 'android', 'all');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationAudienceType" AS ENUM ('all', 'premium', 'free', 'inactive', 'custom');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationCampaignStatus" AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('queued', 'sent', 'failed', 'clicked', 'dismissed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "push_subscriptions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "platform" "PlatformType" NOT NULL DEFAULT 'web',
  "endpoint" TEXT NOT NULL,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "deviceLabel" TEXT,
  "appVersion" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastSeenAt" TIMESTAMP(3),
  CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");
CREATE INDEX IF NOT EXISTS "push_subscriptions_userId_platform_idx" ON "push_subscriptions"("userId", "platform");
CREATE INDEX IF NOT EXISTS "push_subscriptions_isActive_idx" ON "push_subscriptions"("isActive");

CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "enablePush" BOOLEAN NOT NULL DEFAULT false,
  "dailyReminder" BOOLEAN NOT NULL DEFAULT true,
  "meditationReminder" BOOLEAN NOT NULL DEFAULT true,
  "sleepReminder" BOOLEAN NOT NULL DEFAULT true,
  "streakReminder" BOOLEAN NOT NULL DEFAULT true,
  "horoscopeReminder" BOOLEAN NOT NULL DEFAULT true,
  "billingAlerts" BOOLEAN NOT NULL DEFAULT true,
  "productAnnouncements" BOOLEAN NOT NULL DEFAULT true,
  "adminBroadcasts" BOOLEAN NOT NULL DEFAULT true,
  "quietHoursStart" TEXT,
  "quietHoursEnd" TEXT,
  "reminderMorningTime" TEXT,
  "reminderEveningTime" TEXT,
  "breathingReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
  "breathingReminderTime" TEXT,
  "meditationReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
  "meditationReminderTime" TEXT,
  "sleepReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
  "sleepReminderTime" TEXT,
  "horoscopeReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
  "horoscopeReminderTime" TEXT,
  "bibleVerseReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
  "bibleVerseReminderTime" TEXT,
  "timezone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "notification_preferences_userId_key" ON "notification_preferences"("userId");

ALTER TABLE "notification_preferences"
  ADD COLUMN IF NOT EXISTS "breathingReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "breathingReminderTime" TEXT,
  ADD COLUMN IF NOT EXISTS "meditationReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "meditationReminderTime" TEXT,
  ADD COLUMN IF NOT EXISTS "sleepReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "sleepReminderTime" TEXT,
  ADD COLUMN IF NOT EXISTS "horoscopeReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "horoscopeReminderTime" TEXT,
  ADD COLUMN IF NOT EXISTS "bibleVerseReminderEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "bibleVerseReminderTime" TEXT;

CREATE TABLE IF NOT EXISTS "notification_campaigns" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "audienceType" "NotificationAudienceType" NOT NULL DEFAULT 'all',
  "audienceFilterJson" JSONB,
  "ctaLabel" TEXT,
  "ctaUrl" TEXT,
  "platform" "PlatformType" NOT NULL DEFAULT 'all',
  "scheduledFor" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "status" "NotificationCampaignStatus" NOT NULL DEFAULT 'draft',
  "createdByAdminId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notification_campaigns_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_campaigns_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "notification_campaigns_status_scheduledFor_idx" ON "notification_campaigns"("status", "scheduledFor");
CREATE INDEX IF NOT EXISTS "notification_campaigns_audienceType_idx" ON "notification_campaigns"("audienceType");

CREATE TABLE IF NOT EXISTS "notification_deliveries" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT,
  "userId" TEXT NOT NULL,
  "pushSubscriptionId" TEXT,
  "platform" "PlatformType" NOT NULL DEFAULT 'web',
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'queued',
  "errorMessage" TEXT,
  "deliveredAt" TIMESTAMP(3),
  "clickedAt" TIMESTAMP(3),
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_deliveries_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "notification_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "notification_deliveries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "notification_deliveries_pushSubscriptionId_fkey" FOREIGN KEY ("pushSubscriptionId") REFERENCES "push_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "notification_deliveries_campaignId_status_idx" ON "notification_deliveries"("campaignId", "status");
CREATE INDEX IF NOT EXISTS "notification_deliveries_userId_createdAt_idx" ON "notification_deliveries"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "notification_deliveries_platform_createdAt_idx" ON "notification_deliveries"("platform", "createdAt");

CREATE TABLE IF NOT EXISTS "notification_events" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'unread',
  "metadataJson" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "notification_events_userId_createdAt_idx" ON "notification_events"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "notification_events_status_idx" ON "notification_events"("status");
