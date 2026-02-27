import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { sendNewEventNotification, sendNewPostNotification } from '@/lib/notifications';
import { useStore } from '@/lib/store';

/**
 * Hook to listen for community notifications via Supabase realtime
 * This subscribes to broadcasts and triggers local notifications when posts/events are created
 */
export function useCommunityNotifications() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);

  useEffect(() => {
    if (!currentUser?.id) return;

    // Subscribe to community notifications channel
    const channel = supabase.channel('community-notifications', {
      config: {
        broadcast: { self: false }, // Don't receive our own broadcasts
      },
    });

    // Listen for new post notifications
    channel.on('broadcast', { event: 'new_post' }, (payload) => {
      const { postId, authorId, authorName, content, userIds } = payload.payload;

      // Only notify if this user is in the list of recipients
      if (userIds && Array.isArray(userIds) && userIds.includes(currentUser.id)) {
        // Don't notify about our own posts
        if (authorId !== currentUser.id) {
          console.log('[CommunityNotifications] Received new post notification');
          sendNewPostNotification(authorName, content, postId).catch(err => {
            console.error('[CommunityNotifications] Error sending notification:', err);
          });
        }
      }
    });

    // Listen for new event notifications
    channel.on('broadcast', { event: 'new_event' }, (payload) => {
      const { eventId, authorId, authorName, eventTitle, eventLocation, userIds } = payload.payload;

      // Only notify if this user is in the list of recipients
      if (userIds && Array.isArray(userIds) && userIds.includes(currentUser.id)) {
        // Don't notify about our own events
        if (authorId !== currentUser.id) {
          console.log('[CommunityNotifications] Received new event notification');
          sendNewEventNotification(authorName, eventTitle, eventId, eventLocation).catch(err => {
            console.error('[CommunityNotifications] Error sending event notification:', err);
          });
        }
      }
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[CommunityNotifications] Subscribed to community notifications');
      }
    });

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, selectedLocation]);
}
