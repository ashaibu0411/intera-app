import { supabase } from './supabase';

export async function startVoiceRoomHighlight(input: { roomId: string; label?: string }) {
  const { data, error } = await supabase.functions.invoke('voice-room-highlight-start', {
    body: input,
  });
  if (error) throw error;
  return data as { highlightId: string; egressId: string; storageBucket: string; storagePath: string };
}

export async function stopVoiceRoomHighlight(input: { roomId: string; highlightId: string; egressId: string }) {
  const { data, error } = await supabase.functions.invoke('voice-room-highlight-stop', {
    body: input,
  });
  if (error) throw error;
  return data as { ok: boolean };
}

