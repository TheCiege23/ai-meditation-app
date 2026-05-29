import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { recordWebhookEvent } from "@/lib/admin-logs";
import { errorResponse } from "@/lib/api-response";
import { stripe } from "@/lib/stripe";
import {
  findUserIdForStripeCustomer,
  mapStripeStatus,
  markSubscriptionActive,
  markSubscriptionInactive,
} from "@/lib/subscription";
import { getUserByEmail } from "@/lib/user-store";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

function getInvoiceBillingInterval(invoice: Stripe.Invoice) {
  const firstLine = invoice.lines.data[0] as
    | { price?: { recurring?: { interval?: string | null } | null } | null }
    | undefined;

  return firstLine?.price?.recurring?.interval ?? null;
}

function getCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined) {
  if (!customer) {
    return null;
  }

  return typeof customer === "string" ? customer : customer.id;
}

async function getUserIdFromEmail(email: string | null | undefined) {
  if (!email) {
    return null;
  }

  const user = await getUserByEmail(email);
  return user?.id ?? null;
}

async function getUserIdFromCustomerId(customerId: string | null | undefined) {
  if (!customerId) {
    return null;
  }

  const knownUserId = await findUserIdForStripeCustomer(customerId);
  if (knownUserId) {
    return knownUserId;
  }

  if (!stripe) {
    return null;
  }

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!customer || customer.deleted) {
      return null;
    }

    return getUserIdFromEmail(customer.email);
  } catch (error) {
    console.error("Unable to look up Stripe customer during webhook sync:", error);
    return null;
  }
}

async function getUserIdFromCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.metadata?.userId) {
    return session.metadata.userId;
  }

  const emailMatch = await getUserIdFromEmail(session.customer_details?.email ?? session.customer_email ?? null);
  if (emailMatch) {
    return emailMatch;
  }

  return getUserIdFromCustomerId(getCustomerId(session.customer));
}

export async function POST(req: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return errorResponse("Stripe webhook is not configured.", 500);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return errorResponse("Missing Stripe signature.", 400);
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    await recordWebhookEvent({
      provider: "stripe",
      eventType: "signature_failed",
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Signature validation failed.",
    });

    return errorResponse(
      "Invalid Stripe signature.",
      400,
      error instanceof Error ? error.message : undefined
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = getCustomerId(session.customer);
        const userId = await getUserIdFromCheckoutSession(session);
        if (userId) {
          await markSubscriptionActive({
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId:
              typeof session.subscription === "string"
                ? session.subscription
                : session.subscription?.id ?? null,
            status: session.payment_status === "paid" ? "active" : "trialing",
            billingInterval: session.metadata?.interval ?? null,
            currentPeriodEnd: null,
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = String(subscription.customer);
        const userId = subscription.metadata?.userId ?? (await getUserIdFromCustomerId(customerId));

        if (userId) {
          await markSubscriptionActive({
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            status: mapStripeStatus(subscription.status),
            billingInterval: subscription.metadata?.interval ?? subscription.items.data[0]?.price?.recurring?.interval ?? null,
            currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = String(subscription.customer);
        const userId = subscription.metadata?.userId ?? (await getUserIdFromCustomerId(customerId));

        if (userId) {
          await markSubscriptionInactive({
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            billingInterval: subscription.metadata?.interval ?? subscription.items.data[0]?.price?.recurring?.interval ?? null,
            status: "canceled",
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = getCustomerId(invoice.customer);
        if (customerId) {
          const userId = await getUserIdFromCustomerId(customerId);
          if (userId) {
            const periodEndSeconds = invoice.lines?.data[0]?.period?.end;
            const currentPeriodEnd = periodEndSeconds ? new Date(periodEndSeconds * 1000) : null;
            // subscription ID will be set/updated via customer.subscription.updated
            await markSubscriptionActive({
              userId,
              stripeCustomerId: customerId,
              stripeSubscriptionId: null,
              status: "active",
              billingInterval: getInvoiceBillingInterval(invoice),
              currentPeriodEnd,
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
        if (customerId) {
          const userId = await getUserIdFromCustomerId(customerId);
          if (userId) {
            await markSubscriptionActive({
              userId,
              stripeCustomerId: customerId,
              stripeSubscriptionId: null,
              status: "past_due",
              billingInterval: getInvoiceBillingInterval(invoice),
              currentPeriodEnd: null,
            });
          }
        }
        break;
      }

      default:
        break;
    }

    await recordWebhookEvent({
      provider: "stripe",
      eventType: event.type,
      externalId: event.id,
      status: "processed",
      payloadJson: { livemode: event.livemode, type: event.type },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    await recordWebhookEvent({
      provider: "stripe",
      eventType: event.type,
      externalId: event.id,
      status: "failed",
      payloadJson: { livemode: event.livemode, type: event.type },
      errorMessage: error instanceof Error ? error.message : "Webhook processing failed.",
    });

    return errorResponse(
      "Failed to process Stripe webhook.",
      500,
      error instanceof Error ? error.message : undefined
    );
  }
}
