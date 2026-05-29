# ChimAura

ChimAura is a wellness app focused on meditation, breathwork, sleep wind-down rituals, ambient soundscapes, AI narration, and daily cosmic reflection.

## Core experiences

- Personalized AI meditations
- Guided breathing exercises
- Sleep wind-down sessions
- Ambient sound mixing
- Premium AI voice narration
- Daily horoscope and zen reflection

> Note: This repository is **only** for the ChimAura meditation, breathing, and reflection app. Any fantasy sports or bracket functionality (including AllFantasy) lives in a completely separate codebase and is not part of this project.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

ChimAura uses server-side integrations for:

- OpenAI
- Stripe Billing
- FreeAstroAPI
- PostgreSQL via Prisma
- Upstash Redis for rate limiting

Copy `.env.example` to `.env.local` and fill in the required values before running production features.

Required for Prisma and deploys:

- `DATABASE_URL`
- `OPENAI_API_KEY`
- `FREE_ASTRO_API_KEY`
- `FREE_ASTRO_API_BASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_YEARLY`
- `NEXT_PUBLIC_APP_URL`
- `PUBLIC_APP_URL` (optional fallback used for server-side email links)
- `AUTH_TOKEN_SECRET` for signed email verification and password reset links
- `RESEND_API_KEY` for verification and password reset email delivery
- `RESEND_FROM_EMAIL` sender address (must be valid in your Resend setup)

Optional but used by specific features:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `WEB_PUSH_PUBLIC_KEY`
- `WEB_PUSH_PRIVATE_KEY`
- `WEB_PUSH_SUBJECT`
- `IP_HASH_SALT`
- `ALLOW_LOCAL_AUTH_FALLBACK` (default `false`; keep `false` in production to prevent ephemeral local auth users)

For Vercel, add the same environment variables in Project Settings -> Environment Variables.

## Email troubleshooting

If verification emails are not arriving:

1. Sign in and call `GET /api/auth/email-health` to see config status.
2. Call `POST /api/auth/email-health` to trigger a test verification email.

Both endpoints require an authenticated session.

## Auth database health

Use `GET /api/health/auth-db` as a deploy/runtime check for sign-in/sign-up readiness.

- Returns `200` when Prisma is reachable and required auth tables exist (`users`, `auth_sessions`).
- Returns `503` when DB is unreachable or schema is incomplete.
