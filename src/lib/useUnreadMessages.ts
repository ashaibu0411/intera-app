import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { create } from 'zustand';
import { supabase } from './supabase';

// Global store for unread message count
interface UnreadMessagesStore {
  unreadCount: number;
  currentUserId: string | null;
  lastRefreshTime: number;
  setUnreadCount: (count: number) => void;
  setCurrentUserId: (id: string | null) => void;
  setLastRefreshTime: (time: number) => void;
}

const useUnreadStore = create<UnreadMessagesStore>((set) => ({
  unreadCount: 0,
  currentUserId: null,
  lastRefreshTime: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
  setCurrentUserId: (id) => set({ currentUserId: id }),
  setLastRefreshTime: (time) => set({ lastRefreshTime: time }),
}));

// Fetch unread count directly from database
async function fetchUnreadCountFromDb(userId: string): Promise<number> {
  try {
    // Get all conversations user is part of
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (!participations || participations.length === 0) {
      return 0;
    }

    const conversationIds = participations.map((p) => p.conversation_id);

    // Count unread messages not sent by this user
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('read', false);

    if (error) {
      console.log('[UnreadMessages] Error fetching count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.log('[UnreadMessages] Exception fetching count:', error);
    return 0;
  }
}

// Mark all messages as read in database and return the new count
export async function markAllMessagesAsReadAndRefresh(userId: string): Promise<number> {
  try {
    // Get all conversation IDs the user is part of
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (!participations || participations.length === 0) {
      return 0;
    }

    const conversationIds = participations.map((p) => p.conversation_id);

    // Update all unread messages to read
    await supabase
      .from('messages')
      .update({ read: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('read', false);

    // Wait a bit for database to sync
    await new Promise(resolve => setTimeout(resolve, 100));

    // Fetch the new count to confirm it's 0
    const newCount = await fetchUnreadCountFromDb(userId);

    // Update store immediately
    useUnreadStore.getState().setUnreadCount(newCount);
    useUnreadStore.getState().setLastRefreshTime(Date.now());

    console.log('[UnreadMessages] Marked all as read, new count:', newCount);

    return newCount;
  } catch (error) {
    console.log('[UnreadMessages] Error marking as read:', error);
    return 0;
  }
}

// Mark messages in a specific conversation as read
export async function markConversationAsRead(conversationId: string, userId: string): Promise<void> {
  try {
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('read', false);

    // Refresh the global count after marking
    const newCount = await fetchUnreadCountFromDb(userId);
    useUnreadStore.getState().setUnreadCount(newCount);
    useUnreadStore.getState().setLastRefreshTime(Date.now());

    console.log('[UnreadMessages] Marked conversation as read, new count:', newCount);
  } catch (error) {
    console.log('[UnreadMessages] Error marking conversation as read:', error);
  }
}

// Force refresh the count from database
export async function refreshUnreadCount(userId: string): Promise<number> {
  const count = await fetchUnreadCountFromDb(userId);
  useUnreadStore.getState().setUnreadCount(count);
  useUnreadStore.getState().setLastRefreshTime(Date.now());
  return count;
}

/**
 * Hook that returns the count of unread messages
 * Uses database as single source of truth with polling
 */
export function useUnreadMessages() {
  const unreadCount = useUnreadStore((s) => s.unreadCount);
  const currentUserId = useUnreadStore((s) => s.currentUserId);
  const setUnreadCount = useUnreadStore((s) => s.setUnreadCount);
  const setCurrentUserId = useUnreadStore((s) => s.setCurrentUserId);
  const setLastRefreshTime = useUnreadStore((s) => s.setLastRefreshTime);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get current user from Supabase auth directly
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, [setCurrentUserId]);

  // Fetch count from database
  const refetch = useCallback(async () => {
    if (!currentUserId) {
      setUnreadCount(0);
      return;
    }
    const count = await fetchUnreadCountFromDb(currentUserId);
    setUnreadCount(count);
    setLastRefreshTime(Date.now());
  }, [currentUserId, setUnreadCount, setLastRefreshTime]);

  // Mark all as read - updates DB then refreshes count
  const markAllAsRead = useCallback(async () => {
    if (!currentUserId) return;
    await markAllMessagesAsReadAndRefresh(currentUserId);
  }, [currentUserId]);

  // Set up polling and app state listeners
  useEffect(() => {
    if (!currentUserId) return;

    // Initial fetch
    refetch();

    // Poll every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      refetch();
    }, 5000);

    // Also refresh when app comes to foreground
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        refetch();
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      appStateSubscription.remove();
    };
  }, [currentUserId, refetch]);

  return {
    unreadCount,
    refetch,
    markAllAsRead,
    // Expose direct count setter for immediate UI updates (will be overwritten by next poll)
    setUnreadCount,
  };
}

// Export the store for direct access
export { useUnreadStore };
