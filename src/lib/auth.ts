import { supabase } from './supabase';
import { useStore } from './store';

export async function signUpWithEmail(email: string, password: string, name: string) {
  const username = 'user_' + Math.random().toString(36).substring(2, 10);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        username,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signUpWithPhone(phone: string, name: string) {
  const username = 'user_' + Math.random().toString(36).substring(2, 10);

  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      data: {
        name,
        username,
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function verifyOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;

  const store = useStore.getState();
  store.logout();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  // If no profile exists yet (can happen with phone auth), return null
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getOrCreateProfile(userId: string, userData: {
  name?: string;
  phone?: string;
  email?: string;
}) {
  // First try to get existing profile
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (existing) return existing;

  // Create new profile if it doesn't exist
  const username = 'user_' + Math.random().toString(36).substring(2, 10);

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      name: userData.name || 'User',
      username: username,
      phone: userData.phone,
      email: userData.email,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: {
  name?: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  interests?: string[];
}) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}
