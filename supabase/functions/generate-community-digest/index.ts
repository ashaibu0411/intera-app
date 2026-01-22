// Supabase Edge Function: generate-community-digest
// Generates (and stores) a personalized digest for a user + city/neighborhood.
//
// Secrets required:
// - PROJECT_URL (or SUPABASE_URL)
// - SERVICE_ROLE_KEY
// - OPENAI_API_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Body = {
  userId: string;
  city: string;
  neighborhood?: string | null;
  frequency?: 'daily' | 'weekly';
};

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

async function generateDigest(apiKey: string, input: { city: string; neighborhood?: string | null; frequency: 'daily' | 'weekly'; sources: string[] }) {
  const system = [
    'You write concise community digests for a neighborhood app.',
    'Return ONLY valid JSON (no markdown).',
    'Schema: { "digest_text": string }',
    '',
    'Rules:',
    '- Use ONLY the provided sources. Do not invent facts, dates, prices, or addresses.',
    '- Keep it skimmable: 6-12 bullets maximum.',
    '- Include a short “What to do next” line at the end.',
  ].join('\n');

  const user = [
    `City: ${input.city}`,
    input.neighborhood ? `Neighborhood: ${input.neighborhood}` : '',
    `Frequency: ${input.frequency}`,
    '',
    'Sources:',
    input.sources.length ? input.sources.join('\n') : '(no sources)',
  ]
    .filter(Boolean)
    .join('\n');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    throw new Error(`OpenAI error: HTTP ${resp.status} ${t}`);
  }

  const json = (await resp.json()) as any;
  const content = String(json?.choices?.[0]?.message?.content ?? '').trim();
  const maybeJson = extractJson(content) ?? content;
  const parsed = JSON.parse(maybeJson);
  return String(parsed?.digest_text ?? '').trim();
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const SUPABASE_URL = Deno.env.get('PROJECT_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const body = (await req.json()) as Body;
    const userId = String(body?.userId ?? '').trim();
    const city = String(body?.city ?? '').trim();
    const neighborhood = body?.neighborhood == null ? null : String(body.neighborhood).trim();
    const frequency = (body?.frequency ?? 'weekly') as 'daily' | 'weekly';
    if (!userId || !city) {
      return new Response(JSON.stringify({ error: 'userId and city are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Pull some recent items (simple, high-recall MVP).
    const [postsRes, eventsRes, bizRes] = await Promise.all([
      admin.from('posts').select('id, content, created_at').order('created_at', { ascending: false }).limit(14),
      admin.from('events').select('id, title, description, date, category, created_at').order('created_at', { ascending: false }).limit(10),
      admin.from('businesses').select('id, name, description, category, created_at').order('created_at', { ascending: false }).limit(10),
    ]);

    const sources: string[] = [];
    for (const p of postsRes.data ?? []) sources.push(`(post) ${compact(p.content ?? '', 180)}  route=/post/${p.id}`);
    for (const e of eventsRes.data ?? []) sources.push(`(event) ${compact(String(e.title ?? 'Event') + ' • ' + String(e.description ?? ''), 180)} route=/event/${e.id}`);
    for (const b of bizRes.data ?? []) sources.push(`(business) ${compact(String(b.name ?? 'Business') + ' • ' + String(b.description ?? ''), 180)} route=/business/${b.id}`);

    const digest_text = await generateDigest(OPENAI_API_KEY, { city, neighborhood, frequency, sources });

    // Store for user history
    const now = new Date();
    const periodEnd = now.toISOString();
    const periodStart = new Date(now.getTime() - (frequency === 'daily' ? 24 : 7 * 24) * 60 * 60 * 1000).toISOString();

    await admin.from('community_digest_history').insert({
      user_id: userId,
      city,
      neighborhood,
      frequency,
      period_start: periodStart,
      period_end: periodEnd,
      digest_text,
    });

    return new Response(JSON.stringify({ digest_text, period_start: periodStart, period_end: periodEnd }), {
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

