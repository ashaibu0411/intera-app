-- Stripe Connect: each business receives payouts on its Express connected account.
-- IMPORTANT: Do not allow clients to UPDATE this column via RLS — only the service role
-- (Edge Functions) should set it. If your policies use a broad "owner can update business",
-- add a separate policy or trigger to block changes to stripe_connect_account_id from anon/authenticated.

ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT;

-- Optional uniqueness: one Stripe account per business row
CREATE UNIQUE INDEX IF NOT EXISTS businesses_stripe_connect_account_id_key
  ON public.businesses (stripe_connect_account_id)
  WHERE stripe_connect_account_id IS NOT NULL;

COMMENT ON COLUMN public.businesses.stripe_connect_account_id IS
  'Stripe Connect Express account id (acct_...). Set only by Edge Functions.';
