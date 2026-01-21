import { supabase } from '@/lib/supabase';

export type CommunityAssistantCloudRow = {
  user_id: string;
  messages: any[];
  updated_at: string;
};

export async function loadCommunityAssistantCloud(): Promise<CommunityAssistantCloudRow | null> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return null;

  const userId = userData.user.id;
  const { data, error } = await supabase
    .from('community_assistant_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return (data as any) || null;
}

export async function saveCommunityAssistantCloud(input: { messages: any[]; updated_at?: string }) {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return;

  const userId = userData.user.id;
  const payload = {
    user_id: userId,
    messages: Array.isArray(input.messages) ? input.messages : [],
    updated_at: input.updated_at || new Date().toISOString(),
  };

  const { error } = await supabase
    .from('community_assistant_state')
    .upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function clearCommunityAssistantCloud() {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return;

  const userId = userData.user.id;
  const { error } = await supabase
    .from('community_assistant_state')
    .upsert(
      { user_id: userId, messages: [], updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) throw error;
}

