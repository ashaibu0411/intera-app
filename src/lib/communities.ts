import { supabase, DbCommunity } from './supabase';

// Get or create a community based on location
export async function getOrCreateCommunity(city: string, state: string | null, country: string): Promise<DbCommunity | null> {
  // First try to find existing community
  let query = supabase
    .from('communities')
    .select('*')
    .ilike('city', city)
    .ilike('country', country);

  if (state) {
    query = query.ilike('state', state);
  }

  const { data: existing, error: findError } = await query.maybeSingle();

  if (findError && findError.code !== 'PGRST116') {
    console.error('Error finding community:', findError);
    return null;
  }

  if (existing) {
    // Update member count based on actual community_members
    const updatedCommunity = await updateCommunityMemberCount(existing.id);
    return updatedCommunity || (existing as DbCommunity);
  }

  // Create new community if it doesn't exist
  const communityName = state ? `${city} Africans` : `${city} Africans`;

  const { data: newCommunity, error: createError } = await supabase
    .from('communities')
    .insert({
      name: communityName,
      city,
      state,
      country,
      member_count: 0, // Start at 0, will be updated when users actually join
      image_url: `https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop`, // Default city image
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating community:', createError);
    return null;
  }

  return newCommunity as DbCommunity;
}

// Update community member count based on actual members in community_members table
export async function updateCommunityMemberCount(communityId: string): Promise<DbCommunity | null> {
  // Count actual members
  const { count, error: countError } = await supabase
    .from('community_members')
    .select('*', { count: 'exact', head: true })
    .eq('community_id', communityId);

  if (countError) {
    console.error('Error counting members:', countError);
    return null;
  }

  // Update the community with correct count
  const { data, error: updateError } = await supabase
    .from('communities')
    .update({ member_count: count || 0 })
    .eq('id', communityId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating member count:', updateError);
    return null;
  }

  return data as DbCommunity;
}

// Join a user to a community
export async function joinCommunity(userId: string, communityId: string): Promise<boolean> {
  // Check if already a member
  const { data: existing } = await supabase
    .from('community_members')
    .select('id')
    .eq('user_id', userId)
    .eq('community_id', communityId)
    .maybeSingle();

  if (existing) {
    return true; // Already a member, don't add again
  }

  // Add as member
  const { error: joinError } = await supabase
    .from('community_members')
    .insert({
      user_id: userId,
      community_id: communityId,
    });

  if (joinError) {
    console.error('Error joining community:', joinError);
    return false;
  }

  // Update member count based on actual count
  await updateCommunityMemberCount(communityId);

  return true;
}

// Leave a community
export async function leaveCommunity(userId: string, communityId: string): Promise<boolean> {
  const { error: leaveError } = await supabase
    .from('community_members')
    .delete()
    .eq('user_id', userId)
    .eq('community_id', communityId);

  if (leaveError) {
    console.error('Error leaving community:', leaveError);
    return false;
  }

  // Update member count based on actual count
  await updateCommunityMemberCount(communityId);

  return true;
}

// Get community by ID
export async function getCommunity(communityId: string): Promise<DbCommunity | null> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
    .single();

  if (error) {
    console.error('Error getting community:', error);
    return null;
  }

  return data as DbCommunity;
}

// Get community by location
export async function getCommunityByLocation(city: string, country: string): Promise<DbCommunity | null> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .ilike('city', city)
    .ilike('country', country)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting community:', error);
    return null;
  }

  return data as DbCommunity | null;
}

// Get all communities with real member counts
export async function getAllCommunities(): Promise<DbCommunity[]> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .order('member_count', { ascending: false });

  if (error) {
    console.error('Error getting communities:', error);
    return [];
  }

  return data as DbCommunity[];
}

// Get total member count across all communities (total app users)
export async function getTotalMemberCount(): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error getting total members:', error);
    return 0;
  }

  return count || 0;
}

// Subscribe to community member count changes (real-time)
export function subscribeToCommunityUpdates(
  communityId: string,
  callback: (community: DbCommunity) => void
) {
  const subscription = supabase
    .channel(`community_${communityId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'communities',
        filter: `id=eq.${communityId}`,
      },
      (payload) => {
        callback(payload.new as DbCommunity);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(subscription);
  };
}

// Get member count for a specific community (fresh from DB)
export async function getCommunityMemberCount(communityId: string): Promise<number> {
  const { data, error } = await supabase
    .from('communities')
    .select('member_count')
    .eq('id', communityId)
    .single();

  if (error) {
    console.error('Error getting member count:', error);
    return 0;
  }

  return data?.member_count || 0;
}
