/**
 * In-app card checkout for business appointments (Stripe Payment Sheet).
 * Requires EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY and deployed Edge Function create-booking-payment-intent.
 */
import { supabase } from '@/lib/supabase';
import {
  formatFunctionsInvokeErrorForUser,
  getMessageFromFunctionsInvokeError,
} from '@/lib/supabaseFunctionInvokeHelpers';

export function isStripeBookingConfigured(): boolean {
  const pk = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return typeof pk === 'string' && pk.startsWith('pk_');
}

export type BookingCardPayResult =
  | { ok: true }
  | { ok: false; error: string; canceled?: boolean };

export async function payBookingWithCard(params: {
  businessId: string;
  serviceId: string;
  customerName?: string;
}): Promise<BookingCardPayResult> {
  if (!isStripeBookingConfigured()) {
    return { ok: false, error: 'Card checkout is not configured. Add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY and deploy the Edge Function.' };
  }

  let initPaymentSheet: typeof import('@stripe/stripe-react-native').initPaymentSheet;
  let presentPaymentSheet: typeof import('@stripe/stripe-react-native').presentPaymentSheet;
  try {
    const stripe = await import('@stripe/stripe-react-native');
    initPaymentSheet = stripe.initPaymentSheet;
    presentPaymentSheet = stripe.presentPaymentSheet;
  } catch {
    return {
      ok: false,
      error: 'Stripe native module is missing. Use a dev/production build (not Expo Go).',
    };
  }

  const { data, error } = await supabase.functions.invoke<{
    clientSecret?: string;
    error?: string;
  }>('create-booking-payment-intent', {
    body: {
      business_id: params.businessId,
      service_id: params.serviceId,
    },
  });

  if (error) {
    const parsed = await getMessageFromFunctionsInvokeError(error);
    console.warn('[create-booking-payment-intent]', parsed.httpStatus ?? '?', parsed.message);
    return { ok: false, error: formatFunctionsInvokeErrorForUser(parsed) };
  }
  if (data?.error) {
    return { ok: false, error: data.error };
  }
  const clientSecret = data?.clientSecret;
  if (!clientSecret) {
    return { ok: false, error: 'No payment session returned' };
  }

  const { error: initError } = await initPaymentSheet({
    merchantDisplayName: 'Intera',
    paymentIntentClientSecret: clientSecret,
    defaultBillingDetails: params.customerName ? { name: params.customerName } : undefined,
    allowsDelayedPaymentMethods: true,
  });

  if (initError) {
    return { ok: false, error: initError.message };
  }

  const { error: presentError } = await presentPaymentSheet();

  if (presentError) {
    const code = (presentError as { code?: string }).code;
    if (code === 'Canceled') {
      return { ok: false, error: 'Payment canceled', canceled: true };
    }
    return { ok: false, error: presentError.message };
  }

  return { ok: true };
}
