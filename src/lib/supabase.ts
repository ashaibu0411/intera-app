import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { useStore } from '@/lib/store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://cvizplvfcdfhjlfryrwu.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2aXpwbHZmY2RmaGpsZnJ5cnd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwODkzMDMsImV4cCI6MjA4MTY2NTMwM30.AEl3xV4Cz_pgmhtlgdcQnjQyyC-vb9b6-1Xjl7IlVMA';

// Exported for Edge Function calls that may need explicit auth headers (guest mode).
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

// Safe storage wrapper that handles blob errors
const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      // Handle blob resolution errors - clear corrupted data
      const errorMsg = String(error);
      if (errorMsg.includes('blob') || errorMsg.includes('Unable to resolve')) {
        console.log('[Supabase] Clearing corrupted storage for key:', key);
        try {
          await AsyncStorage.removeItem(key);
        } catch {
          // Ignore removal errors
        }
      }
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.log('[Supabase] Storage setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.log('[Supabase] Storage removeItem error:', error);
    }
  },
};

let refreshFailureGuard = false;
function getSupabaseProjectRef(url: string): string | null {
  try {
    const host = new URL(url).hostname; // e.g. cvizplvfcdfhjlfryrwu.supabase.co
    const ref = host.split('.')[0];
    return ref || null;
  } catch {
    return null;
  }
}

async function clearSupabaseAuthStorageKeys() {
  const ref = getSupabaseProjectRef(supabaseUrl);
  const keys = [
    // legacy / custom keys used elsewhere in this repo
    'supabase.auth.token',
    // supabase-js v2 default storage key
    ref ? `sb-${ref}-auth-token` : null,
  ].filter(Boolean) as string[];

  for (const k of keys) {
    try {
      await AsyncStorage.removeItem(k);
    } catch {}
  }
}

async function clearAuthLocally(reason: string) {
  if (refreshFailureGuard) return;
  refreshFailureGuard = true;
  try {
    console.log('[Supabase] Clearing auth locally:', reason);
    // Local scope avoids network calls that can loop when refresh token is invalid.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)?.auth?.signOut?.({ scope: 'local' });
  } catch {}
  await clearSupabaseAuthStorageKeys();
  try {
    useStore.getState().logout();
  } catch {}
  refreshFailureGuard = false;
}

async function supabaseFetch(input: RequestInfo | URL, init?: RequestInit) {
  const res = await fetch(input as any, init as any);
  try {
    const url = typeof input === 'string' ? input : (input as any)?.url ? String((input as any).url) : '';
    if (url.includes('/auth/v1/token') && !res.ok) {
      const text = await res.clone().text().catch(() => '');
      if (
        text.includes('Invalid Refresh Token') ||
        text.includes('Refresh Token Not Found') ||
        text.includes('refresh_token_not_found')
      ) {
        await clearAuthLocally('refresh token invalid');
      }
    }
  } catch {}
  return res;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: supabaseFetch as any,
  },
  auth: {
    storage: safeStorage,
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
    await clearSupabaseAuthStorageKeys();
    try {
      useStore.getState().logout();
    } catch {}
  }
});

// Clear invalid session on startup to prevent refresh token errors
export async function clearInvalidSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.log('[Supabase] Session error, clearing invalid session:', error.message);
      // local scope avoids refresh loops
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).auth.signOut({ scope: 'local' });
      await clearSupabaseAuthStorageKeys();
      return null;
    }

    // If we have a session but can't get the user, the session is invalid
    if (session) {
      const { error: userError } = await supabase.auth.getUser();
      if (userError?.message?.includes('Refresh Token') ||
          userError?.message?.includes('Invalid') ||
          userError?.message?.includes('not found')) {
        console.log('[Supabase] Invalid refresh token, signing out');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).auth.signOut({ scope: 'local' });
        await clearSupabaseAuthStorageKeys();
        return null;
      }
    }

    return session;
  } catch (e) {
    console.log('[Supabase] Error checking session:', e);
    // On any error, try to sign out to clear corrupt state
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).auth.signOut({ scope: 'local' });
    } catch {
      // Ignore signout errors
    }
    await clearSupabaseAuthStorageKeys();
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
  /** Joined Open to connect community (lobby + connect wall + connect notifications). */
  open_connect_opt_in?: boolean;
}

export interface DbPost {
  id: string;
  author_id: string;
  content: string;
  images: string[];
  video?: string | null;
  location: string | null;
  community_id: string | null;
  connect_post?: boolean;
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

export interface DbNotification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
  actor?: DbUser | null;
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

export interface DbBusinessInventoryUpdate {
  id: string;
  business_id: string;
  item_id: string | null;
  kind: string;
  title: string;
  message: string;
  scope: 'neighborhood' | 'city';
  city: string;
  neighborhood: string | null;
  created_at: string;
  business?: any;
  item?: any;
}

export interface DbBusinessOrder {
  id: string;
  business_id: string;
  customer_id: string;
  status: 'pending' | 'accepted' | 'ready' | 'picked_up' | 'cancelled';
  pickup_time: string | null;
  notes: string | null;
  currency: string;
  subtotal: number;
  created_at: string;
  updated_at: string;
  business?: any;
  customer?: DbUser;
  items?: DbBusinessOrderItem[];
}

export interface DbBusinessOrderItem {
  id: string;
  order_id: string;
  inventory_item_id: string;
  name_snapshot: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  created_at: string;
  inventory_item?: any;
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
  pinned_title?: string | null;
  pinned_route?: string | null;
  rules?: string | null;
  resources?: string[]; // text[]
  require_speaker_approval?: boolean;
  record_highlights?: boolean;
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
  intent?: 'question' | 'insight' | 'announcement' | 'testimony' | null;
  created_at: string;
}

export interface DbVoiceRoomReaction {
  id: string;
  room_id: string;
  user_id: string;
  kind: 'agree' | 'heart' | 'clap' | 'fire';
  created_at: string;
}

export interface DbVoiceRoomNote {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface DbVoiceRoomRecap {
  id: string;
  room_id: string;
  created_by: string;
  summary: string;
  highlights: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
}

// Community Groups (Churches, Associations, etc.)
export interface DbGroup {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  cover_url: string | null;
  category: 'church' | 'mosque' | 'temple' | 'synagogue' | 'community' | 'association' | 'other';
  faith_type: string | null;
  visibility: 'public' | 'private';
  country: string;
  admin_area: string | null;
  city: string;
  neighborhood: string | null;
  location_label: string;
  contact_phone: string | null;
  contact_email: string | null;
  website: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
  creator?: DbUser;
}

export interface DbGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  user?: DbUser;
}

export interface DbGroupPost {
  id: string;
  group_id: string;
  author_id: string;
  content: string;
  images: string[];
  is_notice: boolean;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author?: DbUser;
}

export interface DbGroupPostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: DbUser;
}

export interface DbGroupPostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface DbGroupEvent {
  id: string;
  group_id: string;
  creator_id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  end_time: string | null;
  location: string | null;
  address: string | null;
  image: string | null;
  attendees_count: number;
  created_at: string;
  creator?: DbUser;
}

export interface DbGroupEventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: 'interested' | 'going';
  created_at: string;
}

export interface DbGroupAlbum {
  id: string;
  group_id: string;
  creator_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  photo_count: number;
  created_at: string;
  updated_at: string;
  creator?: DbUser;
}

export interface DbGroupPhoto {
  id: string;
  album_id: string;
  uploader_id: string;
  url: string;
  caption: string | null;
  created_at: string;
  uploader?: DbUser;
}

export interface DbGroupFile {
  id: string;
  group_id: string;
  uploader_id: string;
  name: string;
  url: string;
  file_type: string;
  size_bytes: number;
  created_at: string;
  uploader?: DbUser;
}

export interface DbGroupInvite {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_id: string | null;
  invite_code: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  expires_at: string;
}
