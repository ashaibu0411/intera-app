import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { useStore } from './store';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
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
