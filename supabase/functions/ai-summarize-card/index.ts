// Supabase Edge Function: ai-summarize-card
// Generates short summaries for Event / Business detail pages.
//
// Secrets required:
// - OPENAI_API_KEY

type Body = {
  kind: 'event' | 'business' | 'other';
  title: string;
  description?: string;
  locationLabel?: string;
  category?: string;
};

type Result = {
  bullets: string[]; // 3-5
  highlights: string[]; // 0-3
  good_for: string[]; // 0-3
  caution?: string | null; // optional safety / verification note
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

async function summarize(apiKey: string, b: Body): Promise<Result> {
  const system = [
    'You write concise, helpful summaries for a community app.',
    'Return ONLY valid JSON (no markdown, no code fences).',
    'Schema:',
    '{ "bullets": string[], "highlights": string[], "good_for": string[], "caution": string|null }',
    '',
    'Rules:',
    '- Use only the given info. Do not invent facts, prices, or hours.',
    '- bullets: 3-5 short bullets.',
    '- highlights: 0-3 (e.g. "Family-friendly", "Free", "Near transit") ONLY if supported.',
    '- good_for: 0-3 (e.g. "newcomers", "families", "students") ONLY if supported.',
    '- caution: null unless there is a safety/verification note worth mentioning (e.g. "Confirm details before you go").',
  ].join('\n');

  const user = [
    `Kind: ${b.kind}`,
    `Title: ${compact(b.title, 180)}`,
    b.category ? `Category: ${compact(b.category, 80)}` : '',
    b.locationLabel ? `Location: ${compact(b.locationLabel, 120)}` : '',
    '',
    'Description:',
    compact(b.description || '', 3500),
  ]
    .filter(Boolean)
    .join('\n');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
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
    const text = await resp.text().catch(() => '');
    throw new Error(`OpenAI error: HTTP ${resp.status} ${text}`);
  }

  const json = (await resp.json()) as any;
  const content = String(json?.choices?.[0]?.message?.content ?? '').trim();
  const maybeJson = extractJson(content) ?? content;
  const parsed = JSON.parse(maybeJson);

  return {
    bullets: Array.isArray(parsed?.bullets) ? parsed.bullets.map((x: any) => String(x)).filter(Boolean).slice(0, 5) : [],
    highlights: Array.isArray(parsed?.highlights) ? parsed.highlights.map((x: any) => String(x)).filter(Boolean).slice(0, 3) : [],
    good_for: Array.isArray(parsed?.good_for) ? parsed.good_for.map((x: any) => String(x)).filter(Boolean).slice(0, 3) : [],
    caution: parsed?.caution == null ? null : String(parsed.caution),
  };
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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const body = (await req.json()) as Body;
    const title = String(body?.title ?? '').trim();
    const kind = (body?.kind ?? 'other') as Body['kind'];
    if (!title) {
      return new Response(JSON.stringify({ error: 'title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const result = await summarize(OPENAI_API_KEY, {
      kind,
      title,
      description: body?.description,
      locationLabel: body?.locationLabel,
      category: body?.category,
    });

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

