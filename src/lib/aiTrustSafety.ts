import { supabase, SUPABASE_ANON_KEY } from '@/lib/supabase';

export type AiTrustSafetyResult = {
  risk: 'low' | 'medium' | 'high';
  score: number;
  red_flags: string[];
  safe_signals: string[];
  suggested_questions: string[];
  recommendation: string;
};

export async function aiTrustSafety(input: { kind: 'marketplace_listing' | 'dm_message' | 'dm_thread' | 'other'; text: string }) {
  const invokeOptions: { body: typeof input; headers?: Record<string, string> } = { body: input };
  if (SUPABASE_ANON_KEY) {
    invokeOptions.headers = {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    };
  }

  const { data, error } = await supabase.functions.invoke('ai-trust-safety', invokeOptions);
  if (error) throw error;
  return data as AiTrustSafetyResult;
}

