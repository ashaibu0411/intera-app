import { supabase } from '@/lib/supabase';

export type AlertScope = 'neighborhood' | 'city' | 'global';

export async function sendRemotePushAlert(payload: {
  title: string;
  body: string;
  scope: AlertScope;
  city?: string | null;
  neighborhood?: string | null;
  excludeUserId?: string | null;
  type?: string;
  actorId?: string | null;
  data?: Record<string, unknown>;
}) {
  try {
    const typeFromData = typeof payload.data?.type === 'string' ? String(payload.data.type) : undefined;
    await supabase.functions.invoke('send-push-alert', {
      body: {
        ...payload,
        type: payload.type ?? typeFromData,
        actorId: payload.actorId ?? null,
        data: payload.data ?? {},
      },
    });
  } catch (e) {
    // best-effort; log for debugging cross-platform notification issues
    console.warn('[PushAlerts] sendRemotePushAlert failed:', String((e as any)?.message ?? e));
  }
}

/**
 * SMS to the business listing phone (Twilio via Edge Function). Best-effort; skips if Twilio or phone unset.
 * Caller must be the booking customer (enforced server-side).
 */
export async function sendBusinessAppointmentSms(appointmentId: string) {
  try {
    await supabase.functions.invoke('send-appointment-sms', {
      body: { appointmentId },
    });
  } catch (e) {
    console.warn('[PushAlerts] sendBusinessAppointmentSms failed:', String((e as any)?.message ?? e));
  }
}

export async function sendDirectPushAlert(payload: {
  title: string;
  body: string;
  recipientUserId: string;
  excludeUserId?: string | null;
  type?: string;
  actorId?: string | null;
  data?: Record<string, unknown>;
}) {
  try {
    const typeFromData = typeof payload.data?.type === 'string' ? String(payload.data.type) : undefined;
    await supabase.functions.invoke('send-push-alert', {
      body: {
        title: payload.title,
        body: payload.body,
        recipientUserId: payload.recipientUserId,
        excludeUserId: payload.excludeUserId ?? null,
        type: payload.type ?? typeFromData,
        actorId: payload.actorId ?? null,
        data: payload.data ?? {},
      },
    });
  } catch {
    // best-effort
  }
}
