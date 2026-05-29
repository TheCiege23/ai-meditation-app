import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function isPrismaMissingTableError(error: unknown, tableName?: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2021") {
    return false;
  }

  if (!tableName) {
    return true;
  }

  return error.message.toLowerCase().includes(tableName.toLowerCase());
}

export function isPrismaMissingColumnError(
  error: unknown,
  tableName?: string,
  columnName?: string
) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2022") {
    return false;
  }

  const message = error.message.toLowerCase();

  if (tableName && !message.includes(tableName.toLowerCase())) {
    return false;
  }

  if (columnName && !message.includes(columnName.toLowerCase())) {
    return false;
  }

  return true;
}

export function isPrismaForeignKeyError(error: unknown, constraintHint?: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2003") {
    return false;
  }

  if (!constraintHint) {
    return true;
  }

  return error.message.toLowerCase().includes(constraintHint.toLowerCase());
}

export function isPrismaUnavailableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return error.message.toLowerCase().includes("can't reach database server");
  }

  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("can't reach database server") ||
    message.includes("failed to connect to database") ||
    message.includes("connection pool timeout")
  );
}
