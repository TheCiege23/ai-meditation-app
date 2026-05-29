import { NextResponse } from "next/server";

import { maskStripeReference } from "@/lib/admin";
import { requireAdminApiViewer } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";
import {
  findUserByStripeCustomerId,
  getUserByEmail,
  getUserById,
} from "@/lib/user-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type WebhookEventRow = {
  id: string;
  provider: string;
  eventType: string;
  externalId: string | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
};

export async function GET(req: Request) {
  const viewer = await requireAdminApiViewer(req);
  if (viewer instanceof NextResponse) return viewer;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json(
      {
        error:
          "Provide a search query: email address, Stripe customer ID (cus_…), or subscription ID (sub_…).",
      },
      { status: 400 }
    );
  }

  // Detect query type by prefix
  let user = null;
  if (q.startsWith("cus_")) {
    user = await findUserByStripeCustomerId(q);
  } else if (q.startsWith("sub_")) {
    const sub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: q },
      select: { userId: true },
    });
    if (sub) user = await getUserById(sub.userId);
  } else {
    // Assume email address
    user = await getUserByEmail(q);
  }

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const stripeCustomerId = user.subscription?.stripeCustomerId ?? null;
  const stripeSubscriptionId = user.subscription?.stripeSubscriptionId ?? null;

  // Fetch recent Stripe webhook events and filter by those that reference
  // this customer or subscription ID in their payload.
  const webhookEvents: WebhookEventRow[] = [];
  if (stripeCustomerId || stripeSubscriptionId) {
    const recentEvents = await prisma.webhookEvent.findMany({
      where: { provider: "stripe" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const filtered = recentEvents.filter((ev) => {
      const payload = JSON.stringify(ev.payloadJson ?? "");
      return (
        (stripeCustomerId ? payload.includes(stripeCustomerId) : false) ||
        (stripeSubscriptionId ? payload.includes(stripeSubscriptionId) : false)
      );
    });

    for (const ev of filtered.slice(0, 15)) {
      webhookEvents.push({
        id: ev.id,
        provider: ev.provider,
        eventType: ev.eventType,
        externalId: ev.externalId ?? null,
        status: ev.status,
        errorMessage: ev.errorMessage ?? null,
        createdAt: ev.createdAt.toISOString(),
      });
    }
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? null,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
    },
    subscription: user.subscription
      ? {
          tier: user.subscription.tier,
          status: user.subscription.status,
          billingInterval: user.subscription.billingInterval ?? null,
          currentPeriodEnd:
            user.subscription.currentPeriodEnd?.toISOString() ?? null,
          stripeCustomerId: maskStripeReference(stripeCustomerId),
          stripeSubscriptionId: maskStripeReference(stripeSubscriptionId),
          createdAt: user.subscription.createdAt.toISOString(),
          updatedAt: user.subscription.updatedAt.toISOString(),
        }
      : null,
    webhookEvents,
  });
}
