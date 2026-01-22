import { supabase, SUPABASE_ANON_KEY } from '@/lib/supabase';

export type CommunityDigestResult = {
  digest_text: string;
  period_start: string;
  period_end: string;
};

export async function generateCommunityDigest(input: { userId: string; city: string; neighborhood?: string | null; frequency?: 'daily' | 'weekly' }) {
  const invokeOptions: { body: typeof input; headers?: Record<string, string> } = { body: input };
  if (SUPABASE_ANON_KEY) {
    invokeOptions.headers = {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    };
  }

  const { data, error } = await supabase.functions.invoke('generate-community-digest', invokeOptions);
  if (error) throw error;
  return data as CommunityDigestResult;
}

