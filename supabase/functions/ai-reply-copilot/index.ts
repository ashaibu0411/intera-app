// Supabase Edge Function: ai-reply-copilot
// Suggests 3 helpful replies to a post/comment thread.
//
// Secrets required:
// - OPENAI_API_KEY

type Body = {
  postText: string;
  replyingToText?: string; // optional: the comment being replied to
  goal?: 'helpful' | 'friendly' | 'short' | 'supportive';
  voice?: 'community' | 'professional' | 'playful';
};

type Result = {
  replies: string[]; // 3
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

async function suggest(apiKey: string, body: Body): Promise<Result> {
  const system = [
    'You are Intera Reply Copilot for a community app.',
    'Return ONLY valid JSON (no markdown).',
    'Schema: { "replies": string[] }',
    '',
    'Rules:',
    '- Provide exactly 3 replies.',
    '- Replies must be short (1-2 sentences), friendly, and non-judgmental.',
    '- Do not invent facts. Do not offer illegal/medical/legal advice.',
    '- Avoid phone numbers, addresses, or personal data.',
  ].join('\n');

  const user = [
    `Goal: ${body.goal || 'helpful'}`,
    `Voice: ${body.voice || 'community'}`,
    '',
    'Post:',
    compact(body.postText, 2000),
    body.replyingToText ? `\nReplying to:\n${compact(body.replyingToText, 800)}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.5,
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

  const replies = Array.isArray(parsed?.replies) ? parsed.replies.map((x: any) => String(x)).filter(Boolean) : [];
  return { replies: replies.slice(0, 3) };
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
    const postText = String(body?.postText ?? '').trim();
    if (!postText) {
      return new Response(JSON.stringify({ error: 'postText is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const result = await suggest(OPENAI_API_KEY, body);
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

