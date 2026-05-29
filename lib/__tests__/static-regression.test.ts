/**
 * Static code regression tests — Parts A and B.
 *
 * Part A: Ensures no hardcoded Stripe bypass URLs or removed components
 *         re-enter application source code.
 * Part B: Ensures every app/api route exports the dynamic and runtime
 *         constants that prevent Railway/Next.js build failures.
 *
 * Run with: npx tsx --test lib/__tests__/static-regression.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";

const ROOT = process.cwd();

// ── File-walking helpers ─────────────────────────────────────────────────────

/**
 * Directories (relative to ROOT, using forward slashes) that are NOT
 * production application code and must be excluded from Part A scans.
 */
const EXCLUDED_DIR_NAMES = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "out",
  "__tests__",  // any __tests__ directory
  "tests",      // Playwright e2e tests
  "memory",     // internal documentation
  "prisma",     // migration SQL files
  "public",     // static assets
]);

function isExcludedPath(relFromRoot: string): boolean {
  const parts = relFromRoot.replace(/\\/g, "/").split("/");
  // Exclude if any path segment (directory) is in the excluded set
  for (let i = 0; i < parts.length - 1; i++) {
    if (EXCLUDED_DIR_NAMES.has(parts[i])) return true;
  }
  return false;
}

function walkFiles(dir: string, exts: string[]): string[] {
  const results: string[] = [];
  function recurse(current: string) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      const rel = relative(ROOT, full).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        if (!isExcludedPath(rel + "/placeholder")) recurse(full);
      } else if (entry.isFile() && exts.includes(extname(entry.name))) {
        if (!isExcludedPath(rel)) results.push(full);
      }
    }
  }
  if (existsSync(dir)) recurse(dir);
  return results;
}

/** All TypeScript/TSX application source files (excludes tests, build output, etc.). */
function getAppSourceFiles(): Array<{ rel: string; content: string }> {
  const srcDirs = ["app", "components", "lib", "hooks"];
  const files: Array<{ rel: string; content: string }> = [];
  for (const d of srcDirs) {
    for (const abs of walkFiles(join(ROOT, d), [".ts", ".tsx"])) {
      files.push({
        rel: relative(ROOT, abs).replace(/\\/g, "/"),
        content: readFileSync(abs, "utf-8"),
      });
    }
  }
  return files;
}

/** All app/api route.ts files (recursive). */
function getApiRouteFiles(): Array<{ rel: string; content: string }> {
  const apiDir = join(ROOT, "app", "api");
  if (!existsSync(apiDir)) return [];
  return walkFiles(apiDir, [".ts"])
    .filter((abs) => basename(abs) === "route.ts")
    .map((abs) => ({
      rel: relative(ROOT, abs).replace(/\\/g, "/"),
      content: readFileSync(abs, "utf-8"),
    }));
}

// Compute once at module scope so every test can reuse the result.
const APP_FILES = getAppSourceFiles();
const API_ROUTES = getApiRouteFiles();

// ── Part A: Stripe bypass URL regression ────────────────────────────────────

describe("Part A — Stripe bypass URL regression", () => {
  it("no source file contains buy.stripe.com", () => {
    const hits = APP_FILES.filter(({ content }) =>
      content.includes("buy.stripe.com")
    ).map(({ rel }) => rel);

    assert.deepEqual(
      hits,
      [],
      `buy.stripe.com found in production source:\n  ${hits.join("\n  ")}`
    );
  });

  it("no source file contains checkout.stripe.com as a hardcoded URL", () => {
    const hits = APP_FILES.filter(({ content }) =>
      content.includes("checkout.stripe.com")
    ).map(({ rel }) => rel);

    assert.deepEqual(
      hits,
      [],
      `checkout.stripe.com found in production source:\n  ${hits.join("\n  ")}`
    );
  });

  it("no source file defines or references YEARLY_STRIPE_CHECKOUT_URL", () => {
    const hits = APP_FILES.filter(({ content }) =>
      content.includes("YEARLY_STRIPE_CHECKOUT_URL")
    ).map(({ rel }) => rel);

    assert.deepEqual(
      hits,
      [],
      `YEARLY_STRIPE_CHECKOUT_URL found in production source:\n  ${hits.join("\n  ")}`
    );
  });

  it("StripeBuyButtonEmbed is not imported in any application source file", () => {
    // The component file itself only exports — only import statements indicate usage.
    const hits = APP_FILES.filter(({ content }) =>
      /import\s+.*StripeBuyButtonEmbed/.test(content)
    ).map(({ rel }) => rel);

    assert.deepEqual(
      hits,
      [],
      `StripeBuyButtonEmbed imported in:\n  ${hits.join("\n  ")}`
    );
  });

  it("UpgradeModal does not reference StripeBuyButtonEmbed", () => {
    const upgradeModal = APP_FILES.find(({ rel }) =>
      rel.includes("UpgradeModal")
    );
    if (!upgradeModal) {
      // File not found is not a test failure — the component may have moved.
      return;
    }
    assert.ok(
      !upgradeModal.content.includes("StripeBuyButtonEmbed"),
      "UpgradeModal must not reference StripeBuyButtonEmbed"
    );
  });

  it("pricing page does not reference StripeBuyButtonEmbed", () => {
    const pricingPage = APP_FILES.find(({ rel }) =>
      rel === "app/pricing/page.tsx"
    );
    if (!pricingPage) return;
    assert.ok(
      !pricingPage.content.includes("StripeBuyButtonEmbed"),
      "pricing page must not reference StripeBuyButtonEmbed"
    );
  });
});

// ── Part B: API route dynamic config ────────────────────────────────────────

describe("Part B — API route dynamic config (Railway/Next.js build safety)", () => {
  it("has at least one API route to check", () => {
    assert.ok(
      API_ROUTES.length > 0,
      "Expected to find route files under app/api/"
    );
  });

  it("all app/api route files export dynamic = 'force-dynamic'", () => {
    const missing = API_ROUTES.filter(
      ({ content }) => !content.includes('export const dynamic = "force-dynamic"')
    ).map(({ rel }) => rel);

    assert.deepEqual(
      missing,
      [],
      `Routes missing dynamic export:\n  ${missing.join("\n  ")}`
    );
  });

  it("all app/api route files export runtime = 'nodejs'", () => {
    const missing = API_ROUTES.filter(
      ({ content }) => !content.includes('export const runtime = "nodejs"')
    ).map(({ rel }) => rel);

    assert.deepEqual(
      missing,
      [],
      `Routes missing runtime export:\n  ${missing.join("\n  ")}`
    );
  });

  it("lib/consent.ts references TERMS_VERSION and PRIVACY_VERSION constants", () => {
    const consentPath = join(ROOT, "lib", "consent.ts");
    assert.ok(existsSync(consentPath), "lib/consent.ts must exist");
    const src = readFileSync(consentPath, "utf-8");
    assert.ok(
      src.includes("TERMS_VERSION"),
      "lib/consent.ts must reference TERMS_VERSION"
    );
    assert.ok(
      src.includes("PRIVACY_VERSION"),
      "lib/consent.ts must reference PRIVACY_VERSION"
    );
  });
});
