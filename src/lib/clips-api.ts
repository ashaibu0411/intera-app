import { supabase } from './supabase';

export interface DbClip {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  description: string;
  music_tag: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string;
  user?: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
  };
}

// Get all clips (paginated)
export async function getClips(limit = 20, offset = 0): Promise<DbClip[]> {
  const { data, error } = await supabase
    .from('clips')
    .select(`
      *,
      user:profiles(id, name, username, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching clips:', error);
    return [];
  }

  return data || [];
}

// Get clips from followed users
export async function getFollowingClips(userId: string, limit = 20, offset = 0): Promise<DbClip[]> {
  // First get followed user IDs
  const { data: following } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId);

  const followingIds = following?.map(f => f.following_id) || [];

  if (followingIds.length === 0) return [];

  const { data, error } = await supabase
    .from('clips')
    .select(`
      *,
      user:profiles(id, name, username, avatar_url)
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching following clips:', error);
    return [];
  }

  return data || [];
}

// Get clips by user
export async function getUserClips(userId: string): Promise<DbClip[]> {
  const { data, error } = await supabase
    .from('clips')
    .select(`
      *,
      user:profiles(id, name, username, avatar_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user clips:', error);
    return [];
  }

  return data || [];
}

// Create a new clip
export async function createClip(clip: {
  user_id: string;
  video_url: string;
  thumbnail_url?: string;
  description: string;
  music_tag?: string;
}): Promise<DbClip | null> {
  const { data, error } = await supabase
    .from('clips')
    .insert({
      user_id: clip.user_id,
      video_url: clip.video_url,
      thumbnail_url: clip.thumbnail_url || null,
      description: clip.description,
      music_tag: clip.music_tag || null,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      views_count: 0,
    })
    .select(`
      *,
      user:profiles(id, name, username, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error creating clip:', error);
    return null;
  }

  return data;
}

// Upload video to Supabase Storage
export async function uploadClipVideo(
  userId: string,
  videoUri: string
): Promise<string | null> {
  try {
    const fileName = `${userId}/${Date.now()}.mp4`;

    // Fetch the video file
    const response = await fetch(videoUri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('clips')
      .upload(fileName, blob, {
        contentType: 'video/mp4',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading video:', error);
      return null;
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('clips')
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Error in uploadClipVideo:', error);
    return null;
  }
}

// Upload thumbnail to Supabase Storage
export async function uploadClipThumbnail(
  userId: string,
  imageUri: string
): Promise<string | null> {
  try {
    const fileName = `${userId}/thumb_${Date.now()}.jpg`;

    const response = await fetch(imageUri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('clips')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading thumbnail:', error);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from('clips')
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  } catch (error) {
    console.error('Error in uploadClipThumbnail:', error);
    return null;
  }
}

// Like a clip
export async function likeClip(clipId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('clip_likes')
    .insert({ clip_id: clipId, user_id: userId });

  if (error && error.code !== '23505') { // Ignore duplicate key error
    console.error('Error liking clip:', error);
    return false;
  }

  // Update likes count
  await supabase.rpc('increment_clip_likes', { clip_id: clipId });
  return true;
}

// Unlike a clip
export async function unlikeClip(clipId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('clip_likes')
    .delete()
    .eq('clip_id', clipId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error unliking clip:', error);
    return false;
  }

  // Decrement likes count
  await supabase.rpc('decrement_clip_likes', { clip_id: clipId });
  return true;
}

// Check if user liked a clip
export async function hasUserLikedClip(clipId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('clip_likes')
    .select('id')
    .eq('clip_id', clipId)
    .eq('user_id', userId)
    .single();

  return !!data;
}

// Increment view count
export async function incrementClipViews(clipId: string): Promise<void> {
  await supabase.rpc('increment_clip_views', { clip_id: clipId });
}

// Delete a clip
export async function deleteClip(clipId: string, userId: string): Promise<boolean> {
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
