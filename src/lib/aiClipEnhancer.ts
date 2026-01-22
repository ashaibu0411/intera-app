import { supabase, SUPABASE_ANON_KEY } from '@/lib/supabase';

export type AiClipEnhancerResult = {
  title_ideas: string[];
  description: string;
  hashtags: string[];
  best_lines: string[];
};

export async function aiClipEnhancer(input: {
  transcript: string;
  currentDescription?: string;
  goal?: 'more_views' | 'more_followers' | 'more_comments' | 'general';
  voice?: 'fun' | 'clean' | 'professional' | 'community';
}) {
  const invokeOptions: { body: typeof input; headers?: Record<string, string> } = { body: input };
  if (SUPABASE_ANON_KEY) {
    invokeOptions.headers = {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    };
  }

  const { data, error } = await supabase.functions.invoke('ai-clip-enhancer', invokeOptions);
  if (error) throw error;
  return data as AiClipEnhancerResult;
}

