// Supabase Edge Function: immigration-assistant
// Server-side OpenAI call for Immigration Assistant (keeps API key off device).
//
// Secrets required:
// - OPENAI_API_KEY
//
// Notes:
// - This function is designed to be callable by guests (use dashboard JWT setting as desired).

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type Body = {
  messages?: ChatMessage[]; // previous conversation turns (no system)
  query?: string; // latest user message (optional if included in messages)
  profile?: {
    cityLabel?: string;
    isNewArrival?: boolean;
    arrivalCity?: string;
    lookingForHelp?: string[];
    newcomerDay?: number;
    newcomerCompletedDays?: number[];
  };
};

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SYSTEM_PROMPT = `You are an expert immigration advisor and career counselor specializing in helping professionals from developing countries (especially Africa, the Caribbean, and Asia) relocate to work or study in countries like the USA, UK, Canada, Australia, and Germany.

Your expertise includes:
- Work visa processes (H-1B, EB-3, Skilled Worker visas, etc.)
- Professional licensing and credential evaluation (CGFNS, WES, NACES)
- Healthcare worker immigration (nurses, doctors, physical therapists)
- Tech worker immigration (software engineers, data scientists)
- Student visas and scholarship opportunities
- Family-based immigration
- Document requirements and timelines
- Cost estimates and financial planning
- Job search strategies for sponsored positions

When answering:
1. Be specific and actionable with step-by-step guidance
2. Include estimated costs and timelines when relevant
3. Mention official resources and websites
4. Be encouraging but realistic about challenges
5. If you don't know something specific, say so and suggest where to find accurate info
6. Consider the user's country of origin when giving advice
7. Keep responses concise but comprehensive (aim for 150-300 words)

Always be supportive - these are life-changing decisions and users need clear, accurate guidance.`;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function sanitizeMessages(raw: any): ChatMessage[] {
  const arr = Array.isArray(raw) ? raw : [];
  const out: ChatMessage[] = [];
  for (const m of arr) {
    const role = m?.role === 'assistant' ? 'assistant' : m?.role === 'user' ? 'user' : null;
    const content = typeof m?.content === 'string' ? m.content.trim() : '';
    if (!role || !content) continue;
    out.push({ role, content });
  }
  // keep last N turns
  return out.slice(-clamp(18, 2, 30));
}

async function openaiChat(apiKey: string, messages: Array<{ role: string; content: string }>) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.35,
      messages,
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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const body = (await req.json()) as Body;
    const prior = sanitizeMessages(body?.messages);
    const query = typeof body?.query === 'string' ? body.query.trim() : '';
    const profile = body?.profile ?? {};

    const profileLine = [
      profile?.cityLabel ? `Location now: ${profile.cityLabel}` : null,
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

    const convo = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(profileLine ? [{ role: 'system', content: `User context: ${profileLine}` }] : []),
      ...prior,
      ...(query ? [{ role: 'user', content: query }] : []),
    ];

    const answer = await openaiChat(OPENAI_API_KEY, convo);
    return new Response(JSON.stringify({ answer }), {
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

