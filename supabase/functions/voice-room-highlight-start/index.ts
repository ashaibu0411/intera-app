// Supabase Edge Function: voice-room-highlight-start
// Starts a LiveKit Egress MP4 recording for a voice room highlight and uploads it to Supabase Storage via S3-compatible API.
//
// Secrets required:
// - LIVEKIT_URL
// - LIVEKIT_API_KEY
// - LIVEKIT_API_SECRET
// - SUPABASE_URL
// - SERVICE_ROLE_KEY
// - S3_ENDPOINT                 (from Storage -> S3 page "Endpoint")
// - S3_ACCESS_KEY               (from Storage -> S3 page "Access keys" create one)
// - S3_SECRET_KEY               (from Storage -> S3 page "Access keys" secret shown once)
// - S3_REGION                   (from Storage -> S3 page "Region")
//
// Notes:
// - This function assumes you're writing into the Storage bucket "clips" to reuse your existing Clips pipeline.
// - The bucket must exist in Supabase Storage.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  EgressClient,
  EncodedFileOutput,
  S3Upload,
  EncodingOptionsPreset,
} from 'npm:livekit-server-sdk@2.15.0';

type Body = {
  roomId: string;
  label?: string;
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

function rand() {
  return Math.random().toString(36).slice(2);
}

async function authedUserId(req: Request, supabaseUrl: string, anonKey: string) {
  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : authHeader;
  if (!jwt) return null;
  const admin = createClient(supabaseUrl, anonKey);
  // With service role key, we can validate the JWT and read the user.
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

    // NOTE: Supabase Edge Functions secret names cannot start with "SUPABASE_",
    // so we use S3_* for these values.
    const S3_ENDPOINT = Deno.env.get('S3_ENDPOINT') ?? Deno.env.get('SUPABASE_S3_ENDPOINT') ?? '';
    const S3_ACCESS_KEY = Deno.env.get('S3_ACCESS_KEY') ?? Deno.env.get('SUPABASE_S3_ACCESS_KEY') ?? '';
    const S3_SECRET_KEY = Deno.env.get('S3_SECRET_KEY') ?? Deno.env.get('SUPABASE_S3_SECRET_KEY') ?? '';
    const S3_REGION = Deno.env.get('S3_REGION') ?? Deno.env.get('SUPABASE_S3_REGION') ?? 'us-east-1';

    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) return json(500, { error: 'Missing LiveKit secrets' });
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(500, { error: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' });
    if (!S3_ENDPOINT || !S3_ACCESS_KEY || !S3_SECRET_KEY) {
      return json(500, { error: 'Missing S3 secrets (S3_ENDPOINT/S3_ACCESS_KEY/S3_SECRET_KEY)' });
    }

    const body = (await req.json()) as Body;
    const roomId = String(body?.roomId || '').trim();
    const label = String(body?.label || '').trim();
    if (!roomId) return json(400, { error: 'roomId is required' });

    // Auth user (validate JWT using service role)
    const userId = await authedUserId(req, SUPABASE_URL, SERVICE_ROLE_KEY);
    if (!userId) return json(401, { error: 'Unauthorized' });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Verify room exists and fetch provider room name
    const { data: room, error: roomErr } = await admin
      .from('voice_rooms')
      .select('id, creator_id, provider_room_name, status')
      .eq('id', roomId)
      .single();
    if (roomErr || !room) return json(404, { error: 'Room not found' });

    // Verify user is host/mod/creator
    const isCreator = room.creator_id === userId;
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
    if (!isCreator && !isHostOrMod) return json(403, { error: 'Only host/mod can start highlights' });

    if (room.status === 'ended') return json(400, { error: 'Room has ended' });

    // We write directly into the Storage bucket named "clips"
    const storageBucket = 'clips';
    const storagePath = `voice_rooms/${roomId}/highlight_${Date.now()}_${rand()}.mp4`;

    const egressClient = new EgressClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    const outputs = {
      file: new EncodedFileOutput({
        filepath: storagePath,
        output: {
          case: 's3',
          value: new S3Upload({
            accessKey: S3_ACCESS_KEY,
            secret: S3_SECRET_KEY,
            endpoint: S3_ENDPOINT,
            region: S3_REGION,
            bucket: storageBucket,
            forcePathStyle: true,
          }),
        },
      }),
    };

    // Start recording. Even though this is a voice room, we record as MP4 for compatibility with the Clips player.
    const info = await egressClient.startRoomCompositeEgress(room.provider_room_name, outputs as any, {
      layout: 'speaker',
      encodingOptions: EncodingOptionsPreset.H264_720P_30,
      audioOnly: false,
    } as any);

    const egressId = String((info as any)?.egressId || (info as any)?.egress_id || '');
    if (!egressId) return json(500, { error: 'Egress started but no egressId returned' });

    // Track highlight in DB
    const { data: highlightRow, error: insErr } = await admin
      .from('voice_room_highlights')
      .insert({
        room_id: roomId,
        created_by: userId,
        label,
        egress_id: egressId,
        storage_bucket: storageBucket,
        storage_path: storagePath,
        status: 'recording',
      })
      .select('id')
      .single();

    if (insErr) return json(500, { error: insErr.message });

    return json(200, {
      highlightId: highlightRow.id,
      egressId,
      storageBucket,
      storagePath,
    });
  } catch (err) {
    return json(500, { error: 'Unexpected error', details: String(err) });
  }
});

