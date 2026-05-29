import { NextResponse } from "next/server";

import { isPrismaUnavailableError, prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AuthDbHealthRow = {
  users_table: string | null;
  auth_sessions_table: string | null;
};

export async function GET() {
  const allowLocalAuthFallback = process.env.ALLOW_LOCAL_AUTH_FALLBACK === "true";

  try {
    const result = await prisma.$queryRaw<AuthDbHealthRow[]>`
      SELECT
        to_regclass('public.users')::text AS users_table,
        to_regclass('public.auth_sessions')::text AS auth_sessions_table
    `;

    const row = result[0] ?? { users_table: null, auth_sessions_table: null };
    const usersTableExists = Boolean(row.users_table);
    const authSessionsTableExists = Boolean(row.auth_sessions_table);
    const healthy = usersTableExists && authSessionsTableExists;

    return NextResponse.json(
      {
        ok: healthy,
        checks: {
          prismaReachable: true,
          usersTableExists,
          authSessionsTableExists,
          allowLocalAuthFallback,
        },
        message: healthy
          ? "Primary auth database is reachable and required tables exist."
          : "Primary auth database schema is incomplete for auth. Run migrations before sign-up/sign-in traffic.",
      },
      { status: healthy ? 200 : 503 }
    );
  } catch (error) {
    const unavailable = isPrismaUnavailableError(error);

    return NextResponse.json(
      {
        ok: false,
        checks: {
          prismaReachable: false,
          usersTableExists: false,
          authSessionsTableExists: false,
          allowLocalAuthFallback,
        },
        message: unavailable
          ? "Primary auth database is unreachable."
          : "Auth database health check failed.",
        detail: error instanceof Error ? error.message : "Unknown health check error.",
      },
      { status: 503 }
    );
  }
}
