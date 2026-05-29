-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260529_add_schema_gaps
--
-- Adds all enums, columns, and tables that exist in schema.prisma but were
-- absent from the earlier foundation and notification-reminder migrations.
--
-- Every statement uses IF NOT EXISTS / DO $$ … EXCEPTION … END $$  so this
-- migration is idempotent and safe to apply against a database that was
-- already bootstrapped with `prisma db push`.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Missing enums ─────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "AlertLevel" AS ENUM ('info', 'warning', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SupportTicketStatus" AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SupportPriority" AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SupportCategory" AS ENUM ('bug', 'billing', 'account', 'content', 'feature_request', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SupportSenderType" AS ENUM ('user', 'admin', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ContentEntryStatus" AS ENUM ('draft', 'active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "MeditationSessionStatus" AS ENUM ('preparing', 'ready', 'playing', 'paused', 'completed', 'stopped', 'abandoned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SessionHistoryType" AS ENUM ('meditation', 'breathing', 'sleep', 'horoscope', 'journal', 'affirmation', 'yoga');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "SessionHistoryStatus" AS ENUM ('started', 'completed', 'stopped', 'abandoned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Missing columns on existing tables ────────────────────────────────────

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "phoneNumber"   TEXT,
  ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT;

CREATE INDEX IF NOT EXISTS "profiles_timezone_idx"
  ON "profiles"("timezone");

ALTER TABLE "daily_usage"
  ADD COLUMN IF NOT EXISTS "breathingCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sleepCount"     INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "admin_audit_logs"
  ADD COLUMN IF NOT EXISTS "entityType" TEXT,
  ADD COLUMN IF NOT EXISTS "entityId"   TEXT;

ALTER TABLE "api_request_logs"
  ADD COLUMN IF NOT EXISTS "platform" TEXT;

CREATE INDEX IF NOT EXISTS "api_request_logs_platform_createdAt_idx"
  ON "api_request_logs"("platform", "createdAt");

-- ── 3. Missing tables (dependency order: no-FK first, then FK chains) ─────────

-- email_verification_tokens
CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "tokenHash" TEXT         NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "email_verification_tokens_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "email_verification_tokens_userId_key"
  ON "email_verification_tokens"("userId");
CREATE INDEX IF NOT EXISTS "email_verification_tokens_expiresAt_idx"
  ON "email_verification_tokens"("expiresAt");

-- phone_otps
CREATE TABLE IF NOT EXISTS "phone_otps" (
  "id"           TEXT         NOT NULL,
  "userId"       TEXT         NOT NULL,
  "codeHash"     TEXT         NOT NULL,
  "expiresAt"    TIMESTAMP(3) NOT NULL,
  "attemptCount" INTEGER      NOT NULL DEFAULT 0,
  "lastSentAt"   TIMESTAMP(3) NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "phone_otps_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "phone_otps_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "phone_otps_userId_key"
  ON "phone_otps"("userId");
CREATE INDEX IF NOT EXISTS "phone_otps_expiresAt_idx"
  ON "phone_otps"("expiresAt");

-- admin_alerts
CREATE TABLE IF NOT EXISTS "admin_alerts" (
  "id"                TEXT          NOT NULL,
  "level"             "AlertLevel"  NOT NULL DEFAULT 'info',
  "type"              TEXT          NOT NULL,
  "title"             TEXT          NOT NULL,
  "message"           TEXT          NOT NULL,
  "isResolved"        BOOLEAN       NOT NULL DEFAULT false,
  "resolvedByAdminId" TEXT,
  "resolvedAt"        TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_alerts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "admin_alerts_resolvedByAdminId_fkey"
    FOREIGN KEY ("resolvedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "admin_alerts_level_isResolved_idx"
  ON "admin_alerts"("level", "isResolved");

-- release_notes
CREATE TABLE IF NOT EXISTS "release_notes" (
  "id"               TEXT           NOT NULL,
  "version"          TEXT           NOT NULL,
  "title"            TEXT           NOT NULL,
  "content"          TEXT           NOT NULL,
  "platform"         "PlatformType" NOT NULL DEFAULT 'all',
  "isPublished"      BOOLEAN        NOT NULL DEFAULT false,
  "publishedAt"      TIMESTAMP(3),
  "createdByAdminId" TEXT           NOT NULL,
  "createdAt"        TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3)   NOT NULL,
  CONSTRAINT "release_notes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "release_notes_createdByAdminId_fkey"
    FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "release_notes_platform_isPublished_idx"
  ON "release_notes"("platform", "isPublished");

-- support_tickets
CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id"              TEXT                   NOT NULL,
  "userId"          TEXT,
  "email"           TEXT,
  "subject"         TEXT                   NOT NULL,
  "message"         TEXT                   NOT NULL,
  "status"          "SupportTicketStatus"  NOT NULL DEFAULT 'open',
  "priority"        "SupportPriority"      NOT NULL DEFAULT 'medium',
  "category"        "SupportCategory"      NOT NULL DEFAULT 'other',
  "assignedAdminId" TEXT,
  "createdAt"       TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3)           NOT NULL,
  CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "support_tickets_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "support_tickets_assignedAdminId_fkey"
    FOREIGN KEY ("assignedAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "support_tickets_status_priority_idx"
  ON "support_tickets"("status", "priority");
CREATE INDEX IF NOT EXISTS "support_tickets_assignedAdminId_idx"
  ON "support_tickets"("assignedAdminId");

-- support_ticket_messages  (depends on support_tickets)
CREATE TABLE IF NOT EXISTS "support_ticket_messages" (
  "id"           TEXT                 NOT NULL,
  "ticketId"     TEXT                 NOT NULL,
  "senderType"   "SupportSenderType"  NOT NULL DEFAULT 'system',
  "senderUserId" TEXT,
  "message"      TEXT                 NOT NULL,
  "createdAt"    TIMESTAMP(3)         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "support_ticket_messages_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "support_ticket_messages_senderUserId_fkey"
    FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "support_ticket_messages_ticketId_createdAt_idx"
  ON "support_ticket_messages"("ticketId", "createdAt");

-- content_entries
CREATE TABLE IF NOT EXISTS "content_entries" (
  "id"               TEXT                  NOT NULL,
  "key"              TEXT                  NOT NULL,
  "title"            TEXT                  NOT NULL,
  "content"          TEXT                  NOT NULL,
  "type"             TEXT                  NOT NULL,
  "tags"             TEXT[]                NOT NULL DEFAULT '{}',
  "status"           "ContentEntryStatus"  NOT NULL DEFAULT 'draft',
  "platform"         "PlatformType"        NOT NULL DEFAULT 'all',
  "createdByAdminId" TEXT,
  "createdAt"        TIMESTAMP(3)          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3)          NOT NULL,
  CONSTRAINT "content_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "content_entries_createdByAdminId_fkey"
    FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "content_entries_type_status_idx"
  ON "content_entries"("type", "status");
CREATE INDEX IF NOT EXISTS "content_entries_platform_idx"
  ON "content_entries"("platform");

-- feature_flag_rules
CREATE TABLE IF NOT EXISTS "feature_flag_rules" (
  "id"               TEXT           NOT NULL,
  "key"              TEXT           NOT NULL,
  "title"            TEXT           NOT NULL,
  "description"      TEXT,
  "isEnabled"        BOOLEAN        NOT NULL DEFAULT false,
  "rolloutPercent"   INTEGER        NOT NULL DEFAULT 0,
  "platform"         "PlatformType" NOT NULL DEFAULT 'all',
  "createdByAdminId" TEXT,
  "createdAt"        TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3)   NOT NULL,
  CONSTRAINT "feature_flag_rules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "feature_flag_rules_createdByAdminId_fkey"
    FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "feature_flag_rules_key_platform_key"
  ON "feature_flag_rules"("key", "platform");
CREATE INDEX IF NOT EXISTS "feature_flag_rules_isEnabled_idx"
  ON "feature_flag_rules"("isEnabled");

-- app_versions  (no FK)
CREATE TABLE IF NOT EXISTS "app_versions" (
  "id"          TEXT           NOT NULL,
  "platform"    "PlatformType" NOT NULL,
  "version"     TEXT           NOT NULL,
  "buildNumber" TEXT,
  "releaseDate" TIMESTAMP(3),
  "isCurrent"   BOOLEAN        NOT NULL DEFAULT false,
  "notes"       TEXT,
  "createdAt"   TIMESTAMP(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_versions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "app_versions_platform_version_key"
  ON "app_versions"("platform", "version");
CREATE INDEX IF NOT EXISTS "app_versions_platform_isCurrent_idx"
  ON "app_versions"("platform", "isCurrent");

-- courses  (no FK)
CREATE TABLE IF NOT EXISTS "courses" (
  "id"            TEXT         NOT NULL,
  "slug"          TEXT         NOT NULL,
  "titleEn"       TEXT         NOT NULL,
  "titleEs"       TEXT         NOT NULL,
  "descriptionEn" TEXT,
  "descriptionEs" TEXT,
  "durationDays"  INTEGER      NOT NULL,
  "isPremium"     BOOLEAN      NOT NULL DEFAULT true,
  "orderIndex"    INTEGER      NOT NULL DEFAULT 0,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "courses_slug_key"
  ON "courses"("slug");

-- course_steps  (depends on courses)
CREATE TABLE IF NOT EXISTS "course_steps" (
  "id"            TEXT     NOT NULL,
  "courseId"      TEXT     NOT NULL,
  "dayIndex"      INTEGER  NOT NULL,
  "titleEn"       TEXT     NOT NULL,
  "titleEs"       TEXT     NOT NULL,
  "descriptionEn" TEXT,
  "descriptionEs" TEXT,
  "type"          TEXT     NOT NULL,
  "contentJson"   JSONB,
  "orderIndex"    INTEGER  NOT NULL DEFAULT 0,
  CONSTRAINT "course_steps_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "course_steps_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "course_steps_courseId_dayIndex_idx"
  ON "course_steps"("courseId", "dayIndex");

-- meditation_sessions  (must precede session_history)
CREATE TABLE IF NOT EXISTS "meditation_sessions" (
  "id"              TEXT                       NOT NULL,
  "userId"          TEXT                       NOT NULL,
  "mood"            TEXT                       NOT NULL,
  "durationMinutes" INTEGER                    NOT NULL,
  "voice"           TEXT                       NOT NULL,
  "sound"           TEXT,
  "breathingStyle"  TEXT,
  "scriptText"      TEXT                       NOT NULL,
  "audioUrl"        TEXT,
  "status"          "MeditationSessionStatus"  NOT NULL DEFAULT 'preparing',
  "startedAt"       TIMESTAMP(3),
  "pausedAt"        TIMESTAMP(3),
  "completedAt"     TIMESTAMP(3),
  "elapsedSeconds"  INTEGER                    NOT NULL DEFAULT 0,
  "metadataJson"    JSONB,
  "createdAt"       TIMESTAMP(3)               NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3)               NOT NULL,
  CONSTRAINT "meditation_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "meditation_sessions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "meditation_sessions_userId_status_updatedAt_idx"
  ON "meditation_sessions"("userId", "status", "updatedAt");
CREATE INDEX IF NOT EXISTS "meditation_sessions_createdAt_idx"
  ON "meditation_sessions"("createdAt");

-- session_history  (depends on users + meditation_sessions)
CREATE TABLE IF NOT EXISTS "session_history" (
  "id"              TEXT                   NOT NULL,
  "sessionId"       TEXT,
  "userId"          TEXT                   NOT NULL,
  "type"            "SessionHistoryType"   NOT NULL,
  "title"           TEXT                   NOT NULL,
  "summary"         TEXT,
  "metadataJson"    JSONB,
  "startedAt"       TIMESTAMP(3)           NOT NULL,
  "completedAt"     TIMESTAMP(3),
  "durationSeconds" INTEGER,
  "status"          "SessionHistoryStatus" NOT NULL,
  "createdAt"       TIMESTAMP(3)           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3)           NOT NULL,
  CONSTRAINT "session_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "session_history_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "session_history_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "meditation_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "session_history_sessionId_key"
  ON "session_history"("sessionId");
CREATE INDEX IF NOT EXISTS "session_history_userId_createdAt_idx"
  ON "session_history"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "session_history_status_createdAt_idx"
  ON "session_history"("status", "createdAt");

-- user_streaks
CREATE TABLE IF NOT EXISTS "user_streaks" (
  "id"               TEXT         NOT NULL,
  "userId"           TEXT         NOT NULL,
  "currentStreak"    INTEGER      NOT NULL DEFAULT 0,
  "longestStreak"    INTEGER      NOT NULL DEFAULT 0,
  "lastActiveDate"   TEXT,
  "reflectionStreak" INTEGER      NOT NULL DEFAULT 0,
  "meditationStreak" INTEGER      NOT NULL DEFAULT 0,
  "sleepStreak"      INTEGER      NOT NULL DEFAULT 0,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_streaks_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_streaks_userId_key"
  ON "user_streaks"("userId");
CREATE INDEX IF NOT EXISTS "user_streaks_lastActiveDate_idx"
  ON "user_streaks"("lastActiveDate");

-- mood_entries
CREATE TABLE IF NOT EXISTS "mood_entries" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "mood"      TEXT         NOT NULL,
  "note"      TEXT,
  "dateKey"   TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mood_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "mood_entries_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "mood_entries_userId_dateKey_key"
  ON "mood_entries"("userId", "dateKey");

-- user_course_progress  (depends on users + courses)
CREATE TABLE IF NOT EXISTS "user_course_progress" (
  "id"               TEXT         NOT NULL,
  "userId"           TEXT         NOT NULL,
  "courseId"         TEXT         NOT NULL,
  "currentStepIndex" INTEGER      NOT NULL DEFAULT 0,
  "startedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt"      TIMESTAMP(3),
  CONSTRAINT "user_course_progress_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_course_progress_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_course_progress_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_course_progress_userId_courseId_key"
  ON "user_course_progress"("userId", "courseId");
CREATE INDEX IF NOT EXISTS "user_course_progress_userId_idx"
  ON "user_course_progress"("userId");

-- journal_entries
CREATE TABLE IF NOT EXISTS "journal_entries" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "type"      TEXT         NOT NULL,
  "prompt"    TEXT,
  "content"   TEXT         NOT NULL,
  "sessionId" TEXT,
  "dateKey"   TEXT         NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "journal_entries_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "journal_entries_userId_createdAt_idx"
  ON "journal_entries"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "journal_entries_userId_dateKey_idx"
  ON "journal_entries"("userId", "dateKey");

-- saved_affirmations
CREATE TABLE IF NOT EXISTS "saved_affirmations" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "text"      TEXT         NOT NULL,
  "theme"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_affirmations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "saved_affirmations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "saved_affirmations_userId_createdAt_idx"
  ON "saved_affirmations"("userId", "createdAt");

-- saved_prompts
CREATE TABLE IF NOT EXISTS "saved_prompts" (
  "id"        TEXT         NOT NULL,
  "userId"    TEXT         NOT NULL,
  "text"      TEXT         NOT NULL,
  "source"    TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "saved_prompts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "saved_prompts_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "saved_prompts_userId_createdAt_idx"
  ON "saved_prompts"("userId", "createdAt");

-- dashboard_state
CREATE TABLE IF NOT EXISTS "dashboard_state" (
  "id"                TEXT         NOT NULL,
  "userId"            TEXT         NOT NULL,
  "lastSessionType"   TEXT,
  "lastSessionId"     TEXT,
  "lastViewedSection" TEXT,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "dashboard_state_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "dashboard_state_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "dashboard_state_userId_key"
  ON "dashboard_state"("userId");
