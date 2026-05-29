import type Stripe from "stripe";

import { prisma } from "@/lib/db";
import { getUserById, getUserSubscription, upsertUserSubscription } from "@/lib/user-store";
import { assertStripeServerReady } from "@/lib/stripe";
import type { SubscriptionStatus, SubscriptionTier } from "@/lib/types";

export function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "trialing";
    case "active":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "inactive";
  }
}

export async function resolveUserTier(userId: string): Promise<SubscriptionTier> {
  const subscription = await getUserSubscription(userId);
  return subscription?.tier ?? "free";
}

export async function upsertStripeCustomerForUser(userId: string) {
  const stripe = assertStripeServerReady();
  const user = await getUserById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.subscription?.stripeCustomerId) {
    return user.subscription.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.displayName ?? user.profile?.fullName ?? user.email,
    metadata: {
      userId: user.id,
      app: "ChimAura",
    },
  });

  await upsertUserSubscription({
    userId: user.id,
    stripeCustomerId: customer.id,
    stripeSubscriptionId: user.subscription?.stripeSubscriptionId ?? null,
    tier: user.subscription?.tier ?? "free",
    status: user.subscription?.status ?? "inactive",
    billingInterval: user.subscription?.billingInterval ?? null,
    currentPeriodEnd: user.subscription?.currentPeriodEnd ?? null,
  });

  return customer.id;
}

export async function markSubscriptionActive(input: {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  billingInterval?: string | null;
  currentPeriodEnd: Date | string | null;
}) {
  return upsertUserSubscription({
    userId: input.userId,
    stripeCustomerId: input.stripeCustomerId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    tier: "premium",
    status: input.status,
    billingInterval: input.billingInterval ?? null,
    currentPeriodEnd: input.currentPeriodEnd,
  });
}

export async function markSubscriptionInactive(input: {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  billingInterval?: string | null;
  status?: SubscriptionStatus;
}) {
  return upsertUserSubscription({
    userId: input.userId,
    stripeCustomerId: input.stripeCustomerId ?? null,
    stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    tier: "free",
    status: input.status ?? "canceled",
    billingInterval: input.billingInterval ?? null,
    currentPeriodEnd: null,
  });
}

export async function findUserIdForStripeCustomer(stripeCustomerId: string) {
  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeCustomerId,
    },
    select: {
      userId: true,
    },
  });

  return subscription?.userId ?? null;
}
