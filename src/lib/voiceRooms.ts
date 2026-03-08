import { supabase } from '@/lib/supabase';
import type {
  DbVoiceRoom,
  DbVoiceRoomParticipant,
  DbVoiceRoomHandRaise,
  DbVoiceRoomReaction,
  DbVoiceRoomNote,
  DbVoiceRoomRecap,
} from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { sendRemotePushAlert } from '@/lib/pushAlerts';

export type VoiceRole = DbVoiceRoomParticipant['role'];
export type HandRaiseIntent = NonNullable<DbVoiceRoomHandRaise['intent']> extends never
  ? 'question' | 'insight' | 'announcement' | 'testimony'
  : NonNullable<DbVoiceRoomHandRaise['intent']>;

export async function listLiveVoiceRooms(limit: number = 50): Promise<DbVoiceRoom[]> {
  // Keep this query schema-tolerant. Some projects may not have expires_at yet.
  // We'll filter expired rooms client-side when the column exists.
  const { data, error } = await supabase
    .from('voice_rooms')
    .select('*')
    .neq('status', 'ended')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;

  const rooms = (data ?? []) as DbVoiceRoom[];
  const now = Date.now();
  return rooms.filter((r) => {
    const raw = (r as any)?.expires_at;
    if (!raw) return true;
    const ts = new Date(String(raw)).getTime();
    return !Number.isFinite(ts) || ts > now;
  });
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
  // Always trust the authenticated user id for RLS (prevents creatorId mismatch on web/hydration).
  const { data: authData } = await supabase.auth.getUser();
  const authUserId = authData?.user?.id ?? null;
  if (!authUserId) {
    throw new Error('Sign in required to start a room.');
  }
  if (input.creatorId && input.creatorId !== authUserId) {
    console.log('[VoiceRooms] creatorId mismatch; using auth user id', { inputCreatorId: input.creatorId, authUserId });
  }

  const providerRoomName = `room_${uuidv4()}`;
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

  const payloadBase = {
    creator_id: authUserId,
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

  // Insert without expires_at to stay compatible with older schemas.
  const first = await supabase.from('voice_rooms').insert(payloadBase).select('*').single();
  if (!first.error) {
    const created = first.data as DbVoiceRoom;

    // Best-effort: set expires_at if the column exists in this DB.
    try {
      await supabase.from('voice_rooms').update({ expires_at: expiresAt } as any).eq('id', created.id);
    } catch {}

    // Ensure creator is present as Host on stage (best-effort)
    try {
      await upsertParticipant({ roomId: created.id, userId: authUserId, role: 'host', isMuted: false });
    } catch {}

    // Notify area/city that a room is live (best-effort)
    try {
      const scope = (input.scope ?? 'city') as any;
      const where =
        scope === 'neighborhood'
          ? `${input.neighborhood ?? 'your neighborhood'}`
          : scope === 'city'
            ? `${input.city ?? 'your city'}`
            : 'your community';
      await sendRemotePushAlert({
        title: `LIVE: ${input.title}`,
        body: `${input.topic ? `${input.topic} • ` : ''}Join the voice room in ${where}.`,
        scope,
        city: input.city ?? null,
        neighborhood: input.neighborhood ?? null,
        excludeUserId: authUserId,
        type: 'voice_room_live',
        actorId: authUserId,
        data: {
          type: 'voice_room_live',
          roomId: created.id,
        },
      });
    } catch {}

    return created;
  }

  {
    const msg = String(first.error.message || '');
    if (msg.includes('row-level security') || (first.error as any)?.code === '42501') {
      throw new Error('Voice rooms are blocked by database RLS. Apply the `voice_rooms` RLS SQL policies in Supabase, then try again.');
    }
    throw first.error;
  }
}

export async function endVoiceRoom(roomId: string): Promise<void> {
  const { error } = await supabase
    .from('voice_rooms')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', roomId);
  if (error) throw error;

  // Best-effort cleanup (requires host/mod delete policy)
  try {
    await supabase.from('voice_room_hand_raises').delete().eq('room_id', roomId);
  } catch {}
  try {
    await supabase.from('voice_room_participants').delete().eq('room_id', roomId);
  } catch {}
}

export async function deleteVoiceRoom(roomId: string): Promise<void> {
  const { error } = await supabase.from('voice_rooms').delete().eq('id', roomId);
  if (error) throw error;
}

export async function restartVoiceRoom(roomId: string): Promise<void> {
  const providerRoomName = `room_${uuidv4()}`;
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

  // Clear state first (best-effort)
  try {
    await supabase.from('voice_room_hand_raises').delete().eq('room_id', roomId);
  } catch {}
  try {
    await supabase.from('voice_room_participants').delete().eq('room_id', roomId);
  } catch {}

  const first = await supabase
    .from('voice_rooms')
    .update({
      status: 'live',
      ended_at: null,
      starts_at: null,
      provider_room_name: providerRoomName,
      expires_at: expiresAt,
    } as any)
    .eq('id', roomId);

  if (!first.error) return;

  // Backward-compatible fallback if expires_at doesn't exist.
  if (String(first.error.message || '').includes('expires_at')) {
    const retry = await supabase
      .from('voice_rooms')
      .update({
        status: 'live',
        ended_at: null,
        starts_at: null,
        provider_room_name: providerRoomName,
      } as any)
      .eq('id', roomId);
    if (retry.error) throw retry.error;
    return;
  }

  throw first.error;
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

export async function raiseHand(roomId: string, userId: string, intent: HandRaiseIntent = 'question'): Promise<void> {
  // Raising a hand should never change the participant role.
  const { error: updateErr } = await supabase
    .from('voice_room_participants')
    .update({ hand_raised: true, last_seen: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (updateErr) {
    // If participant row doesn't exist yet, create as listener (audience).
    await upsertParticipant({ roomId, userId, role: 'listener', isMuted: true, handRaised: true });
  }
  const { error } = await supabase.from('voice_room_hand_raises').upsert(
    {
      room_id: roomId,
      user_id: userId,
      intent,
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
  // First get participants
  const { data: participants, error } = await supabase
    .from('voice_room_participants')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });

  if (error) throw error;
  if (!participants || participants.length === 0) return [];

  // Get unique user IDs
  const userIds = [...new Set(participants.map(p => p.user_id))];

  // Fetch profiles separately
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, avatar_url')
    .in('id', userIds);

  // Create a map of profiles by user ID
  const profileMap = new Map<string, { id: string; name: string; avatar_url: string | null }>();
  (profiles ?? []).forEach(p => profileMap.set(p.id, p));

  // Merge participants with profiles
  return participants.map(p => ({
    ...p,
    profile: profileMap.get(p.user_id) ?? undefined
  })) as ParticipantWithProfile[];
}

// Moderation functions
export async function setParticipantMuted(roomId: string, userId: string, isMuted: boolean): Promise<void> {
  const updates: Record<string, any> = { is_muted: !!isMuted };
  // Host-mute lock: muting locks; unmuting unlocks (if the column exists).
  updates.mute_locked = !!isMuted;
  const { error } = await supabase
    .from('voice_room_participants')
    .update(updates)
    .eq('room_id', roomId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function muteParticipant(roomId: string, userId: string): Promise<void> {
  await setParticipantMuted(roomId, userId, true);
}

export async function unmuteParticipant(roomId: string, userId: string): Promise<void> {
  await setParticipantMuted(roomId, userId, false);
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

export async function updateVoiceRoomContext(
  roomId: string,
  patch: Partial<
    Pick<
      DbVoiceRoom,
      'description' | 'pinned_title' | 'pinned_route' | 'rules' | 'resources' | 'require_speaker_approval' | 'record_highlights'
    >
  >
) {
  const { error } = await supabase.from('voice_rooms').update(patch).eq('id', roomId);
  if (error) throw error;
}

export type VoiceRoomReactionKind = DbVoiceRoomReaction['kind'];

export async function sendReaction(roomId: string, userId: string, kind: VoiceRoomReactionKind) {
  const { error } = await supabase.from('voice_room_reactions').insert({
    room_id: roomId,
    user_id: userId,
    kind,
  });
  if (error) throw error;
}

export async function getReactionCounts(roomId: string) {
  const kinds: VoiceRoomReactionKind[] = ['agree', 'heart', 'clap', 'fire'];
  const results = await Promise.all(
    kinds.map(async (kind) => {
      const { count } = await supabase
        .from('voice_room_reactions')
        .select('id', { head: true, count: 'exact' })
        .eq('room_id', roomId)
        .eq('kind', kind);
      return [kind, count ?? 0] as const;
    })
  );
  return Object.fromEntries(results) as Record<VoiceRoomReactionKind, number>;
}

export async function sendNoteToHost(roomId: string, userId: string, content: string) {
  const trimmed = (content || '').trim();
  if (!trimmed) return;
  const { error } = await supabase.from('voice_room_notes').insert({
    room_id: roomId,
    user_id: userId,
    content: trimmed,
  });
  if (error) throw error;
}

export async function listNotes(roomId: string, limit: number = 50): Promise<DbVoiceRoomNote[]> {
  const { data, error } = await supabase
    .from('voice_room_notes')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as DbVoiceRoomNote[];
}

export async function getRecap(roomId: string): Promise<DbVoiceRoomRecap | null> {
  const { data, error } = await supabase.from('voice_room_recaps').select('*').eq('room_id', roomId).maybeSingle();
  if (error) throw error;
  return (data ?? null) as DbVoiceRoomRecap | null;
}

export async function upsertRecap(input: {
  roomId: string;
  userId: string;
  summary: string;
  highlights: string[];
  published: boolean;
}) {
  const { error } = await supabase.from('voice_room_recaps').upsert(
    {
      room_id: input.roomId,
      created_by: input.userId,
      summary: input.summary || '',
      highlights: (input.highlights || []).filter(Boolean),
      published: !!input.published,
    },
    { onConflict: 'room_id' }
  );
  if (error) throw error;
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

