import { supabase, SUPABASE_ANON_KEY } from '@/lib/supabase';

export type AiReplyCopilotResult = { replies: string[] };

export async function aiReplyCopilot(input: {
  postText: string;
  replyingToText?: string;
  goal?: 'helpful' | 'friendly' | 'short' | 'supportive';
  voice?: 'community' | 'professional' | 'playful';
}) {
  const invokeOptions: { body: typeof input; headers?: Record<string, string> } = { body: input };
  if (SUPABASE_ANON_KEY) {
    invokeOptions.headers = {
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    };
  }

  const { data, error } = await supabase.functions.invoke('ai-reply-copilot', invokeOptions);
  if (error) throw error;
  return data as AiReplyCopilotResult;
}

