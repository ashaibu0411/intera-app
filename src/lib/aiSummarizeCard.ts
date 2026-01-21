import { supabase, SUPABASE_ANON_KEY } from '@/lib/supabase';

export type AiSummaryResult = {
  bullets: string[];
  highlights: string[];
  good_for: string[];
  caution?: string | null;
};

export async function aiSummarizeCard(input: {
  kind: 'event' | 'business' | 'other';
  title: string;
  description?: string;
  locationLabel?: string;
  category?: string;
}) {
  const invokeOptions: { body: typeof input; headers?: Record<string, string> } = { body: input };
  if (SUPABASE_ANON_KEY) {
    invokeOptions.headers = {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    };
  }

  const { data, error } = await supabase.functions.invoke('ai-summarize-card', invokeOptions);
  if (error) throw error;
  return data as AiSummaryResult;
}

