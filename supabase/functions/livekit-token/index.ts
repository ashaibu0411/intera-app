// Supabase Edge Function: livekit-token
// Mints a LiveKit access token securely (API secret never reaches the client).
//
// Secrets required (Supabase Dashboard -> Edge Functions -> Secrets):
// - LIVEKIT_URL (e.g. wss://<your-livekit-host> or https://<your-livekit-host>)
// - LIVEKIT_API_KEY
// - LIVEKIT_API_SECRET
//
// Client calls (your app already does this):
//   supabase.functions.invoke('livekit-token', { body: { roomName, name, canPublish } })
//
// Notes:
// - Identity is forced to the authenticated Supabase user id.
// - canSubscribe is always true (otherwise clients "connect" but can't hear anyone).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AccessToken } from 'npm:livekit-server-sdk@2.15.0';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

function normalizeLiveKitUrl(raw: string): string {
  const v = raw.trim();
  if (v.startsWith('wss://') || v.startsWith('ws://')) return v;
  if (v.startsWith('https://')) return 'wss://' + v.slice('https://'.length);
  if (v.startsWith('http://')) return 'ws://' + v.slice('http://'.length);
  // If someone stores host-only, default to wss.
  return 'wss://' + v;
}

function validateLiveKitUrl(raw: string): { ok: true; normalized: string } | { ok: false; error: string; normalized?: string } {
  const normalized = normalizeLiveKitUrl(raw);
  try {
    const u = new URL(normalized);
    if (!(u.protocol === 'wss:' || u.protocol === 'ws:')) return { ok: false, error: 'LIVEKIT_URL must be ws:// or wss:// (or http(s):// which we convert)' };
    if (!u.hostname) return { ok: false, error: 'LIVEKIT_URL is missing a hostname' };
    if (u.pathname && u.pathname !== '/' && u.pathname !== '') return { ok: false, error: 'LIVEKIT_URL should not include a path (use host only)' };
    return { ok: true, normalized };
  } catch (e) {
    return { ok: false, error: `Invalid LIVEKIT_URL: ${String((e as any)?.message ?? e)}` };
  }
}

type Body = {
  roomName?: string;
  name?: string;
  // Client hint only; we compute canPublish server-side.
  canPublish?: boolean;
  debug?: boolean;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) return json(500, { error: 'Missing Supabase env' });

    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return json(401, { error: 'Unauthorized' });

    const LIVEKIT_URL_RAW = Deno.env.get('LIVEKIT_URL') ?? '';
    const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY') ?? '';
    const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET') ?? '';
    if (!LIVEKIT_URL_RAW || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return json(500, { error: 'Missing LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET' });
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const roomName = String(body?.roomName ?? '').trim();
    const canPublishRequested = !!body?.canPublish;
    const nameRaw = body?.name;
    const name = typeof nameRaw === 'string' && nameRaw.trim().length ? nameRaw.trim() : undefined;
    const debug = !!body?.debug;

    if (!roomName) return json(400, { error: 'Missing roomName' });

    const identity = userData.user.id;

    const urlCheck = validateLiveKitUrl(LIVEKIT_URL_RAW);
    if (!urlCheck.ok) {
      console.log('[livekit-token] Invalid LIVEKIT_URL', { LIVEKIT_URL_RAW, normalized: urlCheck.normalized, error: urlCheck.error });
      return json(500, { error: urlCheck.error });
    }

    // Determine publish permissions server-side to avoid client-side identity mismatch bugs.
    const { data: roomRow, error: roomErr } = await supabase
      .from('voice_rooms')
      .select('id, creator_id, status')
      .eq('provider_room_name', roomName)
      .maybeSingle();

    if (roomErr) {
      console.log('[livekit-token] voice_rooms lookup failed', { roomName, identity, error: String(roomErr.message ?? roomErr) });
      return json(500, { error: 'Could not verify room', details: String(roomErr.message ?? roomErr) });
    }
    if (!roomRow?.id) {
      console.log('[livekit-token] Room not found for provider_room_name', { roomName, identity });
      return json(404, { error: 'Room not found' });
    }

    const isCreator = String(roomRow.creator_id ?? '') === identity;
    let participantRole: string | null = null;
    let isParticipant = false;
    try {
      const { data: partRow } = await supabase
        .from('voice_room_participants')
        .select('role')
        .eq('room_id', roomRow.id)
        .eq('user_id', identity)
        .maybeSingle();
      participantRole = (partRow as any)?.role ?? null;
      isParticipant = !!partRow;
    } catch {
      participantRole = null;
      isParticipant = false;
    }

    // Audience can speak (open mic) but still stay in "listener" role in the UI.
    // Grant publish to any authenticated participant in the room.
    const canPublish = isCreator || isParticipant;

    console.log('[livekit-token] Minting token', {
      roomName,
      roomId: roomRow.id,
      identity,
      name,
      canPublishRequested,
      participantRole,
      isCreator,
      isParticipant,
      canPublish,
      canSubscribe: true,
      url: urlCheck.normalized,
    });

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity,
      name,
      ttl: '6h',
    });

    const grants = {
      room: roomName,
      roomJoin: true,
      canPublish,
      canPublishData: canPublish,
      canSubscribe: true,
    } as const;

    at.addGrant(grants);

    const token = await at.toJwt();
    return json(200, {
      token,
      url: urlCheck.normalized,
      ...(debug
        ? {
            debug: {
              identity,
              roomName,
              canPublishRequested,
              participantRole,
              isCreator,
              isParticipant,
              canPublish,
              canSubscribe: true,
              url: urlCheck.normalized,
              grants,
            },
          }
        : null),
    });
  } catch (err) {
    return json(500, { error: 'Unexpected error', details: String(err) });
  }
});

