import { supabase } from '@/lib/supabase';

export type AlertScope = 'neighborhood' | 'city' | 'global';

export async function sendRemotePushAlert(payload: {
  title: string;
  body: string;
  scope: AlertScope;
  city?: string | null;
  neighborhood?: string | null;
  excludeUserId?: string | null;
  data?: Record<string, unknown>;
}) {
  try {
    await supabase.functions.invoke('send-push-alert', { body: payload });
  } catch {
    // best-effort
  }
}

