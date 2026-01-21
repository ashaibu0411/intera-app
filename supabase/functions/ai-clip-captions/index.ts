// Supabase Edge Function: ai-clip-captions
// Transcribes a clip (mp4/webm/m4a/mp3...) into timed caption segments.
//
// Secrets required:
// - OPENAI_API_KEY

type Segment = { start: number; end: number; text: string };

type Result = {
  language: string | null;
  text: string;
  segments: Segment[];
  translation?: { language: string; text: string } | null;
};

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function safeNum(n: unknown, fallback = 0) {
  const x = typeof n === 'number' ? n : Number(n);
  return Number.isFinite(x) ? x : fallback;
}

async function transcribe(apiKey: string, file: File, hintLang?: string): Promise<{ language: string | null; text: string; segments: Segment[] }> {
  const fd = new FormData();
  fd.append('model', 'whisper-1');
  fd.append('response_format', 'verbose_json');
  // If caller provided language hint, pass it (OpenAI expects ISO-639-1 like "en")
  if (hintLang) fd.append('language', hintLang);
  fd.append('file', file, file.name || 'clip.mp4');

  const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: fd,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`OpenAI transcribe error: HTTP ${resp.status} ${text}`);
  }

  const json = (await resp.json()) as any;
  const language = json?.language ? String(json.language) : null;
  const text = String(json?.text ?? '').trim();
  const segments: Segment[] = Array.isArray(json?.segments)
    ? json.segments
        .map((s: any) => ({
          start: safeNum(s?.start, 0),
          end: safeNum(s?.end, 0),
          text: String(s?.text ?? '').trim(),
        }))
        .filter((s: Segment) => s.text && s.end >= s.start)
    : [];

  return { language, text, segments };
}

async function translate(apiKey: string, text: string, targetLang: string): Promise<string> {
  const system = [
    'You are a translation assistant.',
    'Return ONLY the translated text. No markdown, no quotes.',
    'Keep meaning and tone. Do not add extra info.',
  ].join('\n');

  const user = `Translate into ${targetLang}:\n\n${text}`;

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
    const t = await resp.text().catch(() => '');
    throw new Error(`OpenAI translate error: HTTP ${resp.status} ${t}`);
  }

  const json = (await resp.json()) as any;
  return String(json?.choices?.[0]?.message?.content ?? '').trim();
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

    const form = await req.formData();
    const file = form.get('file');
    const sourceLang = form.get('sourceLang');
    const targetLang = form.get('targetLang');

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'file is required (multipart/form-data)' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    // Basic size cap (best-effort). Whisper generally supports up to ~25MB.
    const maxBytes = 25 * 1024 * 1024;
    if (typeof file.size === 'number' && file.size > maxBytes) {
      return new Response(JSON.stringify({ error: 'File too large', maxBytes }), {
        status: 413,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const transcription = await transcribe(
      OPENAI_API_KEY,
      file,
      typeof sourceLang === 'string' && sourceLang.trim() ? sourceLang.trim() : undefined
    );

    const result: Result = {
      language: transcription.language,
      text: transcription.text,
      segments: transcription.segments,
      translation: null,
    };

    if (typeof targetLang === 'string' && targetLang.trim()) {
      const tl = targetLang.trim();
      const translated = await translate(OPENAI_API_KEY, transcription.text, tl);
      result.translation = { language: tl, text: translated };
    }

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

