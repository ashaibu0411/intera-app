// Supabase Edge Function: ai-moderate-content
// AI moderation for user-generated text (posts/comments/etc).
//
// Secrets required:
// - OPENAI_API_KEY

type Body = {
  text: string;
  context?: 'post' | 'comment' | 'dm' | 'profile' | 'clip_caption' | 'other';
};

type ModerationDecision = {
  action: 'allow' | 'warn' | 'block';
  categories: string[]; // e.g. sexual, violence, hate_speech, scam, harassment, spam, pii
  reasons: string[]; // short human-readable reasons
  redaction_tips: string[]; // suggestions like "remove phone number"
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

function detectPII(text: string) {
  const t = String(text || '');
  const hits: string[] = [];
  // Email
  if (/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(t)) hits.push('email');
  // Phone (loose)
  if (/\b(\+?\d{1,3}[\s.-]?)?(\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}\b/.test(t)) hits.push('phone');
  // Address-ish (very rough)
  if (/\b\d{1,5}\s+[A-Za-z0-9.'-]+\s+(street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|court|ct)\b/i.test(t))
    hits.push('address');
  return Array.from(new Set(hits));
}

async function openaiDecision(apiKey: string, body: Body): Promise<ModerationDecision> {
  const pii = detectPII(body.text);
  const system = [
    'You are a strict but fair community content moderator for a neighborhood app.',
    'Return ONLY valid JSON (no markdown, no code fences).',
    'Schema:',
    '{ "action": "allow"|"warn"|"block", "categories": string[], "reasons": string[], "redaction_tips": string[] }',
    '',
    'Policy:',
    '- BLOCK: sexual content involving nudity/explicit acts, credible threats/violence, hate speech/slurs, instructions for wrongdoing.',
    '- WARN: mild harassment, spammy promotion, potential scam vibes, or unsafe oversharing (PII).',
    '- ALLOW: normal community conversation.',
    '',
    'Notes:',
    '- Do not invent details; judge ONLY the provided text.',
    '- If the text includes personal contact info or exact address, include category "pii" and add redaction tips.',
    '- Keep reasons short (max 1 sentence each).',
  ].join('\n');

  const user = [
    `Context: ${body.context || 'other'}`,
    `PII detectors found: ${pii.length ? pii.join(', ') : 'none'}`,
    '',
    'Text:',
    compact(body.text, 4000),
  ].join('\n');

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0,
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

  const action = String(parsed?.action || '').toLowerCase();
  const decision: ModerationDecision = {
    action: action === 'block' ? 'block' : action === 'warn' ? 'warn' : 'allow',
    categories: Array.isArray(parsed?.categories) ? parsed.categories.map((x: any) => String(x)).filter(Boolean) : [],
    reasons: Array.isArray(parsed?.reasons) ? parsed.reasons.map((x: any) => String(x)).filter(Boolean) : [],
    redaction_tips: Array.isArray(parsed?.redaction_tips) ? parsed.redaction_tips.map((x: any) => String(x)).filter(Boolean) : [],
  };

  // Ensure PII categories/tips are present when detectors hit.
  if (pii.length) {
    if (!decision.categories.includes('pii')) decision.categories.push('pii');
    const map: Record<string, string> = {
      email: 'Consider removing your email address and moving it to private messages.',
      phone: 'Consider removing your phone number and moving it to private messages.',
      address: 'Consider removing your exact address; share a general area instead.',
    };
    for (const p of pii) {
      const tip = map[p];
      if (tip && !decision.redaction_tips.includes(tip)) decision.redaction_tips.push(tip);
    }
    if (decision.action === 'allow') decision.action = 'warn';
  }

  return decision;
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
    if (!text) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const decision = await openaiDecision(OPENAI_API_KEY, { text, context: body?.context });
    return new Response(JSON.stringify(decision), {
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

