/**
 * Stripe Connect Express onboarding for business owners (in-app browser).
 * Requires deployed Edge Function `stripe-connect-onboarding`.
 */
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase, SUPABASE_URL } from '@/lib/supabase';
import { isStripeBookingConfigured } from '@/lib/bookingStripePayment';
import {
  formatFunctionsInvokeErrorForUser,
  getMessageFromFunctionsInvokeError,
} from '@/lib/supabaseFunctionInvokeHelpers';

export type StripeConnectOnboardingResult =
  | { ok: true; charges_enabled?: boolean }
  | { ok: false; error: string };

/**
 * Stripe Account Links require https return/refresh URLs (not vibecode:// or exp://).
 * 1) Optional: EXPO_PUBLIC_STRIPE_CONNECT_RETURN_URL (+ _REFRESH_URL) — your own https pages.
 * 2) Default: Supabase function `stripe-connect-deeplink` (deploy with --no-verify-jwt) serves HTML → opens app.
 */
function getStripeConnectHttpsUrls():
  | { ok: true; return_url: string; refresh_url: string }
  | { ok: false; error: string } {
  const explicitReturn = process.env.EXPO_PUBLIC_STRIPE_CONNECT_RETURN_URL?.trim();
  if (explicitReturn?.startsWith('https://')) {
    const explicitRefresh = process.env.EXPO_PUBLIC_STRIPE_CONNECT_REFRESH_URL?.trim();
    return {
      ok: true,
      return_url: explicitReturn,
      refresh_url: explicitRefresh?.startsWith('https://') ? explicitRefresh : explicitReturn,
    };
  }

  const bridge = process.env.EXPO_PUBLIC_STRIPE_CONNECT_BRIDGE_URL?.trim();
  if (bridge?.startsWith('https://')) {
    const b = bridge.replace(/\/$/, '');
    const appReturn = Linking.createURL('stripe-connect-return');
    const appRefresh = Linking.createURL('stripe-connect-refresh');
    return {
      ok: true,
      return_url: `${b}?d=${encodeURIComponent(appReturn)}`,
      refresh_url: `${b}?d=${encodeURIComponent(appRefresh)}`,
    };
  }

  const base = (process.env.EXPO_PUBLIC_SUPABASE_URL || SUPABASE_URL || '').replace(/\/$/, '');
  if (base.startsWith('https://')) {
    const bridge = `${base}/functions/v1/stripe-connect-deeplink`;
    const appReturn = Linking.createURL('stripe-connect-return');
    const appRefresh = Linking.createURL('stripe-connect-refresh');
    const return_url = `${bridge}?d=${encodeURIComponent(appReturn)}`;
    const refresh_url = `${bridge}?d=${encodeURIComponent(appRefresh)}`;
    return { ok: true, return_url, refresh_url };
  }

  return {
    ok: false,
    error:
      'Stripe Connect needs an https return URL. Deploy supabase function stripe-connect-deeplink (--no-verify-jwt) or set EXPO_PUBLIC_STRIPE_CONNECT_RETURN_URL.',
  };
}

/** App deep link opened by the HTTPS bridge page (must match app.json scheme + path). */
export function getStripeConnectAppDeepLink(): string {
  return Linking.createURL('stripe-connect-return');
}

/**
 * Opens Stripe-hosted Connect onboarding. Caller should reload business row after success.
 */
export async function openStripeConnectOnboarding(businessId: string): Promise<StripeConnectOnboardingResult> {
  if (!isStripeBookingConfigured()) {
    return {
      ok: false,
      error: 'Stripe is not configured. Add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY and deploy Edge Functions.',
    };
  }

  const urls = getStripeConnectHttpsUrls();
  if (!urls.ok) {
    return { ok: false, error: urls.error };
  }
  const { return_url, refresh_url } = urls;

  const { data, error } = await supabase.functions.invoke<{
    url?: string;
    error?: string;
    charges_enabled?: boolean;
  }>('stripe-connect-onboarding', {
    body: {
      business_id: businessId,
      return_url,
      refresh_url,
    },
  });

  if (error) {
    const parsed = await getMessageFromFunctionsInvokeError(error);
    // Shows in Metro, Logcat, and many crash tools (release too) — filter tag "stripe-connect-onboarding"
    console.warn('[stripe-connect-onboarding]', parsed.httpStatus ?? '?', parsed.message);
    return {
      ok: false,
      error: formatFunctionsInvokeErrorForUser(parsed),
    };
  }
  if (data?.error) {
    return { ok: false, error: data.error };
  }
  const url = data?.url;
  if (!url) {
    return { ok: false, error: 'No onboarding URL returned' };
  }

  // Second arg must match return_url (https) so the auth session closes when Stripe redirects there
  const result = await WebBrowser.openAuthSessionAsync(url, return_url);
  if (result.type === 'cancel') {
    return { ok: false, error: 'Canceled' };
  }

  return { ok: true, charges_enabled: data?.charges_enabled };
}
