import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useStore } from './store';
import { supabase } from './supabase';
import { sendNewMessageNotification } from './notifications';

/**
 * Hook that listens for new messages and sends notifications
 * when the user receives a message they haven't seen
 */
export function useMessageNotifications() {
  const currentUser = useStore((s) => s.currentUser);
  const lastCheckedRef = useRef<string>(new Date().toISOString());
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!currentUser?.id) return;

    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let isActive = true;

    const checkForNewMessages = async () => {
      if (!isActive || !currentUser?.id) return;

      try {
        // Get conversations the user is part of
        const { data: participations } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', currentUser.id);

        if (!participations || participations.length === 0) return;

        const conversationIds = participations.map((p) => p.conversation_id);

        // Get unread messages from other users since last check
        const { data: newMessages } = await supabase
          .from('messages')
          .select(`
            id,
            content,
            sender_id,
            conversation_id,
            created_at,
            read,
            sender:profiles(name)
          `)
          .in('conversation_id', conversationIds)
          .neq('sender_id', currentUser.id)
          .eq('read', false)
          .gt('created_at', lastCheckedRef.current)
          .order('created_at', { ascending: false })
          .limit(10);

        if (newMessages && newMessages.length > 0) {
          // Only send notifications if app is in background or inactive
          const shouldNotify = appStateRef.current !== 'active';

          for (const message of newMessages) {
            const senderName = (message.sender as { name?: string })?.name || 'Someone';

            if (shouldNotify) {
              await sendNewMessageNotification(
                senderName,
                message.content,
                message.conversation_id,
                message.sender_id
              );
            }
          }

          // Update last checked time
          lastCheckedRef.current = new Date().toISOString();
        }
      } catch (error) {
        console.error('Error checking for new messages:', error);
      }
    };

    // Listen to app state changes
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // When app comes to foreground, check for messages
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        checkForNewMessages();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Poll for messages every 10 seconds
    pollInterval = setInterval(checkForNewMessages, 10000);

    // Initial check
    checkForNewMessages();

    return () => {
      isActive = false;
      subscription.remove();
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentUser?.id]);
}
