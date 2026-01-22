// Supabase Edge Function: ai-business-booster
// Generates marketing content for a business listing (promo pack).
//
// Secrets required:
// - OPENAI_API_KEY

type Body = {
  business: {
    name: string;
    description?: string;
    category?: string;
    locationLabel?: string;
    phone?: string;
    website?: string;
    hoursHint?: string;
  };
  goal?: 'more_bookings' | 'more_walkins' | 'more_messages' | 'general';
  voice?: 'friendly' | 'luxury' | 'professional' | 'playful' | 'community';
  audience?: string; // e.g. "newcomers", "families", "students"
};

type Result = {
  tagline: string;
  short_bio: string;
  google_description: string;
  flyer: { headline: string; bullets: string[] };
  instagram_captions: string[]; // 3
  hashtags: string[]; // 10-20
  offers: string[]; // 3-5
  posting_plan_7d: { day: number; post: string }[];
  safety_note?: string | null;
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

async function generate(apiKey: string, body: Body): Promise<Result> {
  const b = body.business;
  const system = [
    'You are Intera Business Booster, an assistant that helps local businesses market themselves.',
    'Return ONLY valid JSON (no markdown, no code fences).',
    'Schema:',
    '{',
    '  "tagline": string,',
    '  "short_bio": string,',
    '  "google_description": string,',
    '  "flyer": { "headline": string, "bullets": string[] },',
    '  "instagram_captions": string[],',
    '  "hashtags": string[],',
    '  "offers": string[],',
    '  "posting_plan_7d": { "day": number, "post": string }[],',
    '  "safety_note": string|null',
    '}',
    '',
    'Rules:',
    '- Use ONLY details provided. Do not invent pricing, address, hours, certifications, or guarantees.',
    '- Keep it compliant and non-misleading.',
    '- If contact info is missing, do not fabricate it; suggest "DM for details" or "Message us".',
    '- Keep outputs short and punchy.',
    '- hashtags should be plain words/phrases with # prefix.',
  ].join('\n');

  const user = [
    `Goal: ${body.goal || 'general'}`,
    `Voice: ${body.voice || 'community'}`,
    body.audience ? `Audience: ${body.audience}` : '',
    '',
    `Business name: ${compact(b.name, 120)}`,
    b.category ? `Category: ${compact(b.category, 80)}` : '',
    b.locationLabel ? `Location: ${compact(b.locationLabel, 120)}` : '',
    b.hoursHint ? `Hours hint: ${compact(b.hoursHint, 120)}` : '',
    b.phone ? `Phone: ${compact(b.phone, 40)}` : '',
    b.website ? `Website: ${compact(b.website, 120)}` : '',
    '',
    'Description:',
    compact(b.description || '', 2500),
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
      temperature: 0.35,
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

  const flyerBullets = Array.isArray(parsed?.flyer?.bullets) ? parsed.flyer.bullets.map((x: any) => String(x)).filter(Boolean).slice(0, 6) : [];

  return {
    tagline: String(parsed?.tagline ?? '').trim(),
    short_bio: String(parsed?.short_bio ?? '').trim(),
    google_description: String(parsed?.google_description ?? '').trim(),
    flyer: {
      headline: String(parsed?.flyer?.headline ?? '').trim(),
      bullets: flyerBullets,
    },
    instagram_captions: Array.isArray(parsed?.instagram_captions)
      ? parsed.instagram_captions.map((x: any) => String(x)).filter(Boolean).slice(0, 3)
      : [],
    hashtags: Array.isArray(parsed?.hashtags)
      ? parsed.hashtags.map((x: any) => String(x)).filter(Boolean).slice(0, 20)
      : [],
    offers: Array.isArray(parsed?.offers)
      ? parsed.offers.map((x: any) => String(x)).filter(Boolean).slice(0, 5)
      : [],
    posting_plan_7d: Array.isArray(parsed?.posting_plan_7d)
      ? parsed.posting_plan_7d
          .map((x: any) => ({
            day: Number(x?.day ?? 0),
            post: String(x?.post ?? '').trim(),
          }))
          .filter((x: any) => x.day >= 1 && x.day <= 7 && x.post)
      : [],
    safety_note: parsed?.safety_note == null ? null : String(parsed.safety_note),
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
    const name = String(body?.business?.name ?? '').trim();
    if (!name) {
      return new Response(JSON.stringify({ error: 'business.name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const result = await generate(OPENAI_API_KEY, body);
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

