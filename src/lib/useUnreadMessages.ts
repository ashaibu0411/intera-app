import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from './supabase';

/**
 * Hook that returns the count of unread messages
 */
export function useUnreadMessages() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const isMarkingAsRead = useRef(false);

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
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUserId || isMarkingAsRead.current) {
      return;
    }

    try {
      // Get conversations the user is part of
      const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      if (!participations || participations.length === 0) {
        setUnreadCount(0);
        return;
      }

      const conversationIds = participations.map((p) => p.conversation_id);

      // Count unread messages from other users
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', currentUserId)
        .eq('read', false);

      if (error) {
        console.log('[Messages] Error fetching unread count:', error);
        return;
      }

      setUnreadCount(count || 0);
    } catch (error) {
      console.error('[Messages] Error fetching unread count:', error);
    }
  }, [currentUserId]);

  // Mark all messages as read and refresh count
  const markAllAsRead = useCallback(async () => {
    if (!currentUserId || isMarkingAsRead.current) return;

    isMarkingAsRead.current = true;

    try {
      // Get conversations the user is part of
      const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);

      if (!participations || participations.length === 0) {
        isMarkingAsRead.current = false;
        return;
      }

      // Mark messages as read for each conversation individually
      for (const participation of participations) {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('conversation_id', participation.conversation_id)
          .neq('sender_id', currentUserId)
          .eq('read', false);
      }

      // Immediately set count to 0
      setUnreadCount(0);
    } catch (error) {
      console.error('[Messages] Error marking all as read:', error);
    } finally {
      isMarkingAsRead.current = false;
    }
  }, [currentUserId]);

  // Fetch on mount and poll every 5 seconds
  useEffect(() => {
    if (currentUserId) {
      fetchUnreadCount();
    }

    const interval = setInterval(() => {
      if (currentUserId) {
        fetchUnreadCount();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUserId, fetchUnreadCount]);

  // Also refetch when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (currentUserId) {
        fetchUnreadCount();
      }
    }, [currentUserId, fetchUnreadCount])
  );

  return { unreadCount, refetch: fetchUnreadCount, markAllAsRead };
}
