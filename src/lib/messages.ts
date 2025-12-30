import { supabase, DbMessage, DbConversation } from './supabase';

// Get or create a conversation between two users
export async function getOrCreateConversation(userId1: string, userId2: string) {
  // First, try to find an existing conversation
  const { data: existingConversations } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId1);

  if (existingConversations && existingConversations.length > 0) {
    const conversationIds = existingConversations.map(c => c.conversation_id);

    const { data: matchingConversation } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId2)
      .in('conversation_id', conversationIds)
      .single();

    if (matchingConversation) {
      return matchingConversation.conversation_id;
    }
  }

  // Create a new conversation
  const { data: newConversation, error: convError } = await supabase
    .from('conversations')
    .insert({})
    .select()
    .single();

  if (convError) throw convError;

  // Add both participants
  const { error: partError } = await supabase
    .from('conversation_participants')
    .insert([
      { conversation_id: newConversation.id, user_id: userId1 },
      { conversation_id: newConversation.id, user_id: userId2 },
    ]);

  if (partError) throw partError;

  return newConversation.id;
}

// Get all conversations for a user
export async function getConversations(userId: string) {
  // Get conversation IDs the user is part of
  const { data: participations, error: partError } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (partError) throw partError;
  if (!participations || participations.length === 0) return [];

  const conversationIds = participations.map(p => p.conversation_id);

  // Get conversations with last message and other participant
  const conversations = await Promise.all(
    conversationIds.map(async (convId) => {
      // Get the other participant
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          user:profiles(*)
        `)
        .eq('conversation_id', convId)
        .neq('user_id', userId)
        .single();

      // Get the last message
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Count unread messages
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', convId)
        .eq('read', false)
        .neq('sender_id', userId);

      return {
        id: convId,
        otherUser: participants?.user,
        lastMessage,
        unreadCount: unreadCount || 0,
      };
    })
  );

  // Sort by last message date
  return conversations
    .filter(c => c.lastMessage)
    .sort((a, b) =>
      new Date(b.lastMessage?.created_at || 0).getTime() -
      new Date(a.lastMessage?.created_at || 0).getTime()
    );
}

// Get messages in a conversation
export async function getMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles(*)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Send a message
export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    })
    .select(`
      *,
      sender:profiles(*)
    `)
    .single();

  if (error) throw error;

  // Update conversation timestamp
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return data;
}

// Mark messages as read
export async function markMessagesAsRead(conversationId: string, userId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId);

  if (error) throw error;
}

// Subscribe to new messages in a conversation
export function subscribeToMessages(
  conversationId: string,
  callback: (message: any) => void
) {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
}

// Unsubscribe from messages
export function unsubscribeFromMessages(conversationId: string) {
  supabase.channel(`messages:${conversationId}`).unsubscribe();
}
