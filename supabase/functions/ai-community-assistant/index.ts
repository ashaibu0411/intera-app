// Supabase Edge Function: ai-community-assistant
// Answers "local" questions using your own Supabase data + OpenAI.
//
// Secrets required:
// - SUPABASE_URL
// - SERVICE_ROLE_KEY
// - OPENAI_API_KEY
//
// Client calls:
//   supabase.functions.invoke('ai-community-assistant', { body: { query, location } })

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Location = {
  country?: string | null;
  city?: string | null;
  neighborhood?: string | null;
};

type Body = {
  query: string;
  location?: Location;
};

type Source = {
  type: 'post' | 'business' | 'event' | 'provider' | 'listing' | 'housing';
  id: string;
  title: string;
  snippet: string;
  route: string;
};

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function compact(s: string, maxLen: number) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, Math.max(0, maxLen - 3)).trimEnd() + '...';
}

function safeIlikeTerm(raw: string) {
  // For PostgREST filters; avoid wildcard injection.
  // We still use leading/trailing % for substring search.
  return String(raw || '').replace(/[%_]/g, ' ').trim();
}

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'but', 'by', 'can', 'could', 'do', 'does', 'for', 'from', 'get',
  'have', 'how', 'i', 'in', 'is', 'it', 'me', 'my', 'near', 'of', 'on', 'or', 'please', 'show', 'some', 'tell',
  'that', 'the', 'this', 'to', 'up', 'us', 'what', 'when', 'where', 'who', 'with', 'would', 'you', 'your',
  'any', 'find',
]);

function extractSearchTerms(raw: string) {
  const cleaned = String(raw || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(Boolean);
  const uniq: string[] = [];
  for (const w of words) {
    if (w.length < 3) continue;
    if (STOPWORDS.has(w)) continue;
    if (!uniq.includes(w)) uniq.push(w);
  }

  // Prefer more specific terms first.
  uniq.sort((a, b) => b.length - a.length);

  // Keep it small to avoid huge PostgREST OR filters.
  return uniq.slice(0, 4);
}

function isEventIntent(raw: string) {
  const t = String(raw || '').toLowerCase();
  return t.includes('event') || t.includes('weekend') || t.includes('happening') || t.includes('meetup') || t.includes('concert');
}

async function openaiChat(opts: { apiKey: string; system: string; user: string }) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`OpenAI error: HTTP ${resp.status} ${text}`);
  }

  const json = (await resp.json()) as any;
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned empty response');
  return String(content);
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
    if (query.length < 2) {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const location: Location = body?.location ?? {};
    const city = (location?.city ?? '').trim();
    const country = (location?.country ?? '').trim();
    const neighborhood = (location?.neighborhood ?? '').trim();

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const terms = extractSearchTerms(query);
    const patterns = terms.length ? terms.map((t) => `%${safeIlikeTerm(t)}%`) : [`%${safeIlikeTerm(query)}%`];

    const limit = clamp(6, 1, 10);
    const perTermLimit = clamp(3, 1, 6);
    const debugErrors: string[] = [];

    async function searchTable<T>(args: { table: string; select: string; orTemplate: (pattern: string) => string }) {
      const merged = new Map<string, T>();
      const errors: string[] = [];
      for (const pat of patterns) {
        const res = await admin.from(args.table).select(args.select).or(args.orTemplate(pat)).limit(perTermLimit);
        if (res.error) errors.push(`${args.table}: ${res.error.message}`);
        for (const row of (res.data as any[]) ?? []) {
          const id = String((row as any).id ?? '');
          if (id && !merged.has(id)) merged.set(id, row as T);
        }
      }
      return { data: Array.from(merged.values()).slice(0, limit), errors };
    }

    const [postsRes, businessesRes, eventsRes, faithEventsRes, providersRes, listingsRes, housingRes] = await Promise.all([
      searchTable<{ id: string; content: string | null; location: string | null; created_at: string }>({
        table: 'posts',
        select: 'id, content, location, created_at',
        orTemplate: (pat) => `content.ilike.${pat},location.ilike.${pat}`,
      }),
      searchTable<{ id: string; name: string | null; description: string | null; category: string | null; location: string | null; address: string | null; phone: string | null; website: string | null; is_verified: boolean | null; created_at: string }>({
        table: 'businesses',
        select: 'id, name, description, category, location, address, phone, website, is_verified, created_at',
        orTemplate: (pat) => `name.ilike.${pat},description.ilike.${pat},category.ilike.${pat},location.ilike.${pat}`,
      }),
      searchTable<{ id: string; title: string | null; description: string | null; location: string | null; address: string | null; date: string | null; time: string | null; category: string | null; created_at: string }>({
        table: 'events',
        select: 'id, title, description, location, address, date, time, category, created_at',
        orTemplate: (pat) => `title.ilike.${pat},description.ilike.${pat},location.ilike.${pat},category.ilike.${pat}`,
      }),
      searchTable<{ id: string; title: string | null; description: string | null; location: string | null; address: string | null; date: string | null; time: string | null; faith_type: string | null; created_at: string }>({
        table: 'faith_events',
        select: 'id, title, description, location, address, date, time, faith_type, created_at',
        orTemplate: (pat) => `title.ilike.${pat},description.ilike.${pat},location.ilike.${pat},faith_type.ilike.${pat}`,
      }),
      searchTable<{ id: string; title: string | null; bio: string | null; category: string | null; city: string | null; country: string | null; contact_phone: string | null; contact_email: string | null; created_at: string }>({
        table: 'service_providers',
        select: 'id, title, bio, category, city, country, contact_phone, contact_email, created_at',
        orTemplate: (pat) => `title.ilike.${pat},bio.ilike.${pat},category.ilike.${pat},city.ilike.${pat}`,
      }),
      searchTable<{ id: string; title: string | null; description: string | null; category: string | null; location: string | null; price: number | null; currency: string | null; created_at: string }>({
        table: 'marketplace_listings',
        select: 'id, title, description, category, location, price, currency, created_at',
        orTemplate: (pat) => `title.ilike.${pat},description.ilike.${pat},category.ilike.${pat},location.ilike.${pat}`,
      }),
      searchTable<{ id: string; title: string | null; description: string | null; type: string | null; price: number | null; currency: string | null; city: string | null; country: string | null; neighborhood: string | null; created_at: string }>({
        table: 'housing_listings',
        select: 'id, title, description, type, price, currency, city, country, neighborhood, created_at',
        orTemplate: (pat) => `title.ilike.${pat},description.ilike.${pat},type.ilike.${pat},city.ilike.${pat},neighborhood.ilike.${pat}`,
      }),
    ]);

    debugErrors.push(...(postsRes.errors ?? []));
    debugErrors.push(...(businessesRes.errors ?? []));
    debugErrors.push(...(eventsRes.errors ?? []));
    debugErrors.push(...(faithEventsRes.errors ?? []));
    debugErrors.push(...(providersRes.errors ?? []));
    debugErrors.push(...(listingsRes.errors ?? []));
    debugErrors.push(...(housingRes.errors ?? []));

    const sources: Source[] = [];

    const posts = postsRes?.data ?? [];
    for (const p of posts) {
      sources.push({
        type: 'post',
        id: String(p.id),
        title: 'Community post',
        snippet: compact(p.content ?? '', 180),
        route: `/post/${p.id}`,
      });
    }

    const businesses = businessesRes?.data ?? [];
    for (const b of businesses) {
      const catPrefix = b.category ? String(b.category) + ' • ' : '';
      sources.push({
        type: 'business',
        id: String(b.id),
        title: String(b.name ?? 'Business'),
        snippet: compact(catPrefix + String(b.description ?? ''), 180),
        route: `/business/${b.id}`,
      });
    }

    const events = eventsRes?.data ?? [];
    for (const e of events) {
      const catPrefix = e.category ? String(e.category) + ' • ' : '';
      sources.push({
        type: 'event',
        id: String(e.id),
        title: String(e.title ?? 'Event'),
        snippet: compact(catPrefix + String(e.description ?? ''), 180),
        route: `/event/${e.id}`,
      });
    }

    const faithEvents = faithEventsRes?.data ?? [];
    for (const e of faithEvents) {
      const catPrefix = e.faith_type ? String(e.faith_type) + ' • ' : '';
      sources.push({
        type: 'event',
        id: String(e.id),
        title: String(e.title ?? 'Faith event'),
        snippet: compact(catPrefix + String(e.description ?? ''), 180),
        route: `/events`,
      });
    }

    const providers = providersRes?.data ?? [];
    for (const sp of providers) {
      sources.push({
        type: 'provider',
        id: String(sp.id),
        title: String(sp.title ?? sp.category ?? 'Service provider'),
        snippet: compact(sp.bio ?? '', 180),
        route: `/trusted-providers`,
      });
    }

    const listings = listingsRes?.data ?? [];
    for (const l of listings) {
      const price = l.price ? (String(l.price) + ' ' + String(l.currency ?? '')).trim() : '';
      const pricePrefix = price ? price + ' • ' : '';
      sources.push({
        type: 'listing',
        id: String(l.id),
        title: String(l.title ?? 'Marketplace listing'),
        snippet: compact(pricePrefix + String(l.description ?? ''), 180),
        route: `/marketplace`,
      });
    }

    const housing = housingRes?.data ?? [];
    for (const h of housing) {
      const price = h.price ? (String(h.price) + ' ' + String(h.currency ?? '')).trim() : '';
      const typePrefix = h.type ? String(h.type) + ' • ' : '';
      const pricePrefix = price ? price + ' • ' : '';
      sources.push({
        type: 'housing',
        id: String(h.id),
        title: String(h.title ?? 'Housing'),
        snippet: compact(typePrefix + pricePrefix + String(h.description ?? ''), 180),
        route: `/housing-board`,
      });
    }

    // If user asked about events but nothing matched text, show upcoming events.
    if (!sources.length && isEventIntent(query)) {
      const today = new Date().toISOString().slice(0, 10);
      let [upcomingEvents, upcomingFaith] = await Promise.all([
        admin
          .from('events')
          .select('id, title, description, date, category, created_at')
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(6),
        admin
          .from('faith_events')
          .select('id, title, description, date, faith_type, created_at')
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(6),
      ]);

      if (upcomingEvents.error) debugErrors.push(`events(upcoming): ${upcomingEvents.error.message}`);
      if (upcomingFaith.error) debugErrors.push(`faith_events(upcoming): ${upcomingFaith.error.message}`);

      // If there are no upcoming rows (or date isn't populated), fall back to most recent events.
      if (!upcomingEvents.error && (upcomingEvents.data?.length ?? 0) === 0) {
        const recent = await admin
          .from('events')
          .select('id, title, description, date, category, created_at')
          .order('created_at', { ascending: false })
          .limit(6);
        if (recent.error) debugErrors.push(`events(recent): ${recent.error.message}`);
        else upcomingEvents = recent;
      }
      if (!upcomingFaith.error && (upcomingFaith.data?.length ?? 0) === 0) {
        const recent = await admin
          .from('faith_events')
          .select('id, title, description, date, faith_type, created_at')
          .order('created_at', { ascending: false })
          .limit(6);
        if (recent.error) debugErrors.push(`faith_events(recent): ${recent.error.message}`);
        else upcomingFaith = recent;
      }

      for (const e of upcomingEvents.data ?? []) {
        const catPrefix = e.category ? String(e.category) + ' • ' : '';
        sources.push({
          type: 'event',
          id: String(e.id),
          title: String(e.title ?? 'Event'),
          snippet: compact(catPrefix + String(e.description ?? ''), 180),
          route: `/event/${e.id}`,
        });
      }
      for (const e of upcomingFaith.data ?? []) {
        const catPrefix = e.faith_type ? String(e.faith_type) + ' • ' : '';
        sources.push({
          type: 'event',
          id: String(e.id),
          title: String(e.title ?? 'Faith event'),
          snippet: compact(catPrefix + String(e.description ?? ''), 180),
          route: `/events`,
        });
      }
    }

    // Light location hint only (don’t hard filter yet; MVP keeps recall high).
    const locationLine = [neighborhood, city, country].filter(Boolean).join(', ');
    const contextBlock = sources.length
      ? sources
          .slice(0, 14)
          .map((s, i) => `[${i + 1}] (${s.type}) ${s.title} — ${s.snippet}`)
          .join('\n')
      : '(no matching community sources found)';

    const system = [
      'You are Intera, an AI community assistant for a neighborhood/community app.',
      'Use ONLY the provided community sources to make recommendations; do not invent businesses, addresses, or claims.',
      'If sources are insufficient, ask 1-2 clarifying questions OR suggest how to ask the community.',
      'Output format:',
      '## Answer',
      '- 3–7 bullet points with actionable recommendations.',
      '',
      '## Sources',
      '- List the source numbers you used like [1], [3] and a 3-8 word reason.',
      '',
      'Be concise, friendly, and practical.',
    ].join('\n');

    const user = [
      `User location (if known): ${locationLine || 'unknown'}`,
      `User question: ${query}`,
      '',
      'Community sources:',
      contextBlock,
    ].join('\n');

    const answer = await openaiChat({ apiKey: OPENAI_API_KEY, system, user });

    return new Response(
      JSON.stringify({
        answer,
        sources,
        location: { city, country, neighborhood },
        debug: {
          terms,
          patterns,
          errorCount: debugErrors.length,
          errors: debugErrors.slice(0, 12),
        },
      }),
      {
      status: 200,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Unexpected error', details: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});

