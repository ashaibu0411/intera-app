/**
 * Creates a Stripe PaymentIntent for an appointment service.
 * Amount is read from business_services (service role) — client cannot pick an arbitrary price.
 *
 * Stripe Connect (default): funds go to the business's connected account via transfer_data.
 * Optional platform fee: STRIPE_PLATFORM_FEE_PERCENT (e.g. "5" = 5% of charge).
 *
 * Escape hatch (legacy / dev only): STRIPE_CONNECT_DISABLED=1 — no transfer_data; money stays on platform.
 *
 * Secrets: STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY
 * Optional: STRIPE_CONNECT_DEFAULT_COUNTRY (unused here), STRIPE_PLATFORM_FEE_PERCENT, STRIPE_CONNECT_DISABLED
 */
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function platformFeeAmountCents(amountCents: number): number {
  const raw = Deno.env.get('STRIPE_PLATFORM_FEE_PERCENT');
  if (!raw) return 0;
  const pct = parseFloat(raw);
  if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) return 0;
  const fee = Math.floor((amountCents * pct) / 100);
  return fee >= amountCents ? 0 : fee;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: 'Stripe is not configured on the server' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const connectDisabled = Deno.env.get('STRIPE_CONNECT_DISABLED') === '1';

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const business_id = body?.business_id as string | undefined;
    const service_id = body?.service_id as string | undefined;
    if (!business_id || !service_id) {
      return new Response(JSON.stringify({ error: 'business_id and service_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: svc, error: svcErr } = await supabaseAdmin
      .from('business_services')
      .select('id, price, currency, business_id, is_active')
      .eq('id', service_id)
      .eq('business_id', business_id)
      .maybeSingle();

    if (svcErr || !svc || !svc.is_active) {
      return new Response(JSON.stringify({ error: 'Service not found or inactive' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: businessRow, error: bizErr } = await supabaseAdmin
      .from('businesses')
      .select('id, stripe_connect_account_id')
      .eq('id', business_id)
      .maybeSingle();

    if (bizErr || !businessRow) {
      return new Response(JSON.stringify({ error: 'Business not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const price = Number(svc.price);
    if (!Number.isFinite(price) || price <= 0 || price > 10000) {
      return new Response(JSON.stringify({ error: 'Invalid service price' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amountCents = Math.round(price * 100);
    const currency = String(svc.currency || 'usd').toLowerCase();
    const application_fee_amount = platformFeeAmountCents(amountCents);

    const baseParams: Stripe.PaymentIntentCreateParams = {
      amount: amountCents,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        supabase_user_id: user.id,
        business_id,
        service_id,
      },
    };

    if (!connectDisabled) {
      const connectedAccountId = businessRow.stripe_connect_account_id as string | null;
      if (!connectedAccountId?.startsWith('acct_')) {
        return new Response(
          JSON.stringify({
            error:
              'This business is not set up for in-app card payments yet. The owner must connect Stripe payouts first.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      let account: Stripe.Account;
      try {
        account = await stripe.accounts.retrieve(connectedAccountId);
      } catch {
        return new Response(JSON.stringify({ error: 'Could not verify payout account. Try again later.' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!account.charges_enabled) {
        return new Response(
          JSON.stringify({
            error:
              'This business is still finishing Stripe setup or is under review. Choose another payment method or try again later.',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }

      baseParams.transfer_data = { destination: connectedAccountId };
      if (application_fee_amount > 0) {
        baseParams.application_fee_amount = application_fee_amount;
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(baseParams);

    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[create-booking-payment-intent]', e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
