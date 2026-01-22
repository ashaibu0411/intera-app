// Supabase Edge Function: ai-smart-search
// Natural language search across posts/events/businesses (and a few other public tables).
//
// Secrets required:
// - PROJECT_URL (or SUPABASE_URL)
// - SERVICE_ROLE_KEY
// - OPENAI_API_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Body = {
  query: string;
  limit?: number; // default 12
};

type Candidate = {
  type: string;
  id: string;
  title: string;
  snippet: string;
  route: string;
};

type Result = {
  query: string;
  results: Candidate[];
  debug?: { terms: string[]; candidateCount: number };
};

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by',
  'for', 'from', 'has', 'have', 'how', 'i', 'in', 'is', 'it',
  'near', 'of', 'on', 'or', 'please', 'the', 'this', 'to', 'we',
  'what', 'where', 'who', 'with', 'you', 'your',
]);

function compact(s: string, maxLen: number) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, Math.max(0, maxLen - 3)).trimEnd() + '...';
}

function extractTerms(q: string): string[] {
  const cleaned = String(q || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = cleaned.split(' ').filter(Boolean);
  const terms: string[] = [];
  for (const p of parts) {
    if (p.length < 2) continue;
    if (STOPWORDS.has(p)) continue;
    terms.push(p);
  }
  // de-dupe, keep order
  return Array.from(new Set(terms)).slice(0, 6);
}

function extractJson(text: string) {
  const s = String(text || '');
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return s.slice(start, end + 1);
}

async function rerankWithOpenAI(apiKey: string, query: string, candidates: Candidate[], limit: number): Promise<Candidate[]> {
  if (!candidates.length) return [];

  const system = [
    'You are a search ranking assistant for a community app.',
    'Return ONLY valid JSON (no markdown).',
    'Schema: { "ordered_ids": string[] }',
    '',
    'Rules:',
    '- Re-rank candidates by relevance to the query.',
    '- Use ONLY provided candidate text; do not invent.',
    '- Prefer local specificity and exact matches.',
    '- Return up to the requested number of ids.',
  ].join('\n');

  const listing = candidates
    .map((c, i) => `${i + 1}. id=${c.type}:${c.id} | ${c.title} | ${c.snippet}`)
    .join('\n');

  const user = [
    `Query: ${query}`,
    `Limit: ${limit}`,
    '',
    'Candidates:',
    listing,
  ].join('\n');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!resp.ok) {
    // If rerank fails, just return the original list
    return candidates.slice(0, limit);
  }

  const json = (await resp.json()) as any;
  const content = String(json?.choices?.[0]?.message?.content ?? '').trim();
  const maybeJson = extractJson(content) ?? content;
  const parsed = JSON.parse(maybeJson);
  const ordered = Array.isArray(parsed?.ordered_ids) ? parsed.ordered_ids.map((x: any) => String(x)).filter(Boolean) : [];

  const byKey = new Map(candidates.map((c) => [`${c.type}:${c.id}`, c] as const));
  const out: Candidate[] = [];
  for (const k of ordered) {
    const item = byKey.get(k);
    if (item) out.push(item);
    if (out.length >= limit) break;
  }
  // Fill any missing slots deterministically
  if (out.length < limit) {
    for (const c of candidates) {
      const k = `${c.type}:${c.id}`;
      if (out.some((x) => `${x.type}:${x.id}` === k)) continue;
      out.push(c);
      if (out.length >= limit) break;
    }
  }
  return out;
}

async function fetchCandidates(admin: any, terms: string[], perTypeLimit: number): Promise<Candidate[]> {
  const patterns = terms.map((t) => `%${t}%`);
  const likeOr = (fields: string[]) =>
    patterns
      .flatMap((p) => fields.map((f) => `${f}.ilike.${p}`))
      .join(',');

  const [postsRes, eventsRes, faithRes, bizRes] = await Promise.all([
    admin.from('posts').select('id, content, created_at').or(likeOr(['content'])).order('created_at', { ascending: false }).limit(perTypeLimit),
    admin.from('events').select('id, title, description, category, created_at').or(likeOr(['title', 'description', 'category'])).order('created_at', { ascending: false }).limit(perTypeLimit),
    admin.from('faith_events').select('id, title, description, faith_type, created_at').or(likeOr(['title', 'description', 'faith_type'])).order('created_at', { ascending: false }).limit(perTypeLimit),
    admin.from('businesses').select('id, name, description, category, created_at').or(likeOr(['name', 'description', 'category'])).order('created_at', { ascending: false }).limit(perTypeLimit),
  ]);

  const out: Candidate[] = [];

  for (const p of postsRes.data ?? []) {
    out.push({
      type: 'post',
      id: String(p.id),
      title: 'Community post',
      snippet: compact(p.content ?? '', 180),
      route: `/post/${p.id}`,
    });
  }

  for (const e of eventsRes.data ?? []) {
    const catPrefix = e.category ? String(e.category) + ' • ' : '';
    out.push({
      type: 'event',
      id: String(e.id),
      title: String(e.title ?? 'Event'),
      snippet: compact(catPrefix + String(e.description ?? ''), 180),
      route: `/event/${e.id}`,
    });
  }

  for (const e of faithRes.data ?? []) {
    const catPrefix = e.faith_type ? String(e.faith_type) + ' • ' : '';
    out.push({
      type: 'event',
      id: String(e.id),
      title: String(e.title ?? 'Faith event'),
      snippet: compact(catPrefix + String(e.description ?? ''), 180),
      route: `/event/faith_${e.id}`,
    });
  }

  for (const b of bizRes.data ?? []) {
    const catPrefix = b.category ? String(b.category) + ' • ' : '';
    out.push({
      type: 'business',
      id: String(b.id),
      title: String(b.name ?? 'Business'),
      snippet: compact(catPrefix + String(b.description ?? ''), 180),
      route: `/business/${b.id}`,
    });
  }

  return out;
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
    const query = String(body?.query ?? '').trim();
    if (!query) {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const limit = Math.max(3, Math.min(30, Math.floor(Number(body?.limit ?? 12))));
    const terms = extractTerms(query);
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // If no strong terms, fall back to raw query as a term (still safe)
    const effectiveTerms = terms.length ? terms : [query.toLowerCase().slice(0, 32)];
    const candidates = await fetchCandidates(admin, effectiveTerms, 10);
    const ranked = await rerankWithOpenAI(OPENAI_API_KEY, query, candidates, limit);

    const result: Result = {
      query,
      results: ranked,
      debug: { terms: effectiveTerms, candidateCount: candidates.length },
    };

    return new Response(JSON.stringify(result), {
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

