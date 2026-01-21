import { SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from '@/lib/supabase';

export type AiAssistantLocation = {
  country?: string | null;
  city?: string | null;
  neighborhood?: string | null;
};

export type AiAssistantProfileContext = {
  cityLabel?: string;
  isNewArrival?: boolean;
  arrivalCity?: string;
  lookingForHelp?: string[];
  newcomerDay?: number;
  newcomerCompletedDays?: number[];
};

export type AiAssistantSource = {
  type: 'post' | 'business' | 'event' | 'provider' | 'listing' | 'housing';
  id: string;
  title: string;
  snippet: string;
  route: string;
};

export async function askAiCommunityAssistant(input: {
  query: string;
  location?: AiAssistantLocation;
  profile?: AiAssistantProfileContext;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}) {
  // Use explicit HTTP call to avoid any client header/transport quirks.
  // This also makes debugging much easier (we can surface status/body).
  // NOTE: Your currently deployed function slug ends with a trailing dash:
  // `ai-community-assistant-` (visible in Supabase dashboard). If you rename the
  // function to `ai-community-assistant`, change this path accordingly.
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/ai-community-assistant-`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (SUPABASE_ANON_KEY) {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
    headers.apikey = SUPABASE_ANON_KEY;
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });

  const text = await resp.text().catch(() => '');
  if (!resp.ok) {
    const err = new Error(`Edge Function HTTP ${resp.status}${text ? `: ${text}` : ''}`);
    (err as any).status = resp.status;
    (err as any).body = text;
    throw err;
  }

  const data = text ? JSON.parse(text) : {};
  return data as { answer: string; sources: AiAssistantSource[] };
}

