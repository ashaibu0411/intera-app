import { supabase, SUPABASE_ANON_KEY } from '@/lib/supabase';

export type AiAssistantLocation = {
  country?: string | null;
  city?: string | null;
  neighborhood?: string | null;
};

export type AiAssistantSource = {
  type: 'post' | 'business' | 'event' | 'provider' | 'listing' | 'housing';
  id: string;
  title: string;
  snippet: string;
  route: string;
};

export async function askAiCommunityAssistant(input: { query: string; location?: AiAssistantLocation }) {
  const invokeOptions: { body: typeof input; headers?: Record<string, string> } = { body: input };

  // Always send anon JWT/apikey. This works for guests and avoids Edge Function gateway
  // issues when "Verify JWT with legacy secret" is enabled in the dashboard.
  if (SUPABASE_ANON_KEY) {
    invokeOptions.headers = {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    };
  }

  const { data, error } = await supabase.functions.invoke('ai-community-assistant', invokeOptions);
  if (error) throw error;
  return data as { answer: string; sources: AiAssistantSource[] };
}

