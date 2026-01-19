import { supabase, DbUser } from './supabase';

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected';

export interface Connection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface UserWithConnectionStatus extends DbUser {
  connectionStatus: ConnectionStatus;
  connectionId?: string;
  lookingFor?: 'friends' | 'dating' | 'networking' | 'all';
  aboutMe?: string;
  lastActive?: string;
}

// Get all nearby/discoverable users (excluding current user and already connected)
export async function getDiscoverableUsers(
  currentUserId: string,
  limit = 50
): Promise<UserWithConnectionStatus[]> {
  try {
    // Get all profiles except current user
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId)
      .limit(limit);

    if (profilesError) {
      console.error('[connections-api] Error fetching profiles:', profilesError);
      return [];
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Get all connection requests involving the current user
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('*')
      .or(`requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`);

    // Connections table might not exist yet, that's okay
    const connectionMap = new Map<string, { status: ConnectionStatus; id: string }>();

    if (!connectionsError && connections) {
      for (const conn of connections) {
        const otherUserId = conn.requester_id === currentUserId
          ? conn.recipient_id
          : conn.requester_id;

        let status: ConnectionStatus = 'none';
        if (conn.status === 'accepted') {
          status = 'connected';
        } else if (conn.status === 'pending') {
          status = conn.requester_id === currentUserId ? 'pending_sent' : 'pending_received';
        }

        connectionMap.set(otherUserId, { status, id: conn.id });
      }
    }

    // Map profiles with connection status
    return profiles.map((profile) => ({
      ...profile,
      connectionStatus: connectionMap.get(profile.id)?.status || 'none',
      connectionId: connectionMap.get(profile.id)?.id,
      lookingFor: 'all' as const,
      aboutMe: profile.bio || '',
      lastActive: profile.last_seen || profile.created_at,
    }));
  } catch (error) {
    console.error('[connections-api] Error in getDiscoverableUsers:', error);
    return [];
  }
}

// Get users I'm connected with (accepted connections)
export async function getConnectedUsers(currentUserId: string): Promise<DbUser[]> {
  try {
    // Get all accepted connections
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('requester_id, recipient_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`);

    if (connectionsError) {
      console.error('[connections-api] Error fetching connections:', connectionsError);
      return [];
    }

    if (!connections || connections.length === 0) {
      return [];
    }

    // Get the other user IDs
    const otherUserIds = connections.map((conn) =>
      conn.requester_id === currentUserId ? conn.recipient_id : conn.requester_id
    );

    // Fetch those users' profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', otherUserIds);

    if (profilesError) {
      console.error('[connections-api] Error fetching connected profiles:', profilesError);
      return [];
    }

    return profiles || [];
  } catch (error) {
    console.error('[connections-api] Error in getConnectedUsers:', error);
    return [];
  }
}

// Get pending connection requests (received)
export async function getPendingRequests(currentUserId: string): Promise<{ connection: Connection; user: DbUser }[]> {
  try {
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('*')
      .eq('recipient_id', currentUserId)
      .eq('status', 'pending');

    if (connectionsError) {
      console.error('[connections-api] Error fetching pending requests:', connectionsError);
      return [];
    }

    if (!connections || connections.length === 0) {
      return [];
    }

    // Get requester profiles
    const requesterIds = connections.map((c) => c.requester_id);
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', requesterIds);

    if (profilesError) {
      console.error('[connections-api] Error fetching requester profiles:', profilesError);
      return [];
    }

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    return connections
      .map((conn) => ({
        connection: conn,
        user: profileMap.get(conn.requester_id)!,
      }))
      .filter((item) => item.user);
  } catch (error) {
    console.error('[connections-api] Error in getPendingRequests:', error);
    return [];
  }
}

// Send a connection request
export async function sendConnectionRequest(
  requesterId: string,
  recipientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if connection already exists
    const { data: existing } = await supabase
      .from('connections')
      .select('id, status')
      .or(`and(requester_id.eq.${requesterId},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${requesterId})`)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') {
        return { success: false, error: 'Already connected' };
      }
      if (existing.status === 'pending') {
        return { success: false, error: 'Request already pending' };
      }
      // If rejected, allow re-requesting by updating the existing record
      const { error: updateError } = await supabase
        .from('connections')
        .update({
          status: 'pending',
          requester_id: requesterId,
          recipient_id: recipientId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('[connections-api] Error updating connection:', updateError);
        return { success: false, error: 'Failed to send request' };
      }
      return { success: true };
    }

    // Create new connection request
    const { error: insertError } = await supabase
      .from('connections')
      .insert({
        requester_id: requesterId,
        recipient_id: recipientId,
        status: 'pending',
      });

    if (insertError) {
      console.error('[connections-api] Error creating connection:', insertError);
      return { success: false, error: 'Failed to send request' };
    }

    return { success: true };
  } catch (error) {
    console.error('[connections-api] Error in sendConnectionRequest:', error);
    return { success: false, error: 'An error occurred' };
  }
}

// Accept a connection request
export async function acceptConnectionRequest(connectionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('connections')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    if (error) {
      console.error('[connections-api] Error accepting connection:', error);
      return { success: false, error: 'Failed to accept request' };
    }

    return { success: true };
  } catch (error) {
    console.error('[connections-api] Error in acceptConnectionRequest:', error);
    return { success: false, error: 'An error occurred' };
  }
}

// Reject a connection request
export async function rejectConnectionRequest(connectionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('connections')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId);

    if (error) {
      console.error('[connections-api] Error rejecting connection:', error);
      return { success: false, error: 'Failed to reject request' };
    }

    return { success: true };
  } catch (error) {
    console.error('[connections-api] Error in rejectConnectionRequest:', error);
    return { success: false, error: 'An error occurred' };
  }
}

// Remove a connection (unfriend)
export async function removeConnection(
  currentUserId: string,
  otherUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('connections')
      .delete()
      .or(`and(requester_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(requester_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`);

    if (error) {
      console.error('[connections-api] Error removing connection:', error);
      return { success: false, error: 'Failed to remove connection' };
    }

    return { success: true };
  } catch (error) {
    console.error('[connections-api] Error in removeConnection:', error);
    return { success: false, error: 'An error occurred' };
  }
}

// Get connection status between two users
export async function getConnectionStatus(
  userId1: string,
  userId2: string
): Promise<{ status: ConnectionStatus; connectionId?: string }> {
  try {
    const { data, error } = await supabase
      .from('connections')
      .select('id, status, requester_id')
      .or(`and(requester_id.eq.${userId1},recipient_id.eq.${userId2}),and(requester_id.eq.${userId2},recipient_id.eq.${userId1})`)
      .maybeSingle();

    if (error || !data) {
      return { status: 'none' };
    }

    if (data.status === 'accepted') {
      return { status: 'connected', connectionId: data.id };
    }

    if (data.status === 'pending') {
      return {
        status: data.requester_id === userId1 ? 'pending_sent' : 'pending_received',
        connectionId: data.id,
      };
    }

    return { status: 'none' };
  } catch (error) {
    console.error('[connections-api] Error in getConnectionStatus:', error);
    return { status: 'none' };
  }
}

// Search users by name or username
export async function searchUsers(
  currentUserId: string,
  query: string,
  limit = 20
): Promise<UserWithConnectionStatus[]> {
  try {
    if (!query.trim()) return [];

    const searchTerm = `%${query.trim()}%`;

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId)
      .or(`name.ilike.${searchTerm},username.ilike.${searchTerm}`)
      .limit(limit);

    if (error) {
      console.error('[connections-api] Error searching users:', error);
      return [];
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Get connection statuses for found users
    const userIds = profiles.map((p) => p.id);
    const { data: connections } = await supabase
      .from('connections')
      .select('*')
      .or(`requester_id.eq.${currentUserId},recipient_id.eq.${currentUserId}`)
      .or(`requester_id.in.(${userIds.join(',')}),recipient_id.in.(${userIds.join(',')})`);

    const connectionMap = new Map<string, { status: ConnectionStatus; id: string }>();

    if (connections) {
      for (const conn of connections) {
        const otherUserId = conn.requester_id === currentUserId
          ? conn.recipient_id
          : conn.requester_id;

        if (!userIds.includes(otherUserId)) continue;

        let status: ConnectionStatus = 'none';
        if (conn.status === 'accepted') {
          status = 'connected';
        } else if (conn.status === 'pending') {
          status = conn.requester_id === currentUserId ? 'pending_sent' : 'pending_received';
        }

        connectionMap.set(otherUserId, { status, id: conn.id });
      }
    }

    return profiles.map((profile) => ({
      ...profile,
      connectionStatus: connectionMap.get(profile.id)?.status || 'none',
      connectionId: connectionMap.get(profile.id)?.id,
      lookingFor: 'all' as const,
      aboutMe: profile.bio || '',
      lastActive: profile.last_seen || profile.created_at,
    }));
  } catch (error) {
    console.error('[connections-api] Error in searchUsers:', error);
    return [];
  }
}
