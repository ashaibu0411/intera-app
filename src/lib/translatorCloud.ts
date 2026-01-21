import { supabase } from '@/lib/supabase';

export type TranslatorCloudState = {
  user_id: string;
  source_lang_code: string;
  target_lang_code: string;
  use_ai: boolean;
  recents: any[];
  updated_at?: string;
};

export async function loadTranslatorCloudState(): Promise<TranslatorCloudState | null> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return null;

  const userId = userData.user.id;
  const { data, error } = await supabase
    .from('translator_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data as any) || null;
}

export async function saveTranslatorCloudState(input: {
  source_lang_code: string;
  target_lang_code: string;
  use_ai: boolean;
  recents: any[];
}) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return;

  const userId = userData.user.id;
  const payload = {
    user_id: userId,
    source_lang_code: input.source_lang_code,
    target_lang_code: input.target_lang_code,
    use_ai: input.use_ai,
    recents: input.recents,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('translator_state').upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
}

