import { supabase, SUPABASE_ANON_KEY } from '@/lib/supabase';

export type AiSmartSearchItem = {
  type: string;
  id: string;
  title: string;
  snippet: string;
  route: string;
};

export type AiSmartSearchResult = {
  query: string;
  results: AiSmartSearchItem[];
  debug?: { terms: string[]; candidateCount: number };
};

export async function aiSmartSearch(input: { query: string; limit?: number }) {
  const invokeOptions: { body: typeof input; headers?: Record<string, string> } = { body: input };
  if (SUPABASE_ANON_KEY) {
    invokeOptions.headers = {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    };
  }

  const { data, error } = await supabase.functions.invoke('ai-smart-search', invokeOptions);
  if (error) throw error;
  return data as AiSmartSearchResult;
}

