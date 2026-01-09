import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useStore } from './store';
import { supabase } from './supabase';

/**
 * Hook that returns the count of unread messages
 */
export function useUnreadMessages() {
  const currentUser = useStore((s) => s.currentUser);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      // Get conversations the user is part of
      const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser.id);

      if (!participations || participations.length === 0) {
        setUnreadCount(0);
        return;
      }

      const conversationIds = participations.map((p) => p.conversation_id);

      // Count unread messages from other users
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', currentUser.id)
        .eq('read', false);

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [currentUser?.id]);

  // Fetch on mount and poll every 5 seconds
  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(fetchUnreadCount, 5000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Also refetch when screen gains focus (e.g., returning from messages)
  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
    }, [fetchUnreadCount])
  );

  return { unreadCount, refetch: fetchUnreadCount };
}
