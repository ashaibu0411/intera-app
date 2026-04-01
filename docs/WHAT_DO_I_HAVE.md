# What do I have? (Supabase + app checklist)

If you’re not sure what’s already set up, do this in order. You only need the **Supabase dashboard** and (optionally) **Stripe dashboard**.

---

## Step 1 — Database snapshot (SQL)

1. Open **Supabase** → your project → **SQL Editor** → New query.  
2. Open the file **`supabase/DIAGNOSTIC_what_do_i_have.sql`** in this repo, copy **all** of it, paste, **Run**.

You’ll get several **result tables** (one per query block). Together they show:

- Columns that look like **Stripe / payments / Connect**
- **Tables** related to bookings / businesses / orders  
- **RPC / functions** in `public` with those keywords (if any)

**How to read it:**  
- Empty result for a section = nothing matched that pattern (not always bad).  
- Rows = “this exists in your database.”

Save a screenshot or export if you want to compare later.

---

## Step 2 — Supabase (not in SQL)

| Where | What to look for | If it’s there |
|--------|------------------|----------------|
| **Edge Functions** | Any function names with `stripe`, `payment`, `webhook`, `booking` | Server-side Stripe logic may be deployed |
| **Project Settings → Edge Functions → Secrets** (or **Vault**) | `STRIPE_SECRET_KEY`, webhook secret, etc. | Server can call Stripe |
| **Authentication → Providers** | Email, Google, etc. | Unrelated to Stripe but good to know |

---

## Step 3 — Stripe dashboard

| Where | What to look for |
|--------|------------------|
| **Developers → API keys** | Publishable + secret (secret stays in Supabase, not in the app binary) |
| **Developers → Webhooks** | Endpoint URL pointing at your Supabase Edge Function or backend |
| **Connect → Accounts** (if you use Connect) | Connected accounts when businesses finish onboarding |

---

## Step 4 — This app (Intera)

- **Open to connect** needs: `OPEN_CONNECT_BACKEND_ALL.sql` (or the split migrations) — separate from Stripe.  
- **Bookings + Stripe** need: DB tables you already saw (`appointments`, `business_booking_settings`) **plus** `stripe_connect_id`-style columns **plus** Edge Functions/secrets if payments run server-side.

---

## Still confused?

Run **only** the first query in `DIAGNOSTIC_what_do_i_have.sql` and paste the **output** (or a screenshot) into a note — that single result lists almost every payment/Stripe-ish column name across your `public` schema.
