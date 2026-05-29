import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { getAppUrl, getStripePriceId } from "@/lib/stripe";
import { upsertStripeCustomerForUser } from "@/lib/subscription";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in to upgrade.", 401);
  }

  if (!viewer.emailVerified) {
    return errorResponse("Please verify your email before upgrading.", 403);
  }

  if (!stripe) {
    return errorResponse("Stripe is not configured.", 500);
  }

  const body = await req.json().catch(() => ({}));
  const rawInterval = body?.interval;
  if (rawInterval !== "monthly" && rawInterval !== "yearly") {
    return errorResponse("Invalid interval. Must be 'monthly' or 'yearly'.", 400);
  }
  const interval = rawInterval as "monthly" | "yearly";

  const priceId = getStripePriceId(interval);
  if (!priceId) {
    return errorResponse(`Stripe price for the ${interval} plan is not configured. Contact support.`, 500);
  }

  const customerId = await upsertStripeCustomerForUser(viewer.userId);
  const appUrl = getAppUrl();
  const successUrl = `${appUrl}/pricing?checkout=success`;
  const cancelUrl = `${appUrl}/pricing?checkout=cancelled`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: viewer.userId,
      app: "ChimAura",
      tier: "premium",
      interval,
    },
    subscription_data: {
      metadata: {
        userId: viewer.userId,
        app: "ChimAura",
        tier: "premium",
        interval,
      },
    },
  });

  return NextResponse.json({
    url: session.url,
    sessionId: session.id,
  });
}