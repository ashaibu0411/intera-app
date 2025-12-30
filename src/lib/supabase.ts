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
}

export interface DbPost {
  id: string;
  author_id: string;
  content: string;
  images: string[];
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
