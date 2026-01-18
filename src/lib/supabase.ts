import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://cvizplvfcdfhjlfryrwu.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2aXpwbHZmY2RmaGpsZnJ5cnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODkzMDMsImV4cCI6MjA4MTY2NTMwM30.AEl3xV4Cz_pgmhtlgdcQnjQyyC-vb9b6-1Xjl7IlVMA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Handle auth errors globally - clear invalid sessions
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('[Supabase] Token refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    console.log('[Supabase] User signed out');
    // Clear any stale auth data from storage
    try {
      await AsyncStorage.removeItem('supabase.auth.token');
    } catch (e) {
      // Ignore storage errors
    }
  }
});

// Clear invalid session on startup to prevent refresh token errors
export async function clearInvalidSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.log('[Supabase] Session error, clearing invalid session:', error.message);
      await supabase.auth.signOut();
      return null;
    }

    // If we have a session but can't get the user, the session is invalid
    if (session) {
      const { error: userError } = await supabase.auth.getUser();
      if (userError?.message?.includes('Refresh Token') ||
          userError?.message?.includes('Invalid') ||
          userError?.message?.includes('not found')) {
        console.log('[Supabase] Invalid refresh token, signing out');
        await supabase.auth.signOut();
        return null;
      }
    }

    return session;
  } catch (e) {
    console.log('[Supabase] Error checking session:', e);
    // On any error, try to sign out to clear corrupt state
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore signout errors
    }
    return null;
  }
}

// Database types
export interface DbUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  interests: string[];
  created_at: string;
  is_online?: boolean;
  last_seen?: string;
  show_online_status?: boolean;
}

export interface DbPost {
  id: string;
  author_id: string;
  content: string;
  images: string[];
  video?: string | null;
  location: string | null;
  community_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: DbUser;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

export interface DbComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  // Joined data
  author?: DbUser;
  likes_count?: number;
}

export interface DbLike {
  id: string;
  user_id: string;
  post_id: string | null;
  comment_id: string | null;
  created_at: string;
}

export interface DbCommunity {
  id: string;
  name: string;
  city: string;
  state: string | null;
  country: string;
  image_url: string | null;
  member_count: number;
  created_at: string;
}

export interface DbConversation {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface DbConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  created_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
  // Joined data
  sender?: DbUser;
}

export interface DbMarketplaceListing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  condition: 'new' | 'used' | 'refurbished';
  location: string | null;
  is_store_based: boolean;
  store_name: string | null;
  views: number;
  created_at: string;
  // Joined data
  seller?: DbUser;
}

export interface DbFaithEvent {
  id: string;
  organizer_id: string;
  organization_name: string;
  organization_logo: string | null;
  faith_type: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  address: string;
  is_recurring: boolean;
  recurring_schedule: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  attendees_count: number;
  created_at: string;
}

export interface DbEvent {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  end_time: string | null;
  location: string;
  address: string;
  image: string | null;
  category: string;
  is_public: boolean;
  scope: 'city' | 'nearby' | 'global';
  created_at: string;
  // Joined data
  creator?: DbUser;
}

export interface DbEventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: 'interested' | 'going';
  created_at: string;
}

export interface DbIncident {
  id: string;
  creator_id: string;
  type: string;
  title: string;
  description: string;
  image: string | null;
  country: string;
  admin_area: string | null;
  city: string;
  neighborhood: string | null;
  location_label: string;
  lat: number | null;
  lng: number | null;
  scope: 'neighborhood' | 'city' | 'global';
  status: 'active' | 'resolved';
  created_at: string;
  creator?: DbUser;
}

export interface DbIncidentSignal {
  id: string;
  incident_id: string;
  user_id: string;
  kind: 'me_too' | 'helping' | 'resolved';
  created_at: string;
}

export interface DbUtilityReport {
  id: string;
  creator_id: string;
  utility: 'power' | 'water' | 'internet' | 'road';
  state: 'outage' | 'restored' | 'degraded';
  note: string | null;
  country: string;
  admin_area: string | null;
  city: string;
  neighborhood: string | null;
  location_label: string;
  lat: number | null;
  lng: number | null;
  scope: 'neighborhood' | 'city' | 'global';
  created_at: string;
  creator?: DbUser;
}

export interface DbHousingListing {
  id: string;
  creator_id: string;
  type: 'room' | 'apartment' | 'house' | 'sublet';
  title: string;
  description: string;
  price: number;
  currency: string;
  price_type: 'month' | 'week' | 'day';
  bedrooms: number;
  bathrooms: number;
  is_furnished: boolean;
  utilities_included: boolean;
  pet_friendly: boolean;
  images: string[];
  country: string;
  admin_area: string | null;
  city: string;
  neighborhood: string | null;
  location_label: string;
  address: string | null;
  scope: 'neighborhood' | 'city' | 'global';
  created_at: string;
  creator?: DbUser;
}

export interface DbHousingListingConfirmation {
  id: string;
  listing_id: string;
  user_id: string;
  created_at: string;
}

export interface DbHousingListingFlag {
  id: string;
  listing_id: string;
  user_id: string;
  reason: string;
  note: string | null;
  created_at: string;
}

export interface DbBusinessReview {
  id: string;
  business_id: string;
  reviewer_id: string;
  rating: number;
  review: string | null;
  created_at: string;
  updated_at: string;
  reviewer?: DbUser;
}

export interface DbBusinessConfirmation {
  id: string;
  business_id: string;
  user_id: string;
  created_at: string;
}

export interface DbServiceProvider {
  id: string;
  user_id: string;
  category: string;
  title: string;
  bio: string;
  skills: string[];
  is_available: boolean;
  availability_note: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  country: string;
  admin_area: string | null;
  city: string;
  neighborhood: string | null;
  location_label: string;
  scope: 'neighborhood' | 'city' | 'global';
  created_at: string;
  updated_at: string;
  user?: DbUser;
}

export interface DbServiceProviderReview {
  id: string;
  provider_id: string;
  reviewer_id: string;
  rating: number;
  review: string | null;
  created_at: string;
  updated_at: string;
  reviewer?: DbUser;
}

export interface DbServiceProviderConfirmation {
  id: string;
  provider_id: string;
  user_id: string;
  created_at: string;
}

export interface DbServeTalent {
  id: string;
  user_id: string;
  category: string;
  skills: string[];
  experience: string;
  bio: string;
  is_available: boolean;
  availability_note: string | null;
  willing_to_travel: boolean;
  travel_radius: string | null;
  faith_background: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  portfolio_images: string[];
  video_link: string | null;
  country: string;
  admin_area: string | null;
  city: string;
  neighborhood: string | null;
  location_label: string;
  scope: 'neighborhood' | 'city' | 'global';
  created_at: string;
  updated_at: string;
  last_active: string;
  user?: DbUser;
}

export interface DbUserWallet {
  id: string;
  user_id: string;
  gem_balance: number;
  total_earned: number;
  total_sent: number;
  created_at: string;
  updated_at: string;
}

export interface DbGiftTransaction {
  id: string;
  sender_id: string;
  sender_name: string | null;
  recipient_id: string;
  recipient_name: string | null;
  gift_id: string;
  gift_name: string;
  gift_value: number;
  room_id: string | null;
  room_title: string | null;
  created_at: string;
}

export interface DbVoiceRoom {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  topic: string | null;
  country: string;
  admin_area: string | null;
  city: string;
  neighborhood: string | null;
  scope: 'neighborhood' | 'city' | 'global';
  status: 'scheduled' | 'live' | 'ended';
  starts_at: string | null;
  ended_at: string | null;
  expires_at?: string | null;
  provider: string;
  provider_room_name: string;
  created_at: string;
  updated_at: string;
}

export interface DbVoiceRoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: 'host' | 'moderator' | 'speaker' | 'listener';
  is_muted: boolean;
  hand_raised: boolean;
  joined_at: string;
  last_seen: string;
}

export interface DbVoiceRoomHandRaise {
  id: string;
  room_id: string;
  user_id: string;
  created_at: string;
}
