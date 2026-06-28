# DEPLOYMENT GUIDE — Bigfella Auto Express Portal

Built by BJNEXUS AI · Next.js 16.2.6 + Supabase + Stripe

---

## Prerequisites

- Node.js 20+
- Supabase account (free tier works for MVP)
- Stripe account
- n8n Cloud account (for automation engine — Job 2)
- Vercel account (free tier works)

---

## Step 1 — Supabase Setup

### 1.1 Create project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your Project URL and anon key from **Project Settings → API**
3. Ensure you use the new key format: `sb_publishable_xxx` (anon) and `sb_secret_xxx` (service role)
   - Legacy `eyJ...` JWT keys cannot be rotated if compromised

### 1.2 Run the schema
1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/migrations/001_schema.sql`
3. Paste and run

**Verify after running:**
```sql
-- Should return 10 tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Should return the view
SELECT viewname FROM pg_views WHERE schemaname = 'public';

-- Confirm RLS is enabled on all user-facing tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```

### 1.3 Enable Realtime
Go to **Database → Replication** and confirm these tables are in the `supabase_realtime` publication:
- `shipments`
- `notifications`
- `quotes`

The schema migration adds them automatically, but verify in the dashboard.

### 1.4 Configure Auth
1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to your Vercel deployment URL (e.g. `https://bigfella-portal.vercel.app`)
3. Add to **Redirect URLs**: `https://bigfella-portal.vercel.app/api/auth/callback`
4. For Google OAuth: **Authentication → Providers → Google** — add your Google OAuth credentials

**CVE-2026-31813 note:** This project pins `@supabase/supabase-js` to a version using `gotrue >= 2.185.0` which patches the OIDC token bypass. If you add Apple or Azure providers, this patch is critical.

---

## Step 2 — Stripe Setup

### 2.1 Get API keys
1. [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API keys
2. Copy **Secret key** (`sk_test_xxx` for test, `sk_live_xxx` for production)

### 2.2 Create webhook endpoint
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the **Signing secret** (`whsec_xxx`)

**Critical:** `STRIPE_WEBHOOK_SECRET` must be set. If empty, the webhook handler rejects all calls rather than silently accepting them.

---

## Step 3 — n8n Setup (Job 2 automation engine)

1. In n8n Cloud, **activate the workflow FIRST** before copying the webhook URL
   - Activating generates the Production URL — never use the `/webhook-test/` URL
   - After activating, check n8n logs for: `Registered production webhook POST /webhook/...`
2. Copy the Production webhook URL → set as `N8N_WEBHOOK_URL`
3. Set `N8N_WEBHOOK_SECRET` to a shared secret string
4. In your n8n workflow outbound HTTP nodes (for `/api/webhooks/n8n`), add header: `x-n8n-secret: your-shared-secret`

---

## Step 4 — Vercel Deployment

### 4.1 Connect repo
1. [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Select `nextjs-supabase-logistics-portal`
3. Framework: **Next.js** (auto-detected)

### 4.2 Environment variables
Add all variables from `.env.example` in **Vercel → Project Settings → Environment Variables**:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | From Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | `sb_publishable_xxx` format |
| `SUPABASE_SECRET_KEY` | ✅ | `sb_secret_xxx` format — server only |
| `STRIPE_SECRET_KEY` | ✅ | `sk_test_xxx` or `sk_live_xxx` |
| `STRIPE_WEBHOOK_SECRET` | ✅ | `whsec_xxx` — never leave empty |
| `N8N_WEBHOOK_URL` | ✅ | Production URL only |
| `N8N_WEBHOOK_SECRET` | ✅ | Shared secret |
| `RESEND_API_KEY` | Optional | Email notifications |

### 4.3 Deploy
Click **Deploy**. Vercel builds and deploys in ~2 minutes.

**CVE-2026-44578 note:** This project is hosted on Vercel. The WebSocket SSRF vulnerability (CVE-2026-44578) only affects **self-hosted** Next.js instances. Vercel deployments are not affected. If you ever move to self-hosting, ensure Next.js stays on 16.2.6+.

---

## Step 5 — Post-Deploy Verification

Run through this checklist after first deploy:

- [ ] Visit `https://your-domain.vercel.app` — redirects to `/login`
- [ ] Sign up with email — magic link arrives, redirects to correct dashboard
- [ ] Sign up with Google — OIDC flow works, redirects correctly
- [ ] Add a vehicle — all 19 types available in dropdown
- [ ] Book a shipment — form submits, redirects to athlete dashboard
- [ ] Stripe webhook — use `stripe listen --forward-to` locally to test
- [ ] n8n webhook — trigger a test from n8n, confirm shipment status updates in portal
- [ ] Admin login — confirm `/admin` redirects non-admin users to their dashboard

---

## Local Development

```bash
# Install dependencies
npm install

# Copy env file
cp .env.example .env.local
# Fill in your values

# Run dev server
npm run dev

# Type check
npm run typecheck

# Run tests
npm test

# Lint
npm run lint
```

---

## PHP Note

Andre's job post listed PHP as part of the stack. The actual architecture has no PHP layer — Next.js API routes (TypeScript) handle all server-side logic. Stripe webhooks, n8n webhooks, and booking endpoints are all `/api/` Route Handlers in Next.js App Router. If legacy PHP code exists on the HubSpot site, it is untouched — this portal is a separate application.

---

## Architecture Summary

```
Browser (athlete/agent/admin)
    ↓
Next.js 16.2.6 on Vercel
    ↓
Supabase (Postgres + Auth + Realtime)
    ↓ (on booking)
n8n Cloud automation engine (Job 2)
    ↓
Super Dispatch API + HubSpot CRM + Stripe + Twilio
    ↓ (status updates back)
/api/webhooks/n8n → Supabase → Realtime → browser
```

The `order_guid` field flows through every layer — Supabase → n8n → HubSpot → back to Supabase. This is the correlation key that enables real-time status sync without polling every system separately.
