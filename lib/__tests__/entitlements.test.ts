/**
 * Unit tests for getEffectiveEntitlements and isPremiumAccessActive.
 * Run with: npx tsx --test lib/__tests__/entitlements.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getEffectiveEntitlements, isPremiumAccessActive } from "../entitlements";

const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();

describe("isPremiumAccessActive", () => {
  it("returns true for active premium with future period end", () => {
    assert.equal(
      isPremiumAccessActive({ subscriptionTier: "premium", subscriptionStatus: "active", currentPeriodEnd: futureDate }),
      true
    );
  });

  it("returns true for trialing premium with future period end", () => {
    assert.equal(
      isPremiumAccessActive({ subscriptionTier: "premium", subscriptionStatus: "trialing", currentPeriodEnd: futureDate }),
      true
    );
  });

  it("returns true for active premium with null period end", () => {
    assert.equal(
      isPremiumAccessActive({ subscriptionTier: "premium", subscriptionStatus: "active", currentPeriodEnd: null }),
      true
    );
  });

  it("returns false for free tier", () => {
    assert.equal(
      isPremiumAccessActive({ subscriptionTier: "free", subscriptionStatus: "inactive", currentPeriodEnd: null }),
      false
    );
  });

  it("returns false for past_due premium", () => {
    assert.equal(
      isPremiumAccessActive({ subscriptionTier: "premium", subscriptionStatus: "past_due", currentPeriodEnd: futureDate }),
      false
    );
  });

  it("returns false for canceled premium", () => {
    assert.equal(
      isPremiumAccessActive({ subscriptionTier: "premium", subscriptionStatus: "canceled", currentPeriodEnd: futureDate }),
      false
    );
  });

  it("returns false for active premium with expired period end", () => {
    assert.equal(
      isPremiumAccessActive({ subscriptionTier: "premium", subscriptionStatus: "active", currentPeriodEnd: pastDate }),
      false
    );
  });

  it("returns false for inactive premium", () => {
    assert.equal(
      isPremiumAccessActive({ subscriptionTier: "premium", subscriptionStatus: "inactive", currentPeriodEnd: null }),
      false
    );
  });
});

describe("getEffectiveEntitlements", () => {
  it("returns premium entitlements for active premium", () => {
    const result = getEffectiveEntitlements({
      subscriptionTier: "premium",
      subscriptionStatus: "active",
      currentPeriodEnd: futureDate,
    });
    assert.equal(result.tier, "premium");
    assert.equal(result.meditationsPerDay, null);
    assert.equal(result.premiumVoices, true);
    assert.equal(result.sleepMode, true);
  });

  it("returns free entitlements for past_due premium", () => {
    const result = getEffectiveEntitlements({
      subscriptionTier: "premium",
      subscriptionStatus: "past_due",
      currentPeriodEnd: futureDate,
    });
    assert.equal(result.tier, "free");
    assert.equal(result.meditationsPerDay, 3);
    assert.equal(result.premiumVoices, false);
  });

  it("returns free entitlements for canceled premium with expired period", () => {
    const result = getEffectiveEntitlements({
      subscriptionTier: "premium",
      subscriptionStatus: "canceled",
      currentPeriodEnd: pastDate,
    });
    assert.equal(result.tier, "free");
  });

  it("returns free entitlements for free tier", () => {
    const result = getEffectiveEntitlements({
      subscriptionTier: "free",
      subscriptionStatus: "inactive",
      currentPeriodEnd: null,
    });
    assert.equal(result.tier, "free");
    assert.equal(result.courses, false);
    assert.equal(result.focusTimer, false);
  });

  it("returns premium entitlements for trialing premium", () => {
    const result = getEffectiveEntitlements({
      subscriptionTier: "premium",
      subscriptionStatus: "trialing",
      currentPeriodEnd: null,
    });
    assert.equal(result.tier, "premium");
    assert.equal(result.courses, true);
  });

  // Regression: premium tier alone must NOT grant premium entitlements.
  it("returns free entitlements for inactive premium (tier alone is not enough)", () => {
    const result = getEffectiveEntitlements({
      subscriptionTier: "premium",
      subscriptionStatus: "inactive",
      currentPeriodEnd: null,
    });
    assert.equal(result.tier, "free");
    assert.equal(result.meditationsPerDay, 3);
    assert.equal(result.premiumVoices, false);
    assert.equal(result.courses, false);
  });

  it("returns free entitlements for canceled premium with a future period end", () => {
    // Canceled subscriptions must not retain premium even if period hasn't expired.
    const result = getEffectiveEntitlements({
      subscriptionTier: "premium",
      subscriptionStatus: "canceled",
      currentPeriodEnd: futureDate,
    });
    assert.equal(result.tier, "free");
    assert.equal(result.premiumVoices, false);
  });

  it("returns free entitlements for active premium with an expired period end", () => {
    // An expired billing period must downgrade access regardless of status.
    const result = getEffectiveEntitlements({
      subscriptionTier: "premium",
      subscriptionStatus: "active",
      currentPeriodEnd: pastDate,
    });
    assert.equal(result.tier, "free");
    assert.equal(result.sleepMode, false);
    assert.equal(result.maxDurationMinutes, 5);
  });

  it("returns premium entitlements for active premium with a future period end", () => {
    const result = getEffectiveEntitlements({
      subscriptionTier: "premium",
      subscriptionStatus: "active",
      currentPeriodEnd: futureDate,
    });
    assert.equal(result.tier, "premium");
    assert.equal(result.maxDurationMinutes, 60);
    assert.equal(result.sleepMode, true);
    assert.equal(result.soundMixer, true);
  });
});
