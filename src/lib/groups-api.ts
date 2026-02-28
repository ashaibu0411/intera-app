import { supabase, SUPABASE_ANON_KEY, SUPABASE_URL } from './supabase';
import { Platform } from 'react-native';
import { decode } from 'base64-arraybuffer';
import type {
  DbGroup,
  DbGroupMember,
  DbGroupPost,
  DbGroupPostComment,
  DbGroupEvent,
  DbGroupAlbum,
  DbGroupPhoto,
  DbGroupFile,
} from './supabase';

function isRemoteHttpUrl(uri: string) {
  return typeof uri === 'string' && (uri.startsWith('http://') || uri.startsWith('https://'));
}

async function readUriAsArrayBuffer(uri: string): Promise<{ body: ArrayBuffer; sizeBytes: number } | null> {
  try {
    if (Platform.OS === 'web') {
      const resp = await fetch(uri);
      const blob = await resp.blob();
      if (!blob || blob.size < 20) return null;
      return { body: await blob.arrayBuffer(), sizeBytes: blob.size };
    }

    const FileSystem = await import('expo-file-system');
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    if (!info.exists) return null;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    if (!base64 || base64.length < 20) return null;
    const body = decode(base64);
    const sizeBytes = typeof info.size === 'number' ? info.size : body.byteLength;
    return { body, sizeBytes };
  } catch (e) {
    console.log('[groups-api] Failed reading uri:', e);
    return null;
  }
}

async function uploadToBucketPublicUrl(params: {
  bucket: string;
  objectPath: string;
  uri: string;
  contentType: string;
  maxBytes?: number;
}): Promise<string | null> {
  const { bucket, objectPath, uri, contentType, maxBytes = 15 * 1024 * 1024 } = params;
  if (!uri || isRemoteHttpUrl(uri)) return uri || null;

  const file = await readUriAsArrayBuffer(uri);
  if (!file) return null;
  if (file.sizeBytes > maxBytes) return null;

  const { error } = await supabase.storage.from(bucket).upload(objectPath, file.body, {
    contentType,
    upsert: false,
  });
  if (error) {
    const msg = String((error as any)?.message ?? error);
    const status = Number((error as any)?.statusCode ?? (error as any)?.status ?? 0);
    console.log('[groups-api] Upload error:', { bucket, status, msg });
    return null;
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return urlData.publicUrl;
}

export async function uploadGroupImageUri(params: {
  userId: string;
  groupId: string;
  uri: string;
  kind: 'group_image' | 'group_cover' | 'post_image' | 'album_photo';
}): Promise<string | null> {
  const { userId, groupId, uri, kind } = params;
  if (!uri || isRemoteHttpUrl(uri)) return uri || null;

  const uriLower = uri.toLowerCase();
  const extMatch = uriLower.match(/\.(png|jpe?g|webp)(?:$|\?|#)/);
  const ext = extMatch?.[1] || 'jpg';
  const contentType =
    ext === 'png' ? 'image/png'
    : ext === 'webp' ? 'image/webp'
    : 'image/jpeg';

  const objectPath = `groups/${groupId}/${kind}/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext === 'jpeg' ? 'jpg' : ext}`;

  // Prefer the group-media bucket; if not deployed yet, gracefully fail.
  return await uploadToBucketPublicUrl({
    bucket: 'group-media',
    objectPath,
    uri,
    contentType,
    maxBytes: 20 * 1024 * 1024,
  });
}

function encodePath(path: string) {
  return path
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/');
}

export async function uploadGroupVideoUri(params: {
  userId: string;
  groupId: string;
  albumId?: string;
  uri: string;
  kind: 'album_video';
}): Promise<string | null> {
  const { userId, groupId, albumId, uri, kind } = params;
  if (!uri || isRemoteHttpUrl(uri)) return uri || null;

  const MAX_BYTES = 150 * 1024 * 1024;
  const uriLower = uri.toLowerCase();
  const extMatch = uriLower.match(/\.(mp4|mov|webm)(?:$|\?|#)/);
  const ext = extMatch?.[1] || 'mp4';
  const contentType =
    ext === 'mov' ? 'video/quicktime'
    : ext === 'webm' ? 'video/webm'
    : 'video/mp4';

  const objectPathRaw = `groups/${groupId}/${kind}/${albumId || 'no-album'}/${userId}/${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  if (Platform.OS === 'web') {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    const sizeBytes = blob?.size ?? 0;
    if (sizeBytes > MAX_BYTES) return null;
    const body = await blob.arrayBuffer();
    if (!body || body.byteLength < 100) return null;

    const { error } = await supabase.storage.from('group-media').upload(objectPathRaw, body, {
      contentType,
      upsert: false,
    });
    if (error) return null;
    const { data: urlData } = supabase.storage.from('group-media').getPublicUrl(objectPathRaw);
    return urlData.publicUrl;
  }

  const FileSystem = await import('expo-file-system');
  const info = await FileSystem.getInfoAsync(uri, { size: true });
  const sizeBytes = typeof info.size === 'number' ? info.size : 0;
  if (sizeBytes > MAX_BYTES) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) return null;

  const objectPath = encodePath(objectPathRaw);
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/group-media/${objectPath}`;

  const result = await FileSystem.uploadAsync(uploadUrl, uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
      'content-type': contentType,
      'x-upsert': 'false',
    },
  });

  if (result.status !== 200 && result.status !== 201) return null;
  const { data: urlData } = supabase.storage.from('group-media').getPublicUrl(objectPathRaw);
  return urlData.publicUrl;
}

export async function getGroupAlbum(albumId: string): Promise<DbGroupAlbum | null> {
  const { data, error } = await supabase
    .from('group_albums')
    .select('*, creator:profiles!creator_id(*)')
    .eq('id', albumId)
    .single();

  if (error) return null;
  return data as DbGroupAlbum;
}

// Extended Group Settings interface
export interface GroupSettings {
  // Event settings
  events_creation: 'admin_only' | 'members';
  // Media/Album settings
  media_upload: 'admin_only' | 'members';
  // Membership settings
  join_mode: 'open' | 'request' | 'invite_only';
  // Post settings
  posts_creation: 'admin_only' | 'members';
  posts_media_allowed: boolean;
}

export interface DbGroupWithSettings extends DbGroup {
  settings?: GroupSettings;
}

export interface DbGroupJoinRequest {
  id: string;
  group_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface DbGroupMedia {
  id: string;
  album_id: string;
  uploader_id: string;
  url: string;
  type: 'photo' | 'video';
  thumbnail_url?: string;
  caption: string | null;
  created_at: string;
  uploader?: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
  };
}

// Default settings for new groups
export const DEFAULT_GROUP_SETTINGS: GroupSettings = {
  events_creation: 'admin_only',
  media_upload: 'members',
  join_mode: 'open',
  posts_creation: 'members',
  posts_media_allowed: true,
};

// ============ GROUPS ============

export async function getGroups(limit = 50): Promise<DbGroup[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('member_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
  return (data || []) as DbGroup[];
}

export async function getGroupsByCategory(category: string, limit = 50): Promise<DbGroup[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('category', category)
    .order('member_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching groups by category:', error);
    return [];
  }
  return (data || []) as DbGroup[];
}

export async function getGroupsByCity(city: string, limit = 50): Promise<DbGroup[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .ilike('city', `%${city}%`)
    .order('member_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching groups by city:', error);
    return [];
  }
  return (data || []) as DbGroup[];
}

export async function getStudyGroups(limit = 50): Promise<DbGroup[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .or(`category.eq.other,name.ilike.%study%,name.ilike.%students%`)
    .order('member_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching study groups:', error);
    return [];
  }
  return (data || []) as DbGroup[];
}

export async function getGroup(groupId: string): Promise<DbGroup | null> {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (error) {
    console.error('Error fetching group:', error);
    return null;
  }

  // Fetch creator profile separately if needed
  if (data?.creator_id) {
    const { data: creator } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .eq('id', data.creator_id)
      .single();

    if (creator) {
      return { ...data, creator } as DbGroup;
    }
  }

  return data as DbGroup;
}

export async function createGroup(group: Omit<DbGroup, 'id' | 'member_count' | 'created_at' | 'updated_at' | 'creator'>): Promise<DbGroup | null> {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      ...group,
      member_count: 1,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating group:', error);
    return null;
  }

  // Add creator as admin member
  if (data) {
    await joinGroup(data.id, group.creator_id, 'admin');
  }

  return data as DbGroup;
}

export async function updateGroup(groupId: string, updates: Partial<DbGroup>): Promise<DbGroup | null> {
  const { data, error } = await supabase
    .from('groups')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', groupId)
    .select('*, creator:profiles!creator_id(*)')
    .single();

  if (error) {
    console.error('Error updating group:', error);
    return null;
  }
  return data as DbGroup;
}

export async function deleteGroup(groupId: string): Promise<boolean> {
  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId);

  if (error) {
    console.error('Error deleting group:', error);
    return false;
  }
  return true;
}

// ============ MEMBERS ============

export async function getGroupMembers(groupId: string, limit = 100): Promise<DbGroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*, user:profiles!user_id(*)')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching group members:', error);
    return [];
  }
  return (data || []) as DbGroupMember[];
}

export async function getGroupMember(groupId: string, userId: string): Promise<DbGroupMember | null> {
  const { data, error } = await supabase
    .from('group_members')
    .select('*, user:profiles!user_id(*)')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching group member:', error);
  }
  return data as DbGroupMember | null;
}

export async function joinGroup(groupId: string, userId: string, role: 'admin' | 'moderator' | 'member' = 'member'): Promise<DbGroupMember | null> {
  const { data, error } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: userId,
      role,
    })
    .select('*, user:profiles!user_id(*)')
    .single();

  if (error) {
    console.error('Error joining group:', error);
    return null;
  }

  // Update member count
  await supabase.rpc('increment_group_member_count', { group_id: groupId });

  return data as DbGroupMember;
}

export async function leaveGroup(groupId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error leaving group:', error);
    return false;
  }

  // Update member count
  await supabase.rpc('decrement_group_member_count', { group_id: groupId });

  return true;
}

export async function updateMemberRole(groupId: string, userId: string, role: 'admin' | 'moderator' | 'member'): Promise<boolean> {
  const { error } = await supabase
    .from('group_members')
    .update({ role })
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating member role:', error);
    return false;
  }
  return true;
}

export async function getUserGroups(userId: string): Promise<DbGroup[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('group:groups!group_id(*, creator:profiles!creator_id(*))')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((d: any) => d.group).filter(Boolean) as DbGroup[];
}

// ============ POSTS ============

export async function getGroupPosts(groupId: string, limit = 50): Promise<DbGroupPost[]> {
  const { data, error } = await supabase
    .from('group_posts')
    .select('*, author:profiles!author_id(*)')
    .eq('group_id', groupId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching group posts:', error);
    return [];
  }
  return (data || []) as DbGroupPost[];
}

export async function getGroupNotices(groupId: string, limit = 10): Promise<DbGroupPost[]> {
  const { data, error } = await supabase
    .from('group_posts')
    .select('*, author:profiles!author_id(*)')
    .eq('group_id', groupId)
    .eq('is_notice', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching group notices:', error);
    return [];
  }
  return (data || []) as DbGroupPost[];
}

export async function createGroupPost(post: Omit<DbGroupPost, 'id' | 'likes_count' | 'comments_count' | 'created_at' | 'updated_at' | 'author'>): Promise<DbGroupPost | null> {
  const { data, error } = await supabase
    .from('group_posts')
    .insert({
      ...post,
      likes_count: 0,
      comments_count: 0,
    })
    .select('*, author:profiles!author_id(*)')
    .single();

  if (error) {
    console.error('Error creating group post:', error);
    return null;
  }
  return data as DbGroupPost;
}

export async function deleteGroupPost(postId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_posts')
    .delete()
    .eq('id', postId);

  if (error) {
    console.error('Error deleting group post:', error);
    return false;
  }
  return true;
}

export async function togglePinPost(postId: string, isPinned: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('group_posts')
    .update({ is_pinned: isPinned })
    .eq('id', postId);

  if (error) {
    console.error('Error toggling pin:', error);
    return false;
  }
  return true;
}

export async function likeGroupPost(postId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_post_likes')
    .insert({ post_id: postId, user_id: userId });

  if (error) {
    if (error.code === '23505') return true; // Already liked
    console.error('Error liking post:', error);
    return false;
  }

  await supabase.rpc('increment_group_post_likes', { post_id: postId });
  return true;
}

export async function unlikeGroupPost(postId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error unliking post:', error);
    return false;
  }

  await supabase.rpc('decrement_group_post_likes', { post_id: postId });
  return true;
}

export async function getPostComments(postId: string): Promise<DbGroupPostComment[]> {
  const { data, error } = await supabase
    .from('group_post_comments')
    .select('*, author:profiles!author_id(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching post comments:', error);
    return [];
  }
  return (data || []) as DbGroupPostComment[];
}

export async function addPostComment(postId: string, authorId: string, content: string): Promise<DbGroupPostComment | null> {
  const { data, error } = await supabase
    .from('group_post_comments')
    .insert({ post_id: postId, author_id: authorId, content })
    .select('*, author:profiles!author_id(*)')
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    return null;
  }

  await supabase.rpc('increment_group_post_comments', { post_id: postId });
  return data as DbGroupPostComment;
}

// ============ EVENTS ============

export async function getGroupEvents(groupId: string, limit = 50): Promise<DbGroupEvent[]> {
  const { data, error } = await supabase
    .from('group_events')
    .select('*, creator:profiles!creator_id(*)')
    .eq('group_id', groupId)
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching group events:', error);
    return [];
  }
  return (data || []) as DbGroupEvent[];
}

export async function createGroupEvent(event: Omit<DbGroupEvent, 'id' | 'attendees_count' | 'created_at' | 'creator'>): Promise<DbGroupEvent | null> {
  const { data, error } = await supabase
    .from('group_events')
    .insert({ ...event, attendees_count: 0 })
    .select('*, creator:profiles!creator_id(*)')
    .single();

  if (error) {
    console.error('Error creating group event:', error);
    return null;
  }
  return data as DbGroupEvent;
}

export async function deleteGroupEvent(eventId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_events')
    .delete()
    .eq('id', eventId);

  if (error) {
    console.error('Error deleting group event:', error);
    return false;
  }
  return true;
}

export async function rsvpToGroupEvent(eventId: string, userId: string, status: 'interested' | 'going'): Promise<boolean> {
  const { error } = await supabase
    .from('group_event_rsvps')
    .upsert({ event_id: eventId, user_id: userId, status }, { onConflict: 'event_id,user_id' });

  if (error) {
    console.error('Error RSVPing to event:', error);
    return false;
  }
  return true;
}

// ============ ALBUMS & PHOTOS ============

export async function getGroupAlbums(groupId: string): Promise<DbGroupAlbum[]> {
  const { data, error } = await supabase
    .from('group_albums')
    .select('*, creator:profiles!creator_id(*)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching group albums:', error);
    return [];
  }
  return (data || []) as DbGroupAlbum[];
}

export async function createGroupAlbum(album: Omit<DbGroupAlbum, 'id' | 'photo_count' | 'created_at' | 'updated_at' | 'creator'>): Promise<DbGroupAlbum | null> {
  const { data, error } = await supabase
    .from('group_albums')
    .insert({ ...album, photo_count: 0 })
    .select('*, creator:profiles!creator_id(*)')
    .single();

  if (error) {
    console.error('Error creating group album:', error);
    return null;
  }
  return data as DbGroupAlbum;
}

export async function deleteGroupAlbum(albumId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_albums')
    .delete()
    .eq('id', albumId);

  if (error) {
    console.error('Error deleting group album:', error);
    return false;
  }
  return true;
}

export async function getAlbumPhotos(albumId: string): Promise<DbGroupPhoto[]> {
  const { data, error } = await supabase
    .from('group_photos')
    .select('*, uploader:profiles!uploader_id(*)')
    .eq('album_id', albumId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching album photos:', error);
    return [];
  }
  return (data || []) as DbGroupPhoto[];
}

export async function addPhotoToAlbum(photo: Omit<DbGroupPhoto, 'id' | 'created_at' | 'uploader'>): Promise<DbGroupPhoto | null> {
  const { data, error } = await supabase
    .from('group_photos')
    .insert(photo)
    .select('*, uploader:profiles!uploader_id(*)')
    .single();

  if (error) {
    console.error('Error adding photo:', error);
    return null;
  }

  await supabase.rpc('increment_album_photo_count', { album_id: photo.album_id });
  return data as DbGroupPhoto;
}

export async function deletePhoto(photoId: string, albumId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_photos')
    .delete()
    .eq('id', photoId);

  if (error) {
    console.error('Error deleting photo:', error);
    return false;
  }

  await supabase.rpc('decrement_album_photo_count', { album_id: albumId });
  return true;
}

// ============ FILES ============

export async function getGroupFiles(groupId: string): Promise<DbGroupFile[]> {
  const { data, error } = await supabase
    .from('group_files')
    .select('*, uploader:profiles!uploader_id(*)')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching group files:', error);
    return [];
  }
  return (data || []) as DbGroupFile[];
}

export async function uploadGroupFile(file: Omit<DbGroupFile, 'id' | 'created_at' | 'uploader'>): Promise<DbGroupFile | null> {
  const { data, error } = await supabase
    .from('group_files')
    .insert(file)
    .select('*, uploader:profiles!uploader_id(*)')
    .single();

  if (error) {
    console.error('Error uploading file:', error);
    return null;
  }
  return data as DbGroupFile;
}

export async function deleteGroupFile(fileId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_files')
    .delete()
    .eq('id', fileId);

  if (error) {
    console.error('Error deleting file:', error);
    return false;
  }
  return true;
}

// ============ SEARCH ============

export async function searchGroups(query: string, limit = 20): Promise<DbGroup[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*, creator:profiles!creator_id(*)')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('member_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error searching groups:', error);
    return [];
  }
  return (data || []) as DbGroup[];
}

// ============ JOIN REQUESTS ============

export async function getGroupJoinRequests(groupId: string): Promise<DbGroupJoinRequest[]> {
  const { data, error } = await supabase
    .from('group_join_requests')
    .select('*, user:profiles!user_id(*)')
    .eq('group_id', groupId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching join requests:', error);
    return [];
  }
  return (data || []) as DbGroupJoinRequest[];
}

export async function requestToJoinGroup(groupId: string, userId: string, message?: string): Promise<DbGroupJoinRequest | null> {
  const { data, error } = await supabase
    .from('group_join_requests')
    .insert({
      group_id: groupId,
      user_id: userId,
      status: 'pending',
      message,
    })
    .select('*, user:profiles!user_id(*)')
    .single();

  if (error) {
    console.error('Error creating join request:', error);
    return null;
  }
  return data as DbGroupJoinRequest;
}

export async function approveJoinRequest(requestId: string, groupId: string, userId: string): Promise<boolean> {
  // Update request status
  const { error: updateError } = await supabase
    .from('group_join_requests')
    .update({ status: 'approved' })
    .eq('id', requestId);

  if (updateError) {
    console.error('Error approving join request:', updateError);
    return false;
  }

  // Add user as member
  await joinGroup(groupId, userId, 'member');
  return true;
}

export async function rejectJoinRequest(requestId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_join_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId);

  if (error) {
    console.error('Error rejecting join request:', error);
    return false;
  }
  return true;
}

// ============ ADMIN MEMBER REMOVAL ============

export async function removeMember(groupId: string, userId: string, removedBy: string): Promise<boolean> {
  // Only admins can remove members - this check should be done in the UI
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing member:', error);
    return false;
  }

  // Update member count
  await supabase.rpc('decrement_group_member_count', { group_id: groupId });
  return true;
}

// ============ GROUP SETTINGS ============

export async function getGroupSettings(groupId: string): Promise<GroupSettings> {
  const { data, error } = await supabase
    .from('group_settings')
    .select('*')
    .eq('group_id', groupId)
    .single();

  if (error || !data) {
    return DEFAULT_GROUP_SETTINGS;
  }

  return {
    events_creation: data.events_creation || 'admin_only',
    media_upload: data.media_upload || 'members',
    join_mode: data.join_mode || 'open',
    posts_creation: data.posts_creation || 'members',
    posts_media_allowed: data.posts_media_allowed ?? true,
  };
}

export async function updateGroupSettings(groupId: string, settings: Partial<GroupSettings>): Promise<boolean> {
  const { error } = await supabase
    .from('group_settings')
    .upsert({
      group_id: groupId,
      ...settings,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'group_id' });

  if (error) {
    console.error('Error updating group settings:', error);
    return false;
  }
  return true;
}

// ============ MEDIA (Photos & Videos) ============

export async function getAlbumMedia(albumId: string): Promise<DbGroupMedia[]> {
  const { data, error } = await supabase
    .from('group_media')
    .select('*, uploader:profiles!uploader_id(*)')
    .eq('album_id', albumId)
    .order('created_at', { ascending: false });

  if (error) {
    // Fallback to photos table if media table doesn't exist
    const photos = await getAlbumPhotos(albumId);
    return photos.map(p => ({
      id: p.id,
      album_id: p.album_id,
      uploader_id: p.uploader_id,
      url: p.url,
      type: 'photo' as const,
      caption: p.caption,
      created_at: p.created_at,
      uploader: p.uploader,
    }));
  }
  return (data || []) as DbGroupMedia[];
}

export async function addMediaToAlbum(media: Omit<DbGroupMedia, 'id' | 'created_at' | 'uploader'>): Promise<DbGroupMedia | null> {
  const { data, error } = await supabase
    .from('group_media')
    .insert(media)
    .select('*, uploader:profiles!uploader_id(*)')
    .single();

  if (error) {
    console.error('Error adding media:', error);
    // Fallback to photos table for photos
    if (media.type === 'photo') {
      const photo = await addPhotoToAlbum({
        album_id: media.album_id,
        uploader_id: media.uploader_id,
        url: media.url,
        caption: media.caption,
      });
      if (photo) {
        return {
          id: photo.id,
          album_id: photo.album_id,
          uploader_id: photo.uploader_id,
          url: photo.url,
          type: 'photo',
          caption: photo.caption,
          created_at: photo.created_at,
          uploader: photo.uploader,
        };
      }
    }
    return null;
  }

  await supabase.rpc('increment_album_photo_count', { album_id: media.album_id });
  return data as DbGroupMedia;
}

export async function deleteMedia(mediaId: string, albumId: string): Promise<boolean> {
  const { error } = await supabase
    .from('group_media')
    .delete()
    .eq('id', mediaId);

  if (error) {
    // Fallback to photos table
    return deletePhoto(mediaId, albumId);
  }

  await supabase.rpc('decrement_album_photo_count', { album_id: albumId });
  return true;
}

// ============ CLIPS/VIDEOS DELETION ============

export async function deleteClip(clipId: string, userId: string): Promise<boolean> {
  // Only the owner can delete their clip
  const { error } = await supabase
    .from('clips')
    .delete()
    .eq('id', clipId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting clip:', error);
    return false;
  }
  return true;
}
