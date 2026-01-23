import { supabase } from '@/lib/supabase';

export type TalkMode = 'talk' | 'listen' | 'both';
export type TalkStatus = 'available' | 'busy' | 'offline';

export type TalkAvailability = {
  user_id: string;
  mode: TalkMode;
  status: TalkStatus;
  topics: string[];
  languages: string[];
  rate_gems_per_minute: number;
  min_billable_minutes: number;
  profile?: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    location: string | null;
  } | null;
};

export type TalkSession = {
  id: string;
  requester_id: string;
  provider_id: string;
  status: 'requested' | 'active' | 'ended' | 'cancelled' | 'rejected';
  started_at: string;
  ended_at: string | null;
  rate_gems_per_minute: number;
  billed_minutes: number;
  billed_gems: number;
  settled_at: string | null;
};

export async function listAvailableTalkers(limit = 50): Promise<TalkAvailability[]> {
  const { data, error } = await supabase
    .from('talk_availability')
    .select(
      `
      user_id,
      mode,
      status,
      topics,
      languages,
      rate_gems_per_minute,
      min_billable_minutes,
      profile:profiles(
        id,
        name,
        username,
        avatar_url,
        bio,
        location
      )
    `
    )
    .eq('status', 'available')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as TalkAvailability[];
}

export async function getMyAvailability(userId: string): Promise<TalkAvailability | null> {
  const { data, error } = await supabase
    .from('talk_availability')
    .select(
      `
      user_id,
      mode,
      status,
      topics,
      languages,
      rate_gems_per_minute,
      min_billable_minutes,
      profile:profiles(
        id,
        name,
        username,
        avatar_url,
        bio,
        location
      )
    `
    )
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as TalkAvailability) ?? null;
}

export async function upsertMyAvailability(input: {
  userId: string;
  mode: TalkMode;
  status: TalkStatus;
  topics?: string[];
  languages?: string[];
  rate_gems_per_minute?: number;
  min_billable_minutes?: number;
}) {
  const payload = {
    user_id: input.userId,
    mode: input.mode,
    status: input.status,
    topics: input.topics ?? [],
    languages: input.languages ?? [],
    rate_gems_per_minute: input.rate_gems_per_minute ?? 1,
    min_billable_minutes: input.min_billable_minutes ?? 1,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('talk_availability').upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function startTalkSession(input: {
  requesterId: string;
  providerId: string;
  rateGemsPerMinute: number;
}) {
  // IMPORTANT: use RPC so we enforce 18+, blocks, availability, and rate limits server-side.
  // requesterId is kept for callsites but must match auth.uid() on the server.
  const { data, error } = await supabase.rpc('start_talk_session', {
    provider_id: input.providerId,
    rate_gems_per_minute: input.rateGemsPerMinute,
  });
  if (error) throw error;
  return data as TalkSession;
}

export async function listMyTalkSessions(userId: string, limit = 20): Promise<TalkSession[]> {
  const { data, error } = await supabase
    .from('talk_sessions')
    .select('*')
    .or(`requester_id.eq.${userId},provider_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as TalkSession[];
}

export async function endTalkSession(sessionId: string) {
  const { data, error } = await supabase.rpc('end_talk_session', { session_id: sessionId });
  if (error) throw error;
  // returns { billed_minutes, billed_gems, requester_new_balance }
  return data as { billed_minutes: number; billed_gems: number; requester_new_balance: number }[];
}

export async function hasConfirmedTalkAge18Plus(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('talk_age_confirmations')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return !!data?.user_id;
}

export async function confirmTalkAge18Plus(userId: string) {
  const { error } = await supabase.from('talk_age_confirmations').upsert(
    {
      user_id: userId,
      confirmed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (error) throw error;
}

export async function listMyBlockedUserIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from('user_blocks').select('blocked_id').eq('blocker_id', userId);
  if (error) throw error;
  return (data ?? []).map((r: any) => String(r.blocked_id)).filter(Boolean);
}

export type BasicProfile = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
};

export async function getProfilesByIds(userIds: string[]): Promise<BasicProfile[]> {
  const ids = (userIds ?? []).map((x) => String(x)).filter(Boolean);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, username, avatar_url, bio, location')
    .in('id', ids);
  if (error) throw error;
  return (data ?? []) as BasicProfile[];
}

export async function blockUser(input: { blockerId: string; blockedId: string }) {
  if (input.blockerId === input.blockedId) return;
  const { error } = await supabase.from('user_blocks').insert({
    blocker_id: input.blockerId,
    blocked_id: input.blockedId,
  });
  if (error) throw error;
}

export async function unblockUser(input: { blockerId: string; blockedId: string }) {
  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', input.blockerId)
    .eq('blocked_id', input.blockedId);
  if (error) throw error;
}

export async function reportUser(input: { reporterId: string; reportedId: string; reason: string; details?: string }) {
  if (input.reporterId === input.reportedId) return;
  const { error } = await supabase.from('user_reports').insert({
    reporter_id: input.reporterId,
    reported_id: input.reportedId,
    reason: input.reason || 'other',
    details: input.details ?? null,
  });
  if (error) throw error;
}

export async function submitTalkReview(input: { sessionId: string; rating: number; comment?: string }) {
  const { data, error } = await supabase.rpc('submit_talk_review', {
    session_id: input.sessionId,
    rating: input.rating,
    comment: input.comment ?? null,
  });
  if (error) throw error;
  return data as any;
}

