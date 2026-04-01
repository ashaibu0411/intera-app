/**
 * Creates or resumes Stripe Connect Express onboarding for a business the user owns.
 *
 * Body: { business_id, return_url, refresh_url? }
 * Returns: { url } — open in in-app browser
 *
 * Secrets: STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY
 * Optional: STRIPE_CONNECT_DEFAULT_COUNTRY (ISO 2-letter, default US)
 */
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const defaultCountry = (Deno.env.get('STRIPE_CONNECT_DEFAULT_COUNTRY') || 'US').toUpperCase();

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
    const return_url = body?.return_url as string | undefined;
    const refresh_url = (body?.refresh_url as string | undefined) || return_url;

    if (!business_id || !return_url) {
      return new Response(JSON.stringify({ error: 'business_id and return_url required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: business, error: bizErr } = await supabaseAdmin
      .from('businesses')
      .select('id, owner_id, name, stripe_connect_account_id')
      .eq('id', business_id)
      .maybeSingle();

    if (bizErr || !business) {
      return new Response(JSON.stringify({ error: 'Business not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (business.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Only the business owner can connect Stripe' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let stripeAccountId = business.stripe_connect_account_id as string | null;

    if (!stripeAccountId) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .maybeSingle();

      const email = user.email ?? (profile?.email as string | undefined);

      const account = await stripe.accounts.create({
        type: 'express',
        country: defaultCountry,
        email: email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          name: (business.name as string)?.slice(0, 100) || undefined,
        },
        metadata: {
          supabase_business_id: business_id,
        },
      });

      stripeAccountId = account.id;

      const { error: updErr } = await supabaseAdmin
        .from('businesses')
        .update({ stripe_connect_account_id: stripeAccountId })
        .eq('id', business_id);

      if (updErr) {
        console.error('[stripe-connect-onboarding] failed to save account id', updErr);
        return new Response(JSON.stringify({ error: 'Could not save Stripe account. Try again.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const acct = await stripe.accounts.retrieve(stripeAccountId);
    const linkType: 'account_onboarding' | 'account_update' =
      acct.charges_enabled ? 'account_update' : 'account_onboarding';

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url,
      return_url,
      type: linkType,
    });

    return new Response(
      JSON.stringify({
        url: accountLink.url,
        stripe_account_id: stripeAccountId,
        charges_enabled: acct.charges_enabled,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error('[stripe-connect-onboarding]', e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
