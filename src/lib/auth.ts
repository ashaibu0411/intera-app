import { supabase } from './supabase';
import { useStore } from './store';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;

  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (error) {
    // In development/Expo Go, the check might fail but Apple Sign In
    // will work in production builds. Return true on iOS to show the button.
    console.log('[Apple Auth] Availability check failed, defaulting to true on iOS');
    return true;
  }
}

export async function signInWithApple() {
  console.log('[Apple Auth] Requesting Apple credentials...');

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  console.log('[Apple Auth] Received credential, has identity token:', !!credential.identityToken);

  if (!credential.identityToken) {
    throw new Error('No identity token received from Apple');
  }

  console.log('[Apple Auth] Signing in with Supabase...');

  // Sign in with Supabase using Apple's identity token
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });

  if (error) {
    console.log('[Apple Auth] Supabase error:', error.message);
    throw error;
  }

  console.log('[Apple Auth] Supabase sign in successful');

  // Return both auth data and Apple credential for profile setup
  return {
    ...data,
    appleCredential: credential,
  };
}

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

export async function deleteAccount() {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user logged in');

  // Delete the user's profile first (if exists)
  await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);

  // Sign out and clear local state
  const store = useStore.getState();
  store.logout();

  // Note: Full account deletion requires a Supabase Edge Function or admin API
  // For now, we sign out and delete the profile data
  await supabase.auth.signOut();

  return { success: true };
}
