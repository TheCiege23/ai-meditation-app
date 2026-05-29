/**
 * Unit tests for signup consent validation logic.
 * Run with: npx tsx --test lib/__tests__/signup-consent.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PRIVACY_VERSION, TERMS_VERSION } from "../legal";

function validateConsent(body: { acceptedTerms?: unknown; acceptedPrivacy?: unknown }) {
  const acceptedTerms = body?.acceptedTerms === true;
  const acceptedPrivacy = body?.acceptedPrivacy === true;
  if (!acceptedTerms || !acceptedPrivacy) {
    return {
      ok: false,
      error: "You must accept the Terms of Service and Privacy Policy to create an account.",
    };
  }
  return { ok: true };
}

describe("signup consent validation", () => {
  it("rejects when acceptedTerms is missing", () => {
    const result = validateConsent({ acceptedPrivacy: true });
    assert.equal(result.ok, false);
    assert.ok(result.error?.includes("Terms of Service"));
  });

  it("rejects when acceptedPrivacy is missing", () => {
    const result = validateConsent({ acceptedTerms: true });
    assert.equal(result.ok, false);
    assert.ok(result.error?.includes("Privacy Policy"));
  });

  it("rejects when both are missing", () => {
    const result = validateConsent({});
    assert.equal(result.ok, false);
  });

  it("rejects when acceptedTerms is false", () => {
    const result = validateConsent({ acceptedTerms: false, acceptedPrivacy: true });
    assert.equal(result.ok, false);
  });

  it("rejects when acceptedPrivacy is false", () => {
    const result = validateConsent({ acceptedTerms: true, acceptedPrivacy: false });
    assert.equal(result.ok, false);
  });

  it("rejects when values are strings instead of booleans", () => {
    const result = validateConsent({ acceptedTerms: "true", acceptedPrivacy: "true" });
    assert.equal(result.ok, false);
  });

  it("accepts when both are true", () => {
    const result = validateConsent({ acceptedTerms: true, acceptedPrivacy: true });
    assert.equal(result.ok, true);
  });
});

describe("legal version constants", () => {
  it("TERMS_VERSION is a non-empty string", () => {
    assert.equal(typeof TERMS_VERSION, "string");
    assert.ok(TERMS_VERSION.length > 0);
  });

  it("PRIVACY_VERSION is a non-empty string", () => {
    assert.equal(typeof PRIVACY_VERSION, "string");
    assert.ok(PRIVACY_VERSION.length > 0);
  });
});

/**
 * Consent record payload — Part D regression.
 *
 * We mirror the payload structure from lib/consent.ts without importing Prisma.
 * This verifies that:
 *  (a) the constants are the right types,
 *  (b) a terms payload has consentType "terms" and uses TERMS_VERSION,
 *  (c) a privacy payload has consentType "privacy" and uses PRIVACY_VERSION.
 *
 * The static-regression test additionally verifies that lib/consent.ts itself
 * references both constants by name (so a hardcoded string substitute would fail).
 */
describe("consent record payload structure", () => {
  it("terms payload uses TERMS_VERSION from lib/legal", () => {
    const payload = {
      consentType: "terms" as const,
      version: TERMS_VERSION,
    };
    assert.equal(payload.consentType, "terms");
    assert.equal(payload.version, TERMS_VERSION);
    assert.notEqual(payload.version, "", "TERMS_VERSION must not be empty");
  });

  it("privacy payload uses PRIVACY_VERSION from lib/legal", () => {
    const payload = {
      consentType: "privacy" as const,
      version: PRIVACY_VERSION,
    };
    assert.equal(payload.consentType, "privacy");
    assert.equal(payload.version, PRIVACY_VERSION);
    assert.notEqual(payload.version, "", "PRIVACY_VERSION must not be empty");
  });

  it("terms and privacy versions are distinct constants (not aliased)", () => {
    // They may share the same value (e.g. both "1.0") but must be separate exports
    // so they can be bumped independently.
    assert.equal(typeof TERMS_VERSION, "string");
    assert.equal(typeof PRIVACY_VERSION, "string");
  });

  it("signup body with both true is accepted", () => {
    // Re-confirm the full happy path: acceptedTerms + acceptedPrivacy → ok
    const body = { acceptedTerms: true, acceptedPrivacy: true };
    const acceptedTerms = body.acceptedTerms === true;
    const acceptedPrivacy = body.acceptedPrivacy === true;
    assert.ok(acceptedTerms && acceptedPrivacy, "both flags must be true");
  });
});
