import { supabase, SUPABASE_ANON_KEY } from '@/lib/supabase';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function askImmigrationAssistant(input: {
  query: string;
  messages: ChatMessage[];
  profile?: {
    cityLabel?: string;
    isNewArrival?: boolean;
    arrivalCity?: string;
    lookingForHelp?: string[];
    newcomerDay?: number;
    newcomerCompletedDays?: number[];
  };
}) {
  const headers: Record<string, string> = {};
  if (SUPABASE_ANON_KEY) {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
    headers.apikey = SUPABASE_ANON_KEY;
  }

  const { data, error } = await supabase.functions.invoke('immigration-assistant', {
    body: input,
    headers: Object.keys(headers).length ? headers : undefined,
  } as any);

  if (error) throw error;
  return data as { answer: string };
}

