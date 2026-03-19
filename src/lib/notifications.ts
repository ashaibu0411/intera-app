import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from './store';

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType =
  | 'new_post'
  | 'new_comment'
  | 'new_member'
  | 'stream_live'
  | 'new_follower'
  | 'gift_received'
  | 'stream_mention'
  | 'battle_invite'
  | 'battle_started'
  | 'new_message'
  | 'daily_reward'
  | 'story_reply'
  | 'poll_result'
  | 'clip_featured';

export interface NotificationPreferences {
  enabled: boolean;
  streamGoLive: boolean;
  newFollowers: boolean;
  gifts: boolean;
  mentions: boolean;
  battleInvites: boolean;
  messages: boolean;
  dailyRewards: boolean;
  stories: boolean;
  polls: boolean;
  clips: boolean;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  timestamp: string;
}

// Default preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  enabled: true,
  streamGoLive: true,
  newFollowers: true,
  gifts: true,
  mentions: true,
  battleInvites: true,
  messages: true,
  dailyRewards: true,
  stories: true,
  polls: true,
  clips: true,
};

// Storage key for notification history
const NOTIFICATIONS_HISTORY_KEY = '@notifications_history';
const NOTIFICATION_PREFS_KEY = '@notification_preferences';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }

  // For Android, set up notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('local-posts', {
      name: 'Local Posts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D4673A',
    });
  }

  return true;
}

// Check if notifications are enabled
export async function areNotificationsEnabled(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// Send a local notification for a new post in user's city
export async function sendNewPostNotification(
  authorName: string,
  postContent: string,
  postId: string
): Promise<void> {
  // Check if user has notifications enabled in settings
  const store = useStore.getState();
  if (!store.notificationsEnabled) {
    return;
  }

  // Check system permissions
  const hasPermission = await areNotificationsEnabled();
  if (!hasPermission) {
    return;
  }

  // Truncate content if too long
  const truncatedContent = postContent.length > 100
    ? postContent.substring(0, 100) + '...'
    : postContent;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${authorName} posted in your community`,
      body: truncatedContent,
      data: { postId, type: 'new_post' },
      sound: true,
    },
    trigger: null, // Send immediately
  });
}

export async function sendNewEventNotification(
  authorName: string,
  eventTitle: string,
  eventId: string,
  eventLocation?: string | null
): Promise<void> {
  const store = useStore.getState();
  if (!store.notificationsEnabled) return;

  const hasPermission = await areNotificationsEnabled();
  if (!hasPermission) return;

  const body = `${authorName} created "${eventTitle}"${eventLocation ? ` at ${eventLocation}` : ''}`;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New event near you',
      body: body.length > 120 ? body.slice(0, 120) + '…' : body,
      data: { type: 'event', eventId },
      sound: true,
    },
    trigger: null,
  });
}

// Send notification for new community member
export async function sendNewMemberNotification(
  memberName: string,
  communityName: string
): Promise<void> {
  const store = useStore.getState();
  if (!store.notificationsEnabled) {
    return;
  }

  const hasPermission = await areNotificationsEnabled();
  if (!hasPermission) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New community member!',
      body: `${memberName} joined ${communityName}`,
      data: { type: 'new_member' },
      sound: true,
    },
    trigger: null,
  });
}

// Schedule appointment reminders (1 day and 1 hour before)
export async function scheduleAppointmentReminders(
  appointmentId: string,
  businessName: string,
  serviceName: string,
  date: string,
  time: string
): Promise<void> {
  const store = useStore.getState();
  if (!store.notificationsEnabled) return;

  const hasPermission = await areNotificationsEnabled();
  if (!hasPermission) return;

  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  const appointmentDate = new Date(year, month - 1, day, hours, minutes);

  // 1 day before
  const oneDayBefore = new Date(appointmentDate);
  oneDayBefore.setDate(oneDayBefore.getDate() - 1);
  if (oneDayBefore > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Appointment tomorrow',
        body: `${serviceName} at ${businessName} - ${time}`,
        data: { type: 'appointment_reminder', appointmentId },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: oneDayBefore },
    });
  }

  // 1 hour before
  const oneHourBefore = new Date(appointmentDate);
  oneHourBefore.setHours(oneHourBefore.getHours() - 1);
  if (oneHourBefore > new Date()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Appointment in 1 hour',
        body: `${serviceName} at ${businessName} - ${time}`,
        data: { type: 'appointment_reminder', appointmentId },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: oneHourBefore },
    });
  }
}

// Cancel all scheduled notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Send notification for new comment on user's post
export async function sendNewCommentNotification(
  commenterName: string,
  commentContent: string,
  postId: string
): Promise<void> {
  const store = useStore.getState();
  if (!store.notificationsEnabled) {
    return;
  }

  const hasPermission = await areNotificationsEnabled();
  if (!hasPermission) {
    return;
  }

  // Truncate content if too long
  const truncatedContent = commentContent.length > 80
    ? commentContent.substring(0, 80) + '...'
    : commentContent;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${commenterName} commented on your post`,
      body: truncatedContent,
      data: { postId, type: 'new_comment' },
      sound: true,
    },
    trigger: null, // Send immediately
  });
}

// Get notification response listener (for when user taps notification)
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Get notification received listener (for when notification arrives)
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

// ============================================
// NOTIFICATION PREFERENCES
// ============================================

/**
 * Save notification preferences
 */
export async function saveNotificationPreferences(prefs: NotificationPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    console.error('Failed to save notification preferences');
  }
}

/**
 * Load notification preferences
 */
export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
    if (stored) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch {
    console.error('Failed to load notification preferences');
  }
  return DEFAULT_NOTIFICATION_PREFERENCES;
}

// ============================================
// NOTIFICATION HISTORY
// ============================================

/**
 * Save notification to history
 */
async function saveNotificationToHistory(notification: AppNotification): Promise<void> {
  try {
    const history = await getNotificationHistory();
    const updated = [notification, ...history].slice(0, 100); // Keep last 100
    await AsyncStorage.setItem(NOTIFICATIONS_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    console.error('Failed to save notification to history');
  }
}

/**
 * Get notification history
 */
export async function getNotificationHistory(): Promise<AppNotification[]> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    console.error('Failed to load notification history');
  }
  return [];
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  try {
    const history = await getNotificationHistory();
    const updated = history.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    await AsyncStorage.setItem(NOTIFICATIONS_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    console.error('Failed to mark notification as read');
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<void> {
  try {
    const history = await getNotificationHistory();
    const updated = history.map(n => ({ ...n, read: true }));
    await AsyncStorage.setItem(NOTIFICATIONS_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    console.error('Failed to mark all notifications as read');
  }
}

/**
 * Clear notification history
 */
export async function clearNotificationHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(NOTIFICATIONS_HISTORY_KEY);
  } catch {
    console.error('Failed to clear notification history');
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<number> {
  const history = await getNotificationHistory();
  return history.filter(n => !n.read).length;
}

// ============================================
// STREAM & SOCIAL NOTIFICATIONS
// ============================================

/**
 * Send stream live notification
 */
export async function sendStreamLiveNotification(
  streamerName: string,
  streamTitle: string,
  streamId: string
): Promise<void> {
  const store = useStore.getState();
  if (!store.notificationsEnabled) return;

  const prefs = await loadNotificationPreferences();
  if (!prefs.streamGoLive) return;

  const hasPermission = await areNotificationsEnabled();
  if (!hasPermission) return;

  await saveNotificationToHistory({
    id: `notif_${Date.now()}`,
    type: 'stream_live',
    title: `${streamerName} is now live!`,
    body: streamTitle || 'Tap to join the stream',
    data: { streamId },
    read: false,
    timestamp: new Date().toISOString(),
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${streamerName} is now live!`,
      body: streamTitle || 'Tap to join the stream',
      data: { streamId, type: 'stream_live' },
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Send gift received notification
 */
export async function sendGiftNotification(
  senderName: string,
  giftName: string,
  gemValue: number
): Promise<void> {
  const store = useStore.getState();
  if (!store.notificationsEnabled) return;

  const prefs = await loadNotificationPreferences();
  if (!prefs.gifts) return;

  const hasPermission = await areNotificationsEnabled();
  if (!hasPermission) return;

  await saveNotificationToHistory({
    id: `notif_${Date.now()}`,
    type: 'gift_received',
    title: 'Gift Received!',
    body: `${senderName} sent you a ${giftName} (${gemValue} gems)`,
    read: false,
    timestamp: new Date().toISOString(),
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Gift Received!',
      body: `${senderName} sent you a ${giftName} (${gemValue} gems)`,
      data: { type: 'gift_received' },
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Send battle invite notification
 */
export async function sendBattleInviteNotification(
  inviterName: string,
  battleId: string
): Promise<void> {
  const store = useStore.getState();
  if (!store.notificationsEnabled) return;

  const prefs = await loadNotificationPreferences();
  if (!prefs.battleInvites) return;

  const hasPermission = await areNotificationsEnabled();
  if (!hasPermission) return;

  await saveNotificationToHistory({
    id: `notif_${Date.now()}`,
    type: 'battle_invite',
    title: 'Battle Invitation',
    body: `${inviterName} invited you to a creator battle!`,
    data: { battleId },
    read: false,
    timestamp: new Date().toISOString(),
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Battle Invitation',
      body: `${inviterName} invited you to a creator battle!`,
      data: { battleId, type: 'battle_invite' },
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Send new follower notification
 */
export async function sendNewFollowerNotification(
  followerName: string,
  followerId: string
): Promise<void> {
  const store = useStore.getState();
  if (!store.notificationsEnabled) return;

  const prefs = await loadNotificationPreferences();
  if (!prefs.newFollowers) return;

  const hasPermission = await areNotificationsEnabled();
  if (!hasPermission) return;

  await saveNotificationToHistory({
    id: `notif_${Date.now()}`,
    type: 'new_follower',
    title: 'New Follower',
    body: `${followerName} started following you`,
    data: { followerId },
    read: false,
    timestamp: new Date().toISOString(),
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New Follower',
      body: `${followerName} started following you`,
      data: { followerId, type: 'new_follower' },
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Send daily reward reminder notification
 */
export async function sendDailyRewardNotification(): Promise<void> {
  const store = useStore.getState();
  if (!store.notificationsEnabled) return;

  const prefs = await loadNotificationPreferences();
  if (!prefs.dailyRewards) return;

  const hasPermission = await areNotificationsEnabled();
  if (!hasPermission) return;

  await saveNotificationToHistory({
    id: `notif_${Date.now()}`,
    type: 'daily_reward',
    title: 'Daily Reward Available!',
    body: 'Claim your daily gems now',
    read: false,
    timestamp: new Date().toISOString(),
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily Reward Available!',
      body: 'Claim your daily gems now',
      data: { type: 'daily_reward' },
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Send story reply notification
 */
export async function sendStoryReplyNotification(
  replierName: string,
  storyId: string
): Promise<void> {
  const store = useStore.getState();
  if (!store.notificationsEnabled) return;

  const prefs = await loadNotificationPreferences();
  if (!prefs.stories) return;

  const hasPermission = await areNotificationsEnabled();
  if (!hasPermission) return;

  await saveNotificationToHistory({
    id: `notif_${Date.now()}`,
    type: 'story_reply',
    title: 'New Story Reply',
    body: `${replierName} replied to your story`,
    data: { storyId },
    read: false,
    timestamp: new Date().toISOString(),
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New Story Reply',
      body: `${replierName} replied to your story`,
      data: { storyId, type: 'story_reply' },
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Send poll ended notification
 */
export async function sendPollEndedNotification(
  question: string,
  pollId: string
): Promise<void> {
  const store = useStore.getState();
  if (!store.notificationsEnabled) return;

  const prefs = await loadNotificationPreferences();
  if (!prefs.polls) return;

  const hasPermission = await areNotificationsEnabled();
  if (!hasPermission) return;

  const truncatedQuestion = question.length > 30
    ? question.substring(0, 30) + '...'
    : question;

  await saveNotificationToHistory({
    id: `notif_${Date.now()}`,
    type: 'poll_result',
    title: 'Poll Results',
    body: `Results are in for: "${truncatedQuestion}"`,
    data: { pollId },
    read: false,
    timestamp: new Date().toISOString(),
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Poll Results',
      body: `Results are in for: "${truncatedQuestion}"`,
      data: { pollId, type: 'poll_result' },
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch {
    // Badge count not supported on all platforms
  }
}

/**
 * Send new message notification
 */
export async function sendNewMessageNotification(
  senderName: string,
  messageContent: string,
  conversationId: string,
  senderId: string
): Promise<void> {
  const store = useStore.getState();
  if (!store.notificationsEnabled) return;

  const prefs = await loadNotificationPreferences();
  if (!prefs.messages) return;

  const hasPermission = await areNotificationsEnabled();
  if (!hasPermission) return;

  // Truncate content if too long
  const truncatedContent = messageContent.length > 80
    ? messageContent.substring(0, 80) + '...'
    : messageContent;

  await saveNotificationToHistory({
    id: `notif_${Date.now()}`,
    type: 'new_message',
    title: `New message from ${senderName}`,
    body: truncatedContent,
    data: { conversationId, senderId },
    read: false,
    timestamp: new Date().toISOString(),
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `New message from ${senderName}`,
      body: truncatedContent,
      data: { conversationId, senderId, type: 'new_message' },
      sound: true,
    },
    trigger: null,
  });
}
