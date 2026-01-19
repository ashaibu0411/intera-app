import { supabase } from '@/lib/supabase';
import type { DbVoiceRoom, DbVoiceRoomParticipant, DbVoiceRoomHandRaise } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export type VoiceRole = DbVoiceRoomParticipant['role'];

export async function listLiveVoiceRooms(limit: number = 50): Promise<DbVoiceRoom[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('voice_rooms')
    .select('*')
    .neq('status', 'ended')
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (!error) return (data ?? []) as DbVoiceRoom[];

  // Backward-compatible fallback: if the DB doesn't have expires_at yet, retry without it.
  if (String(error.message || '').includes('expires_at')) {
    const retry = await supabase
      .from('voice_rooms')
      .select('*')
      .neq('status', 'ended')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (retry.error) throw retry.error;
    return (retry.data ?? []) as DbVoiceRoom[];
  }

  throw error;
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
  const providerRoomName = `room_${uuidv4()}`;
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

  const payloadBase = {
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
  } as const;

  // Try with expires_at (new schema), then fallback if column doesn't exist yet.
  const first = await supabase
    .from('voice_rooms')
    .insert({ ...payloadBase, expires_at: expiresAt })
    .select('*')
    .single();

  if (!first.error) return first.data as DbVoiceRoom;

  if (String(first.error.message || '').includes('expires_at')) {
    const retry = await supabase.from('voice_rooms').insert(payloadBase).select('*').single();
    if (retry.error) throw retry.error;
    return retry.data as DbVoiceRoom;
  }

  throw first.error;
}

export async function endVoiceRoom(roomId: string): Promise<void> {
  const { error } = await supabase
    .from('voice_rooms')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', roomId);
  if (error) throw error;
}

export async function deleteVoiceRoom(roomId: string): Promise<void> {
  const { error } = await supabase.from('voice_rooms').delete().eq('id', roomId);
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

// Extended participant with profile info
export interface ParticipantWithProfile extends DbVoiceRoomParticipant {
  profile?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export async function listParticipantsWithProfiles(roomId: string): Promise<ParticipantWithProfile[]> {
  const { data, error } = await supabase
    .from('voice_room_participants')
    .select(`
      *,
      profile:profiles!user_id(id, name, avatar_url)
    `)
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ParticipantWithProfile[];
}

// Moderation functions
export async function muteParticipant(roomId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('voice_room_participants')
    .update({ is_muted: true })
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function unmuteParticipant(roomId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('voice_room_participants')
    .update({ is_muted: false })
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function demoteToListener(roomId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('voice_room_participants')
    .update({ role: 'listener' })
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function kickParticipant(roomId: string, userId: string): Promise<void> {
  // Remove from participants
  const { error } = await supabase
    .from('voice_room_participants')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) throw error;

  // Also remove any hand raise
  await supabase
    .from('voice_room_hand_raises')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);
}

// Get room with participant count
export async function getRoomWithParticipantCount(roomId: string): Promise<DbVoiceRoom & { participant_count: number } | null> {
  const { data: room, error: roomError } = await supabase
    .from('voice_rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (roomError) return null;

  const { count } = await supabase
    .from('voice_room_participants')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', roomId);

  return { ...room, participant_count: count ?? 0 } as DbVoiceRoom & { participant_count: number };
}

// List rooms with participant counts
export async function listLiveVoiceRoomsWithCounts(limit: number = 50): Promise<(DbVoiceRoom & { participant_count: number; host_name?: string })[]> {
  const rooms = await listLiveVoiceRooms(limit);

  // Get participant counts and host names for all rooms
  const roomsWithCounts = await Promise.all(
    rooms.map(async (room) => {
      const [{ count }, { data: hostProfile }] = await Promise.all([
        supabase
          .from('voice_room_participants')
          .select('id', { count: 'exact', head: true })
          .eq('room_id', room.id),
        supabase
          .from('profiles')
          .select('name')
          .eq('id', room.creator_id)
          .single()
      ]);

      return {
        ...room,
        participant_count: count ?? 0,
        host_name: hostProfile?.name ?? 'Anonymous'
      };
    })
  );

  return roomsWithCounts;
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

