# ChimAura — Launch Readiness Audit

**Date:** 2026-05-28  
**Scope:** Full technical readiness review after Sessions 1–5 hardening  
**Platform:** Railway (Next.js 16, App Router, React 19, PostgreSQL, Prisma)

---

## 1. Executive Summary

**ChimAura is technically launchable** once Railway environment variables are configured, the database migration is applied, and Stripe products/webhooks are live. No code-level launch blockers remain.

### Major fixes completed in Sessions 1–5

| Area | Fix |
|------|-----|
| Billing checkout | Removed `buy.stripe.com` bypass URLs; all purchases now go through `/api/stripe/checkout` → Stripe-hosted checkout |
| Premium entitlements | `getEffectiveEntitlements` requires **tier = premium AND status = active/trialing AND non-expired period end** — tier alone never grants premium |
| Legal consent | Signup records `acceptedTerms` and `acceptedPrivacy` in `UserConsent` table with version strings before account creation completes |
| Privacy/Terms pages | `/privacy` and `/terms` render with versioned content (v1.0, dated March 21, 2026) |
| Guest AI limit | Guests capped at **1 AI generation per IP per UTC day** via Redis (in-memory fallback when Redis is absent) |
| Wellness safety | Yoga AI prompts contain explicit pain/stop/modification safety instructions |
| Pricing page cleanup | HeyGen video promises and AI-video-generation feature language removed |
| Railway API routes | All `app/api/**/route.ts` files export `dynamic = "force-dynamic"` and `runtime = "nodejs"` — build no longer fails during static page-data collection |
| OpenAI lazy init | `getOpenAI()` helper pattern — missing `OPENAI_API_KEY` returns 503 (speech) or silent fallback (meditation); never crashes the build |
| Regression tests | 69 unit tests across 5 test files; 3 Playwright E2E spec files |
| Admin billing/resync | Admins can look up any user by email/Stripe ID and manually resync subscription state from Stripe with full audit logging |

---

## 2. Required Railway Configuration

### 2a. Required environment variables

These must be set before the app will function correctly in production. Missing any of these will cause hard failures.

| Variable | Purpose | Notes |
|----------|---------|-------|
| `DATABASE_URL` | PostgreSQL connection string | Railway auto-injects this when a PostgreSQL service is attached to the project |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL used in emails and Stripe redirects | e.g. `https://chimaura.com` — must match the Railway domain or custom domain |
| `AUTH_TOKEN_SECRET` | Signs session cookies | Generate with `openssl rand -hex 32`. Also accepted as `AUTH_SECRET` |
| `IP_HASH_SALT` | Hashes guest IP addresses for rate-limit keys | Generate with `openssl rand -hex 16` |
| `RESEND_API_KEY` | Transactional email (verification, password reset) | From [resend.com](https://resend.com) — required for email verification flow |
| `RESEND_FROM_EMAIL` | Sender address for transactional emails | Must be verified in Resend; also accepted as `EMAIL_FROM` |
| `STRIPE_SECRET_KEY` | Stripe API access | `sk_live_…` in production; `sk_test_…` for staging |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook signatures | `whsec_…` from the Stripe dashboard webhook endpoint |
| `STRIPE_PRICE_MONTHLY` | Stripe Price ID for monthly plan | `price_…` from Stripe Products |
| `STRIPE_PRICE_YEARLY` | Stripe Price ID for yearly plan | `price_…` from Stripe Products |
| `OPENAI_API_KEY` | AI meditation and speech generation | Missing key disables speech (503) and falls back to built-in meditation scripts (200) |
| `UPSTASH_REDIS_REST_URL` | Redis for guest rate-limiting and session caching | From [upstash.com](https://upstash.com); without this the guest limit resets on redeploy |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash authentication token | Paired with `UPSTASH_REDIS_REST_URL` |

### 2b. Optional environment variables

These unlock additional features but are not required for core auth, billing, and AI generation.

| Variable | Feature | Default behavior if absent |
|----------|---------|---------------------------|
| `FREE_ASTRO_API_KEY` | Daily horoscope generation | Horoscope API returns error / fallback content |
| `FREE_ASTRO_API_BASE_URL` | Horoscope API base URL | Horoscope API unavailable |
| `NOTIFICATION_CRON_SECRET` | Secures `/api/notifications/cron` endpoint | Cron endpoint unprotected (minor risk if publicly known) |
| `SUPPORT_EMAIL` | Contact form reply-to address | Falls back to `RESEND_FROM_EMAIL` |
| `WEB_PUSH_PUBLIC_KEY` | Web push notifications | Push notification features disabled |
| `WEB_PUSH_PRIVATE_KEY` | Web push notifications | Push notification features disabled |
| `WEB_PUSH_SUBJECT` | Push notification sender identity | Push notification features disabled |
| `TWILIO_ACCOUNT_SID` | SMS OTP | OTP/phone features disabled |
| `TWILIO_AUTH_TOKEN` | SMS authentication | OTP/phone features disabled |
| `TWILIO_PHONE_NUMBER` | SMS sender number | OTP/phone features disabled |
| `DEEPL_API_KEY` | Machine translation | Translation feature disabled |
| `HEYGEN_API_KEY` | AI video generation | HeyGen video routes return error |
| `CHIMAURA_DATA_DIR` | Local data directory override | Uses Railway ephemeral filesystem |
| `ALLOW_LOCAL_AUTH_FALLBACK` | Dev-only auth bypass | Not recommended in production |

> **Note:** The codebase checks `process.env.VERCEL` in one location. This is legacy and has no effect on Railway — do not set it.

### 2c. Database migration

Run immediately after deploying and before any traffic reaches the app:

```bash
npx prisma migrate deploy
```

Railway deploy command recommendation (in Railway service settings):

```
npx prisma migrate deploy && node_modules/.bin/next start
```

Or use the Railway pre-deploy command feature to run migrations separately before the new instance goes live.

---

## 3. Stripe Readiness

### 3a. Required Stripe products and prices

Create two recurring prices in the Stripe dashboard and copy their IDs to Railway:

| Price | Interval | Railway variable |
|-------|----------|-----------------|
| ChimAura Premium — Monthly | Monthly | `STRIPE_PRICE_MONTHLY` |
| ChimAura Premium — Yearly | Annual | `STRIPE_PRICE_YEARLY` |

Both prices must be **recurring** (not one-time). The webhook handler reads `currentPeriodEnd` from Stripe subscriptions — one-time prices will not populate this correctly.

### 3b. Checkout session metadata

The checkout session must include these metadata fields so the webhook handler can link purchases to users:

```json
{
  "userId": "<user's database ID>",
  "app": "ChimAura",
  "tier": "premium",
  "interval": "monthly" | "yearly"
}
```

This is currently set in `/app/api/stripe/checkout/route.ts`. Verify after any Stripe SDK upgrades.

### 3c. Required webhook endpoint

Register a webhook in the Stripe dashboard pointing to:

```
https://chimaura.com/api/stripe/webhook
```

Enable exactly these event types:

| Event | Handler action |
|-------|---------------|
| `checkout.session.completed` | Marks subscription active after successful checkout |
| `customer.subscription.created` | Marks subscription active with period end |
| `customer.subscription.updated` | Updates subscription state (status, period end, interval) |
| `customer.subscription.deleted` | Marks subscription canceled, downgrades to free |
| `invoice.payment_succeeded` | Renews period end, confirms active status |
| `invoice.payment_failed` | Sets status to `past_due`, preserves premium until period end |

Copy the resulting `whsec_…` signing secret to `STRIPE_WEBHOOK_SECRET`.

### 3d. Billing portal

Enable the Stripe Customer Portal in the Stripe dashboard. The `/api/stripe/portal` route creates a portal session and redirects users to manage their subscription. Without portal setup, the "Manage subscription" button will fail.

### 3e. Test webhook delivery

Use the Stripe CLI to replay events locally before going live:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
stripe trigger checkout.session.completed
```

Verify the `UserConsent` and `Subscription` rows are created correctly in the database after each event.

---

## 4. Auth and Legal Readiness

### 4a. Signup legal consent

- At signup, users must check **two separate checkboxes** (Terms of Service, Privacy Policy) before the Create Account button enables.
- On submission, the backend validates `acceptedTerms: true` and `acceptedPrivacy: true` before creating the account.
- Consent is recorded in the `UserConsent` table with version `TERMS_VERSION = "1.0"` and `PRIVACY_VERSION = "1.0"` (from `lib/legal.ts`), plus timestamp and IP hash.
- If either field is missing or false, signup returns HTTP 400 and no user is created.

### 4b. Database requirement

The `UserConsent` table must exist in the production database. It is created by Prisma migrations. Running `npx prisma migrate deploy` before serving traffic is mandatory.

### 4c. Email verification

- Users receive a verification email after signup via Resend.
- The `/api/auth/verify-email` route marks `emailVerified = true`.
- Stripe checkout should only be offered to verified users to reduce fraud risk. **Verify that the checkout API route checks `emailVerified` before creating a session.**

### 4d. Legal pages

- `/privacy` — Privacy Policy, version 1.0, last updated March 21, 2026
- `/terms` — Terms of Service, version 1.0, last updated March 21, 2026
- Both pages render a visible `<h1>` heading and return HTTP 200.
- Both are linked from the signup form and the contact page.

### 4e. Remaining legal recommendation

> **Before commercial launch:** Have a licensed attorney review the Terms of Service and Privacy Policy. The current versions are functional and GDPR/CCPA-aware in structure, but have not been independently verified by legal counsel.

---

## 5. AI and Wellness Readiness

### 5a. OpenAI route safety

| Route | Behavior when `OPENAI_API_KEY` is missing |
|-------|------------------------------------------|
| `/api/generate-speech` | Returns HTTP 503 with `"Speech generation is not configured."` — fails clearly |
| `/api/generate-meditation` | Returns HTTP 200 with a built-in fallback script (`source: "fallback"`) — degrades gracefully |
| `/api/interpret-command` | Returns HTTP 503 with `"OpenAI is not configured."` — fails clearly |

OpenAI client is initialized lazily via `getOpenAI()` helpers — missing API key never crashes the Next.js build.

### 5b. Guest AI generation limit

- Guests are limited to **1 AI generation per IP address per UTC day**.
- Limit enforced in `lib/guest-limit.ts` via Upstash Redis (`chimaura:guest:daily:{YYYY-MM-DD}:{ipHash}`).
- **If `UPSTASH_REDIS_REST_URL` is not set**, the fallback is an in-memory `Map` that resets on every server restart or redeploy. This means the guest limit does not persist across Railway deploys. Set Upstash Redis for reliable enforcement in production.

### 5c. Yoga safety

Safety language is embedded in the OpenAI prompt for yoga generation (not rendered statically in the UI):

- "If you feel sharp pain, reduce intensity or rest in a neutral pose."
- "Never instruct the user to push through pain or ignore discomfort."
- "Explicitly remind the user to stop and rest if they feel pain, dizziness, numbness, or unusual discomfort."
- "Do not make pregnancy, injury rehabilitation, trauma treatment, or medical recovery claims."
- "Always offer a gentler modification or alternative for every challenging pose."

The fallback yoga script (when OpenAI is unavailable) also includes explicit pain/stop guidance.

> **Remaining risk:** Safety language depends on the AI following prompt instructions. Consider adding a **static disclaimer** visible in the yoga UI: *"ChimAura wellness content is for general wellbeing only and is not a substitute for medical advice. Stop any activity that causes pain."*

### 5d. Wellness content disclaimers

The wellness topic pages (`/wellness/[slug]`) do not currently render a static "not medical advice" disclaimer. The content is SEO-focused and informational.

> **Remaining risk:** Consider adding a persistent footer note across wellness, meditation, yoga, and breathing pages: *"This content is for general wellness purposes only and does not constitute medical advice."*

### 5e. Horoscope

- Daily horoscope generation uses `FREE_ASTRO_API_KEY`.
- If the API key is absent or the external API is unavailable, the horoscope route returns an error — there is no generated fallback.
- This is cosmetic (not a safety or billing issue) but will affect UX if the key is not set.

---

## 6. Subscription and Entitlement Readiness

### 6a. Entitlement enforcement logic

`getEffectiveEntitlements` in `lib/entitlements.ts` applies a **three-gate check** via `isPremiumAccessActive`:

1. `tier === "premium"` — free-tier users never get premium, even if the database row is wrong.
2. `status === "active"` or `status === "trialing"` — `past_due`, `canceled`, and `inactive` all resolve to free entitlements.
3. `currentPeriodEnd === null` OR `currentPeriodEnd > new Date()` — an expired period end blocks premium access even if status is active. Expired premium users are treated as free until the webhook updates their record.

This means a stale database record cannot accidentally grant premium. The enforcement is defense-in-depth: even if a webhook fires late, the period-end gate holds.

### 6b. Past-due and canceled behavior

| Stripe state | Local status | Access |
|---|---|---|
| `active` + future period end | `active` | Premium ✓ |
| `trialing` + future period end | `trialing` | Premium ✓ |
| `past_due` (failed payment) | `past_due` | Free |
| `canceled` | `canceled` | Free |
| `active` + expired period end | `active` (stale) | Free (period gate blocks) |
| `inactive` / no subscription | `inactive` | Free |

### 6c. Admin resync tool

Admins can navigate to `/admin/billing`, search by email or Stripe customer/subscription ID, and press **"Resync from Stripe"** to pull the live subscription state directly from the Stripe API. The resync:

- Calls `stripe.subscriptions.retrieve(stripeSubscriptionId)`
- Maps the Stripe status via `mapStripeStatus()`
- Writes the updated record to the database via `markSubscriptionActive()` or `markSubscriptionInactive()`
- Creates an `AdminAuditLog` entry with action `"subscription.resync"` and full metadata

This is the primary manual recovery tool when webhooks are delayed or missed.

### 6d. Webhook recovery

The `WebhookEvent` table records every received Stripe event (via `recordWebhookEvent()`). If the local subscription state diverges from Stripe (e.g., a webhook was missed due to a Railway restart), the admin resync tool resolves it. Stripe also retries failed webhooks for up to 72 hours.

### 6e. Remaining subscription risks

- **No email notification to users when their subscription goes past-due.** Stripe sends payment-failure emails via its own system, but ChimAura does not send a custom "update your payment method" email.
- **No proactive expiry warning.** Users are not notified before their subscription period ends.
- **No self-service cancellation UI.** Users must use the Stripe Customer Portal (accessible via "Manage subscription" in account settings) to cancel.

---

## 7. Admin and Support Readiness

### 7a. Admin billing lookup

- Route: `/admin/billing`
- Search by email, Stripe customer ID (`cus_…`), or subscription ID (`sub_…`)
- Returns: user details, subscription state, masked Stripe IDs, up to 15 recent webhook events for that customer
- Protected by `requireAdminViewer()` — non-admin users are redirected to `/unauthorized`

### 7b. Resync from Stripe

- API: `POST /api/admin/billing/resync` with `{ userId }`
- Protected by `requireAdminApiViewer()` — non-admin requests receive HTTP 403
- Returns 422 if the user has no linked Stripe subscription
- Returns 503 if `STRIPE_SECRET_KEY` is not configured
- Full audit trail written to `AdminAuditLog`

### 7c. Audit logging

All admin actions are recorded in `AdminAuditLog` with:
- `adminUserId` (who performed the action)
- `targetUserId` (affected user)
- `action` (e.g., `"subscription.resync"`, `"feature-flags.updated"`)
- `metadataJson` (before/after values)
- Timestamp

Audit logs are visible in `/admin/logs` under "Admin actions."

### 7d. Webhook history

All Stripe webhook events are stored in `WebhookEvent` with status and error message. Admins can view recent webhook activity in `/admin/logs` under "Stripe webhooks" and in `/admin/billing` per-user.

### 7e. Manual support workflow

1. User reports billing issue → admin navigates to `/admin/billing`, searches by email
2. Admin views subscription state and recent webhooks
3. If state is stale → click "Resync from Stripe"
4. If resync fails (Stripe shows no subscription) → admin uses `/admin/subscriptions` to view the record and manually investigates via Stripe dashboard
5. All actions are logged

---

## 8. Testing Coverage

### 8a. Unit tests

**69 tests across 5 files**, run with `npm test` (uses `tsx --test`, no Jest):

| File | Tests | Covers |
|------|-------|--------|
| `entitlements.test.ts` | 17 | `isPremiumAccessActive`, `getEffectiveEntitlements` (all status × period-end combinations) |
| `signup-consent.test.ts` | 13 | Consent validation (missing/false/string fields rejected), version constants, payload structure |
| `guest-limit.test.ts` | 5 | In-memory limit enforcement, independent IPs, UTC midnight rollover |
| `static-regression.test.ts` | 10 | No Stripe bypass URLs, no `StripeBuyButtonEmbed`, all API routes have `dynamic`/`runtime` exports, consent version constants present |
| `admin-billing.test.ts` | 24 | `mapStripeStatus` (all 8 Stripe statuses), `maskStripeReference`, admin guard wiring (403), 422/400 codes, no secret exposure |

All 69 tests pass as of 2026-05-28.

### 8b. Static regression tests

`lib/__tests__/static-regression.test.ts` contains two permanent guard groups:

- **Part A (Stripe bypass):** Scans all production TypeScript files for `buy.stripe.com`, `checkout.stripe.com`, `YEARLY_STRIPE_CHECKOUT_URL`, and `StripeBuyButtonEmbed` imports. Any reintroduction fails CI.
- **Part B (Railway build safety):** Verifies every `app/api/**/route.ts` exports both `dynamic = "force-dynamic"` and `runtime = "nodejs"`. Missing exports immediately fail CI.

### 8c. Playwright E2E tests

3 spec files (run with `npm run test:e2e` against a running dev server):

| File | Covers |
|------|--------|
| `tests/e2e/static-pages.spec.ts` | `/privacy`, `/terms`, `/pricing` load; pricing billing interval buttons; no HeyGen/video promises; signup consent checkboxes; submit disabled until both checkboxes checked |
| `tests/e2e/auth-verification.spec.ts` | Auth and email verification flows |
| `tests/e2e/yoga-mode.spec.ts` | Yoga page interactions |

### 8d. Production smoke-test runbook

`docs/RAILWAY_DEPLOY_SMOKE_TEST.md` — 18 sections covering every critical system:
Railway env vars → DB migration → public pages → signup/consent → email verification → login/logout → Stripe monthly/yearly checkout → webhook verification → billing portal → premium entitlements → past-due/canceled downgrade → guest AI limits → free-user limits → OpenAI generation → horoscope → legal links → rollback checklist.

---

## 9. Remaining Launch Blockers

**There are no code-level launch blockers.**

The only tasks remaining before the app is publicly launchable are operational:

| Task | Type | Owner |
|------|------|-------|
| Set all **required** Railway env vars (Section 2a) | Configuration | Infra/DevOps |
| Run `npx prisma migrate deploy` in the Railway production environment | Configuration | Infra/DevOps |
| Create Stripe products and prices; copy IDs to Railway | Configuration | Billing/DevOps |
| Register Stripe webhook endpoint; copy `whsec_…` to Railway | Configuration | Billing/DevOps |
| Enable Stripe Customer Portal in the Stripe dashboard | Configuration | Billing |
| Set up Upstash Redis; copy URL and token to Railway | Configuration | Infra |
| Complete the production smoke test per `docs/RAILWAY_DEPLOY_SMOKE_TEST.md` | Verification | Engineering |
| Attorney review of Terms of Service and Privacy Policy *(recommended)* | Legal | Legal/Business |

---

## 10. Recommended Next Improvements After Launch

These are enhancements to prioritize post-launch based on user safety, compliance, and operational maturity. They are not blockers.

### High priority (first 30 days post-launch)

| Improvement | Rationale |
|-------------|-----------|
| **Static wellness/yoga safety disclaimers in UI** | Currently safety language is only in the AI prompt; a static "not medical advice" notice in the page UI is legally safer |
| **Error monitoring (Sentry or similar)** | Currently there is no centralized error tracking; server errors are only visible in Railway logs |
| **Upstash Redis for guest limit persistence** | Without Redis, the guest AI limit resets on every Railway redeploy — may allow abuse |
| **Email notification on payment failure** | Users currently rely on Stripe's default payment-failure email; a ChimAura-branded email with a link to update billing would reduce churn |

### Medium priority (30–90 days post-launch)

| Improvement | Rationale |
|-------------|-----------|
| **Self-service account deletion and data export** | Required for GDPR/CCPA compliance (right to erasure, right to access); currently requires manual admin action |
| **Admin refund and cancel helpers** | Admins currently must log into the Stripe dashboard to issue refunds; an in-app helper with audit logging would be faster |
| **Stronger analytics (PostHog, Mixpanel, or similar)** | Currently there are no page-view or conversion analytics beyond `ApiRequestLog` |
| **Log drain to persistent storage** | Railway logs are ephemeral; connecting a log drain (e.g., Papertrail, Datadog, Logtail) gives 30+ day retention for incident analysis |
| **Stripe Customer Portal polish** | Ensure portal returns to the correct `/settings/account` page; verify cancellation flow matches ChimAura's terms |
| **Proactive subscription expiry email** | Warn users 7 days before their subscription expires so they can update payment if needed |

### Lower priority (90+ days)

| Improvement | Rationale |
|-------------|-----------|
| **Mobile app store compliance review** | If a React Native or PWA submission to App Store/Google Play is planned, in-app purchase rules require significant billing changes |
| **Data retention automation** | Automated deletion of old `ApiRequestLog`, `WebhookEvent`, and inactive `AuthSession` rows prevents unbounded table growth |
| **Better horoscope fallback handling** | If `FREE_ASTRO_API_KEY` is missing or the external API is down, the horoscope page returns an error; a cached fallback content would improve UX |
| **Observability dashboards** | Custom Railway metrics or a Grafana/Datadog dashboard for request rates, error rates, and AI generation latency |
| **Admin bulk subscription operations** | Ability to pause, extend, or cancel subscriptions in bulk from the admin panel |
| **Webhook event replay** | Admin UI to manually replay a stored `WebhookEvent` through the handler logic (useful for recovery after extended outages) |

---

## 11. Final Go-Live Checklist

Complete all items in order before opening traffic to the public.

### Infrastructure

- [ ] Railway PostgreSQL service is provisioned and `DATABASE_URL` is set
- [ ] All required env vars from Section 2a are set in Railway
- [ ] `npx prisma migrate deploy` has been run in the production environment and completed without errors
- [ ] Upstash Redis is provisioned and `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are set

### Stripe

- [ ] Live Stripe products and prices created; `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY` set in Railway
- [ ] Webhook endpoint registered at `https://chimaura.com/api/stripe/webhook` with all 6 event types
- [ ] `STRIPE_WEBHOOK_SECRET` (`whsec_…`) copied to Railway
- [ ] Stripe Customer Portal enabled in Stripe dashboard
- [ ] End-to-end checkout test completed with a real (or test-mode) card

### Email

- [ ] Resend API key set; sender domain verified in Resend
- [ ] Verification email delivers correctly and the link resolves
- [ ] Password reset email delivers correctly

### AI generation

- [ ] `OPENAI_API_KEY` set; test meditation and speech generation from the app
- [ ] Meditation fallback behavior confirmed (app stays functional if quota is hit)

### Smoke test

- [ ] Complete all 18 sections of `docs/RAILWAY_DEPLOY_SMOKE_TEST.md`
- [ ] `/privacy` and `/terms` render correctly with current version text
- [ ] Signup records two `UserConsent` rows (terms + privacy) in the database
- [ ] Premium subscription upgrade and downgrade flow verified end-to-end
- [ ] Admin `/admin/billing` lookup and resync verified with a test account

### Legal

- [ ] Terms of Service reviewed by legal counsel *(recommended before accepting payments)*
- [ ] Privacy Policy reviewed by legal counsel *(recommended before accepting payments)*
- [ ] Cookie/tracking disclosure reviewed if any analytics tools are added post-launch

### Launch

- [ ] Railway deploy health check passes
- [ ] Custom domain DNS configured and HTTPS certificate issued
- [ ] `NEXT_PUBLIC_APP_URL` updated to production domain (not Railway-generated URL)
- [ ] `npm run lint` — 0 errors
- [ ] `npm run build` — passes
- [ ] `npm test` — 69/69 pass

---

*Last updated: 2026-05-28 — reflects Sessions 1–5 hardening (billing bypass removal, entitlement enforcement, legal consent, guest AI limits, Railway dynamic route config, regression tests, admin billing/resync tools).*
