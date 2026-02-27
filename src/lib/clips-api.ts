import { Platform } from 'react-native';
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

function extractClipsObjectPathFromStorageUrl(url: string): string | null {
  try {
    const markers = [
      // Public bucket/object URL
      '/storage/v1/object/public/clips/',
      // Signed URL base (requires `?token=...`)
      '/storage/v1/object/sign/clips/',
      // Authenticated object URL (served with auth header/cookie)
      '/storage/v1/object/authenticated/clips/',
    ] as const;

    const marker = markers.find((m) => url.includes(m));
    if (!marker) return null;

    const idx = url.indexOf(marker);
    if (idx === -1) return null;

    // Strip query params/fragments if present.
    const after = url.slice(idx + marker.length);
    const raw = after.split('?')[0]?.split('#')[0] ?? after;
    // Supabase public URLs are typically safe to decode; if not, fall back to raw.
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  } catch {
    return null;
  }
}

/**
 * Resolve a `clips.video_url` value into a playable URL.
 *
 * Supports:
 * - full `https://.../storage/v1/object/public/clips/<path>` URLs
 * - raw storage object paths like `<userId>/<ts>.mp4`
 *
 * Behavior:
 * - ALWAYS try signed URL first (required for private buckets)
 * - Only fall back to public URL if signing fails AND bucket is public
 */
export async function resolveClipVideoUrl(
  videoUrlOrPath: string,
  opts?: { expiresInSeconds?: number }
): Promise<string> {
  const raw = String(videoUrlOrPath || '').trim();
  if (!raw) return '';

  // If this is already a signed URL with a token, check if it might be expired
  // Signed URLs typically expire, so we should re-sign if possible
  if ((raw.includes('/storage/v1/object/sign/clips/') || raw.includes('/storage/v1/object/sign/')) && raw.includes('token=')) {
    // Extract the path and re-sign to ensure fresh token
    const objectPath = extractClipsObjectPathFromStorageUrl(raw);
    if (objectPath) {
      const expiresInSeconds = Math.max(60, Math.floor(opts?.expiresInSeconds ?? 60 * 60));
      const { data: signed, error: signedError } = await supabase.storage
        .from('clips')
        .createSignedUrl(objectPath, expiresInSeconds);
      if (!signedError && signed?.signedUrl) return signed.signedUrl;
    }
    // If re-signing fails, return original (may still work)
    return raw;
  }

  const isHttp = raw.startsWith('http://') || raw.startsWith('https://');
  const objectPath = isHttp ? extractClipsObjectPathFromStorageUrl(raw) : raw;
  const expiresInSeconds = Math.max(60, Math.floor(opts?.expiresInSeconds ?? 60 * 60));

  if (objectPath) {
    // ALWAYS try signed URL first - this is required for private buckets
    const { data: signed, error: signedError } = await supabase.storage
      .from('clips')
      .createSignedUrl(objectPath, expiresInSeconds);

    if (!signedError && signed?.signedUrl) {
      console.log('[clips-api] Using signed URL for:', objectPath);
      return signed.signedUrl;
    }

    console.log('[clips-api] Signed URL failed:', signedError?.message, '- trying edge function');

    // If client-side signing fails (common for guests / strict Storage policies),
    // try the Edge Function signer (uses service role server-side).
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('sign-clip-url', {
        body: { path: objectPath, expiresInSeconds },
      });
      if (!fnError && (fnData as any)?.signedUrl) {
        console.log('[clips-api] Using edge function signed URL');
        return String((fnData as any).signedUrl);
      }
      console.log('[clips-api] Edge function signing failed:', fnError?.message);
    } catch (e: any) {
      console.log('[clips-api] Edge function error:', e?.message);
    }

    // Last resort: try public URL (only works if bucket is public)
    console.log('[clips-api] Falling back to public URL - this will fail if bucket is private');
    const { data: publicUrl } = supabase.storage.from('clips').getPublicUrl(objectPath);
    return publicUrl.publicUrl;
  }

  return raw;
}

// Upload video to Supabase Storage
export async function uploadClipVideo(
  userId: string,
  videoUri: string
): Promise<string | null> {
  try {
    const uriLower = (videoUri || '').toLowerCase();
    // Only trust a real .mp4/.mov extension at the end of the URI; otherwise default.
    const extMatch = uriLower.match(/\.(mp4|mov)(?:$|\?|#)/);
    const ext = extMatch?.[1] || 'mp4';
    const fileName = `${userId}/${Date.now()}.${ext}`;
    const contentType = ext === 'mov' || ext === 'qt' ? 'video/quicktime' : 'video/mp4';

    console.log('[clips-api] Starting video upload:', { videoUri, fileName, contentType });

    let body: ArrayBuffer;

    if (Platform.OS === 'web') {
      // On web, expo-file-system isn't available. Fetch the blob/arrayBuffer instead.
      const resp = await fetch(videoUri);
      body = await resp.arrayBuffer();
      if (!body || body.byteLength < 100) return null;
    } else {
      // Use FileSystem to read the file as base64 - more reliable than fetch() for local files
      const FileSystem = await import('expo-file-system');

      // Verify the file exists and get its info
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (!fileInfo.exists) {
        console.error('[clips-api] Video file does not exist:', videoUri);
        return null;
      }
      console.log('[clips-api] File info:', { size: fileInfo.size, uri: fileInfo.uri });

      // Read file as base64
      const base64Data = await FileSystem.readAsStringAsync(videoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64Data || base64Data.length < 100) {
        console.error('[clips-api] Failed to read video file or file is too small');
        return null;
      }

      console.log('[clips-api] Read video file, base64 length:', base64Data.length);

      // Convert base64 to ArrayBuffer for upload
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      body = bytes.buffer;
    }

    console.log('[clips-api] Uploading to Supabase...');

    const { error } = await supabase.storage.from('clips').upload(fileName, body, {
      contentType,
      upsert: false,
    });

    if (error) {
      console.error('[clips-api] Error uploading video:', error);
      const msg = String((error as any)?.message ?? error);
      const status = Number((error as any)?.statusCode ?? (error as any)?.status ?? 0);
      const lower = msg.toLowerCase();
      if (status === 404 || lower.includes('bucket') && lower.includes('not')) {
        throw new Error(
          "Clips upload isn't set up on the server yet. In Supabase: Storage → create bucket 'clips' (Public) and add upload policies (or run the clips storage SQL migration)."
        );
      }
      if (status === 401 || status === 403 || lower.includes('row-level security') || lower.includes('not authorized') || lower.includes('unauthorized')) {
        throw new Error(
          "You can't upload clips yet. Make sure you're signed in and that Supabase Storage policies allow authenticated uploads to bucket 'clips'."
        );
      }
      throw new Error('Upload failed. Please try again.');
    }

    console.log('[clips-api] Upload successful:', fileName);

    // Store the object path in DB (more robust than storing a public URL).
    return fileName;
  } catch (error: any) {
    console.error('[clips-api] Error in uploadClipVideo:', error);
    // Preserve the useful error message for the UI.
    if (error?.message) throw error;
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
    let body: ArrayBuffer;

    if (Platform.OS === 'web') {
      const resp = await fetch(imageUri);
      body = await resp.arrayBuffer();
      if (!body || body.byteLength < 20) return null;
    } else {
      const FileSystem = await import('expo-file-system');
      const info = await FileSystem.getInfoAsync(imageUri);
      if (!info.exists) {
        console.error('[clips-api] Thumbnail file does not exist:', imageUri);
        return null;
      }

      // Read file as base64 (more reliable for Android file:// URIs than fetch(blob))
      const base64Data = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (!base64Data || base64Data.length < 20) return null;

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      body = bytes.buffer;
    }

    const { error } = await supabase.storage.from('clips').upload(fileName, body, {
      contentType: 'image/jpeg',
      upsert: false,
    });

    if (error) {
      console.error('[clips-api] Error uploading thumbnail:', error);
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from('clips')
      .getPublicUrl(fileName);

    return publicUrl.publicUrl;
  } catch (error) {
    console.error('[clips-api] Error in uploadClipThumbnail:', error);
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
