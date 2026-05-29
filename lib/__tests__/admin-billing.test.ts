/**
 * Admin billing tests — Part H.
 *
 * Covers:
 *  - mapStripeStatus pure-function correctness for all Stripe status values.
 *  - maskStripeReference display masking.
 *  - Static guard checks: lookup and resync route files exist, call
 *    requireAdminApiViewer, check instanceof NextResponse, and
 *    include correct HTTP status codes.
 *  - No raw secrets are referenced in lookup response code.
 *
 * Run with: npx tsx --test lib/__tests__/admin-billing.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { ADMIN_NAV_ITEMS, maskStripeReference } from "../admin";
import { mapStripeStatus } from "../subscription";

const ROOT = process.cwd();

// ── mapStripeStatus ───────────────────────────────────────────────────────────

describe("mapStripeStatus", () => {
  it("maps 'active' → 'active'", () => {
    assert.equal(mapStripeStatus("active"), "active");
  });

  it("maps 'trialing' → 'trialing'", () => {
    assert.equal(mapStripeStatus("trialing"), "trialing");
  });

  it("maps 'past_due' → 'past_due'", () => {
    assert.equal(mapStripeStatus("past_due"), "past_due");
  });

  it("maps 'unpaid' → 'past_due' (treated same as past_due)", () => {
    assert.equal(mapStripeStatus("unpaid"), "past_due");
  });

  it("maps 'canceled' → 'canceled'", () => {
    assert.equal(mapStripeStatus("canceled"), "canceled");
  });

  it("maps 'incomplete_expired' → 'canceled'", () => {
    assert.equal(mapStripeStatus("incomplete_expired"), "canceled");
  });

  it("maps unknown/paused statuses → 'inactive'", () => {
    // TypeScript cast needed because these are valid Stripe statuses not in our local enum.
    assert.equal(mapStripeStatus("incomplete" as Parameters<typeof mapStripeStatus>[0]), "inactive");
    assert.equal(mapStripeStatus("paused" as Parameters<typeof mapStripeStatus>[0]), "inactive");
  });
});

// ── maskStripeReference ───────────────────────────────────────────────────────

describe("maskStripeReference", () => {
  it("returns 'Not connected' for null", () => {
    assert.equal(maskStripeReference(null), "Not connected");
  });

  it("returns 'Not connected' for undefined", () => {
    assert.equal(maskStripeReference(undefined), "Not connected");
  });

  it("returns short IDs (≤ 10 chars) unchanged", () => {
    assert.equal(maskStripeReference("cus_12345"), "cus_12345");
  });

  it("masks a long Stripe customer ID — keeps first 6 and last 4 chars", () => {
    // e.g. "cus_AbCdEfGhIjKlMnOp" (19 chars)
    const id = "cus_AbCdEfGhIjKlMnOp";
    const masked = maskStripeReference(id);
    assert.equal(masked, `${id.slice(0, 6)}...${id.slice(-4)}`);
  });

  it("masks a long Stripe subscription ID", () => {
    const id = "sub_XxXxXxXxXxXxXxXxXx";
    const masked = maskStripeReference(id);
    assert.equal(masked, `${id.slice(0, 6)}...${id.slice(-4)}`);
  });
});

// ── Admin guard wiring (static analysis) ─────────────────────────────────────

describe("admin billing API — guard wiring and response codes", () => {
  const lookupPath = join(
    ROOT,
    "app",
    "api",
    "admin",
    "billing",
    "lookup",
    "route.ts"
  );
  const resyncPath = join(
    ROOT,
    "app",
    "api",
    "admin",
    "billing",
    "resync",
    "route.ts"
  );

  it("lookup route file exists", () => {
    assert.ok(
      existsSync(lookupPath),
      "app/api/admin/billing/lookup/route.ts must exist"
    );
  });

  it("resync route file exists", () => {
    assert.ok(
      existsSync(resyncPath),
      "app/api/admin/billing/resync/route.ts must exist"
    );
  });

  it("lookup route calls requireAdminApiViewer (non-admin users are rejected)", () => {
    const src = readFileSync(lookupPath, "utf-8");
    assert.ok(
      src.includes("requireAdminApiViewer"),
      "lookup route must call requireAdminApiViewer"
    );
  });

  it("lookup route checks instanceof NextResponse (guard result is forwarded)", () => {
    const src = readFileSync(lookupPath, "utf-8");
    assert.ok(
      src.includes("instanceof NextResponse"),
      "lookup route must short-circuit on instanceof NextResponse"
    );
  });

  it("resync route calls requireAdminApiViewer (non-admin users are rejected)", () => {
    const src = readFileSync(resyncPath, "utf-8");
    assert.ok(
      src.includes("requireAdminApiViewer"),
      "resync route must call requireAdminApiViewer"
    );
  });

  it("resync route checks instanceof NextResponse (guard result is forwarded)", () => {
    const src = readFileSync(resyncPath, "utf-8");
    assert.ok(
      src.includes("instanceof NextResponse"),
      "resync route must short-circuit on instanceof NextResponse"
    );
  });

  it("resync route returns 422 when no Stripe subscription is linked", () => {
    const src = readFileSync(resyncPath, "utf-8");
    assert.ok(
      src.includes("422"),
      "resync route must return 422 when stripeSubscriptionId is absent"
    );
  });

  it("resync route returns 400 when userId is missing", () => {
    const src = readFileSync(resyncPath, "utf-8");
    assert.ok(
      src.includes("400"),
      "resync route must return 400 for missing userId"
    );
  });

  it("lookup route does not expose raw STRIPE_SECRET_KEY in response", () => {
    const src = readFileSync(lookupPath, "utf-8");
    // The lookup route must not read or forward STRIPE_SECRET_KEY
    assert.ok(
      !src.includes("STRIPE_SECRET_KEY"),
      "lookup route must not reference STRIPE_SECRET_KEY"
    );
  });
});

// ── Billing page and nav ──────────────────────────────────────────────────────

describe("admin billing page and navigation", () => {
  it("admin billing page file exists", () => {
    const pagePath = join(ROOT, "app", "admin", "billing", "page.tsx");
    assert.ok(existsSync(pagePath), "app/admin/billing/page.tsx must exist");
  });

  it("billing page calls requireAdminViewer (access is protected)", () => {
    const pagePath = join(ROOT, "app", "admin", "billing", "page.tsx");
    const src = readFileSync(pagePath, "utf-8");
    assert.ok(
      src.includes("requireAdminViewer"),
      "billing page must call requireAdminViewer"
    );
  });

  it("ADMIN_NAV_ITEMS includes a Billing entry pointing to /admin/billing", () => {
    const billingEntry = (
      ADMIN_NAV_ITEMS as ReadonlyArray<{ href: string; label: string }>
    ).find((item) => item.href === "/admin/billing");
    assert.ok(billingEntry, "ADMIN_NAV_ITEMS must include { href: '/admin/billing' }");
    assert.equal(billingEntry.label, "Billing");
  });
});
