import { supabase, SUPABASE_ANON_KEY } from '@/lib/supabase';

export type AiModerationDecision = {
  action: 'allow' | 'warn' | 'block';
  categories: string[];
  reasons: string[];
  redaction_tips: string[];
};

export async function aiModerateContent(input: { text: string; context?: 'post' | 'comment' | 'dm' | 'profile' | 'clip_caption' | 'other' }) {
  const invokeOptions: { body: typeof input; headers?: Record<string, string> } = { body: input };
  if (SUPABASE_ANON_KEY) {
    invokeOptions.headers = {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    };
  }

  const { data, error } = await supabase.functions.invoke('ai-moderate-content', invokeOptions);
  if (error) throw error;
  return data as AiModerationDecision;
}

