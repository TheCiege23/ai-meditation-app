import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { compareSync as compareBcryptSync } from "bcryptjs";

import { NextResponse } from "next/server";

import {
  authenticateUser as authenticateLocalUser,
  createAuthSession as createLocalAuthSession,
  createUser as createLocalUser,
  deleteAuthSession as deleteLocalAuthSession,
  deleteAuthSessionsByUserId as deleteLocalAuthSessionsByUserId,
  deletePhoneOtp as deleteLocalPhoneOtp,
  getAuthUserByEmail as getLocalAuthUserByEmail,
  getAuthUserById as getLocalAuthUserById,
  getPhoneOtpByUserId as getLocalPhoneOtpByUserId,
  getUserBySessionToken as getLocalUserBySessionToken,
  type LocalPhoneOtpRecord,
  type PublicUser,
  updateAuthUser as updateLocalAuthUser,
  updatePhoneOtpAttemptCount as updateLocalPhoneOtpAttemptCount,
  upsertPhoneOtp as upsertLocalPhoneOtp,
} from "@/lib/cache-db";
import {
  isPrismaForeignKeyError,
  isPrismaMissingColumnError,
  isPrismaMissingTableError,
  isPrismaUnavailableError,
  prisma,
} from "@/lib/db";
import type { Viewer } from "@/lib/types";
import {
  createAuthSessionRecord,
  createUserAccount,
  deleteAuthSessionRecord,
  deleteExpiredAuthSessions,
  getAuthSessionByToken,
  getGuestViewer,
  getUserByEmail,
  mapUserToViewer,
} from "@/lib/user-store";

export const AUTH_COOKIE_NAME = "chimaura_session";

type AuthAccount = {
  userId: string;
  viewer: Viewer;
};

export type AuthUserRecord = {
  userId: string;
  email: string;
  passwordHash: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneVerified: boolean;
};

export type PhoneOtpRecord = {
  userId: string;
  codeHash: string;
  expiresAt: Date;
  attemptCount: number;
  lastSentAt: Date;
};

function parseCookies(cookieHeader: string | null) {
  const cookies = new Map<string, string>();
  if (!cookieHeader) {
    return cookies;
  }

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (!name || rest.length === 0) {
      continue;
    }
    cookies.set(name, decodeURIComponent(rest.join("=")));
  }

  return cookies;
}

function shouldUseLocalAuthFallback(error: unknown) {
  const allowInProduction = process.env.ALLOW_LOCAL_AUTH_FALLBACK === "true";
  if (process.env.NODE_ENV === "production" && !allowInProduction) {
    return false;
  }

  return (
    isPrismaUnavailableError(error) ||
    isPrismaMissingTableError(error, "auth_sessions") ||
    isPrismaMissingTableError(error, "users") ||
    isPrismaMissingTableError(error, "profiles") ||
    isPrismaMissingTableError(error, "subscriptions") ||
    isPrismaMissingColumnError(error, undefined, "emailverified") ||
    isPrismaMissingColumnError(error, undefined, "phonenumber") ||
    isPrismaMissingColumnError(error, undefined, "phoneverified") ||
    isPrismaForeignKeyError(error, "auth_sessions")
  );
}

function mapCachedUserToViewer(user: PublicUser): Viewer {
  return {
    userId: user.userId,
    email: user.email,
    emailVerified: user.emailVerified,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
    displayName: user.displayName,
    isGuest: user.isGuest,
    isAdmin: false,
    role: "user",
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
    currentPeriodEnd: user.currentPeriodEnd,
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId,
    createdAt: user.createdAt,
  };
}

function mapLocalAuthUserToRecord(user: NonNullable<Awaited<ReturnType<typeof getLocalAuthUserById>>>): AuthUserRecord {
  return {
    userId: user.userId,
    email: user.email,
    passwordHash: user.passwordHash,
    emailVerified: user.emailVerified,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
  };
}

function mapPrismaAuthUserToRecord(user: {
  id: string;
  email: string;
  passwordHash: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  phoneVerified: boolean;
}): AuthUserRecord {
  return {
    userId: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    emailVerified: user.emailVerified,
    phoneNumber: user.phoneNumber,
    phoneVerified: user.phoneVerified,
  };
}

function shouldUseLocalPhoneOtpFallback(error: unknown) {
  return (
    shouldUseLocalAuthFallback(error) ||
    isPrismaMissingTableError(error, "phone_otps") ||
    isPrismaMissingColumnError(error, "phone_otps")
  );
}

export function hashPassword(password: string) {
  const salt = randomUUID();
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) {
    return false;
  }

  // Legacy compatibility: support bcrypt hashes from older auth versions.
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
    try {
      return compareBcryptSync(password, storedHash);
    } catch {
      return false;
    }
  }

  const [salt, existingHash] = storedHash.split(":");
  if (!salt || !existingHash) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64);
  const existing = Buffer.from(existingHash, "hex");

  if (candidate.length !== existing.length) {
    return false;
  }

  return timingSafeEqual(candidate, existing);
}

export async function getAuthUserRecordByEmail(email: string): Promise<AuthUserRecord | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        emailVerified: true,
        phoneNumber: true,
        phoneVerified: true,
      },
    });

    return user ? mapPrismaAuthUserToRecord(user) : null;
  } catch (error) {
    if (!shouldUseLocalAuthFallback(error)) {
      throw error;
    }

    const user = await getLocalAuthUserByEmail(email);
    return user ? mapLocalAuthUserToRecord(user) : null;
  }
}

export async function getAuthUserRecordById(userId: string): Promise<AuthUserRecord | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        emailVerified: true,
        phoneNumber: true,
        phoneVerified: true,
      },
    });

    return user ? mapPrismaAuthUserToRecord(user) : null;
  } catch (error) {
    if (!shouldUseLocalAuthFallback(error)) {
      throw error;
    }

    const user = await getLocalAuthUserById(userId);
    return user ? mapLocalAuthUserToRecord(user) : null;
  }
}

export async function updateAuthUserRecord(
  userId: string,
  input: {
    passwordHash?: string;
    emailVerified?: boolean;
    phoneNumber?: string | null;
    phoneVerified?: boolean;
  }
): Promise<AuthUserRecord | null> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.passwordHash !== undefined ? { passwordHash: input.passwordHash } : {}),
        ...(input.emailVerified !== undefined ? { emailVerified: input.emailVerified } : {}),
        ...(Object.prototype.hasOwnProperty.call(input, "phoneNumber") ? { phoneNumber: input.phoneNumber } : {}),
        ...(input.phoneVerified !== undefined ? { phoneVerified: input.phoneVerified } : {}),
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        emailVerified: true,
        phoneNumber: true,
        phoneVerified: true,
      },
    });

    return mapPrismaAuthUserToRecord(user);
  } catch (error) {
    if (!shouldUseLocalAuthFallback(error)) {
      throw error;
    }

    const user = await updateLocalAuthUser(userId, input);
    return user ? mapLocalAuthUserToRecord(user) : null;
  }
}

export async function clearAllUserSessions(userId: string) {
  try {
    await prisma.authSession.deleteMany({
      where: { userId },
    });
  } catch (error) {
    if (!shouldUseLocalAuthFallback(error)) {
      throw error;
    }

    await deleteLocalAuthSessionsByUserId(userId);
  }
}

export async function getPhoneOtpRecord(userId: string): Promise<PhoneOtpRecord | null> {
  try {
    const record = await prisma.phoneOtp.findUnique({
      where: { userId },
    });

    return record
      ? {
          userId: record.userId,
          codeHash: record.codeHash,
          expiresAt: record.expiresAt,
          attemptCount: record.attemptCount,
          lastSentAt: record.lastSentAt,
        }
      : null;
  } catch (error) {
    if (!shouldUseLocalPhoneOtpFallback(error)) {
      throw error;
    }

    const record = await getLocalPhoneOtpByUserId(userId);
    return record ? mapLocalPhoneOtpRecord(record) : null;
  }
}

function mapLocalPhoneOtpRecord(record: LocalPhoneOtpRecord): PhoneOtpRecord {
  return {
    userId: record.userId,
    codeHash: record.codeHash,
    expiresAt: record.expiresAt,
    attemptCount: record.attemptCount,
    lastSentAt: record.lastSentAt,
  };
}

export async function savePhoneOtpRecord(input: PhoneOtpRecord) {
  try {
    await prisma.phoneOtp.upsert({
      where: { userId: input.userId },
      update: {
        codeHash: input.codeHash,
        expiresAt: input.expiresAt,
        attemptCount: input.attemptCount,
        lastSentAt: input.lastSentAt,
      },
      create: {
        userId: input.userId,
        codeHash: input.codeHash,
        expiresAt: input.expiresAt,
        attemptCount: input.attemptCount,
        lastSentAt: input.lastSentAt,
      },
    });
  } catch (error) {
    if (!shouldUseLocalPhoneOtpFallback(error)) {
      throw error;
    }

    await upsertLocalPhoneOtp(input);
  }
}

export async function updatePhoneOtpAttemptCount(userId: string, attemptCount: number) {
  try {
    await prisma.phoneOtp.update({
      where: { userId },
      data: { attemptCount },
    });
  } catch (error) {
    if (!shouldUseLocalPhoneOtpFallback(error)) {
      throw error;
    }

    await updateLocalPhoneOtpAttemptCount(userId, attemptCount);
  }
}

export async function deletePhoneOtpRecord(userId: string) {
  try {
    await prisma.phoneOtp.deleteMany({
      where: { userId },
    });
  } catch (error) {
    if (!shouldUseLocalPhoneOtpFallback(error)) {
      throw error;
    }

    await deleteLocalPhoneOtp(userId);
  }
}

export async function authenticateUserCredentials(input: {
  email: string;
  password: string;
}): Promise<AuthAccount | null> {
  try {
    const user = await getUserByEmail(input.email);
    if (!user) {
      const localUser = await authenticateLocalUser(input);
      return localUser
        ? {
            userId: localUser.userId,
            viewer: mapCachedUserToViewer(localUser),
          }
        : null;
    }

    if (!verifyPassword(input.password, user.passwordHash ?? null)) {
      // Migration compatibility: if the Prisma credential check fails,
      // try the local auth store before rejecting the sign-in attempt.
      const localUser = await authenticateLocalUser(input);
      return localUser
        ? {
            userId: localUser.userId,
            viewer: mapCachedUserToViewer(localUser),
          }
        : null;
    }

    return {
      userId: user.id,
      viewer: mapUserToViewer(user),
    };
  } catch (error) {
    if (!shouldUseLocalAuthFallback(error)) {
      throw error;
    }

    const user = await authenticateLocalUser(input);
    return user
      ? {
          userId: user.userId,
          viewer: mapCachedUserToViewer(user),
        }
      : null;
  }
}

export async function registerUserAccount(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<AuthAccount> {
  try {
    const user = await createUserAccount({
      email: input.email,
      passwordHash: hashPassword(input.password),
      displayName: input.displayName,
    });

    return {
      userId: user.id,
      viewer: mapUserToViewer(user),
    };
  } catch (error) {
    if (!shouldUseLocalAuthFallback(error)) {
      throw error;
    }

    const user = await createLocalUser(input);
    return {
      userId: user.userId,
      viewer: mapCachedUserToViewer(user),
    };
  }
}

export async function resolveViewer(req: Request) {
  const sessionToken = parseCookies(req.headers.get("cookie")).get(AUTH_COOKIE_NAME);
  if (!sessionToken) {
    return getGuestViewer();
  }

  try {
    const session = await getAuthSessionByToken(sessionToken);
    if (!session) {
      const localUser = await getLocalUserBySessionToken(sessionToken);
      return localUser ? mapCachedUserToViewer(localUser) : getGuestViewer();
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await deleteAuthSessionRecord(sessionToken);
      return getGuestViewer();
    }

    return mapUserToViewer(session.user);
  } catch (error) {
    if (!shouldUseLocalAuthFallback(error)) {
      throw error;
    }

    const user = await getLocalUserBySessionToken(sessionToken);
    return user ? mapCachedUserToViewer(user) : getGuestViewer();
  }
}

export async function attachAuthSession(response: NextResponse, userId: string) {
  const setSessionCookie = (sessionToken: string, expiresAt: Date | string) => {
    response.cookies.set(AUTH_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt,
    });
  };

  try {
    await deleteExpiredAuthSessions();

    const sessionToken = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    await createAuthSessionRecord({
      userId,
      sessionToken,
      expiresAt,
    });

    setSessionCookie(sessionToken, expiresAt);
  } catch (error) {
    if (!shouldUseLocalAuthFallback(error)) {
      throw error;
    }

    const session = await createLocalAuthSession(userId);
    setSessionCookie(session.sessionToken, session.expiresAt);
  }
}

export async function clearViewerSession(req: Request, response: NextResponse) {
  const sessionToken = parseCookies(req.headers.get("cookie")).get(AUTH_COOKIE_NAME);

  if (sessionToken) {
    try {
      await deleteAuthSessionRecord(sessionToken);
    } catch (error) {
      if (!shouldUseLocalAuthFallback(error)) {
        throw error;
      }
    }

    await deleteLocalAuthSession(sessionToken);
  }

  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}
