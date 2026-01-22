// Supabase Edge Function: ai-trust-safety
// Scam/red-flag checker for marketplace listings and messages.
//
// Secrets required:
// - OPENAI_API_KEY

type Body = {
  kind: 'marketplace_listing' | 'dm_message' | 'dm_thread' | 'other';
  text: string;
};

type Result = {
  risk: 'low' | 'medium' | 'high';
  score: number; // 0-100
  red_flags: string[];
  safe_signals: string[];
  suggested_questions: string[];
  recommendation: string;
};

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function extractJson(text: string) {
  const s = String(text || '');
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return s.slice(start, end + 1);
}

function compact(s: string, maxLen: number) {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, Math.max(0, maxLen - 3)).trimEnd() + '...';
}

async function analyze(apiKey: string, body: Body): Promise<Result> {
  const system = [
    'You are a safety assistant for a marketplace/community app.',
    'Return ONLY valid JSON (no markdown).',
    'Schema:',
    '{ "risk": "low"|"medium"|"high", "score": number, "red_flags": string[], "safe_signals": string[], "suggested_questions": string[], "recommendation": string }',
    '',
    'Rules:',
    '- Do not accuse anyone; describe risks neutrally.',
    '- If there are clear scam patterns (off-platform payment, urgency, gift cards, crypto, shipping fraud), raise risk.',
    '- Keep red_flags and safe_signals short bullets (max 6 each).',
    '- suggested_questions: 3-6 questions to ask the other party.',
    '- recommendation: 1-2 sentences of practical next steps (meet safe place, verify, use in-app payments).',
  ].join('\n');

  const user = [
    `Kind: ${body.kind}`,
    '',
    'Content:',
    compact(body.text, 4000),
  ].join('\n');

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

  const riskRaw = String(parsed?.risk ?? '').toLowerCase();
  const risk: Result['risk'] = riskRaw === 'high' ? 'high' : riskRaw === 'medium' ? 'medium' : 'low';
  const scoreNum = Number(parsed?.score ?? 0);
  const score = Number.isFinite(scoreNum) ? Math.max(0, Math.min(100, Math.round(scoreNum))) : 0;

  return {
    risk,
    score,
    red_flags: Array.isArray(parsed?.red_flags) ? parsed.red_flags.map((x: any) => String(x)).filter(Boolean).slice(0, 6) : [],
    safe_signals: Array.isArray(parsed?.safe_signals) ? parsed.safe_signals.map((x: any) => String(x)).filter(Boolean).slice(0, 6) : [],
    suggested_questions: Array.isArray(parsed?.suggested_questions)
      ? parsed.suggested_questions.map((x: any) => String(x)).filter(Boolean).slice(0, 6)
      : [],
    recommendation: String(parsed?.recommendation ?? '').trim(),
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
    const kind = (body?.kind ?? 'other') as Body['kind'];
    const text = String(body?.text ?? '').trim();
    if (!text) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const result = await analyze(OPENAI_API_KEY, { kind, text });
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

