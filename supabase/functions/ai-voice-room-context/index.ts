// Supabase Edge Function: ai-voice-room-context
// Generates a room description, rules, resources, and pinned suggestion for a Voice Room.
//
// Secrets required:
// - OPENAI_API_KEY
// - SERVICE_ROLE_KEY   (do NOT prefix with SUPABASE_)
//
// Note: Supabase provides SUPABASE_URL automatically in Edge Functions runtime.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Body = {
  roomId: string;
  // Optional existing context so the model can improve rather than overwrite blindly.
  existing?: {
    description?: string | null;
    pinned_title?: string | null;
    pinned_route?: string | null;
    rules?: string | null;
    resources?: string[] | null;
  };
};

type Result = {
  description: string;
  rules: string;
  resources: string[];
  pinned_title: string | null;
  pinned_route: string | null;
};

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

function compact(s: string, maxLen: number) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, Math.max(0, maxLen - 3)).trimEnd() + '...';
}

function extractJson(text: string) {
  const s = String(text || '');
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return s.slice(start, end + 1);
}

async function authedUserId(req: Request, supabaseUrl: string, serviceRoleKey: string) {
  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : authHeader;
  if (!jwt) return null;
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await (admin as any).auth.getUser(jwt);
  if (error || !data?.user?.id) return null;
  return String(data.user.id);
}

async function generate(opts: { apiKey: string; room: any; existing: any }): Promise<Result> {
  const system = [
    'You generate concise, high-quality context for a live voice room in a community app.',
    'Return ONLY valid JSON (no markdown, no code fences).',
    'Schema:',
    '{ "description": string, "rules": string, "resources": string[], "pinned_title": string|null, "pinned_route": string|null }',
    '',
    'Rules:',
    '- Keep description 1–2 short sentences.',
    '- rules: 3–6 short bullet lines separated by newlines (no markdown bullets required).',
    '- resources: 0–5 items. Only include real-looking URLs if the existing context already contains a URL; otherwise use generic placeholders like "https://..." is NOT allowed.',
    '- pinned_route must be an in-app route only (starts with "/"). If unsure, return null.',
    '- Never invent specific event ids, business ids, addresses, phone numbers, or dates.',
  ].join('\n');

  const locationLabel =
    opts.room.scope === 'neighborhood'
      ? opts.room.neighborhood || opts.room.city || 'Neighborhood'
      : opts.room.scope === 'city'
        ? opts.room.city || 'City'
        : 'Global';

  const existingResources = Array.isArray(opts.existing?.resources) ? opts.existing.resources : [];
  const hasUrl = existingResources.some((x: any) => String(x || '').includes('http'));

  const user = [
    `Room title: ${compact(opts.room.title, 120)}`,
    opts.room.topic ? `Topic: ${compact(opts.room.topic, 80)}` : '',
    `Scope: ${opts.room.scope} (${locationLabel})`,
    '',
    'Existing context (may be empty):',
    `Description: ${compact(opts.existing?.description || '', 240)}`,
    `Rules: ${compact(opts.existing?.rules || '', 400)}`,
    `Pinned title: ${compact(opts.existing?.pinned_title || '', 120)}`,
    `Pinned route: ${compact(opts.existing?.pinned_route || '', 120)}`,
    `Resources: ${(existingResources || []).slice(0, 5).join(' | ')}`,
    '',
    `Important: ${hasUrl ? 'You MAY include existing URLs if relevant.' : 'Do NOT include any URLs in resources.'}`,
  ].filter(Boolean).join('\n');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.25,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`OpenAI error: HTTP ${resp.status} ${text}`);
  }

  const jsonResp = (await resp.json()) as any;
  const content = String(jsonResp?.choices?.[0]?.message?.content ?? '').trim();
  const maybeJson = extractJson(content) ?? content;
  const parsed = JSON.parse(maybeJson);

  const rulesRaw = String(parsed?.rules ?? '').trim();
  const rules = rulesRaw
    .split('\n')
    .map((l: string) => l.replace(/^\s*[-•]\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 6)
    .join('\n');

  const resources = Array.isArray(parsed?.resources)
    ? parsed.resources.map((x: any) => String(x).trim()).filter(Boolean).slice(0, 5)
    : [];

  // Guardrail: if we said no URLs, strip anything that looks like a URL.
  const safeResources = resources.filter((r) => !/https?:\/\//i.test(r));
  const finalResources = hasUrl ? resources : safeResources;

  const pinnedRoute = parsed?.pinned_route == null ? null : String(parsed.pinned_route).trim();
  const pinnedTitle = parsed?.pinned_title == null ? null : String(parsed.pinned_title).trim();

  return {
    description: String(parsed?.description ?? '').trim().slice(0, 280),
    rules: rules.slice(0, 600),
    resources: finalResources,
    pinned_title: pinnedTitle || null,
    pinned_route: pinnedRoute && pinnedRoute.startsWith('/') ? pinnedRoute : null,
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
    const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';

    if (!OPENAI_API_KEY) return json(500, { error: 'Missing OPENAI_API_KEY' });
    if (!SERVICE_ROLE_KEY || !SUPABASE_URL) return json(500, { error: 'Missing SERVICE_ROLE_KEY' });

    const body = (await req.json()) as Body;
    const roomId = String(body?.roomId ?? '').trim();
    if (!roomId) return json(400, { error: 'roomId is required' });

    const userId = await authedUserId(req, SUPABASE_URL, SERVICE_ROLE_KEY);
    if (!userId) return json(401, { error: 'Unauthorized' });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: room, error: roomErr } = await admin
      .from('voice_rooms')
      .select('id, creator_id, title, topic, scope, city, neighborhood')
      .eq('id', roomId)
      .single();
    if (roomErr || !room) return json(404, { error: 'Room not found' });

    // Permission: creator or host/mod
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
    if (!isCreator && !isHostOrMod) return json(403, { error: 'Only host/mod can generate context' });

    const result = await generate({
      apiKey: OPENAI_API_KEY,
      room,
      existing: body?.existing ?? {},
    });

    return json(200, result);
  } catch (err) {
    return json(500, { error: 'Unexpected error', details: String(err) });
  }
});

