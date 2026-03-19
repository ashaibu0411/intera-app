import { supabase } from './supabase';
import { getCommunityByLocation, getCommunity } from './communities';
import { sendRemotePushAlert } from './pushAlerts';

/**
 * Get all user IDs in a specific community/city
 */
export async function getCommunityUserIds(communityId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', communityId);

    if (error) {
      console.error('[CommunityNotifications] Error fetching community members:', error);
      return [];
    }

    return (data || []).map((member: { user_id: string }) => member.user_id);
  } catch (error) {
    console.error('[CommunityNotifications] Exception fetching community members:', error);
    return [];
  }
}

/**
 * Get all user IDs in a city (by location string matching)
 */
export async function getCityUserIds(city: string, country: string): Promise<string[]> {
  try {
    // First, try to get community ID (only if country is available)
    if (country) {
      const community = await getCommunityByLocation(city, country);
      if (community) {
        return await getCommunityUserIds(community.id);
      }
    }

    // Fallback: Get users by location string match
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .ilike('location', `%${city}%`);

    if (error) {
      console.error('[CommunityNotifications] Error fetching city users:', error);
      return [];
    }

    return (data || []).map((profile: { id: string }) => profile.id);
  } catch (error) {
    console.error('[CommunityNotifications] Exception fetching city users:', error);
    return [];
  }
}

/**
 * Get author profile for notifications
 */
async function getAuthorProfile(userId: string): Promise<{ name: string; avatar_url?: string } | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[CommunityNotifications] Error fetching author profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[CommunityNotifications] Exception fetching author profile:', error);
    return null;
  }
}

/**
 * Notify all users in a community about a new post
 */
export async function notifyCommunityAboutNewPost(
  postId: string,
  authorId: string,
  postContent: string,
  communityId: string | null,
  location: string | null
): Promise<void> {
  try {
    // Get author info
    const author = await getAuthorProfile(authorId);
    if (!author) {
      console.log('[CommunityNotifications] Author not found, skipping notifications');
      return;
    }

    // Resolve a canonical city/neighborhood for push targeting.
    // IMPORTANT: Remote push is the only reliable way to notify devices when the app is closed/backgrounded.
    let cityForPush: string | null = null;
    let neighborhoodForPush: string | null = null;
    try {
      if (communityId) {
        const community = await getCommunity(communityId);
        cityForPush = community?.city ? String((community as any).city).trim() : null;
      }
    } catch {}
    if (!cityForPush && location) {
      const [beforeDot, afterDot] = location.split('·').map((s) => s.trim());
      neighborhoodForPush = afterDot || null;
      const parts = String(beforeDot || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      cityForPush = parts[0] ? String(parts[0]).trim() : null;
    }

    // Fire-and-forget remote push to *all* enabled devices in this city.
    // This fixes the "same city devices don't get notifications for all posts" issue,
    // because the previous realtime broadcast only works for connected clients and relies on fragile profile/location matching.
    if (cityForPush) {
      sendRemotePushAlert({
        title: `${author.name} posted`,
        body: postContent.length > 100 ? postContent.substring(0, 100) + '...' : postContent,
        scope: 'city',
        city: cityForPush,
        neighborhood: null,
        excludeUserId: authorId,
        type: 'new_post',
        actorId: authorId,
        data: { type: 'new_post', postId, authorId, city: cityForPush, neighborhood: neighborhoodForPush },
      }).catch(() => null);
    } else {
      // Fallback: when city can't be resolved (e.g. iOS with different community/location format),
      // use global scope so cross-platform notifications still work (iPhone→Android).
      console.log('[CommunityNotifications] No city resolved; using global scope for push', { communityId, location });
      sendRemotePushAlert({
        title: `${author.name} posted`,
        body: postContent.length > 100 ? postContent.substring(0, 100) + '...' : postContent,
        scope: 'global',
        city: null,
        neighborhood: null,
        excludeUserId: authorId,
        type: 'new_post',
        actorId: authorId,
        data: { type: 'new_post', postId, authorId },
      }).catch(() => null);
    }

    let userIds: string[] = [];

    // If we have a community ID, get members from that community
    if (communityId) {
      userIds = await getCommunityUserIds(communityId);
    } else if (location) {
      // Extract city/country from location label.
      // Common formats in this app:
      // - "City"
      // - "City, State"
      // - "City, State · Neighborhood"
      // - "City, Country"
      // - "City, State, Country"
      const [beforeDot] = location.split('·').map((s) => s.trim());
      const parts = beforeDot.split(',').map((s) => s.trim()).filter(Boolean);
      const city = parts[0] || '';
      const country = parts.length >= 3 ? parts[parts.length - 1] : ''; // best-effort

      if (city) {
        // Prefer community membership if possible; otherwise fallback to city match
        if (country) {
          const community = await getCommunityByLocation(city, country);
          if (community) {
            userIds = await getCommunityUserIds(community.id);
          } else {
            userIds = await getCityUserIds(city, country);
          }
        } else {
          userIds = await getCityUserIds(city, '');
        }
      }
    }

    // Remove the author from the list (don't notify yourself)
    userIds = userIds.filter(id => id !== authorId);

    if (userIds.length === 0) {
      console.log('[CommunityNotifications] No community members to notify');
      return;
    }

    console.log(`[CommunityNotifications] Notifying ${userIds.length} users about new post`);

    // Create notifications in database for each user.
    // Schema must match: recipient_id, actor_id, type, title, body, data (read_at null = unread).
    const notifications = userIds.map(userId => ({
      recipient_id: userId,
      actor_id: authorId,
      type: 'new_post',
      title: `${author.name} posted in your community`,
      body: postContent.length > 100 ? postContent.substring(0, 100) + '...' : postContent,
      data: { postId, authorId, type: 'new_post' },
    }));

    // Try to insert notifications in batches (Supabase has limits)
    // If notifications table doesn't exist, this will fail gracefully
    const batchSize = 100;
    let insertedCount = 0;
    let skipDbInserts = false;

    for (let i = 0; i < notifications.length; i += batchSize) {
      if (skipDbInserts) break;

      const batch = notifications.slice(i, i + batchSize);
      const { error } = await supabase
        .from('notifications')
        .insert(batch);

      if (error) {
        // If table doesn't exist (42P01 or PGRST205), skip DB inserts and use realtime only
        if (error.code === '42P01' || error.code === 'PGRST205') {
          console.log('[CommunityNotifications] Notifications table does not exist. Using realtime broadcast instead.');
          skipDbInserts = true;
          break;
        }
        console.error(`[CommunityNotifications] Error inserting notifications batch ${i / batchSize + 1}:`, error);
      } else {
        insertedCount += batch.length;
      }
    }

    // Broadcast via Supabase realtime so all connected users get notified
    // This works even without a notifications table
    await supabase
      .channel('community-notifications')
      .send({
        type: 'broadcast',
        event: 'new_post',
        payload: {
          postId,
          authorId,
          authorName: author.name,
          content: postContent.length > 100 ? postContent.substring(0, 100) + '...' : postContent,
          communityId,
          location,
          userIds, // List of users who should receive this
        },
      });

    console.log(`[CommunityNotifications] Created ${insertedCount} notification records and broadcasted to ${userIds.length} users`);
  } catch (error) {
    console.error('[CommunityNotifications] Exception notifying community:', error);
  }
}

/**
 * Notify all users in a community about a new event
 */
export async function notifyCommunityAboutNewEvent(
  eventId: string,
  authorId: string,
  eventTitle: string,
  eventLocation: string | null,
  communityId: string | null,
  city: string | null,
  country: string | null
): Promise<void> {
  try {
    // Get author info
    const author = await getAuthorProfile(authorId);
    if (!author) {
      console.log('[CommunityNotifications] Author not found, skipping event notifications');
      return;
    }

    let userIds: string[] = [];

    // If we have a community ID, get members from that community
    if (communityId) {
      userIds = await getCommunityUserIds(communityId);
    } else if (city && country) {
      // Try to get community first
      const community = await getCommunityByLocation(city, country);
      if (community) {
        userIds = await getCommunityUserIds(community.id);
      } else {
        // Fallback to location string matching
        userIds = await getCityUserIds(city, country);
      }
    }

    // Remove the author from the list
    userIds = userIds.filter(id => id !== authorId);

    if (userIds.length === 0) {
      console.log('[CommunityNotifications] No community members to notify about event');
      return;
    }

    console.log(`[CommunityNotifications] Notifying ${userIds.length} users about new event`);

    // Create notifications in database (recipient_id, actor_id; read_at null = unread)
    const notifications = userIds.map(userId => ({
      recipient_id: userId,
      actor_id: authorId,
      type: 'new_event',
      title: `New event in your community`,
      body: `${author.name} created "${eventTitle}"${eventLocation ? ` at ${eventLocation}` : ''}`,
      data: { eventId, authorId, type: 'new_event' },
    }));

    // Try to insert notifications in batches
    const batchSize = 100;
    let insertedCount = 0;
    let skipDbInserts = false;

    for (let i = 0; i < notifications.length; i += batchSize) {
      if (skipDbInserts) break;

      const batch = notifications.slice(i, i + batchSize);
      const { error } = await supabase
        .from('notifications')
        .insert(batch);

      if (error) {
        // If table doesn't exist (42P01 or PGRST205), skip DB inserts and use realtime only
        if (error.code === '42P01' || error.code === 'PGRST205') {
          console.log('[CommunityNotifications] Notifications table does not exist. Using realtime broadcast instead.');
          skipDbInserts = true;
          break;
        }
        console.error(`[CommunityNotifications] Error inserting event notifications batch ${i / batchSize + 1}:`, error);
      } else {
        insertedCount += batch.length;
      }
    }

    // Broadcast via Supabase realtime
    await supabase
      .channel('community-notifications')
      .send({
        type: 'broadcast',
        event: 'new_event',
        payload: {
          eventId,
          authorId,
          authorName: author.name,
          eventTitle,
          eventLocation,
          communityId,
          city,
          country,
          userIds,
        },
      });

    console.log(`[CommunityNotifications] Created ${insertedCount} event notification records and broadcasted to ${userIds.length} users`);
  } catch (error) {
    console.error('[CommunityNotifications] Exception notifying community about event:', error);
  }
}
