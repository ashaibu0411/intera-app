import { supabase, DbPost, DbComment } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { notifyCommunityAboutNewPost } from './communityNotifications';

// Upload image to Supabase Storage
export async function uploadImage(uri: string, userId: string): Promise<string | null> {
  try {
    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Generate unique filename
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const contentType = fileExt === 'png' ? 'image/png' : 'image/jpeg';

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(fileName, decode(base64), {
        contentType,
        upsert: false,
      });

    if (error) {
      console.log('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('post-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.log('Image upload failed:', error);
    return null;
  }
}

// Upload video to Supabase Storage
export async function uploadVideo(uri: string, userId: string): Promise<string | null> {
  try {
    // Skip if already a remote URL
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }

    // Guardrail: videos can be large; avoid OOM by capping size
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    const sizeBytes = typeof info.size === 'number' ? info.size : 0;
    const MAX_BYTES = 20 * 1024 * 1024; // 20MB
    if (sizeBytes > MAX_BYTES) {
      console.log(`[Posts] Video too large to upload (${sizeBytes} bytes).`);
      return null;
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileExt = uri.split('.').pop()?.toLowerCase() || 'mp4';
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const contentType =
      fileExt === 'mov' ? 'video/quicktime'
      : fileExt === 'webm' ? 'video/webm'
      : 'video/mp4';

    const { error } = await supabase.storage
      .from('post-videos')
      .upload(fileName, decode(base64), {
        contentType,
        upsert: false,
      });

    if (error) {
      console.log('Video upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage.from('post-videos').getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (error) {
    console.log('Video upload failed:', error);
    return null;
  }
}

// Upload multiple images
export async function uploadImages(uris: string[], userId: string): Promise<string[]> {
  const uploadedUrls: string[] = [];

  for (const uri of uris) {
    // Skip if already a remote URL
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      uploadedUrls.push(uri);
      continue;
    }

    const url = await uploadImage(uri, userId);
    if (url) {
      uploadedUrls.push(url);
    }
  }

  return uploadedUrls;
}

// Posts API
export async function getPosts(communityId?: string, limit = 20) {
  let query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles(*),
      likes:likes(count),
      comments:comments(count)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (communityId) {
    query = query.eq('community_id', communityId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Transform the data to match the expected Post format
  return (data || []).map(post => {
    const authorData = post.author as any;
    return {
      id: post.id,
      author: {
        id: authorData?.id || post.author_id,
        name: authorData?.name || 'Unknown',
        username: authorData?.username || 'user',
        avatar: authorData?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
        bio: authorData?.bio || '',
        location: authorData?.location || post.location || '',
        interests: authorData?.interests || [],
        joinedDate: authorData?.created_at || post.created_at,
      },
      content: post.content,
      images: post.images || [],
      video: post.video,
      likes: Array.isArray(post.likes) ? post.likes[0]?.count ?? 0 : (typeof post.likes === 'object' && post.likes !== null ? (post.likes as any).count ?? 0 : post.likes ?? 0),
      comments: Array.isArray(post.comments) ? post.comments[0]?.count ?? 0 : (typeof post.comments === 'object' && post.comments !== null ? (post.comments as any).count ?? 0 : post.comments ?? 0),
      createdAt: post.created_at,
      isLiked: false,
      location: post.location || '',
    };
  });
}

export async function getPost(postId: string) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('id', postId)
    .single();

  if (error) throw error;
  return data;
}

export async function createPost(
  authorId: string,
  content: string,
  images: string[] = [],
  location?: string,
  communityId?: string,
  video?: string | null
) {
  // Build the insert payload - only include video if provided
  // Note: Some databases may not have the video column yet
  const insertPayload: Record<string, unknown> = {
    author_id: authorId,
    content,
    images,
    location,
    community_id: communityId,
  };

  // Only add video field if it's provided (avoids issues with schemas that don't have video column)
  if (video) {
    insertPayload.video = video;
  }

  let data: any = null;
  let error: any = null;

  // First try with video field
  const result = await supabase
    .from('posts')
    .insert(insertPayload)
    .select(`
      *,
      author:profiles(*)
    `)
    .single();

  data = result.data;
  error = result.error;

  // If error mentions video column doesn't exist, retry without it
  if (error?.message?.includes('video') || error?.code === 'PGRST204') {
    console.log('[Posts] Video column not in DB, retrying without video field');
    const { video: _, ...payloadWithoutVideo } = insertPayload;
    const retryResult = await supabase
      .from('posts')
      .insert(payloadWithoutVideo)
      .select(`
        *,
        author:profiles(*)
      `)
      .single();

    data = retryResult.data;
    error = retryResult.error;

    // If we had a video URL, store it locally for this post
    if (video && data?.id) {
      console.log('[Posts] Video saved locally but not to DB - video column missing in schema');
    }
  }

  if (error) throw error;

  // Notify community members about the new post (async, don't block)
  if (data) {
    notifyCommunityAboutNewPost(
      data.id,
      authorId,
      content,
      communityId || null,
      location || null
    ).catch(err => {
      console.error('[Posts] Error notifying community about new post:', err);
    });
  }

  return data;
}

export async function deletePost(postId: string) {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;
}

// Comments API
export async function getComments(postId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:profiles(*)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createComment(postId: string, authorId: string, content: string) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      author_id: authorId,
      content,
    })
    .select(`
      *,
      author:profiles(*)
    `)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}

// Likes API
export async function likePost(userId: string, postId: string) {
  const { error } = await supabase
    .from('likes')
    .insert({
      user_id: userId,
      post_id: postId,
    });

  if (error && error.code !== '23505') throw error; // Ignore duplicate key errors
}

export async function unlikePost(userId: string, postId: string) {
  const { error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);

  if (error) throw error;
}

export async function checkIfLiked(userId: string, postId: string) {
  const { data, error } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignore not found errors
  return !!data;
}

export async function getLikesCount(postId: string) {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (error) throw error;
  return count || 0;
}

export async function getCommentsCount(postId: string) {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (error) throw error;
  return count || 0;
}

// Get posts by a specific user
export async function getPostsByUser(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles(*),
      likes:likes(count),
      comments:comments(count)
    `)
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.log('[Posts] Error fetching user posts:', error);
    return [];
  }

  // Transform the data to match the expected Post format
  return (data || []).map(post => {
    const authorData = post.author as any;
    return {
      id: post.id,
      author: {
        id: authorData?.id || post.author_id,
        name: authorData?.name || 'Unknown',
        username: authorData?.username || 'user',
        avatar: authorData?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
        bio: authorData?.bio || '',
        location: authorData?.location || post.location || '',
        interests: authorData?.interests || [],
        joinedDate: authorData?.created_at || post.created_at,
      },
      content: post.content,
      images: post.images || [],
      video: post.video,
      likes: Array.isArray(post.likes) ? post.likes[0]?.count ?? 0 : (typeof post.likes === 'object' && post.likes !== null ? (post.likes as any).count ?? 0 : post.likes ?? 0),
      comments: Array.isArray(post.comments) ? post.comments[0]?.count ?? 0 : (typeof post.comments === 'object' && post.comments !== null ? (post.comments as any).count ?? 0 : post.comments ?? 0),
      createdAt: post.created_at,
      isLiked: false,
      location: post.location || '',
    };
  });
}
