import { useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { create } from 'zustand';
import { supabase } from './supabase';

// Global store for unread message count
interface UnreadMessagesStore {
  unreadCount: number;
  currentUserId: string | null;
  setUnreadCount: (count: number) => void;
  setCurrentUserId: (id: string | null) => void;
}

const useUnreadStore = create<UnreadMessagesStore>((set) => ({
  unreadCount: 0,
  currentUserId: null,
  setUnreadCount: (count) => set({ unreadCount: count }),
  setCurrentUserId: (id) => set({ currentUserId: id }),
}));

// Fetch unread count function (can be called from anywhere)
export async function fetchUnreadMessageCount(userId: string): Promise<number> {
  try {
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (!participations || participations.length === 0) {
      return 0;
    }

    const conversationIds = participations.map((p) => p.conversation_id);

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('read', false);

    if (error) {
      console.log('[Messages] Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[Messages] Error fetching unread count:', error);
    return 0;
  }
}

// Mark all messages as read function (can be called from anywhere)
export async function markAllMessagesAsReadForUser(userId: string): Promise<void> {
  try {
    const { data: participations } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (!participations || participations.length === 0) return;

    // Mark messages as read for each conversation
    for (const p of participations) {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', p.conversation_id)
        .neq('sender_id', userId)
        .eq('read', false);
    }
  } catch (error) {
    console.error('[Messages] Error marking all as read:', error);
  }
}

/**
 * Hook that returns the count of unread messages
 */
export function useUnreadMessages() {
  const unreadCount = useUnreadStore((s) => s.unreadCount);
  const currentUserId = useUnreadStore((s) => s.currentUserId);
  const setUnreadCount = useUnreadStore((s) => s.setUnreadCount);
  const setCurrentUserId = useUnreadStore((s) => s.setCurrentUserId);

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

  // Fetch count
  const refetch = useCallback(async () => {
    if (!currentUserId) {
      setUnreadCount(0);
      return;
    }
    const count = await fetchUnreadMessageCount(currentUserId);
    setUnreadCount(count);
  }, [currentUserId, setUnreadCount]);

  // Mark all as read and update count
  const markAllAsRead = useCallback(async () => {
    if (!currentUserId) return;
    await markAllMessagesAsReadForUser(currentUserId);
    setUnreadCount(0);
  }, [currentUserId, setUnreadCount]);

  // Fetch on mount and poll every 5 seconds
  useEffect(() => {
    if (currentUserId) {
      refetch();
    }

    const interval = setInterval(() => {
      if (currentUserId) {
        refetch();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUserId, refetch]);

  // Also refetch when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        refetch();
      }
    }, [currentUserId, refetch])
  );

  return { unreadCount, refetch, markAllAsRead, setUnreadCount };
}

// Export the store for direct access
export { useUnreadStore };
