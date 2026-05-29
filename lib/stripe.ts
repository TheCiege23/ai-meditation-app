import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getStripePriceId(interval: "monthly" | "yearly") {
  if (interval === "yearly") {
    return process.env.STRIPE_PRICE_YEARLY ?? "";
  }

  return process.env.STRIPE_PRICE_MONTHLY ?? "";
}

export function assertStripeServerReady() {
  if (!stripe) {
    throw new Error("Stripe is not configured. Add STRIPE_SECRET_KEY.");
  }

  return stripe;
}