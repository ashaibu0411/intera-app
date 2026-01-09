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
  try {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking messages as read:', error);
    }
  } catch (err) {
    console.error('Failed to mark messages as read:', err);
  }
}

// Mark all messages as read for a user (all conversations)
export async function markAllMessagesAsRead(userId: string) {
  try {
    console.log('markAllMessagesAsRead called for user:', userId);

    // Get all conversation IDs the user is part of
    const { data: participations, error: partError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (partError) {
      console.log('Error getting participations:', partError);
      return;
    }

    if (!participations || participations.length === 0) {
      console.log('No participations found');
      return;
    }

    const conversationIds = participations.map((p) => p.conversation_id);
    console.log('Found conversation IDs:', conversationIds);

    // Mark all unread messages from others as read
    const { data, error } = await supabase
      .from('messages')
      .update({ read: true })
      .in('conversation_id', conversationIds)
      .neq('sender_id', userId)
      .eq('read', false)
      .select();

    if (error) {
      console.log('Error marking all messages as read:', error);
    } else {
      console.log('Marked messages as read:', data?.length || 0);
    }
  } catch (err) {
    console.error('Failed to mark all messages as read:', err);
  }
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

// Delete a conversation (removes user from conversation, deletes if empty)
export async function deleteConversation(conversationId: string, userId: string) {
  try {
    // Remove the user from conversation participants
    const { error: removeError } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (removeError) {
      console.error('Error removing from conversation:', removeError);
      throw removeError;
    }

    // Check if any participants remain
    const { data: remainingParticipants } = await supabase
      .from('conversation_participants')
      .select('id')
      .eq('conversation_id', conversationId);

    // If no participants remain, delete the conversation and messages
    if (!remainingParticipants || remainingParticipants.length === 0) {
      // Delete all messages in the conversation
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Delete the conversation
      await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);
    }

    return true;
  } catch (err) {
    console.error('Failed to delete conversation:', err);
    throw err;
  }
}
