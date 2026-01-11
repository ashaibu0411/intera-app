/**
 * Blocked Users Persistence - App Store Guideline 1.2 Compliance
 *
 * Persists blocked users to Supabase so blocks survive app reinstalls.
 * Syncs with local Zustand store for instant UI updates.
 */

import { supabase } from './supabase';

export interface BlockedUser {
  id?: string;
  user_id: string;
  blocked_user_id: string;
  blocked_user_name: string;
  blocked_user_avatar: string | null;
  blocked_at: string;
}

/**
 * Save a blocked user to Supabase
 */
export async function saveBlockedUser(
  userId: string,
  blockedUserId: string,
  blockedUserName: string,
  blockedUserAvatar?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('blocked_users')
      .upsert({
        user_id: userId,
        blocked_user_id: blockedUserId,
        blocked_user_name: blockedUserName,
        blocked_user_avatar: blockedUserAvatar || null,
        blocked_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,blocked_user_id',
      });

    if (error) {
      console.log('[BlockedUsers] Error saving to Supabase:', error.message);
      return false;
    }

    console.log('[BlockedUsers] Saved block to database');
    return true;
  } catch (err) {
    console.log('[BlockedUsers] Error saving blocked user:', err);
    return false;
  }
}

/**
 * Remove a blocked user from Supabase
 */
export async function removeBlockedUser(
  userId: string,
  blockedUserId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('user_id', userId)
      .eq('blocked_user_id', blockedUserId);

    if (error) {
      console.log('[BlockedUsers] Error removing from Supabase:', error.message);
      return false;
    }

    console.log('[BlockedUsers] Removed block from database');
    return true;
  } catch (err) {
    console.log('[BlockedUsers] Error removing blocked user:', err);
    return false;
  }
}

/**
 * Load all blocked users for a user from Supabase
 */
export async function loadBlockedUsers(
  userId: string
): Promise<{ id: string; name: string; avatar: string; blockedAt: string }[]> {
  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .select('*')
      .eq('user_id', userId)
      .order('blocked_at', { ascending: false });

    if (error) {
      console.log('[BlockedUsers] Error loading from Supabase:', error.message);
      return [];
    }

    return (data || []).map((row: BlockedUser) => ({
      id: row.blocked_user_id,
      name: row.blocked_user_name,
      avatar: row.blocked_user_avatar || '',
      blockedAt: row.blocked_at,
    }));
  } catch (err) {
    console.log('[BlockedUsers] Error loading blocked users:', err);
    return [];
  }
}

/**
 * Check if a user is blocked (server-side check)
 */
export async function isUserBlockedInDB(
  userId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('user_id', userId)
      .eq('blocked_user_id', targetUserId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.log('[BlockedUsers] Error checking block status:', error.message);
    }

    return !!data;
  } catch (err) {
    console.log('[BlockedUsers] Error checking block status:', err);
    return false;
  }
}
