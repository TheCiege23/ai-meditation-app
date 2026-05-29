import { createHash } from "node:crypto";

import { resolveViewer } from "@/lib/auth";
import type { RequestIdentity } from "@/lib/types";

const IP_HEADER_CANDIDATES = [
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
  "x-vercel-forwarded-for",
  "forwarded",
];

export function getClientIp(req: Request) {
  for (const headerName of IP_HEADER_CANDIDATES) {
    const raw = req.headers.get(headerName);
    if (!raw) {
      continue;
    }

    const firstSegment = raw.split(",")[0]?.trim();
    if (firstSegment) {
      return firstSegment;
    }
  }

  return "0.0.0.0";
}

export function hashIp(ip: string) {
  const salt = process.env.IP_HASH_SALT ?? "chimaura-ip-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function resolveRequestIdentity(req: Request): Promise<RequestIdentity> {
  const viewer = await resolveViewer(req);
  const ip = getClientIp(req);
  const ipHash = hashIp(ip);
  const userId = viewer.isGuest ? null : viewer.userId;

  return {
    viewer,
    userId,
    identifier: userId ? `user:${userId}` : `ip:${ipHash}`,
    ip,
    ipHash,
    userAgent: req.headers.get("user-agent"),
    isAuthenticated: !viewer.isGuest,
  };
}