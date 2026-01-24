import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

const BUCKET = 'impact-stories';

function rand() {
  return Math.random().toString(36).slice(2);
}

function guessImageContentType(ext: string) {
  const e = ext.toLowerCase();
  if (e === 'png') return 'image/png';
  if (e === 'webp') return 'image/webp';
  return 'image/jpeg';
}

function guessVideoContentType(ext: string) {
  const e = ext.toLowerCase();
  if (e === 'mov') return 'video/quicktime';
  if (e === 'webm') return 'video/webm';
  return 'video/mp4';
}

export async function uploadImpactStoryImage(uri: string, userId: string): Promise<string | null> {
  try {
    if (!uri) return null;
    if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;

    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/${Date.now()}_${rand()}.${fileExt}`;
    const contentType = guessImageContentType(fileExt);

    const { error } = await supabase.storage.from(BUCKET).upload(fileName, decode(base64), {
      contentType,
      upsert: false,
    });
    if (error) {
      console.log('[impactStoriesMedia] image upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (e) {
    console.log('[impactStoriesMedia] image upload failed:', e);
    return null;
  }
}

export async function uploadImpactStoryVideo(uri: string, userId: string): Promise<string | null> {
  try {
    if (!uri) return null;
    if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;

    // Guardrail: videos can be large; avoid OOM by capping size
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    const sizeBytes = typeof info.size === 'number' ? info.size : 0;
    const MAX_BYTES = 100 * 1024 * 1024; // 100MB (increased to match posts)
    if (sizeBytes > MAX_BYTES) {
      console.log(`[impactStoriesMedia] Video too large (${sizeBytes} bytes).`);
      return null;
    }

    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'mp4';
    const fileName = `${userId}/${Date.now()}_${rand()}.${fileExt}`;
    const contentType = guessVideoContentType(fileExt);

    const { error } = await supabase.storage.from(BUCKET).upload(fileName, decode(base64), {
      contentType,
      upsert: false,
    });
    if (error) {
      console.log('[impactStoriesMedia] video upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return urlData.publicUrl;
  } catch (e) {
    console.log('[impactStoriesMedia] video upload failed:', e);
    return null;
  }
}

