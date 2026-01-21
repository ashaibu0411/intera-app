// Supabase Edge Function: ai-language-bridge
// Translation + "local tone" notes using OpenAI.
//
// Secrets required:
// - OPENAI_API_KEY
//
// Optional:
// - PROJECT_URL / SUPABASE_URL (not required)

type Body = {
  text: string;
  sourceLang?: string; // ISO-ish (e.g. en, fr, sw, yo, ig, ha, am, wo, zu, xh, tw, ar)
  targetLang: string;
  context?: string; // e.g. "chat", "formal", "business", "immigration", etc.
  profile?: {
    cityLabel?: string;
    isNewArrival?: boolean;
    arrivalCity?: string;
  };
  history?: Array<{
    from: string;
    to: string;
    source: string;
    target: string;
  }>;
};

type Result = {
  translation: string;
  alternatives: string[];
  tone_notes: string[];
  cultural_notes: string[];
  romanization?: string | null;
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

async function openaiTranslate(opts: {
  apiKey: string;
  text: string;
  sourceLang?: string;
  targetLang: string;
  context?: string;
  profileLine?: string;
  historyLine?: string;
}): Promise<Result> {
  const system = [
    'You are an expert translator and cultural bridge.',
    'Return ONLY valid JSON (no markdown, no code fences).',
    'The JSON must match exactly this shape:',
    '{ "translation": string, "alternatives": string[], "tone_notes": string[], "cultural_notes": string[], "romanization": string|null }',
    '',
    'Rules:',
    '- Keep translation natural in the target language.',
    '- Provide 0-3 alternatives (short).',
    '- Provide 1-4 tone_notes explaining how to sound natural/respectful.',
    '- Provide 0-3 cultural_notes if relevant (avoid stereotypes; be practical).',
    '- If target language uses a non-Latin script, include romanization when helpful; otherwise null.',
  ].join('\n');

  const user = [
    `Source language (if known): ${opts.sourceLang || 'auto'}`,
    `Target language: ${opts.targetLang}`,
    `Context: ${opts.context || 'general'}`,
    ...(opts.profileLine ? [`User context: ${opts.profileLine}`] : []),
    ...(opts.historyLine ? ['Recent translations:', opts.historyLine] : []),
    'Text to translate:',
    compact(opts.text, 4000),
  ].join('\n');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
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
  let parsed: any;
  try {
    parsed = JSON.parse(maybeJson);
  } catch {
    throw new Error('OpenAI returned non-JSON response');
  }

  const result: Result = {
    translation: String(parsed?.translation ?? '').trim(),
    alternatives: Array.isArray(parsed?.alternatives) ? parsed.alternatives.map((x: any) => String(x)).filter(Boolean) : [],
    tone_notes: Array.isArray(parsed?.tone_notes) ? parsed.tone_notes.map((x: any) => String(x)).filter(Boolean) : [],
    cultural_notes: Array.isArray(parsed?.cultural_notes) ? parsed.cultural_notes.map((x: any) => String(x)).filter(Boolean) : [],
    romanization: parsed?.romanization == null ? null : String(parsed.romanization),
  };

  if (!result.translation) throw new Error('Missing translation in model response');
  return result;
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
    const text = String(body?.text ?? '').trim();
    const targetLang = String(body?.targetLang ?? '').trim();
    const sourceLang = body?.sourceLang ? String(body.sourceLang).trim() : undefined;
    const context = body?.context ? String(body.context).trim() : undefined;
    const profile = body?.profile ?? {};
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!text) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }
    if (!targetLang) {
      return new Response(JSON.stringify({ error: 'targetLang is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const profileLine = [
      profile?.cityLabel ? `City: ${profile.cityLabel}` : null,
      profile?.isNewArrival ? `New arrival: yes` : null,
      profile?.arrivalCity ? `Arrived in: ${profile.arrivalCity}` : null,
    ]
      .filter(Boolean)
      .join(' • ');

    const historyLine =
      history.length > 0
        ? history
            .slice(0, 6)
            .map((h) => `${h.from}→${h.to}: "${compact(h.source, 60)}" → "${compact(h.target, 60)}"`)
            .join('\n')
        : '';

    const result = await openaiTranslate({
      apiKey: OPENAI_API_KEY,
      text,
      sourceLang,
      targetLang,
      context,
      profileLine: profileLine || undefined,
      historyLine: historyLine || undefined,
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

