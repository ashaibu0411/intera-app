import { supabase } from './supabase';
import { getCurrentUser } from './auth';
import { Platform } from 'react-native';

let onlineColumnsSupported: boolean | null = null;

function isMissingColumnError(error: any) {
  const msg = String(error?.message ?? '').toLowerCase();
  const code = String(error?.code ?? '');
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    msg.includes('column') && (msg.includes('is_online') || msg.includes('last_seen') || msg.includes('show_online_status'))
  );
}

/**
 * Updates the user's online status in the database
 */
export async function setUserOnline(isOnline: boolean): Promise<void> {
  try {
    // Web presence updates are noisy and often unsupported in dev; skip.
    if (Platform.OS === 'web') return;
    if (onlineColumnsSupported === false) return;
    const user = await getCurrentUser();
    if (!user?.id) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      // Silently ignore if columns don't exist yet (migration not deployed)
      if (isMissingColumnError(error)) {
        onlineColumnsSupported = false;
        return;
      }
      onlineColumnsSupported = true;
      console.log('[OnlineStatus] Error updating status:', error);
    } else {
      onlineColumnsSupported = true;
    }
  } catch (err) {
    console.log('[OnlineStatus] Error:', err);
  }
}

/**
 * Mark user as online - call when app becomes active
 */
export async function markUserOnline(): Promise<void> {
  await setUserOnline(true);
}

/**
 * Mark user as offline - call when app goes to background
 */
export async function markUserOffline(): Promise<void> {
  await setUserOnline(false);
}

/**
 * Update last seen timestamp without changing online status
 */
export async function updateLastSeen(): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    if (onlineColumnsSupported === false) return;
    const user = await getCurrentUser();
    if (!user?.id) return;

    const { error } = await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      if (isMissingColumnError(error)) {
        onlineColumnsSupported = false;
        return;
      }
      onlineColumnsSupported = true;
      console.log('[OnlineStatus] Error updating last seen:', error);
    } else {
      onlineColumnsSupported = true;
    }
  } catch (err) {
    console.log('[OnlineStatus] Error:', err);
  }
}
