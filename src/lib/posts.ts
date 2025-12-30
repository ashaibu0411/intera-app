import { supabase, DbPost, DbComment } from './supabase';

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
  return data;
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
