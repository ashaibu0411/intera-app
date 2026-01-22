// Supabase Edge Function: ai-clip-enhancer
// Generates a better clip description, hashtags, and title ideas from transcript/notes.
//
// Secrets required:
// - OPENAI_API_KEY

type Body = {
  transcript: string;
  currentDescription?: string;
  goal?: 'more_views' | 'more_followers' | 'more_comments' | 'general';
  voice?: 'fun' | 'clean' | 'professional' | 'community';
};

type Result = {
  title_ideas: string[]; // 3
  description: string;
  hashtags: string[]; // 10-20
  best_lines: string[]; // 3-6 short quotes/hooks from transcript
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

async function enhance(apiKey: string, body: Body): Promise<Result> {
  const system = [
    'You are a short-form video caption assistant.',
    'Return ONLY valid JSON (no markdown).',
    'Schema: { "title_ideas": string[], "description": string, "hashtags": string[], "best_lines": string[] }',
    '',
    'Rules:',
    '- Use ONLY transcript/currentDescription; do not invent facts or locations.',
    '- Keep description under ~220 characters and include 1-2 emojis max.',
    '- Hashtags: 10-20, with # prefix, no spaces inside tags.',
    '- Title ideas: 3 short options.',
    '- best_lines: 3-6 short hooks quoted from transcript (or paraphrased minimally if needed).',
  ].join('\n');

  const user = [
    `Goal: ${body.goal || 'general'}`,
    `Voice: ${body.voice || 'community'}`,
    '',
    body.currentDescription ? `Current description:\n${compact(body.currentDescription, 400)}` : '',
    'Transcript:',
    compact(body.transcript, 4000),
  ]
    .filter(Boolean)
    .join('\n');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
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

  return {
    title_ideas: Array.isArray(parsed?.title_ideas) ? parsed.title_ideas.map((x: any) => String(x)).filter(Boolean).slice(0, 3) : [],
    description: String(parsed?.description ?? '').trim(),
    hashtags: Array.isArray(parsed?.hashtags) ? parsed.hashtags.map((x: any) => String(x)).filter(Boolean).slice(0, 20) : [],
    best_lines: Array.isArray(parsed?.best_lines) ? parsed.best_lines.map((x: any) => String(x)).filter(Boolean).slice(0, 6) : [],
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
    const transcript = String(body?.transcript ?? '').trim();
    if (!transcript) {
      return new Response(JSON.stringify({ error: 'transcript is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const result = await enhance(OPENAI_API_KEY, body);
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

