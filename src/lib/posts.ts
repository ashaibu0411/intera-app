import { supabase, DbPost, DbComment } from './supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

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

export async function createPost(authorId: string, content: string, images: string[] = [], location?: string, communityId?: string) {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      content,
      images,
      location,
      community_id: communityId,
    })
    .select(`
      *,
      author:profiles(*)
    `)
    .single();

  if (error) throw error;
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
