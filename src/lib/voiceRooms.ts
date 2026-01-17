import { supabase } from '@/lib/supabase';
import type { DbVoiceRoom, DbVoiceRoomParticipant, DbVoiceRoomHandRaise } from '@/lib/supabase';

export type VoiceRole = DbVoiceRoomParticipant['role'];

export async function listLiveVoiceRooms(limit: number = 50): Promise<DbVoiceRoom[]> {
  const { data, error } = await supabase
    .from('voice_rooms')
    .select('*')
    .neq('status', 'ended')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DbVoiceRoom[];
}

export async function createVoiceRoom(input: {
  creatorId: string;
  title: string;
  description?: string;
  topic?: string;
  country?: string;
  admin_area?: string | null;
  city?: string;
  neighborhood?: string | null;
  scope?: DbVoiceRoom['scope'];
}): Promise<DbVoiceRoom> {
  const providerRoomName = `room_${crypto.randomUUID()}`;

  const { data, error } = await supabase
    .from('voice_rooms')
    .insert({
      creator_id: input.creatorId,
      title: input.title,
      description: input.description ?? null,
      topic: input.topic ?? null,
      country: input.country ?? '',
      admin_area: input.admin_area ?? null,
      city: input.city ?? '',
      neighborhood: input.neighborhood ?? null,
      scope: input.scope ?? 'global',
      status: 'live',
      provider: 'livekit',
      provider_room_name: providerRoomName,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as DbVoiceRoom;
}

export async function endVoiceRoom(roomId: string): Promise<void> {
  const { error } = await supabase
    .from('voice_rooms')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', roomId);
  if (error) throw error;
}

export async function upsertParticipant(input: {
  roomId: string;
  userId: string;
  role: VoiceRole;
  isMuted?: boolean;
  handRaised?: boolean;
}): Promise<void> {
  const { error } = await supabase
    .from('voice_room_participants')
    .upsert(
      {
        room_id: input.roomId,
        user_id: input.userId,
        role: input.role,
        is_muted: input.isMuted ?? false,
        hand_raised: input.handRaised ?? false,
        last_seen: new Date().toISOString(),
      },
      { onConflict: 'room_id,user_id' }
    );
  if (error) throw error;
}

export async function updateParticipantRole(roomId: string, userId: string, role: VoiceRole): Promise<void> {
  const { error } = await supabase
    .from('voice_room_participants')
    .update({ role })
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function leaveRoom(roomId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('voice_room_participants')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function raiseHand(roomId: string, userId: string): Promise<void> {
  await upsertParticipant({ roomId, userId, role: 'listener', handRaised: true });
  const { error } = await supabase.from('voice_room_hand_raises').upsert(
    {
      room_id: roomId,
      user_id: userId,
    },
    { onConflict: 'room_id,user_id' }
  );
  if (error) throw error;
}

export async function lowerHand(roomId: string, userId: string): Promise<void> {
  const { error } = await supabase.from('voice_room_hand_raises').delete().eq('room_id', roomId).eq('user_id', userId);
  if (error) throw error;
  const { error: pErr } = await supabase
    .from('voice_room_participants')
    .update({ hand_raised: false })
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (pErr) throw pErr;
}

export async function listParticipants(roomId: string): Promise<DbVoiceRoomParticipant[]> {
  const { data, error } = await supabase
    .from('voice_room_participants')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbVoiceRoomParticipant[];
}

export async function listHandRaises(roomId: string): Promise<DbVoiceRoomHandRaise[]> {
  const { data, error } = await supabase
    .from('voice_room_hand_raises')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbVoiceRoomHandRaise[];
}

export async function getLiveKitToken(input: {
  roomName: string;
  identity: string;
  name?: string;
  canPublish: boolean;
}): Promise<{ token: string; url: string }> {
  const { data, error } = await supabase.functions.invoke('livekit-token', {
    body: input,
  });
  if (error) throw error;
  return data as { token: string; url: string };
}

