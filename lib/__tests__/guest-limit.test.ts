/**
 * Unit tests for guest daily AI generation limit logic.
 * Run with: npx tsx --test lib/__tests__/guest-limit.test.ts
 */
import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

import { checkGuestDailyLimit, incrementGuestDailyUsage } from "../guest-limit";

const uid = () => `test-ip-${Date.now()}-${Math.random().toString(36).slice(2)}`;

describe("guest daily limit — in-memory fallback", () => {
  it("allows the first generation for a new guest IP", async () => {
    const result = await checkGuestDailyLimit(uid());
    assert.equal(result.allowed, true);
    assert.equal(result.used, 0);
  });

  it("blocks a second generation after the first is incremented", async () => {
    const ipHash = uid();
    await incrementGuestDailyUsage(ipHash);
    const result = await checkGuestDailyLimit(ipHash);
    assert.equal(result.allowed, false);
    assert.equal(result.used, 1);
  });

  it("different guest IPs are tracked independently", async () => {
    const ipA = uid();
    const ipB = uid();
    await incrementGuestDailyUsage(ipA);
    const resultA = await checkGuestDailyLimit(ipA);
    const resultB = await checkGuestDailyLimit(ipB);
    assert.equal(resultA.allowed, false);
    assert.equal(resultB.allowed, true);
  });

  it("reports used count accurately after increment", async () => {
    const ipHash = uid();
    const before = await checkGuestDailyLimit(ipHash);
    assert.equal(before.used, 0);
    await incrementGuestDailyUsage(ipHash);
    const after = await checkGuestDailyLimit(ipHash);
    assert.equal(after.used, 1);
  });
});

describe("guest daily limit — UTC day rollover", () => {
  /**
   * The day key used by the in-memory fallback includes the UTC date:
   *   chimaura:guest:daily:{YYYY-MM-DD}:{ipHash}
   *
   * When the date changes (UTC midnight), the key changes, which means
   * the guest has a fresh quota automatically.  We simulate this by
   * mocking Date so that getDayKey() returns a different date string
   * after mock.timers.tick().
   */
  it("next UTC day generates a fresh key and resets quota", async () => {
    // Fix clock to 30 seconds before UTC midnight on an arbitrary date.
    const dayOneEnd = new Date("2026-03-10T23:59:30Z").getTime();
    mock.timers.enable({ apis: ["Date"], now: dayOneEnd });

    try {
      const ipHash = uid();

      // Use up the quota on 2026-03-10
      await incrementGuestDailyUsage(ipHash);
      const blockedToday = await checkGuestDailyLimit(ipHash);
      assert.equal(blockedToday.allowed, false, "should be blocked on day 1");
      assert.equal(blockedToday.used, 1);

      // Advance 90 seconds — it is now 2026-03-11T00:01:00Z
      mock.timers.tick(90_000);

      // Same ipHash, new UTC date → new key → fresh quota
      const allowedTomorrow = await checkGuestDailyLimit(ipHash);
      assert.equal(
        allowedTomorrow.allowed,
        true,
        "should be allowed on the next UTC day"
      );
      assert.equal(allowedTomorrow.used, 0);
    } finally {
      mock.timers.reset();
    }
  });
});
