import { supabase } from '@/lib/supabase';

export type AiVoiceRoomContextResult = {
  description: string;
  rules: string;
  resources: string[];
  pinned_title: string | null;
  pinned_route: string | null;
};

export async function aiVoiceRoomContext(input: {
  roomId: string;
  existing?: {
    description?: string | null;
    pinned_title?: string | null;
    pinned_route?: string | null;
    rules?: string | null;
    resources?: string[] | null;
  };
}) {
  // IMPORTANT: don't override headers here.
  // supabase-js will automatically include the signed-in user's JWT in Authorization.
  const { data, error } = await supabase.functions.invoke('ai-voice-room-context', { body: input });
  if (error) throw error;
  return data as AiVoiceRoomContextResult;
}

