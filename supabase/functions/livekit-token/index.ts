// Supabase Edge Function: livekit-token
// Mints a LiveKit access token securely (API secret never reaches the client).
//
// Secrets required (Supabase Dashboard -> Edge Functions -> Secrets):
// - LIVEKIT_URL
// - LIVEKIT_API_KEY
// - LIVEKIT_API_SECRET
//
// Client calls:
//   supabase.functions.invoke('livekit-token', { body: { roomName, identity, name, canPublish } })

import { AccessToken } from 'npm:livekit-server-sdk@2.15.0';

type Body = {
  roomName: string;
  identity: string; // user id
  name?: string; // display name
  canPublish?: boolean;
};

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'content-type': 'application/json' },
      });
    }

    const LIVEKIT_URL = Deno.env.get('LIVEKIT_URL') ?? '';
    const LIVEKIT_API_KEY = Deno.env.get('LIVEKIT_API_KEY') ?? '';
    const LIVEKIT_API_SECRET = Deno.env.get('LIVEKIT_API_SECRET') ?? '';

    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return new Response(JSON.stringify({ error: 'Missing LiveKit secrets' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }

    const body = (await req.json()) as Body;
    if (!body?.roomName || !body?.identity) {
      return new Response(JSON.stringify({ error: 'roomName and identity are required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const canPublish = body.canPublish ?? false;

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: body.identity,
      name: body.name,
      ttl: '6h',
    });

    at.addGrant({
      room: body.roomName,
      roomJoin: true,
      canPublish,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return new Response(JSON.stringify({ token, url: LIVEKIT_URL }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected error', details: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
});

