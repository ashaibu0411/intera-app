import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabase';

export type AiClipCaptionSegment = { start: number; end: number; text: string };
export type AiClipCaptionsResult = {
  language: string | null;
  text: string;
  segments: AiClipCaptionSegment[];
  translation?: { language: string; text: string } | null;
};

export async function aiClipCaptionsFromVideoUrl(input: {
  videoUrl: string;
  sourceLang?: string;
  targetLang?: string;
}): Promise<AiClipCaptionsResult> {
  if (Platform.OS === 'web') {
    throw new Error('Captions generation is not supported on web yet.');
  }

  const videoUrl = String(input.videoUrl || '').trim();
  if (!videoUrl) throw new Error('videoUrl is required');

  const tmpPath = `${FileSystem.cacheDirectory}clip_${Date.now()}.mp4`;

  try {
    await FileSystem.downloadAsync(videoUrl, tmpPath);

    const url = `${SUPABASE_URL}/functions/v1/ai-clip-captions`;
    const upload = await FileSystem.uploadAsync(url, tmpPath, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      parameters: {
        ...(input.sourceLang ? { sourceLang: input.sourceLang } : {}),
        ...(input.targetLang ? { targetLang: input.targetLang } : {}),
      },
      headers: {
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
    });

    if (upload.status < 200 || upload.status >= 300) {
      throw new Error(`Edge Function error: HTTP ${upload.status} ${upload.body || ''}`);
    }

    return JSON.parse(upload.body) as AiClipCaptionsResult;
  } finally {
    // best-effort cleanup
    FileSystem.deleteAsync(tmpPath, { idempotent: true }).catch(() => {});
  }
}

