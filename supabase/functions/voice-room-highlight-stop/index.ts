// Supabase Edge Function: voice-room-highlight-stop
// Stops a running LiveKit Egress for a highlight.
//
// Secrets required:
// - LIVEKIT_URL
// - LIVEKIT_API_KEY
// - LIVEKIT_API_SECRET
// - SUPABASE_URL
// - SERVICE_ROLE_KEY
//
// Body:
// { roomId, highlightId, egressId }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { EgressClient } from 'npm:livekit-server-sdk@2.15.0';

type Body = {
  roomId: string;
  highlightId: string;
  egressId: string;
};

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

async function authedUserId(req: Request, supabaseUrl: string, anonKey: string) {
  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : authHeader;
  if (!jwt) return null;
  const admin = createClient(supabaseUrl, anonKey);
  const { data, error } = await (admin as any).auth.getUser(jwt);
  if (error || !data?.user?.id) return null;
  return String(data.user.id);
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

    const LIVEKIT_URL = Deno.env.get('LIVEKIT_URL') ?? '';
    const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY') ?? '';
    const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET') ?? '';

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';

    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) return json(500, { error: 'Missing LiveKit secrets' });
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(500, { error: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' });

    const body = (await req.json()) as Body;
    const roomId = String(body?.roomId || '').trim();
    const highlightId = String(body?.highlightId || '').trim();
    const egressId = String(body?.egressId || '').trim();
    if (!roomId || !highlightId || !egressId) return json(400, { error: 'roomId, highlightId, egressId are required' });

    const userId = await authedUserId(req, SUPABASE_URL, SERVICE_ROLE_KEY);
    if (!userId) return json(401, { error: 'Unauthorized' });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Check permissions: creator/host/mod
    const { data: room } = await admin.from('voice_rooms').select('creator_id').eq('id', roomId).maybeSingle();
    const isCreator = room?.creator_id === userId;
    let isHostOrMod = false;
    if (!isCreator) {
      const { data: me } = await admin
        .from('voice_room_participants')
        .select('role')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .maybeSingle();
      isHostOrMod = me?.role === 'host' || me?.role === 'moderator';
    }
    if (!isCreator && !isHostOrMod) return json(403, { error: 'Only host/mod can stop highlights' });

    // Stop egress
    const egressClient = new EgressClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);
    await egressClient.stopEgress(egressId);

    // Mark stopped
    await admin
      .from('voice_room_highlights')
      .update({ status: 'stopped', stopped_at: new Date().toISOString() })
      .eq('id', highlightId)
      .eq('room_id', roomId);

    return json(200, { ok: true });
  } catch (err) {
    return json(500, { error: 'Unexpected error', details: String(err) });
  }
});

