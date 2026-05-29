import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { requireAdminApiViewer } from "@/lib/admin-auth";
import { createAdminAuditLog } from "@/lib/admin-logs";
import { stripe } from "@/lib/stripe";
import {
  mapStripeStatus,
  markSubscriptionActive,
  markSubscriptionInactive,
} from "@/lib/subscription";
import { getUserById } from "@/lib/user-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function resolveCustomerId(
  customer:
    | string
    | Stripe.Customer
    | Stripe.DeletedCustomer
    | null
    | undefined
): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

export async function POST(req: Request) {
  const viewer = await requireAdminApiViewer(req);
  if (viewer instanceof NextResponse) return viewer;

  const body = await req.json().catch(() => null);
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required." },
      { status: 400 }
    );
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const stripeSubscriptionId = user.subscription?.stripeSubscriptionId ?? null;
  if (!stripeSubscriptionId) {
    return NextResponse.json(
      { error: "No Stripe subscription is linked to this user." },
      { status: 422 }
    );
  }

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured on this server." },
      { status: 503 }
    );
  }

  let stripeSub;
  try {
    stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Stripe lookup failed: ${message}` },
      { status: 502 }
    );
  }

  const newStatus = mapStripeStatus(stripeSub.status);
  const isActive = newStatus === "active" || newStatus === "trialing";

  const stripeCustomerId = resolveCustomerId(stripeSub.customer);

  // Prefer metadata.interval (set at checkout), fall back to price recurring interval
  const billingInterval =
    (stripeSub.metadata?.interval as string | undefined) ??
    stripeSub.items.data[0]?.price?.recurring?.interval ??
    null;

  const rawPeriodEnd = (stripeSub as unknown as { current_period_end?: number })
    .current_period_end;
  const currentPeriodEnd =
    typeof rawPeriodEnd === "number" ? new Date(rawPeriodEnd * 1000) : null;

  if (isActive) {
    await markSubscriptionActive({
      userId,
      stripeCustomerId,
      stripeSubscriptionId: stripeSub.id,
      status: newStatus,
      billingInterval,
      currentPeriodEnd,
    });
  } else {
    await markSubscriptionInactive({
      userId,
      stripeCustomerId,
      stripeSubscriptionId: stripeSub.id,
      billingInterval,
      status: newStatus,
    });
  }

  await createAdminAuditLog({
    adminUserId: viewer.userId!,
    targetUserId: userId,
    action: "subscription.resync",
    entityType: "subscription",
    entityId: stripeSub.id,
    targetType: "user",
    metadataJson: {
      stripeStatus: stripeSub.status,
      mappedStatus: newStatus,
      billingInterval,
      currentPeriodEnd: currentPeriodEnd?.toISOString() ?? null,
    },
  });

  return NextResponse.json({
    ok: true,
    userId,
    stripeStatus: stripeSub.status,
    mappedStatus: newStatus,
    billingInterval,
    currentPeriodEnd: currentPeriodEnd?.toISOString() ?? null,
  });
}
