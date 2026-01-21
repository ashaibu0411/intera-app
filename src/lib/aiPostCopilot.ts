import { supabase, SUPABASE_ANON_KEY } from '@/lib/supabase';

export type AiPostCopilotResult = {
  text: string;
  title_suggestion?: string | null;
  safety_notes?: string[];
};

export async function aiPostCopilot(input: {
  text: string;
  mode?: 'rewrite' | 'shorten' | 'expand' | 'translate';
  targetLang?: string;
  profile?: { cityLabel?: string; isNewArrival?: boolean; arrivalCity?: string };
}) {
  const invokeOptions: { body: typeof input; headers?: Record<string, string> } = { body: input };
  if (SUPABASE_ANON_KEY) {
    invokeOptions.headers = {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    };
  }

  const { data, error } = await supabase.functions.invoke('ai-post-copilot', invokeOptions);
  if (error) throw error;
  return data as AiPostCopilotResult;
}

