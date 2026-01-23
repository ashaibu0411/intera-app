import { supabase } from './supabase';

// ==================== Types ====================

export interface DbUserTrustScore {
  id: string;
  user_id: string;
  overall_score: number;
  verification_level: 'unverified' | 'basic' | 'verified' | 'trusted' | 'community_leader';
  transactions_completed: number;
  events_hosted: number;
  reviews_received: number;
  avg_rating: number;
  community_contributions: number;
  vouches_received: number;
  vouches_given: number;
  reports_filed: number;
  reports_against: number;
  joined_date: string;
  last_active: string;
  created_at: string;
  updated_at: string;
}

export interface DbUserVouch {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string | null;
  relationship: 'friend' | 'family' | 'business' | 'neighbor' | 'colleague';
  created_at: string;
  from_user?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
}

export interface DbUserBadge {
  id: string;
  user_id: string;
  badge_type: string;
  badge_name: string;
  description: string | null;
  earned_at: string;
}

// ==================== Trust Score API ====================

export async function getUserTrustScore(userId: string): Promise<DbUserTrustScore | null> {
  try {
    const { data, error } = await supabase
      .from('user_trust_scores')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Table doesn't exist or no record found - return null silently
      if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.code === '42P01') {
        return null;
      }
      // Only log unexpected errors
      console.error('Error fetching trust score:', error);
      return null;
    }

    return data as DbUserTrustScore;
  } catch {
    // Table doesn't exist - return null silently
    return null;
  }
}

export async function initializeUserTrustScore(userId: string): Promise<DbUserTrustScore | null> {
  try {
    const { data, error } = await supabase
      .from('user_trust_scores')
      .insert({
        user_id: userId,
        overall_score: 20,
        verification_level: 'basic',
      })
      .select()
      .single();

    if (error) {
      // If already exists, fetch existing
      if (error.code === '23505') {
        return getUserTrustScore(userId);
      }
      // Table doesn't exist - return null silently
      if (error.code === 'PGRST205' || error.code === '42P01') {
        return null;
      }
      console.error('Error initializing trust score:', error);
      return null;
    }

    return data as DbUserTrustScore;
  } catch {
    // Table doesn't exist - return null silently
    return null;
  }
}

export async function getOrCreateTrustScore(userId: string): Promise<DbUserTrustScore> {
  const existing = await getUserTrustScore(userId);
  if (existing) return existing;

  const created = await initializeUserTrustScore(userId);
  if (created) return created;

  // Return default if all else fails
  return {
    id: '',
    user_id: userId,
    overall_score: 20,
    verification_level: 'basic',
    transactions_completed: 0,
    events_hosted: 0,
    reviews_received: 0,
    avg_rating: 0,
    community_contributions: 0,
    vouches_received: 0,
    vouches_given: 0,
    reports_filed: 0,
    reports_against: 0,
    joined_date: new Date().toISOString(),
    last_active: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// ==================== Vouches API ====================

export async function getUserVouches(userId: string): Promise<DbUserVouch[]> {
  const { data, error } = await supabase
    .from('user_vouches')
    .select(`
      *,
      from_user:profiles!from_user_id(id, name, avatar_url)
    `)
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vouches:', error);
    return [];
  }

  return (data || []) as DbUserVouch[];
}

export async function getVouchesGivenByUser(userId: string): Promise<DbUserVouch[]> {
  const { data, error } = await supabase
    .from('user_vouches')
    .select(`
      *,
      to_user:profiles!to_user_id(id, name, avatar_url)
    `)
    .eq('from_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vouches given:', error);
    return [];
  }

  return (data || []) as DbUserVouch[];
}

export async function createVouch(
  fromUserId: string,
  toUserId: string,
  relationship: DbUserVouch['relationship'],
  message?: string
): Promise<DbUserVouch | null> {
  if (fromUserId === toUserId) {
    console.error('Cannot vouch for yourself');
    return null;
  }

  const { data, error } = await supabase
    .from('user_vouches')
    .insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      relationship,
      message: message || null,
    })
    .select(`
      *,
      from_user:profiles!from_user_id(id, name, avatar_url)
    `)
    .single();

  if (error) {
    if (error.code === '23505') {
      console.error('Already vouched for this user');
      return null;
    }
    console.error('Error creating vouch:', error);
    return null;
  }

  return data as DbUserVouch;
}

export async function deleteVouch(vouchId: string, fromUserId: string): Promise<boolean> {
  const { error } = await supabase
    .from('user_vouches')
    .delete()
    .eq('id', vouchId)
    .eq('from_user_id', fromUserId);

  if (error) {
    console.error('Error deleting vouch:', error);
    return false;
  }

  return true;
}

export async function hasVouchedFor(fromUserId: string, toUserId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('user_vouches')
    .select('id', { count: 'exact', head: true })
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', toUserId);

  if (error) {
    console.error('Error checking vouch status:', error);
    return false;
  }

  return (count || 0) > 0;
}

// ==================== Badges API ====================

export async function getUserBadges(userId: string): Promise<DbUserBadge[]> {
  const { data, error } = await supabase
    .from('user_trust_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('Error fetching badges:', error);
    return [];
  }

  return (data || []) as DbUserBadge[];
}

export async function awardBadge(
  userId: string,
  badgeType: string,
  badgeName: string,
  description?: string
): Promise<DbUserBadge | null> {
  const { data, error } = await supabase
    .from('user_trust_badges')
    .insert({
      user_id: userId,
      badge_type: badgeType,
      badge_name: badgeName,
      description: description || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // Badge already awarded
      return null;
    }
    console.error('Error awarding badge:', error);
    return null;
  }

  return data as DbUserBadge;
}

// ==================== Review Stats API ====================

export async function getBusinessOwnerReviewStats(userId: string): Promise<{
  totalReviews: number;
  avgRating: number;
  totalConfirmations: number;
}> {
  // Get all businesses owned by this user
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', userId);

  if (!businesses || businesses.length === 0) {
    return { totalReviews: 0, avgRating: 0, totalConfirmations: 0 };
  }

  const businessIds = businesses.map(b => b.id);

  // Get review counts and avg rating
  const { data: reviews } = await supabase
    .from('business_reviews')
    .select('rating')
    .in('business_id', businessIds);

  const totalReviews = reviews?.length || 0;
  const avgRating = totalReviews > 0
    ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  // Get confirmation counts
  const { count: totalConfirmations } = await supabase
    .from('business_confirmations')
    .select('id', { count: 'exact', head: true })
    .in('business_id', businessIds);

  return {
    totalReviews,
    avgRating,
    totalConfirmations: totalConfirmations || 0,
  };
}

export async function getServiceProviderReviewStats(userId: string): Promise<{
  totalReviews: number;
  avgRating: number;
  totalConfirmations: number;
}> {
  // Get provider profile for this user
  const { data: providers } = await supabase
    .from('service_providers')
    .select('id')
    .eq('user_id', userId);

  if (!providers || providers.length === 0) {
    return { totalReviews: 0, avgRating: 0, totalConfirmations: 0 };
  }

  const providerIds = providers.map(p => p.id);

  // Get review counts and avg rating
  const { data: reviews } = await supabase
    .from('service_provider_reviews')
    .select('rating')
    .in('provider_id', providerIds);

  const totalReviews = reviews?.length || 0;
  const avgRating = totalReviews > 0
    ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  // Get confirmation counts
  const { count: totalConfirmations } = await supabase
    .from('service_provider_confirmations')
    .select('id', { count: 'exact', head: true })
    .in('provider_id', providerIds);

  return {
    totalReviews,
    avgRating,
    totalConfirmations: totalConfirmations || 0,
  };
}

export async function getCombinedReviewStats(userId: string): Promise<{
  totalReviews: number;
  avgRating: number;
  totalConfirmations: number;
}> {
  const [businessStats, providerStats] = await Promise.all([
    getBusinessOwnerReviewStats(userId),
    getServiceProviderReviewStats(userId),
  ]);

  const totalReviews = businessStats.totalReviews + providerStats.totalReviews;
  const totalRatingSum = (businessStats.avgRating * businessStats.totalReviews) +
                         (providerStats.avgRating * providerStats.totalReviews);
  const avgRating = totalReviews > 0 ? totalRatingSum / totalReviews : 0;

  return {
    totalReviews,
    avgRating,
    totalConfirmations: businessStats.totalConfirmations + providerStats.totalConfirmations,
  };
}

// ==================== Helper Functions ====================

export function getVerificationLevelLabel(level: DbUserTrustScore['verification_level']): string {
  const labels = {
    unverified: 'Unverified',
    basic: 'Basic Member',
    verified: 'Verified',
    trusted: 'Trusted',
    community_leader: 'Community Leader',
  };
  return labels[level] || 'Unknown';
}

export function getVerificationLevelColor(level: DbUserTrustScore['verification_level']): string {
  const colors = {
    unverified: '#9CA3AF',
    basic: '#6B7280',
    verified: '#3B82F6',
    trusted: '#C9A227',
    community_leader: '#1B4D3E',
  };
  return colors[level] || '#9CA3AF';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return '#1B4D3E';
  if (score >= 60) return '#C9A227';
  if (score >= 40) return '#D4673A';
  return '#DC2626';
}

// ==================== Permanent Review Archive API ====================

export interface ArchivedReview {
  id: string;
  review_type: 'business' | 'service_provider';
  rating: number;
  review_text: string | null;
  reviewer_name: string | null;
  original_created_at: string;
  target_name: string | null;
  target_user_id: string | null;
  archived_at: string;
}

export interface FraudHistory {
  has_flags: boolean;
  flag_count: number;
  total_bad_reviews: number;
  average_rating: number;
  deleted_accounts: number;
}

export interface FraudFlag {
  id: string;
  identity_hash: string;
  flag_type: 'account_deleted_after_bad_review' | 'multiple_accounts' | 'suspicious_pattern' | 'reported_by_community';
  description: string | null;
  evidence: Record<string, unknown> | null;
  flagged_at: string;
}

/**
 * Get permanent archived reviews for a user (cannot be deleted)
 * This fetches all reviews ever left for this person, even from deleted accounts
 */
export async function getPermanentReviewsForUser(userId: string): Promise<ArchivedReview[]> {
  const { data, error } = await supabase
    .from('permanent_review_archive')
    .select('*')
    .eq('target_user_id', userId)
    .order('original_created_at', { ascending: false });

  if (error) {
    console.error('Error fetching permanent reviews:', error);
    return [];
  }

  return (data || []) as ArchivedReview[];
}

/**
 * Get archived reviews by email (for detecting reviews from previous accounts)
 */
export async function getPermanentReviewsByEmail(email: string): Promise<ArchivedReview[]> {
  const { data, error } = await supabase
    .from('permanent_review_archive')
    .select('*')
    .ilike('target_email', email)
    .order('original_created_at', { ascending: false });

  if (error) {
    console.error('Error fetching permanent reviews by email:', error);
    return [];
  }

  return (data || []) as ArchivedReview[];
}

/**
 * Check if a user has fraud flags in their history
 */
export async function checkUserFraudHistory(userId: string): Promise<FraudHistory> {
  const { data, error } = await supabase.rpc('check_user_fraud_history', {
    user_id: userId,
  });

  if (error) {
    console.error('Error checking fraud history:', error);
    return {
      has_flags: false,
      flag_count: 0,
      total_bad_reviews: 0,
      average_rating: 0,
      deleted_accounts: 0,
    };
  }

  // RPC returns array with single row
  const result = Array.isArray(data) ? data[0] : data;
  return result as FraudHistory;
}

/**
 * Get fraud flags for a user
 */
export async function getUserFraudFlags(userId: string): Promise<FraudFlag[]> {
  // First get user's email to find identity hash
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', userId)
    .single();

  if (!profile?.email && !profile?.phone) {
    return [];
  }

  // We need to compute the hash client-side or use a different approach
  // For now, we'll query by evidence containing the user_id
  const { data, error } = await supabase
    .from('review_fraud_flags')
    .select('*')
    .order('flagged_at', { ascending: false });

  if (error) {
    console.error('Error fetching fraud flags:', error);
    return [];
  }

  // Filter flags that relate to this user
  const userFlags = (data || []).filter((flag: FraudFlag) => {
    const evidence = flag.evidence as Record<string, unknown> | null;
    if (!evidence) return false;
    return evidence.deleted_user_id === userId ||
           evidence.email === profile.email;
  });

  return userFlags as FraudFlag[];
}

/**
 * Get all-time review statistics for a user (from permanent archive)
 * This includes reviews from deleted businesses/accounts
 */
export async function getPermanentReviewStats(userId: string): Promise<{
  totalReviews: number;
  avgRating: number;
  positiveReviews: number;
  negativeReviews: number;
  oldestReviewDate: string | null;
}> {
  const reviews = await getPermanentReviewsForUser(userId);

  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      avgRating: 0,
      positiveReviews: 0,
      negativeReviews: 0,
      oldestReviewDate: null,
    };
  }

  const totalReviews = reviews.length;
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;
  const positiveReviews = reviews.filter(r => r.rating >= 4).length;
  const negativeReviews = reviews.filter(r => r.rating <= 2).length;
  const oldestReviewDate = reviews.length > 0
    ? reviews[reviews.length - 1].original_created_at
    : null;

  return {
    totalReviews,
    avgRating,
    positiveReviews,
    negativeReviews,
    oldestReviewDate,
  };
}

/**
 * Check if user appears to be a new account from someone with bad review history
 */
export async function checkForSuspiciousNewAccount(userId: string): Promise<{
  isSuspicious: boolean;
  reason: string | null;
  previousBadReviews: number;
}> {
  const fraudHistory = await checkUserFraudHistory(userId);

  if (fraudHistory.has_flags) {
    return {
      isSuspicious: true,
      reason: `This account may be linked to ${fraudHistory.deleted_accounts} previously deleted account(s) with ${fraudHistory.total_bad_reviews} negative reviews.`,
      previousBadReviews: fraudHistory.total_bad_reviews,
    };
  }

  if (fraudHistory.total_bad_reviews > 0 && fraudHistory.average_rating < 3) {
    return {
      isSuspicious: true,
      reason: `User has a history of ${fraudHistory.total_bad_reviews} negative reviews (avg: ${fraudHistory.average_rating.toFixed(1)}).`,
      previousBadReviews: fraudHistory.total_bad_reviews,
    };
  }

  return {
    isSuspicious: false,
    reason: null,
    previousBadReviews: 0,
  };
}
