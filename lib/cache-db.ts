import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
// `import type` is erased at compile time — no runtime module load on import.
// The value is loaded lazily inside initializeDb() via require() so that this
// module can be imported on any Node.js version without throwing.
import type { DatabaseSync } from "node:sqlite";

export type SubscriptionTier = "free" | "premium";
export type SubscriptionStatus =
  | "inactive"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

export type PublicUser = {
  userId: string;
  email: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneVerified: boolean;
  displayName: string;
  isGuest: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
};

export type MeditationCacheEntry = {
  mood: string;
  duration: string;
  mode: string;
  meditationType: string;
  breathingPattern: string | null;
  text: string;
  wordTarget: number;
  createdAt: string;
  lastUsedAt: string;
  hits: number;
};

export type SpeechCacheEntry = {
  voice: string;
  textHash: string;
  fileName: string;
  bytes: number;
  createdAt: string;
  lastUsedAt: string;
  hits: number;
};

export type SessionRecordInput = {
  mode: string;
  meditationType: string;
  mood: string;
  duration: string;
  breathingPattern: string | null;
  voice: string;
  visual: string;
  sounds: string[];
  text: string;
};

export type UserPreferencesInput = {
  preferredVoiceTone: string;
  preferredVisual: string;
  preferredDuration: string;
  preferredSounds: string[];
  preferredTimerStyle?: string;
};

type CachePaths = {
  dataDir: string;
  audioCacheDir: string;
  dbPath: string;
};

export type LocalAuthUserRecord = {
  userId: string;
  email: string;
  passwordHash: string | null;
  displayName: string;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneVerified: boolean;
  createdAt: string;
};

export type LocalPhoneOtpRecord = {
  userId: string;
  codeHash: string;
  expiresAt: Date;
  attemptCount: number;
  lastSentAt: Date;
};

function buildCachePaths(dataDir: string): CachePaths {
  return {
    dataDir,
    audioCacheDir: path.join(dataDir, "audio-cache"),
    dbPath: path.join(dataDir, "cache.db"),
  };
}

function resolveDataDir() {
  const configured = process.env.CHIMAURA_DATA_DIR?.trim();
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    return path.join(tmpdir(), "chimaura-runtime");
  }

  return path.join(process.cwd(), "data");
}

function getTempDataDir() {
  return path.join(tmpdir(), "chimaura-runtime");
}

function isReadonlyStorageError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  return (
    code === "EROFS" ||
    code === "EPERM" ||
    code === "EACCES" ||
    code === "SQLITE_READONLY" ||
    message.includes("readonly") ||
    message.includes("read-only") ||
    message.includes("access is denied")
  );
}

const GUEST_USER_ID = "guest-user";

let cachePaths = buildCachePaths(resolveDataDir());
let db: DatabaseSync | null = null;

function toJsonArray(value: string[] | null | undefined) {
  return JSON.stringify(value ?? []);
}

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string) {
  const [salt, existingHash] = storedHash.split(":");
  if (!salt || !existingHash) return false;

  const candidate = scryptSync(password, salt, 64);
  const existing = Buffer.from(existingHash, "hex");
  if (candidate.length !== existing.length) return false;
  return timingSafeEqual(candidate, existing);
}

function mapUserRow(
  row:
    | {
        user_id: string;
        email: string | null;
        email_verified: number;
        phone_number: string | null;
        phone_verified: number;
        display_name: string;
        is_guest: number;
        subscription_tier: SubscriptionTier;
        subscription_status: SubscriptionStatus;
        current_period_end: string | null;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
        created_at: string;
      }
    | undefined
): PublicUser | null {
  if (!row) return null;

  return {
    userId: row.user_id,
    email: row.email,
    emailVerified: row.email_verified === 1,
    phoneNumber: row.phone_number,
    phoneVerified: row.phone_verified === 1,
    displayName: row.display_name,
    isGuest: row.is_guest === 1,
    subscriptionTier: row.subscription_tier,
    subscriptionStatus: row.subscription_status,
    currentPeriodEnd: row.current_period_end,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    createdAt: row.created_at,
  };
}

function ensureColumn(sqlite: DatabaseSync, tableName: string, columnDefinition: string) {
  const columnName = columnDefinition.split(" ")[0];
  const columns = sqlite
    .prepare(`PRAGMA table_info(${tableName})`)
    .all() as Array<{ name: string }>;

  if (columns.some((column) => column.name === columnName)) return;
  sqlite.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnDefinition}`);
}

function ensureGuestUser(sqlite: DatabaseSync) {
  const now = new Date().toISOString();

  sqlite
    .prepare(
      `INSERT INTO users (
        user_id,
        email,
        password_hash,
        display_name,
        is_guest,
        subscription_tier,
        subscription_status,
        current_period_end,
        stripe_customer_id,
        stripe_subscription_id,
        created_at,
        updated_at
      ) VALUES (?, NULL, NULL, ?, 1, 'free', 'inactive', NULL, NULL, NULL, ?, ?)
      ON CONFLICT(user_id) DO NOTHING`
    )
    .run(GUEST_USER_ID, "Guest", now, now);
}

function initializeDb(paths: CachePaths): DatabaseSync {
  mkdirSync(paths.dataDir, { recursive: true });
  mkdirSync(paths.audioCacheDir, { recursive: true });

  // Load node:sqlite lazily so that importing this module never throws on
  // Node <22.5.0.  At runtime (Railway + nixpacks.toml) Node 22 is used, so
  // this require() succeeds.  If it somehow runs on an older Node, the error
  // surfaces here (at request time) with a clear message instead of crashing
  // the entire build.
  const m: typeof import("node:sqlite") = (() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require("node:sqlite") as typeof import("node:sqlite");
    } catch {
      throw new Error(
        "SQLite cache requires Node.js 22.5.0 or later. " +
          "Ensure Railway is configured to use Node 22 via nixpacks.toml."
      );
    }
  })();
  const sqlite = new m.DatabaseSync(paths.dbPath);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS meditation_cache (
      cache_key TEXT PRIMARY KEY,
      mood TEXT NOT NULL,
      duration TEXT NOT NULL,
      mode TEXT NOT NULL,
      meditation_type TEXT NOT NULL DEFAULT 'stress_relief',
      breathing_pattern TEXT,
      text TEXT NOT NULL,
      word_target INTEGER NOT NULL,
      hits INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      last_used_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS speech_cache (
      cache_key TEXT PRIMARY KEY,
      voice TEXT NOT NULL,
      text_hash TEXT NOT NULL,
      file_name TEXT NOT NULL,
      bytes INTEGER NOT NULL,
      hits INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      last_used_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_history (
      session_id TEXT PRIMARY KEY,
      mode TEXT NOT NULL,
      meditation_type TEXT NOT NULL,
      mood TEXT NOT NULL,
      duration TEXT NOT NULL,
      breathing_pattern TEXT,
      voice TEXT NOT NULL,
      visual TEXT NOT NULL,
      sounds_json TEXT NOT NULL,
      text TEXT NOT NULL,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      play_count INTEGER NOT NULL DEFAULT 0,
      completed_count INTEGER NOT NULL DEFAULT 0,
      last_played_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      preferred_voice_tone TEXT NOT NULL,
      preferred_visual TEXT NOT NULL,
      preferred_duration TEXT NOT NULL,
      preferred_sounds_json TEXT NOT NULL,
      preferred_timer_style TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_presets (
      preset_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      mode TEXT NOT NULL,
      meditation_type TEXT NOT NULL,
      breathing_pattern TEXT,
      voice_tone TEXT NOT NULL,
      visual TEXT NOT NULL,
      duration TEXT NOT NULL,
      sounds_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      display_name TEXT NOT NULL,
      is_guest INTEGER NOT NULL DEFAULT 0,
      subscription_tier TEXT NOT NULL DEFAULT 'free',
      subscription_status TEXT NOT NULL DEFAULT 'inactive',
      current_period_end TEXT,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      session_token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  ensureColumn(sqlite, "session_history", `user_id TEXT NOT NULL DEFAULT '${GUEST_USER_ID}'`);
  ensureColumn(sqlite, "user_presets", `user_id TEXT NOT NULL DEFAULT '${GUEST_USER_ID}'`);
  ensureColumn(sqlite, "user_preferences", "preferred_timer_style TEXT DEFAULT 'minimal-ring'");
  ensureColumn(sqlite, "users", "email_verified INTEGER NOT NULL DEFAULT 0");
  ensureColumn(sqlite, "users", "phone_number TEXT");
  ensureColumn(sqlite, "users", "phone_verified INTEGER NOT NULL DEFAULT 0");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS phone_otps (
      user_id TEXT PRIMARY KEY,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      last_sent_at TEXT NOT NULL
    );
  `);
  ensureGuestUser(sqlite);

  return sqlite;
}

function getDb() {
  if (db) return db;

  try {
    db = initializeDb(cachePaths);
  } catch (error) {
    const tempPaths = buildCachePaths(getTempDataDir());
    const canRetryWithTemp = cachePaths.dbPath !== tempPaths.dbPath && isReadonlyStorageError(error);
    if (!canRetryWithTemp) {
      throw error;
    }

    cachePaths = tempPaths;
    db = initializeDb(cachePaths);
  }

  return db;
}

export function getGuestUserId() {
  return GUEST_USER_ID;
}

export function getAudioCachePath(fileName: string) {
  return path.join(cachePaths.audioCacheDir, fileName);
}

export async function getGuestUser() {
  const sqlite = getDb();
  const row = sqlite
    .prepare(
      `SELECT user_id, email, display_name, is_guest, subscription_tier, subscription_status, current_period_end, stripe_customer_id, stripe_subscription_id, created_at
       , email_verified, phone_number, phone_verified
       FROM users
       WHERE user_id = ?`
    )
    .get(GUEST_USER_ID) as Parameters<typeof mapUserRow>[0];

  return mapUserRow(row)!;
}

export async function getUserById(userId: string) {
  const sqlite = getDb();
  const row = sqlite
    .prepare(
      `SELECT user_id, email, display_name, is_guest, subscription_tier, subscription_status, current_period_end, stripe_customer_id, stripe_subscription_id, created_at
       , email_verified, phone_number, phone_verified
       FROM users
       WHERE user_id = ?`
    )
    .get(userId) as Parameters<typeof mapUserRow>[0];

  return mapUserRow(row);
}

export async function getUserByEmail(email: string) {
  const sqlite = getDb();
  const row = sqlite
    .prepare(
      `SELECT user_id, email, display_name, is_guest, subscription_tier, subscription_status, current_period_end, stripe_customer_id, stripe_subscription_id, created_at
       , email_verified, phone_number, phone_verified
       FROM users
       WHERE email = ?`
    )
    .get(normalizeEmail(email)) as Parameters<typeof mapUserRow>[0];

  return mapUserRow(row);
}

export async function createUser(input: {
  email: string;
  password: string;
  displayName: string;
}) {
  const sqlite = getDb();
  const userId = randomUUID();
  const now = new Date().toISOString();
  const email = normalizeEmail(input.email);

  const existing = sqlite
    .prepare(`SELECT user_id FROM users WHERE email = ?`)
    .get(email) as { user_id: string } | undefined;

  if (existing) {
    throw new Error("An account with that email already exists.");
  }

  sqlite
    .prepare(
      `INSERT INTO users (
        user_id,
        email,
        password_hash,
        display_name,
        is_guest,
        subscription_tier,
        subscription_status,
        current_period_end,
        stripe_customer_id,
        stripe_subscription_id,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, 0, 'free', 'inactive', NULL, NULL, NULL, ?, ?)`
    )
    .run(userId, email, hashPassword(input.password), input.displayName.trim(), now, now);

  const user = await getUserById(userId);
  if (!user) throw new Error("Failed to create user.");
  return user;
}

export async function authenticateUser(input: { email: string; password: string }) {
  const sqlite = getDb();
  const row = sqlite
    .prepare(
      `SELECT user_id, email, password_hash, display_name, is_guest, subscription_tier, subscription_status, current_period_end, stripe_customer_id, stripe_subscription_id, created_at
       , email_verified, phone_number, phone_verified
       FROM users
       WHERE email = ?`
    )
    .get(normalizeEmail(input.email)) as
    | {
        user_id: string;
        email: string;
        password_hash: string | null;
        email_verified: number;
        phone_number: string | null;
        phone_verified: number;
        display_name: string;
        is_guest: number;
        subscription_tier: SubscriptionTier;
        subscription_status: SubscriptionStatus;
        current_period_end: string | null;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
        created_at: string;
      }
    | undefined;

  if (!row?.password_hash) return null;
  if (!verifyPassword(input.password, row.password_hash)) return null;

  return mapUserRow(row);
}

export async function createAuthSession(userId: string) {
  const sqlite = getDb();
  const sessionToken = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30).toISOString();

  sqlite
    .prepare(
      `INSERT INTO auth_sessions (session_token, user_id, expires_at, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(sessionToken, userId, expiresAt, now.toISOString());

  return { sessionToken, expiresAt };
}

export async function getUserBySessionToken(sessionToken: string) {
  const sqlite = getDb();
  const row = sqlite
    .prepare(
      `SELECT u.user_id, u.email, u.display_name, u.is_guest, u.subscription_tier, u.subscription_status, u.current_period_end, u.stripe_customer_id, u.stripe_subscription_id, u.created_at, s.expires_at
      , u.email_verified, u.phone_number, u.phone_verified
       FROM auth_sessions s
       JOIN users u ON u.user_id = s.user_id
       WHERE s.session_token = ?`
    )
    .get(sessionToken) as
    | {
        user_id: string;
        email: string | null;
        email_verified: number;
        phone_number: string | null;
        phone_verified: number;
        display_name: string;
        is_guest: number;
        subscription_tier: SubscriptionTier;
        subscription_status: SubscriptionStatus;
        current_period_end: string | null;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
        created_at: string;
        expires_at: string;
      }
    | undefined;

  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await deleteAuthSession(sessionToken);
    return null;
  }

  return mapUserRow(row);
}

export async function deleteAuthSession(sessionToken: string) {
  const sqlite = getDb();
  sqlite.prepare(`DELETE FROM auth_sessions WHERE session_token = ?`).run(sessionToken);
}

export async function deleteAuthSessionsByUserId(userId: string) {
  const sqlite = getDb();
  sqlite.prepare(`DELETE FROM auth_sessions WHERE user_id = ?`).run(userId);
}

function mapLocalAuthUserRow(
  row:
    | {
        user_id: string;
        email: string;
        password_hash: string | null;
        display_name: string;
        email_verified: number;
        phone_number: string | null;
        phone_verified: number;
        created_at: string;
      }
    | undefined
): LocalAuthUserRecord | null {
  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    email: row.email,
    passwordHash: row.password_hash,
    displayName: row.display_name,
    emailVerified: row.email_verified === 1,
    phoneNumber: row.phone_number,
    phoneVerified: row.phone_verified === 1,
    createdAt: row.created_at,
  };
}

export async function getAuthUserByEmail(email: string) {
  const sqlite = getDb();
  const row = sqlite
    .prepare(
      `SELECT user_id, email, password_hash, display_name, email_verified, phone_number, phone_verified, created_at
       FROM users
       WHERE email = ?`
    )
    .get(normalizeEmail(email)) as Parameters<typeof mapLocalAuthUserRow>[0];

  return mapLocalAuthUserRow(row);
}

export async function getAuthUserById(userId: string) {
  const sqlite = getDb();
  const row = sqlite
    .prepare(
      `SELECT user_id, email, password_hash, display_name, email_verified, phone_number, phone_verified, created_at
       FROM users
       WHERE user_id = ?`
    )
    .get(userId) as Parameters<typeof mapLocalAuthUserRow>[0];

  return mapLocalAuthUserRow(row);
}

export async function updateAuthUser(
  userId: string,
  input: {
    passwordHash?: string;
    emailVerified?: boolean;
    phoneNumber?: string | null;
    phoneVerified?: boolean;
  }
) {
  const sqlite = getDb();

  sqlite
    .prepare(
      `UPDATE users
       SET password_hash = COALESCE(?, password_hash),
           email_verified = COALESCE(?, email_verified),
           phone_number = CASE WHEN ? = 1 THEN ? ELSE phone_number END,
           phone_verified = COALESCE(?, phone_verified),
           updated_at = ?
       WHERE user_id = ?`
    )
    .run(
      input.passwordHash ?? null,
      typeof input.emailVerified === "boolean" ? (input.emailVerified ? 1 : 0) : null,
      Object.prototype.hasOwnProperty.call(input, "phoneNumber") ? 1 : 0,
      input.phoneNumber ?? null,
      typeof input.phoneVerified === "boolean" ? (input.phoneVerified ? 1 : 0) : null,
      new Date().toISOString(),
      userId
    );

  return getAuthUserById(userId);
}

export async function getPhoneOtpByUserId(userId: string): Promise<LocalPhoneOtpRecord | null> {
  const sqlite = getDb();
  const row = sqlite
    .prepare(
      `SELECT user_id, code_hash, expires_at, attempt_count, last_sent_at
       FROM phone_otps
       WHERE user_id = ?`
    )
    .get(userId) as
    | {
        user_id: string;
        code_hash: string;
        expires_at: string;
        attempt_count: number;
        last_sent_at: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    codeHash: row.code_hash,
    expiresAt: new Date(row.expires_at),
    attemptCount: row.attempt_count,
    lastSentAt: new Date(row.last_sent_at),
  };
}

export async function upsertPhoneOtp(input: {
  userId: string;
  codeHash: string;
  expiresAt: Date;
  attemptCount: number;
  lastSentAt: Date;
}) {
  const sqlite = getDb();
  sqlite
    .prepare(
      `INSERT INTO phone_otps (user_id, code_hash, expires_at, attempt_count, last_sent_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         code_hash = excluded.code_hash,
         expires_at = excluded.expires_at,
         attempt_count = excluded.attempt_count,
         last_sent_at = excluded.last_sent_at`
    )
    .run(
      input.userId,
      input.codeHash,
      input.expiresAt.toISOString(),
      input.attemptCount,
      input.lastSentAt.toISOString()
    );
}

export async function updatePhoneOtpAttemptCount(userId: string, attemptCount: number) {
  const sqlite = getDb();
  sqlite
    .prepare(`UPDATE phone_otps SET attempt_count = ? WHERE user_id = ?`)
    .run(attemptCount, userId);
}

export async function deletePhoneOtp(userId: string) {
  const sqlite = getDb();
  sqlite.prepare(`DELETE FROM phone_otps WHERE user_id = ?`).run(userId);
}

export async function updateUserSubscription(input: {
  userId: string;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  const sqlite = getDb();
  const now = new Date().toISOString();

  sqlite
    .prepare(
      `UPDATE users
       SET subscription_tier = ?,
           subscription_status = ?,
           current_period_end = ?,
           stripe_customer_id = COALESCE(?, stripe_customer_id),
           stripe_subscription_id = COALESCE(?, stripe_subscription_id),
           updated_at = ?
       WHERE user_id = ?`
    )
    .run(
      input.subscriptionTier,
      input.subscriptionStatus,
      input.currentPeriodEnd,
      input.stripeCustomerId ?? null,
      input.stripeSubscriptionId ?? null,
      now,
      input.userId
    );

  return getUserById(input.userId);
}

export async function getMeditationFromCache(key: string) {
  const sqlite = getDb();
  const row = sqlite
    .prepare(
      `SELECT mood, duration, mode, meditation_type, breathing_pattern, text, word_target, hits, created_at, last_used_at
       FROM meditation_cache
       WHERE cache_key = ?`
    )
    .get(key) as
    | {
        mood: string;
        duration: string;
        mode: string;
        meditation_type: string;
        breathing_pattern: string | null;
        text: string;
        word_target: number;
        hits: number;
        created_at: string;
        last_used_at: string;
      }
    | undefined;

  if (!row) return null;

  const now = new Date().toISOString();

  sqlite
    .prepare(
      `UPDATE meditation_cache
       SET hits = hits + 1,
           last_used_at = ?
       WHERE cache_key = ?`
    )
    .run(now, key);

  return {
    mood: row.mood,
    duration: row.duration,
    mode: row.mode,
    meditationType: row.meditation_type,
    breathingPattern: row.breathing_pattern,
    text: row.text,
    wordTarget: row.word_target,
    createdAt: row.created_at,
    lastUsedAt: now,
    hits: row.hits + 1,
  } as MeditationCacheEntry;
}

export async function saveMeditationToCache(
  key: string,
  entry: Omit<MeditationCacheEntry, "hits" | "createdAt" | "lastUsedAt">
) {
  const sqlite = getDb();
  const now = new Date().toISOString();

  sqlite
    .prepare(
      `INSERT INTO meditation_cache (
        cache_key, mood, duration, mode, meditation_type, breathing_pattern, text, word_target, hits, created_at, last_used_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET
        mood = excluded.mood,
        duration = excluded.duration,
        mode = excluded.mode,
        meditation_type = excluded.meditation_type,
        breathing_pattern = excluded.breathing_pattern,
        text = excluded.text,
        word_target = excluded.word_target,
        hits = meditation_cache.hits + 1,
        last_used_at = excluded.last_used_at`
    )
    .run(
      key,
      entry.mood,
      entry.duration,
      entry.mode,
      entry.meditationType,
      entry.breathingPattern,
      entry.text,
      entry.wordTarget,
      now,
      now
    );
}

export async function getSpeechFromCache(key: string) {
  const sqlite = getDb();
  const row = sqlite
    .prepare(
      `SELECT voice, text_hash, file_name, bytes, hits, created_at, last_used_at
       FROM speech_cache
       WHERE cache_key = ?`
    )
    .get(key) as
    | {
        voice: string;
        text_hash: string;
        file_name: string;
        bytes: number;
        hits: number;
        created_at: string;
        last_used_at: string;
      }
    | undefined;

  if (!row) return null;

  const now = new Date().toISOString();

  sqlite
    .prepare(
      `UPDATE speech_cache
       SET hits = hits + 1,
           last_used_at = ?
       WHERE cache_key = ?`
    )
    .run(now, key);

  return {
    voice: row.voice,
    textHash: row.text_hash,
    fileName: row.file_name,
    bytes: row.bytes,
    createdAt: row.created_at,
    lastUsedAt: now,
    hits: row.hits + 1,
  } as SpeechCacheEntry;
}

export async function saveSpeechToCache(
  key: string,
  entry: Omit<SpeechCacheEntry, "hits" | "createdAt" | "lastUsedAt">
) {
  const sqlite = getDb();
  const now = new Date().toISOString();

  sqlite
    .prepare(
      `INSERT INTO speech_cache (
        cache_key, voice, text_hash, file_name, bytes, hits, created_at, last_used_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      ON CONFLICT(cache_key) DO UPDATE SET
        voice = excluded.voice,
        text_hash = excluded.text_hash,
        file_name = excluded.file_name,
        bytes = excluded.bytes,
        hits = speech_cache.hits + 1,
        last_used_at = excluded.last_used_at`
    )
    .run(key, entry.voice, entry.textHash, entry.fileName, entry.bytes, now, now);
}

export async function createSessionRecord(input: SessionRecordInput, userId = GUEST_USER_ID) {
  const sqlite = getDb();
  const sessionId = randomUUID();
  const now = new Date().toISOString();

  sqlite
    .prepare(
      `INSERT INTO session_history (
        session_id, user_id, mode, meditation_type, mood, duration, breathing_pattern, voice, visual, sounds_json, text, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      sessionId,
      userId,
      input.mode,
      input.meditationType,
      input.mood,
      input.duration,
      input.breathingPattern,
      input.voice,
      input.visual,
      toJsonArray(input.sounds),
      input.text,
      now
    );

  return sessionId;
}

export async function markSessionPlayed(sessionId: string, completed: boolean, userId = GUEST_USER_ID) {
  const sqlite = getDb();
  const now = new Date().toISOString();

  sqlite
    .prepare(
      `UPDATE session_history
       SET play_count = play_count + 1,
           completed_count = completed_count + ?,
           last_played_at = ?
       WHERE session_id = ? AND user_id = ?`
    )
    .run(completed ? 1 : 0, now, sessionId, userId);
}

export async function toggleSessionFavorite(sessionId: string, favorite: boolean, userId = GUEST_USER_ID) {
  const sqlite = getDb();
  sqlite
    .prepare(`UPDATE session_history SET is_favorite = ? WHERE session_id = ? AND user_id = ?`)
    .run(favorite ? 1 : 0, sessionId, userId);
}

export async function getSessionById(sessionId: string, userId = GUEST_USER_ID) {
  const sqlite = getDb();
  const row = sqlite
    .prepare(
      `SELECT session_id, mode, meditation_type, mood, duration, breathing_pattern, voice, visual, sounds_json, text, is_favorite, play_count, completed_count, created_at
       FROM session_history
       WHERE session_id = ? AND user_id = ?`
    )
    .get(sessionId, userId) as
    | {
        session_id: string;
        mode: string;
        meditation_type: string;
        mood: string;
        duration: string;
        breathing_pattern: string | null;
        voice: string;
        visual: string;
        sounds_json: string;
        text: string;
        is_favorite: number;
        play_count: number;
        completed_count: number;
        created_at: string;
      }
    | undefined;

  if (!row) return null;

  return {
    sessionId: row.session_id,
    mode: row.mode,
    meditationType: row.meditation_type,
    mood: row.mood,
    duration: row.duration,
    breathingPattern: row.breathing_pattern,
    voice: row.voice,
    visual: row.visual,
    sounds: parseJsonArray(row.sounds_json),
    text: row.text,
    isFavorite: row.is_favorite === 1,
    playCount: row.play_count,
    completedCount: row.completed_count,
    createdAt: row.created_at,
  };
}

export async function getMeditationUsageCount(userId = GUEST_USER_ID, isoDay?: string) {
  const sqlite = getDb();
  const day = isoDay ?? new Date().toISOString().slice(0, 10);

  const row = sqlite
    .prepare(
      `SELECT COUNT(*) as count
       FROM session_history
       WHERE user_id = ?
         AND mode = 'meditation'
         AND substr(created_at, 1, 10) = ?`
    )
    .get(userId, day) as { count: number };

  return row.count;
}

export async function getSessionDashboard(userId = GUEST_USER_ID) {
  const sqlite = getDb();

  const recentRows = sqlite
    .prepare(
      `SELECT session_id, mode, meditation_type, mood, duration, breathing_pattern, voice, visual, sounds_json, text, is_favorite, play_count, completed_count, last_played_at, created_at
       FROM session_history
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`
    )
    .all(userId) as Array<{
      session_id: string;
      mode: string;
      meditation_type: string;
      mood: string;
      duration: string;
      breathing_pattern: string | null;
      voice: string;
      visual: string;
      sounds_json: string;
      text: string;
      is_favorite: number;
      play_count: number;
      completed_count: number;
      last_played_at: string | null;
      created_at: string;
    }>;

  const favorites = recentRows.filter((row) => row.is_favorite === 1);
  const completedCount = (sqlite
    .prepare(`SELECT COALESCE(SUM(completed_count), 0) as total FROM session_history WHERE user_id = ?`)
    .get(userId) as { total: number }).total;
  const totalSessions = (sqlite
    .prepare(`SELECT COUNT(*) as count FROM session_history WHERE user_id = ?`)
    .get(userId) as { count: number }).count;

  const dayRows = sqlite
    .prepare(
      `SELECT DISTINCT substr(last_played_at, 1, 10) as day
       FROM session_history
       WHERE user_id = ? AND completed_count > 0 AND last_played_at IS NOT NULL
       ORDER BY day DESC`
    )
    .all(userId) as Array<{ day: string }>;

  const daySet = new Set(dayRows.map((row) => row.day));
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const isoDay = cursor.toISOString().slice(0, 10);
    if (!daySet.has(isoDay)) break;
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return {
    recent: recentRows.map((row) => ({
      sessionId: row.session_id,
      mode: row.mode,
      meditationType: row.meditation_type,
      mood: row.mood,
      duration: row.duration,
      breathingPattern: row.breathing_pattern,
      voice: row.voice,
      visual: row.visual,
      sounds: parseJsonArray(row.sounds_json),
      text: row.text,
      isFavorite: row.is_favorite === 1,
      playCount: row.play_count,
      completedCount: row.completed_count,
      lastPlayedAt: row.last_played_at,
      createdAt: row.created_at,
    })),
    favorites: favorites.map((row) => ({
      sessionId: row.session_id,
      mode: row.mode,
      meditationType: row.meditation_type,
      mood: row.mood,
      duration: row.duration,
      breathingPattern: row.breathing_pattern,
      voice: row.voice,
      visual: row.visual,
      sounds: parseJsonArray(row.sounds_json),
      text: row.text,
      isFavorite: true,
      playCount: row.play_count,
      completedCount: row.completed_count,
      lastPlayedAt: row.last_played_at,
      createdAt: row.created_at,
    })),
    stats: {
      totalSessions,
      completedSessions: completedCount,
      streakDays: streak,
    },
  };
}

export async function saveUserPreferences(input: UserPreferencesInput, userId = GUEST_USER_ID) {
  const sqlite = getDb();
  const now = new Date().toISOString();

  sqlite
    .prepare(
      `INSERT INTO user_preferences (
        user_id, preferred_voice_tone, preferred_visual, preferred_duration, preferred_sounds_json, preferred_timer_style, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        preferred_voice_tone = excluded.preferred_voice_tone,
        preferred_visual = excluded.preferred_visual,
        preferred_duration = excluded.preferred_duration,
        preferred_sounds_json = excluded.preferred_sounds_json,
        preferred_timer_style = excluded.preferred_timer_style,
        updated_at = excluded.updated_at`
    )
    .run(
      userId,
      input.preferredVoiceTone,
      input.preferredVisual,
      input.preferredDuration,
      toJsonArray(input.preferredSounds),
      input.preferredTimerStyle ?? "minimal-ring",
      now
    );
}

export async function getUserPreferences(userId = GUEST_USER_ID) {
  const sqlite = getDb();
  const row = sqlite
    .prepare(
      `SELECT preferred_voice_tone, preferred_visual, preferred_duration, preferred_sounds_json, preferred_timer_style, updated_at
       FROM user_preferences
       WHERE user_id = ?`
    )
    .get(userId) as
    | {
        preferred_voice_tone: string;
        preferred_visual: string;
        preferred_duration: string;
        preferred_sounds_json: string;
        preferred_timer_style: string | null;
        updated_at: string;
      }
    | undefined;

  if (!row) {
    return {
      preferredVoiceTone: "calm-female",
      preferredVisual: "mist",
      preferredDuration: "5 min",
      preferredSounds: [],
      preferredTimerStyle: "minimal-ring",
      updatedAt: null,
    };
  }

  return {
    preferredVoiceTone: row.preferred_voice_tone,
    preferredVisual: row.preferred_visual,
    preferredDuration: row.preferred_duration,
    preferredSounds: parseJsonArray(row.preferred_sounds_json),
    preferredTimerStyle: row.preferred_timer_style ?? "minimal-ring",
    updatedAt: row.updated_at,
  };
}

export async function createPreset(
  input: {
    name: string;
    mode: string;
    meditationType: string;
    breathingPattern: string | null;
    voiceTone: string;
    visual: string;
    duration: string;
    sounds: string[];
  },
  userId = GUEST_USER_ID
) {
  const sqlite = getDb();
  const presetId = randomUUID();
  const now = new Date().toISOString();

  sqlite
    .prepare(
      `INSERT INTO user_presets (
        preset_id, user_id, name, mode, meditation_type, breathing_pattern, voice_tone, visual, duration, sounds_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      presetId,
      userId,
      input.name,
      input.mode,
      input.meditationType,
      input.breathingPattern,
      input.voiceTone,
      input.visual,
      input.duration,
      toJsonArray(input.sounds),
      now
    );

  return presetId;
}

export async function deletePreset(presetId: string, userId = GUEST_USER_ID) {
  const sqlite = getDb();
  sqlite.prepare(`DELETE FROM user_presets WHERE preset_id = ? AND user_id = ?`).run(presetId, userId);
}

export async function getPresets(userId = GUEST_USER_ID) {
  const sqlite = getDb();
  const rows = sqlite
    .prepare(
      `SELECT preset_id, name, mode, meditation_type, breathing_pattern, voice_tone, visual, duration, sounds_json, created_at
       FROM user_presets
       WHERE user_id = ?
       ORDER BY created_at DESC`
    )
    .all(userId) as Array<{
      preset_id: string;
      name: string;
      mode: string;
      meditation_type: string;
      breathing_pattern: string | null;
      voice_tone: string;
      visual: string;
      duration: string;
      sounds_json: string;
      created_at: string;
    }>;

  return rows.map((row) => ({
    presetId: row.preset_id,
    name: row.name,
    mode: row.mode,
    meditationType: row.meditation_type,
    breathingPattern: row.breathing_pattern,
    voiceTone: row.voice_tone,
    visual: row.visual,
    duration: row.duration,
    sounds: parseJsonArray(row.sounds_json),
    createdAt: row.created_at,
  }));
}
export async function getMostRecentSession(userId = GUEST_USER_ID) {
  const dashboard = await getSessionDashboard(userId);
  return dashboard.recent[0] ?? null;
}

export async function deleteSessionRecord(sessionId: string, userId = GUEST_USER_ID) {
  const sqlite = getDb();
  sqlite
    .prepare(`DELETE FROM session_history WHERE session_id = ? AND user_id = ?`)
    .run(sessionId, userId);
}
