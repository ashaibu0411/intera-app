import { supabase } from './supabase';
import { getCurrentUser } from './auth';

/**
 * Updates the user's online status in the database
 */
export async function setUserOnline(isOnline: boolean): Promise<void> {
  try {
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
      // Silently ignore if is_online column doesn't exist yet
      if (error.code === 'PGRST204') return;
      console.log('[OnlineStatus] Error updating status:', error);
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
    const user = await getCurrentUser();
    if (!user?.id) return;

    const { error } = await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      console.log('[OnlineStatus] Error updating last seen:', error);
    }
  } catch (err) {
    console.log('[OnlineStatus] Error:', err);
  }
}
