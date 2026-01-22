import { supabase, SUPABASE_ANON_KEY } from '@/lib/supabase';

export type AiBusinessBoosterResult = {
  tagline: string;
  short_bio: string;
  google_description: string;
  flyer: { headline: string; bullets: string[] };
  instagram_captions: string[];
  hashtags: string[];
  offers: string[];
  posting_plan_7d: { day: number; post: string }[];
  safety_note?: string | null;
};

export async function aiBusinessBooster(input: {
  business: {
    name: string;
    description?: string;
    category?: string;
    locationLabel?: string;
    phone?: string;
    website?: string;
    hoursHint?: string;
  };
  goal?: 'more_bookings' | 'more_walkins' | 'more_messages' | 'general';
  voice?: 'friendly' | 'luxury' | 'professional' | 'playful' | 'community';
  audience?: string;
}) {
  const invokeOptions: { body: typeof input; headers?: Record<string, string> } = { body: input };
  if (SUPABASE_ANON_KEY) {
    invokeOptions.headers = {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    };
  }

  const { data, error } = await supabase.functions.invoke('ai-business-booster', invokeOptions);
  if (error) throw error;
  return data as AiBusinessBoosterResult;
}

