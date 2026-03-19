import { useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { create } from 'zustand';
import { supabase } from './supabase';

interface UnreadNotificationsStore {
  unreadCount: number;
  currentUserId: string | null;
  setUnreadCount: (count: number) => void;
  setCurrentUserId: (id: string | null) => void;
}

const useUnreadNotificationsStore = create<UnreadNotificationsStore>((set) => ({
  unreadCount: 0,
  currentUserId: null,
  setUnreadCount: (count) => set({ unreadCount: count }),
  setCurrentUserId: (id) => set({ currentUserId: id }),
}));

async function fetchUnreadCountFromDb(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .is('read_at', null);

    if (error) {
      console.log('[UnreadNotifications] Error fetching count:', error);
      return 0;
    }

    return count ?? 0;
  } catch (error) {
    console.log('[UnreadNotifications] Exception fetching count:', error);
    return 0;
  }
}

/**
 * Hook that returns the count of unread notifications from Supabase.
 * Uses the notifications table (recipient_id, read_at) as single source of truth.
 */
export function useUnreadNotifications() {
  const unreadCount = useUnreadNotificationsStore((s) => s.unreadCount);
  const currentUserId = useUnreadNotificationsStore((s) => s.currentUserId);
  const setUnreadCount = useUnreadNotificationsStore((s) => s.setUnreadCount);
  const setCurrentUserId = useUnreadNotificationsStore((s) => s.setCurrentUserId);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setCurrentUserId]);

  const refetch = useCallback(async () => {
    if (!currentUserId) {
      setUnreadCount(0);
      return;
    }
    const count = await fetchUnreadCountFromDb(currentUserId);
    setUnreadCount(count);
  }, [currentUserId, setUnreadCount]);

  useEffect(() => {
    if (!currentUserId) return;

    refetch();

    pollIntervalRef.current = setInterval(refetch, 5000);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') refetch();
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // Realtime: refetch when new notifications arrive
    const channel = supabase.channel(`unread-notifications:${currentUserId}`);
    channel.on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${currentUserId}` },
      () => refetch()
    );
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${currentUserId}` },
      () => refetch()
    );
    channel.subscribe();

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      appStateSubscription.remove();
      supabase.removeChannel(channel);
    };
  }, [currentUserId, refetch]);

  return {
    unreadCount,
    refetch,
  };
}

export { useUnreadNotificationsStore };
