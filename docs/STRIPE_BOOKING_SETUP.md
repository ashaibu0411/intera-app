# In-app card checkout for appointments (Stripe + Connect)

## Who gets the money?

Booking card payments use **Stripe Connect (Express)**:

- Each **business** completes **Connect onboarding** (Manage booking calendar → **Connect Stripe payouts**).
- The PaymentIntent uses **`transfer_data.destination`** = that business’s `acct_…` id stored on `businesses.stripe_connect_account_id`.
- **Your platform Stripe account** receives only an optional **application fee** (see below). The **net** of the charge (after Stripe processing fees and your application fee) is paid out to the **connected account** per Stripe’s Connect rules.

| Party | Booking paid with **card in app** (Stripe) | **Gems** (RevenueCat / App Store / Play) |
|--------|---------------------------------------------|------------------------------------------|
| **Apple / Google** | Generally **no** 30% IAP fee — this is **not** an in-app purchase of digital currency; it’s payment for a **real-world appointment**. | **Yes** — store billing rules apply for digital goods. |
| **Stripe** | **Yes** — Stripe keeps **processing fees** on the charge. See [Stripe pricing](https://stripe.com/pricing). | N/A |
| **Business (connected account)** | Receives the remainder after platform fee (if any) and Stripe fees, via Connect payouts. | N/A |
| **Your platform (Intera)** | Optional **`STRIPE_PLATFORM_FEE_PERCENT`** (e.g. `5` = 5% of the charge) as `application_fee_amount`. Default **0**. | Your existing gem / fee logic. |

### Legacy / dev only

Set secret **`STRIPE_CONNECT_DISABLED=1`** on the Edge Function environment to create PaymentIntents **without** `transfer_data` (all funds stay on the platform account). **Do not use in production** if businesses should be paid via Connect.

## Stripe Dashboard

1. Enable **Stripe Connect** ([Connect settings](https://dashboard.stripe.com/settings/connect)) and choose **Express** accounts (what the onboarding flow creates).
2. Complete Connect branding / support details as Stripe requires.

## Database

Run the migration (or apply SQL in the Supabase SQL editor):

- `supabase/migrations/20260208120000_businesses_stripe_connect.sql` — adds `businesses.stripe_connect_account_id`.

**Security:** Only **service role** (Edge Functions) should set `stripe_connect_account_id`. If your RLS lets owners `UPDATE` all columns on `businesses`, lock this column down (trigger or narrowed policy) so clients cannot point payouts at arbitrary `acct_` ids.

## App setup

1. **Stripe** — Platform account: **publishable** (`pk_…`) and **secret** (`sk_…`) keys.
2. **Expo / EAS** — Set `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `eas.json` env or EAS Secrets for production builds.
3. **Apple Pay (optional)** — Register an Apple Pay **Merchant ID** in Apple Developer (e.g. `merchant.com.vibecode.intera`) to match `app.json` → `@stripe/stripe-react-native` plugin. Set `EXPO_PUBLIC_STRIPE_MERCHANT_IDENTIFIER` if different. Configure **iOS certificates** in Stripe (not “payment method domains”).
4. **Supabase Edge Functions** — Deploy functions and set secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   supabase secrets set STRIPE_CONNECT_DEFAULT_COUNTRY=US
   # optional platform fee (whole percent of charge, e.g. 5 = 5%)
   supabase secrets set STRIPE_PLATFORM_FEE_PERCENT=0
   supabase functions deploy create-booking-payment-intent
   supabase functions deploy stripe-connect-onboarding
   ```
   **Stripe Connect return URL (required):** Stripe only accepts **https** `return_url` / `refresh_url`, not `vibecode://` or `exp://`. Deploy the public **deeplink bridge** (no JWT — the user’s browser hits it after Stripe):
   ```bash
   supabase functions deploy stripe-connect-deeplink --no-verify-jwt
   ```
   Optional secrets on the bridge (defaults match `app.json` → `scheme: "vibecode"`):
   ```bash
   supabase secrets set APP_DEEP_LINK_SCHEME=vibecode
   ```
   The app builds return URLs as  
   `{EXPO_PUBLIC_SUPABASE_URL}/functions/v1/stripe-connect-deeplink?d={encodeURIComponent(Linking.createURL(...))}`.

   **Alternative:** Host your own `https://…` pages and set `EXPO_PUBLIC_STRIPE_CONNECT_RETURN_URL` (and optional `EXPO_PUBLIC_STRIPE_CONNECT_REFRESH_URL`).
5. **Rebuild** the app (native Stripe module — **not** Expo Go).

## Business owner flow

1. Open **Manage booking calendar** for their business.
2. Tap **Connect Stripe payouts** — completes Express onboarding in a browser session.
3. After Stripe enables **charges** on the connected account, customers see **Pay now with card** on book-appointment.

## Files

- `supabase/functions/create-booking-payment-intent/index.ts` — PaymentIntent with Connect `transfer_data` + optional `application_fee_amount`.
- `supabase/functions/stripe-connect-onboarding/index.ts` — Creates Express account (if needed) + Account Link.
- `src/lib/bookingStripePayment.ts` — Invokes `create-booking-payment-intent` + Payment Sheet.
- `src/lib/stripeConnectOnboarding.ts` — Invokes `stripe-connect-onboarding` + in-app browser.
- `src/app/manage-booking-calendar.tsx` — Connect CTA for owners.
- `src/app/book-appointment.tsx` — In-app card only if `stripe_connect_account_id` is set.

## Web

The in-app card option is **hidden on web** (`Platform.OS === 'web'`). Add a web checkout flow separately if needed.
