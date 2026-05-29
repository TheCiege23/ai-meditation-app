import { NextResponse } from "next/server";

import { resolveViewer } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { getAppUrl, stripe } from "@/lib/stripe";
import { getUserSubscription } from "@/lib/user-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const viewer = await resolveViewer(req);
  if (viewer.isGuest || !viewer.userId) {
    return errorResponse("Please sign in first.", 401);
  }

  if (!stripe) {
    return errorResponse("Stripe is not configured.", 500);
  }

  const subscription = await getUserSubscription(viewer.userId);
  if (!subscription?.stripeCustomerId) {
    return errorResponse("No billing profile found for this account.", 400);
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${getAppUrl()}/pricing`,
  });

  return NextResponse.json({ url: session.url });
}