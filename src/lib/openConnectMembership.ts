/**
 * Server-side "Open to connect community" membership.
 * Only opted-in users see lobby, connect wall targeting, and receive connect_post fan-out (see migrations + Edge Function).
 */
import { supabase } from './supabase';

export async function fetchOpenConnectOptIn(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('open_connect_opt_in')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('[openConnectMembership] fetch:', error.message);
      return false;
    }
    return !!(data as { open_connect_opt_in?: boolean } | null)?.open_connect_opt_in;
  } catch {
    return false;
  }
}

export async function setOpenConnectOptIn(userId: string, value: boolean): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ open_connect_opt_in: value })
      .eq('id', userId);

    if (error) {
      const msg = String(error.message || '');
      if (msg.includes('open_connect_opt_in') || (error as { code?: string }).code === 'PGRST204') {
        return { ok: false, error: 'Open to connect membership is not available yet. Update your Supabase database (migration open_connect_opt_in).' };
      }
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
