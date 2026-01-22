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
  profile?: {
    cityLabel?: string;
    isNewArrival?: boolean;
    arrivalCity?: string;
    lookingForHelp?: string[];
    newcomerDay?: number;
    newcomerCompletedDays?: number[];
  };
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
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

function isWeatherIntent(raw: string) {
  const t = String(raw || '').toLowerCase();
  return (
    t.includes('weather') ||
    t.includes('forecast') ||
    t.includes('temperature') ||
    t.includes('rain') ||
    t.includes('snow') ||
    t.includes('wind')
  );
}

function weatherCodeToText(code: number | null | undefined) {
  const c = typeof code === 'number' ? code : Number(code);
  if (!Number.isFinite(c)) return 'Unknown conditions';
  // Open-Meteo WMO codes (subset)
  if (c === 0) return 'Clear sky';
  if (c === 1) return 'Mainly clear';
  if (c === 2) return 'Partly cloudy';
  if (c === 3) return 'Overcast';
  if (c === 45 || c === 48) return 'Fog';
  if (c === 51 || c === 53 || c === 55) return 'Drizzle';
  if (c === 56 || c === 57) return 'Freezing drizzle';
  if (c === 61 || c === 63 || c === 65) return 'Rain';
  if (c === 66 || c === 67) return 'Freezing rain';
  if (c === 71 || c === 73 || c === 75) return 'Snow';
  if (c === 77) return 'Snow grains';
  if (c === 80 || c === 81 || c === 82) return 'Rain showers';
  if (c === 85 || c === 86) return 'Snow showers';
  if (c === 95) return 'Thunderstorm';
  if (c === 96 || c === 99) return 'Thunderstorm with hail';
  return 'Mixed conditions';
}

function usesFahrenheit(country: string) {
  const c = String(country || '').trim();
  if (!c) return false;
  const upper = c.toUpperCase();
  const lower = c.toLowerCase();
  // Country codes (Open-Meteo uses ISO-3166-1 alpha-2 codes).
  if (upper === 'US') return true;
  if (upper === 'BS') return true; // Bahamas
  if (upper === 'BZ') return true; // Belize
  if (upper === 'KY') return true; // Cayman Islands
  if (upper === 'PW') return true; // Palau
  if (upper === 'FM') return true; // Micronesia
  if (upper === 'MH') return true; // Marshall Islands

  // Name fallbacks (in case we only have a label).
  if (lower.includes('united states')) return true;
  if (lower === 'usa' || lower === 'u.s.a.' || lower === 'u.s.' || lower === 'us') return true;
  if (lower.includes('bahamas')) return true;
  if (lower.includes('belize')) return true;
  if (lower.includes('cayman')) return true;
  if (lower.includes('palau')) return true;
  if (lower.includes('micronesia')) return true;
  if (lower.includes('marshall islands')) return true;
  return false;
}

async function fetchWeather(placeQuery: string, fallbackCountryHint?: string) {
  // Geocode -> forecast via Open-Meteo (no API key).
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(placeQuery)}&count=1&language=en&format=json`;
  const geoResp = await fetch(geoUrl);
  if (!geoResp.ok) throw new Error(`Geocoding failed: HTTP ${geoResp.status}`);
  const geoJson = (await geoResp.json()) as any;
  const hit = Array.isArray(geoJson?.results) ? geoJson.results[0] : null;
  if (!hit) return null;

  const latitude = Number(hit.latitude);
  const longitude = Number(hit.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const countryCode = String(hit.country_code ?? '').trim().toUpperCase();
  const countryName = String(hit.country ?? '').trim();
  const useF = usesFahrenheit(countryCode || countryName || fallbackCountryHint || '');
  const temperature_unit = useF ? 'fahrenheit' : 'celsius';
  const wind_speed_unit = useF ? 'mph' : 'kmh';

  const labelParts = [hit.name, hit.admin1, hit.country].filter(Boolean).map((x: any) => String(x).trim()).filter(Boolean);
  const label = labelParts.join(', ');

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(String(latitude))}` +
    `&longitude=${encodeURIComponent(String(longitude))}` +
    `&temperature_unit=${encodeURIComponent(temperature_unit)}` +
    `&wind_speed_unit=${encodeURIComponent(wind_speed_unit)}` +
    `&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&timezone=auto`;
  const wxResp = await fetch(forecastUrl);
  if (!wxResp.ok) throw new Error(`Forecast failed: HTTP ${wxResp.status}`);
  const wxJson = (await wxResp.json()) as any;

  const current = wxJson?.current ?? {};
  const daily = wxJson?.daily ?? {};

  const out = {
    label,
    units: { temperature_unit, wind_speed_unit },
    country: { code: countryCode || null, name: countryName || null },
    current: {
      temperature_2m: typeof current.temperature_2m === 'number' ? current.temperature_2m : Number(current.temperature_2m),
      apparent_temperature: typeof current.apparent_temperature === 'number' ? current.apparent_temperature : Number(current.apparent_temperature),
      precipitation: typeof current.precipitation === 'number' ? current.precipitation : Number(current.precipitation),
      wind_speed_10m: typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : Number(current.wind_speed_10m),
      weather_code: typeof current.weather_code === 'number' ? current.weather_code : Number(current.weather_code),
      time: String(current.time ?? '').trim(),
    },
    today: {
      max: Array.isArray(daily.temperature_2m_max) ? Number(daily.temperature_2m_max[0]) : NaN,
      min: Array.isArray(daily.temperature_2m_min) ? Number(daily.temperature_2m_min[0]) : NaN,
      precip_sum: Array.isArray(daily.precipitation_sum) ? Number(daily.precipitation_sum[0]) : NaN,
    },
    sources: { geoUrl, forecastUrl },
  };
  return out;
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
    const profile = body?.profile ?? {};
    const history = Array.isArray(body?.history) ? body.history : [];

    // Real-time weather (external source). Avoids "no sources" confusion for weather questions.
    if (isWeatherIntent(query)) {
      const placeQuery = [city || neighborhood, country].filter(Boolean).join(', ').trim();
      if (!placeQuery) {
        const answer = [
          '## Answer',
          '- I can grab live weather, but I need a city (and ideally country).',
          '- Please enable location in the app or ask like: “What’s the weather in Aurora, Canada?”',
          '',
          '## Sources',
          '- None (missing location).',
        ].join('\n');
        return new Response(
          JSON.stringify({
            answer,
            sources: [],
            location: { city, country, neighborhood },
            debug: { intent: 'weather' },
          }),
          { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } }
        );
      }

      try {
        const wx = await fetchWeather(placeQuery, country || undefined);
        if (!wx) {
          const answer = [
            '## Answer',
            `- I couldn’t find weather data for “${placeQuery}”.`,
            '- Try adding more detail (city + country), or check spelling.',
            '',
            '## Sources',
            '- Open‑Meteo geocoding (no match).',
          ].join('\n');
          return new Response(
            JSON.stringify({
              answer,
              sources: [],
              location: { city, country, neighborhood },
              debug: { intent: 'weather', placeQuery },
            }),
            { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } }
          );
        }

        const unitLetter = wx?.units?.temperature_unit === 'fahrenheit' ? 'F' : 'C';
        const windUnit = wx?.units?.wind_speed_unit === 'mph' ? 'mph' : 'km/h';
        const cond = weatherCodeToText(wx.current.weather_code);
        const temp = Number.isFinite(wx.current.temperature_2m) ? `${Math.round(wx.current.temperature_2m)}°${unitLetter}` : '—';
        const feels = Number.isFinite(wx.current.apparent_temperature) ? `${Math.round(wx.current.apparent_temperature)}°${unitLetter}` : '—';
        const wind = Number.isFinite(wx.current.wind_speed_10m) ? `${Math.round(wx.current.wind_speed_10m)} ${windUnit}` : '—';
        const precipNow = Number.isFinite(wx.current.precipitation) ? `${wx.current.precipitation} mm` : '—';
        const hi = Number.isFinite(wx.today.max) ? `${Math.round(wx.today.max)}°${unitLetter}` : '—';
        const lo = Number.isFinite(wx.today.min) ? `${Math.round(wx.today.min)}°${unitLetter}` : '—';
        const precipDay = Number.isFinite(wx.today.precip_sum) ? `${wx.today.precip_sum} mm` : '—';

        const answer = [
          '## Answer',
          `- **${wx.label || placeQuery}**: ${cond}.`,
          `- Current: **${temp}** (feels like **${feels}**).`,
          `- Wind: **${wind}**.`,
          `- Precipitation: **${precipNow}** right now; **${precipDay}** expected today.`,
          `- Today: high **${hi}**, low **${lo}**.`,
          '',
          '## Sources',
          '- Open‑Meteo (live forecast).',
        ].join('\n');

        return new Response(
          JSON.stringify({
            answer,
            sources: [],
            location: { city, country, neighborhood },
            debug: { intent: 'weather', placeQuery, sources: wx.sources },
          }),
          { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } }
        );
      } catch (e) {
        const answer = [
          '## Answer',
          "- I couldn’t fetch live weather right now. Please try again in a moment.",
          '',
          '## Sources',
          '- Open‑Meteo (request failed).',
        ].join('\n');
        return new Response(
          JSON.stringify({
            answer,
            sources: [],
            location: { city, country, neighborhood },
            debug: { intent: 'weather', placeQuery, error: String(e) },
          }),
          { status: 200, headers: { ...corsHeaders, 'content-type': 'application/json' } }
        );
      }
    }

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

    const profileLine = [
      profile?.cityLabel ? `City: ${profile.cityLabel}` : null,
      profile?.isNewArrival ? `Newcomer day ${profile.newcomerDay ?? 'unknown'}/30` : null,
      Array.isArray(profile?.lookingForHelp) && profile.lookingForHelp.length
        ? `Looking for help with: ${profile.lookingForHelp.join(', ')}`
        : null,
      Array.isArray(profile?.newcomerCompletedDays) && profile.newcomerCompletedDays.length
        ? `Journey progress: ${profile.newcomerCompletedDays.length}/30 completed`
        : null,
    ]
      .filter(Boolean)
      .join(' • ');

    const historyBlock = history.length
      ? history
          .slice(-10)
          .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${compact(m.content ?? '', 260)}`)
          .join('\n')
      : '(no prior chat)';

    const system = [
      'You are Intera, an AI community assistant for a neighborhood/community app.',
      'Use ONLY the provided community sources to make recommendations; do not invent businesses, addresses, or claims.',
      'Use the user profile context to personalize your answer (tone, priorities), but do not invent facts.',
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
      `User profile: ${profileLine || 'none'}`,
      `User question: ${query}`,
      '',
      'Prior chat (most recent last):',
      historyBlock,
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

