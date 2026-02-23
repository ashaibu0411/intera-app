import { supabase, type DbPost } from './supabase';

export function subscribeToPostInserts(options: {
  communityId?: string | null;
  onInsert: (post: DbPost) => void;
}) {
  const { communityId, onInsert } = options;

  const channel = supabase
    .channel(`posts_${communityId || 'all'}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        ...(communityId ? { filter: `community_id=eq.${communityId}` } : {}),
      },
      (payload) => {
        onInsert(payload.new as DbPost);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

