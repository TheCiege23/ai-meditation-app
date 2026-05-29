# ChimAura — Railway Deploy Smoke Test

Run this checklist after every production deployment.  
Work top to bottom. Each section depends on the one before it.

**Conventions used in this document**
- `{APP_URL}` — your production Railway URL, e.g. `https://chimaura.railway.app`
- `{ADMIN_EMAIL}` — an email address you control that is NOT yet registered
- `{PREMIUM_EMAIL}` — an email already attached to an active Stripe subscription (for premium tests)
- ✅ = expected pass state · ❌ = stop — do not continue until fixed

---

## 1. Railway Environment Variables

Open **Railway → your service → Variables** and confirm every required variable is set.

### Required (app will not start without these)

- [ ] `DATABASE_URL` — PostgreSQL connection string; must point to your Railway Postgres service
- [ ] `NODE_ENV` — must be `production`
- [ ] `NEXT_PUBLIC_APP_URL` — full public URL with no trailing slash, e.g. `https://chimaura.railway.app`

### Authentication

- [ ] `AUTH_TOKEN_SECRET` (or `AUTH_SECRET`) — random 32+ char secret for session/verification tokens
- [ ] `IP_HASH_SALT` — random 16+ char salt; used to hash IPs before storage

### Email (Resend)

- [ ] `RESEND_API_KEY` — starts with `re_`
- [ ] `RESEND_FROM_EMAIL` or `EMAIL_FROM` — e.g. `noreply@chimaura.app`

### OpenAI

- [ ] `OPENAI_API_KEY` — starts with `sk-`

### Stripe billing

- [ ] `STRIPE_SECRET_KEY` — starts with `sk_live_` (production) or `sk_test_` (staging)
- [ ] `STRIPE_PRICE_MONTHLY` — Stripe price ID for the monthly plan, e.g. `price_...`
- [ ] `STRIPE_PRICE_YEARLY` — Stripe price ID for the yearly plan
- [ ] `STRIPE_WEBHOOK_SECRET` — starts with `whsec_`

### Rate limiting / Guest limits (Upstash Redis)

- [ ] `UPSTASH_REDIS_REST_URL` — e.g. `https://...upstash.io`
- [ ] `UPSTASH_REDIS_REST_TOKEN` — Upstash token

  > **Note:** If these are unset, rate limiting and guest daily limits fall back to an
  > in-process Map that resets on every server restart. Acceptable for staging, not recommended
  > for production under load or with multiple instances.

### Horoscope API

- [ ] `FREE_ASTRO_API_KEY` — API key for FreeAstroAPI
- [ ] `FREE_ASTRO_API_BASE_URL` — base URL for the horoscope provider

### Optional

- [ ] `DEEPL_API_KEY` — enables the `/api/translate` endpoint (Spanish UI); gracefully absent
- [ ] `CHIMAURA_DATA_DIR` — path for SQLite/audio cache on the Railway volume; if unset, defaults to the system temp directory
- [ ] `ALLOW_LOCAL_AUTH_FALLBACK` — must **NOT** be `true` in production

**Expected after this section:** All required variables are green in the Railway dashboard. The deployment log shows no `missing env var` warnings for critical paths.

---

## 2. Database Migration

Run once after every deploy that includes a new Prisma migration.

```bash
# From your local machine, with production DATABASE_URL set:
DATABASE_URL="<your production url>" npx prisma migrate deploy

# Or via Railway's run command panel:
npx prisma migrate deploy
```

- [ ] Command exits with `All migrations have been successfully applied` or `No pending migrations`
- [ ] No `Error: P3005` (database schema not empty) or `P3006` (failed migration)

> **If a migration fails mid-run:** Do not restart the app yet. See the
> [Rollback Checklist](#18-rollback-checklist) at the end of this document.

---

## 3. Public Pages Smoke Test

Open each URL in a browser (or `curl -I`). No login required.

| URL | Expected status | Check |
|-----|----------------|-------|
| `{APP_URL}/` | 200 — home/dashboard loads | - [ ] |
| `{APP_URL}/pricing` | 200 — pricing cards visible | - [ ] |
| `{APP_URL}/sign-up` | 200 — signup form visible | - [ ] |
| `{APP_URL}/sign-in` | 200 — login form visible | - [ ] |
| `{APP_URL}/terms` | 200 — Terms of Service text | - [ ] |
| `{APP_URL}/privacy` | 200 — Privacy Policy text | - [ ] |
| `{APP_URL}/meditation` | 200 — meditation builder loads | - [ ] |
| `{APP_URL}/horoscope` | 200 — horoscope page loads | - [ ] |
| `{APP_URL}/breathing` | 200 — breathing page loads | - [ ] |

- [ ] No `500 Internal Server Error` on any page
- [ ] No blank white screens
- [ ] The app header/nav renders correctly

---

## 4. Signup and Legal Consent Test

Use `{ADMIN_EMAIL}` (a fresh address not yet in the database).

1. Navigate to `{APP_URL}/sign-up`
2. Fill in display name and email; enter a password
3. **Do not check either legal checkbox yet**
   - [ ] The "Create Account" button is **disabled** ✅
4. Check **Terms of Service** only
   - [ ] Button remains **disabled** ✅
5. Uncheck Terms; check **Privacy Policy** only
   - [ ] Button remains **disabled** ✅
6. Check **both** checkboxes
   - [ ] Button becomes **enabled** ✅
7. Submit the form
   - [ ] UI shows a "check your email" / verification message ✅
   - [ ] No 400 or 500 error shown ✅

**Expected:** Account is created in the database. A verification email is sent to `{ADMIN_EMAIL}`.

> **Database check (optional):** Connect to the Railway Postgres service and run:
> ```sql
> SELECT email, email_verified, created_at FROM "User" WHERE email = '{ADMIN_EMAIL}';
> SELECT consent_type, version FROM "UserConsent" WHERE user_id = (
>   SELECT id FROM "User" WHERE email = '{ADMIN_EMAIL}'
> );
> ```
> You should see two consent rows: one for `terms` and one for `privacy`, each with the
> current version string (e.g. `1.0`).

---

## 5. Email Verification Test

1. Open the inbox for `{ADMIN_EMAIL}`
   - [ ] Verification email arrived within ~60 seconds ✅
   - [ ] Email is from the address set in `RESEND_FROM_EMAIL` / `EMAIL_FROM` ✅
   - [ ] Email contains a verification link pointing to `{APP_URL}/api/auth/verify-email?token=...` ✅
2. Click the verification link
   - [ ] Redirects to `{APP_URL}/auth/confirmed?verified=success` ✅
   - [ ] Page shows "Email verified" heading ✅
3. Click the **Go to sign in** link
   - [ ] Lands on `{APP_URL}/sign-in` ✅

**If no email arrives within 5 minutes:**
- Check Railway logs for `sendVerificationEmail` errors
- Confirm `RESEND_API_KEY` is valid and the domain is verified in Resend
- Check Resend dashboard logs for bounce/delivery failure

---

## 6. Login and Logout Test

1. Sign in with `{ADMIN_EMAIL}` and the password set in step 4
   - [ ] Redirects to the app home/dashboard ✅
   - [ ] User display name appears in the nav ✅
   - [ ] No 401 or 403 errors in the browser console ✅
2. Navigate to `{APP_URL}/settings/account`
   - [ ] Account page loads with the correct email shown ✅
3. Sign out
   - [ ] Redirects to the homepage or sign-in page ✅
   - [ ] Navigating to a protected page now redirects to sign-in ✅

---

## 7. Stripe Checkout — Monthly Plan

> Prerequisite: You must be signed in as a verified user. Use a Stripe test card
> (`4242 4242 4242 4242`, any future expiry, any CVC) if testing against the Stripe test environment.

1. Navigate to `{APP_URL}/pricing`
2. Select the **Monthly** interval toggle
3. Click **Upgrade to Premium Monthly** (or equivalent CTA)
   - [ ] Browser redirects to a Stripe-hosted checkout page ✅
   - [ ] The checkout page shows the correct monthly price (e.g. $7.99/month) ✅
   - [ ] The checkout page shows your account email ✅
4. Complete the Stripe checkout with a test card
   - [ ] Stripe redirects to `{APP_URL}/pricing?checkout=success` ✅
   - [ ] A green success notice appears on the pricing page ✅
5. Refresh the page or navigate to `/dashboard`
   - [ ] UI reflects **Premium** status ✅

---

## 8. Stripe Checkout — Yearly Plan

Repeat Section 7 with a **different test account** (or cancel the monthly subscription first via the Stripe dashboard), using the **Yearly** toggle.

1. Select **Yearly** interval on `/pricing`
2. Click the yearly upgrade CTA
   - [ ] Checkout page shows the correct yearly price (e.g. $49/year) ✅
   - [ ] "Save X%" badge is visible on the button/page ✅
3. Complete checkout
   - [ ] Redirected to `{APP_URL}/pricing?checkout=success` ✅
   - [ ] Premium status active after redirect ✅

---

## 9. Stripe Webhook Verification

Confirm the webhook is correctly wired before relying on subscription state changes.

### In the Stripe Dashboard

1. Go to **Developers → Webhooks**
2. Confirm there is an endpoint for `{APP_URL}/api/stripe/webhook`
   - [ ] Endpoint URL is exactly `{APP_URL}/api/stripe/webhook` (no trailing slash) ✅
3. Confirm the following events are subscribed:
   - [ ] `customer.subscription.created` ✅
   - [ ] `customer.subscription.updated` ✅
   - [ ] `customer.subscription.deleted` ✅
   - [ ] `invoice.payment_succeeded` ✅
   - [ ] `invoice.payment_failed` ✅
4. Click **Send test webhook** → send `customer.subscription.updated`
   - [ ] Stripe shows HTTP `200` response ✅
   - [ ] Railway logs show the event was received and processed ✅

### Verify webhook secret matches

- [ ] The `STRIPE_WEBHOOK_SECRET` in Railway matches the signing secret shown on the webhook endpoint page in the Stripe dashboard ✅

> **Common failure:** A `400 Webhook signature verification failed` error in Railway logs means
> `STRIPE_WEBHOOK_SECRET` does not match the endpoint's signing secret. Regenerate the secret
> in Stripe, update the Railway variable, and redeploy.

---

## 10. Billing Portal Test

1. Sign in as the premium account from Section 7/8
2. Navigate to `{APP_URL}/pricing`
3. Click **Manage Subscription** (or **Manage Billing**)
   - [ ] Browser redirects to the Stripe Customer Portal ✅
   - [ ] The portal shows the correct subscription and payment method ✅
   - [ ] "Cancel subscription" option is visible ✅
4. Navigate back without making changes

---

## 11. Premium Entitlement Test

While signed in as the active premium account:

- [ ] Navigate to `{APP_URL}/meditation`
  - [ ] Duration options include **10 min, 15 min, 20 min** (not just 1–5 min) ✅
  - [ ] Voice options include premium voices (e.g. **Onyx**, **Sage**, **Verse**) ✅
  - [ ] Multiple sound layers can be selected simultaneously (sound mixer) ✅
- [ ] Navigate to `{APP_URL}/horoscope`
  - [ ] **Weekly** and **Monthly** range options are visible and selectable ✅
- [ ] Navigate to `{APP_URL}/dashboard` (or history/progress)
  - [ ] Session history loads without an upgrade prompt ✅

**Generate a meditation (Premium path):**
1. Select a duration of **10 min or longer**
2. Click **Generate My Session**
   - [ ] Generation completes without a paywall modal ✅
   - [ ] Session is saved to history ✅

**Generate speech (TTS):**
1. On the generated session, trigger audio narration with a premium voice
   - [ ] Audio plays with the selected premium voice ✅
   - [ ] No "voice not available on your plan" error ✅

---

## 12. Past-Due / Canceled Entitlement Test

This verifies that a lapsed subscription correctly downgrades access.

### Simulate via Stripe Dashboard

1. Open the Stripe Dashboard → Customers → find the premium test account
2. Cancel the subscription immediately (or use **Refund + cancel**)
3. Wait ~30 seconds, then resend a `customer.subscription.deleted` test webhook to trigger the status update in Railway, OR wait for Railway logs to confirm the webhook fired

### Verify downgrade

1. Sign in as the now-canceled account
2. Refresh the `/pricing` or `/meditation` page
   - [ ] Premium features are no longer available ✅
   - [ ] Duration is limited back to **5 min** ✅
   - [ ] Premium voices are no longer selectable ✅
   - [ ] An upgrade prompt or paywall modal appears when trying to access premium features ✅
3. Check `/api/auth/session` (GET, while signed in)
   - [ ] Response shows `subscriptionTier: "free"` or `subscriptionStatus: "canceled"` ✅

> **Important:** `subscriptionTier: "premium"` alone must NOT grant premium access.
> The session endpoint and entitlement logic both check `subscriptionStatus` and
> `currentPeriodEnd` before granting premium. This is the regression covered by
> unit test `"returns free entitlements for inactive premium (tier alone is not enough)"`.

---

## 13. Guest AI Generation Limit Test

Do this in a private/incognito window (no account signed in).

**First generation (should succeed):**
1. Navigate to `{APP_URL}/meditation`
2. Configure a short meditation (1 min, any settings)
3. Click **Generate My Session**
   - [ ] Generation succeeds and the meditation text appears ✅
   - [ ] No error banner or signup modal ✅

**Second generation (same IP, same day — should be blocked):**
4. Without refreshing, click **Generate My Session** again (or navigate back and try again)
   - [ ] Request is **blocked** ✅
   - [ ] A message appears explaining the daily guest limit ✅
   - [ ] A sign-up prompt / modal appears ✅
   - [ ] The response from `/api/generate-meditation` is `HTTP 403` with `code: "GUEST_LIMIT_REACHED"` ✅

**API-level verification:**
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X POST {APP_URL}/api/generate-meditation \
  -H "Content-Type: application/json" \
  -d '{"mood":"calm","duration":"1 min","mode":"meditation","meditationType":"stress_relief"}'
```
On the second call from the same IP, expected: `403`

> **Note:** The guest limit is 1 AI session per IP per UTC day. It resets at UTC midnight.
> If Upstash Redis is connected, limits persist across server restarts.
> If Redis is not connected, the in-process fallback resets on every deploy.

---

## 14. Free-User AI Generation Limit Test

Sign in as a **free-tier** account (the `{ADMIN_EMAIL}` from Section 4, which is not premium).

**Verify the per-day cap:**
1. Generate a meditation → succeeds (count = 1 of 3) ✅
2. Generate again → succeeds (count = 2 of 3) ✅
3. Generate again → succeeds (count = 3 of 3) ✅
4. Generate a 4th time
   - [ ] Blocked with an upgrade prompt / usage-limit message ✅
   - [ ] Response from `/api/generate-meditation` is `HTTP 429` or returns `usageLimitReached: true` ✅

**Verify session max duration:**
1. Attempt to configure a **10 min** session
   - [ ] UI shows only durations up to **5 min**, or shows a paywall/upgrade prompt for longer durations ✅

> Free users also have a speech generation cap (3/day). Trigger TTS three times, then confirm
> the fourth attempt is blocked with an upgrade prompt.

---

## 15. OpenAI Speech and Meditation Generation Test

Uses the live `OPENAI_API_KEY`. Requires a signed-in account (free or premium).

**Meditation generation:**
1. Sign in as any verified account
2. Navigate to `{APP_URL}/meditation`
3. Select mood, duration (1 min), and mode (Meditation)
4. Click **Generate My Session**
   - [ ] Response arrives within 15 seconds ✅
   - [ ] Meditation text appears (several paragraphs, not a generic error) ✅
   - [ ] No "OpenAI is not configured" error ✅
   - [ ] Railway logs show `provider: "openai"` in the API request log ✅

**Speech (TTS) generation:**
1. On the generated meditation, trigger audio narration
   - [ ] Audio begins playing within 10 seconds ✅
   - [ ] Audio is clearly spoken meditation content, not silence or error tone ✅
   - [ ] No `503 Speech generation is not configured` error ✅

**Fallback check:**
- [ ] If `OPENAI_API_KEY` were removed, the API returns `503` with a human-readable JSON error (not a 500 stack trace) ✅ *(verify in Railway logs that no stack trace leaks)*

---

## 16. Horoscope API Test

Requires `FREE_ASTRO_API_KEY` and `FREE_ASTRO_API_BASE_URL` to be set.

1. Sign in as any verified account
2. Navigate to `{APP_URL}/horoscope`
3. Select any zodiac sign (e.g. Aries) and the **Today** range
   - [ ] Horoscope text loads within 10 seconds ✅
   - [ ] Content appears to be sign-appropriate (not empty or generic error) ✅
   - [ ] No "provider not configured" or "API key missing" error ✅

**Weekly range (premium only):**
4. While signed in as the premium account, select **Weekly** range
   - [ ] Weekly horoscope text loads ✅
5. Sign in as a free account, attempt **Weekly** range
   - [ ] Access is blocked with an upgrade prompt ✅
   - [ ] API returns an error (not the weekly content) ✅

**API-level check:**
```bash
curl -s {APP_URL}/api/horoscope/daily?sign=aries&range=day \
  -H "Cookie: <your session cookie>"
```
Expected: `200` with JSON horoscope content.

> If horoscope returns errors, check Railway logs for `FREE_ASTRO_API_KEY` not found or
> upstream API rate-limit errors. The horoscope API has its own daily free-user cap (5 views/day).

---

## 17. Privacy, Terms, and Legal Links Test

Verify all legal pages load and cross-links work.

**Pages:**
- [ ] `{APP_URL}/terms` — loads, has a page heading, last-updated date is visible ✅
- [ ] `{APP_URL}/privacy` — loads, has a page heading, last-updated date is visible ✅

**Footer / nav links (check on several pages):**
- [ ] Footer on `/pricing` has working **Terms of Service** and **Privacy Policy** links ✅
- [ ] Sign-up form's "Terms of Service" link opens `/terms` (opens in a new tab) ✅
- [ ] Sign-up form's "Privacy Policy" link opens `/privacy` (opens in a new tab) ✅

**Pricing page disclosure:**
- [ ] The recurring-subscription disclosure is visible on `/pricing`:
  > "ChimAura Premium is a recurring subscription billed monthly or annually via Stripe.
  > You can cancel at any time…" ✅

**No dead links:**
- [ ] None of the above links return `404` ✅

---

## 18. Rollback Checklist

Use this if a deployed build causes critical failures.

### Step 1 — Roll back the Railway deployment

1. Open **Railway → your service → Deployments**
2. Find the last known-good deployment
3. Click **Redeploy** on that build
4. Wait for the health check to pass

### Step 2 — Check whether a database migration ran

If the failing build included a new Prisma migration:

```bash
# List applied migrations
DATABASE_URL="<production url>" npx prisma migrate status
```

- If a migration ran and is **not** destructive (additive-only columns, new tables):
  - The old code will usually work fine with the new schema; rollback is safe.
- If a migration ran and is **destructive** (dropped columns, renamed tables):
  - Do NOT roll back the app code without also reverting the schema.
  - Mark the migration as rolled back:
    ```bash
    DATABASE_URL="<production url>" npx prisma migrate resolve --rolled-back <migration_name>
    ```
  - Manually reverse the schema changes using raw SQL if needed.
  - Contact your DBA before proceeding.

### Step 3 — Verify environment variables did not change

- [ ] Confirm no env vars were accidentally deleted or overwritten during the failed deploy
- [ ] If `STRIPE_WEBHOOK_SECRET` changed, update the Stripe Dashboard endpoint signing secret to match

### Step 4 — Confirm the old build is serving traffic

```bash
curl -I {APP_URL}/api/health/auth-db
```
- [ ] Returns `200` ✅
- [ ] Railway dashboard shows the previous deployment as **Active** ✅

### Step 5 — Post-rollback smoke test

Run **Section 3 (Public Pages)** and **Section 6 (Login/Logout)** only to confirm the basics are working. Do not run the full checklist until the root cause is identified and fixed.

---

## Quick-Reference: Minimum Viable Deploy Checklist

For low-risk deploys (no schema changes, no billing changes), run only:

- [ ] Section 1 — env vars present
- [ ] Section 3 — public pages return 200
- [ ] Section 6 — login/logout works
- [ ] Section 9 — webhook receives test event successfully
- [ ] Section 15 — one meditation generation completes

---

*Last updated: 2026-05-28 — reflects Sessions 1–4 hardening (billing, consent, guest limits, dynamic route config)*
