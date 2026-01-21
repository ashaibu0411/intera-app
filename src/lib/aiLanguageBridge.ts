import { supabase, SUPABASE_ANON_KEY } from '@/lib/supabase';

export type AiLanguageBridgeResult = {
  translation: string;
  alternatives: string[];
  tone_notes: string[];
  cultural_notes: string[];
  romanization?: string | null;
};

export async function aiLanguageBridge(input: {
  text: string;
  sourceLang?: string;
  targetLang: string;
  context?: string;
}) {
  const invokeOptions: { body: typeof input; headers?: Record<string, string> } = { body: input };
  // Always send anon JWT/apikey. This works for guests and avoids Edge Function gateway
  // issues when "Verify JWT with legacy secret" is enabled in the dashboard.
  if (SUPABASE_ANON_KEY) {
    invokeOptions.headers = {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    };
  }

  const { data, error } = await supabase.functions.invoke('ai-language-bridge', invokeOptions);
  if (error) throw error;
  return data as AiLanguageBridgeResult;
}

