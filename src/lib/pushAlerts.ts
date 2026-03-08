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
  } catch {
    // best-effort
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
