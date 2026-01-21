// Supabase Edge Function: ai-post-copilot
// Helps rewrite/translate a post draft to match community tone.
//
// Secrets required:
// - OPENAI_API_KEY

type Body = {
  text: string;
  mode?: 'rewrite' | 'shorten' | 'expand' | 'translate';
  targetLang?: string; // used when mode=translate (e.g. en, fr, es, ar, sw)
  profile?: { cityLabel?: string; isNewArrival?: boolean; arrivalCity?: string };
};

type Result = {
  text: string;
  title_suggestion?: string | null;
  safety_notes?: string[];
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

async function openai(opts: { apiKey: string; system: string; user: string }): Promise<Result> {
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
  const content = String(json?.choices?.[0]?.message?.content ?? '').trim();
  const maybeJson = extractJson(content) ?? content;
  const parsed = JSON.parse(maybeJson);
  return {
    text: String(parsed?.text ?? '').trim(),
    title_suggestion: parsed?.title_suggestion == null ? null : String(parsed.title_suggestion),
    safety_notes: Array.isArray(parsed?.safety_notes) ? parsed.safety_notes.map((x: any) => String(x)).filter(Boolean) : [],
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
    const text = String(body?.text ?? '').trim();
    const mode = (body?.mode ?? 'rewrite') as Body['mode'];
    const targetLang = body?.targetLang ? String(body.targetLang).trim() : '';
    const profile = body?.profile ?? {};

    if (!text) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
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

    const instruction =
      mode === 'shorten'
        ? 'Rewrite the post to be shorter (max ~280 chars) while keeping meaning.'
        : mode === 'expand'
          ? 'Rewrite the post to be clearer and more detailed (friendly, not long-winded).'
          : mode === 'translate'
            ? `Translate the post into ${targetLang || 'the target language'} and keep it natural.`
            : 'Rewrite the post to sound clear, friendly, and neighborly. Keep the user voice.';

    const system = [
      'You are Intera Post Copilot for a community app.',
      'Return ONLY valid JSON (no markdown, no code fences).',
      'Schema:',
      '{ "text": string, "title_suggestion": string|null, "safety_notes": string[] }',
      '',
      'Rules:',
      '- Do not add fake facts, addresses, or claims.',
      '- Keep it respectful and community-safe.',
      '- If the draft includes private info (phone, email, exact address), add a safety note suggesting removal.',
      '- Title suggestion can be null.',
    ].join('\n');

    const user = [
      `Task: ${instruction}`,
      `User context: ${profileLine || 'none'}`,
      '',
      'Draft:',
      compact(text, 4000),
    ].join('\n');

    const result = await openai({ apiKey: OPENAI_API_KEY, system, user });
    if (!result.text) throw new Error('Missing text in model response');

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

