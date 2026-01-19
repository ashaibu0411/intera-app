// Supabase Edge Function: sign-clip-url
// Creates a short-lived signed URL for a clip video in Storage bucket `clips`.
//
// Why:
// - If the `clips` bucket is private, `storage/v1/object/public/...` URLs will 403.
// - Guests (anon) also can't create signed URLs client-side unless Storage policies allow it.
// - This function uses the Service Role key (server-side) to mint a signed URL safely.
//
// Secrets required (Supabase Dashboard -> Edge Functions -> Secrets):
// - SUPABASE_URL
// - SERVICE_ROLE_KEY
//
// Client calls:
//   supabase.functions.invoke('sign-clip-url', { body: { path, expiresInSeconds } })

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Body = {
  path: string; // storage object path inside bucket `clips`, e.g. "<userId>/<ts>.mp4"
  expiresInSeconds?: number;
};

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function isSafeObjectPath(path: string): boolean {
  if (!path) return false;
  if (path.length > 512) return false;
  if (path.startsWith('/') || path.startsWith('\\')) return false;
  if (path.includes('..')) return false;
  // Allow typical storage paths: letters, numbers, underscores, dashes, dots, and slashes.
  return /^[a-zA-Z0-9._\-\/]+$/.test(path);
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const body = (await req.json()) as Body;
    const path = String(body?.path ?? '').trim();
    if (!isSafeObjectPath(path)) {
      return new Response(JSON.stringify({ error: 'Invalid path' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const expiresRaw = Number(body?.expiresInSeconds ?? 60 * 60);
    const expiresInSeconds = Math.max(60, Math.min(60 * 60 * 24, Math.floor(expiresRaw))); // 1 min .. 24h

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await admin.storage.from('clips').createSignedUrl(path, expiresInSeconds);

    if (error || !data?.signedUrl) {
      return new Response(JSON.stringify({ error: error?.message ?? 'Could not create signed URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ signedUrl: data.signedUrl, path, expiresInSeconds }), {
      status: 200,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected error', details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});

