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
  console.log('[Apple Auth] Starting Apple Sign-In...');

  // Check if Apple authentication is available on this device
  let isAvailable = false;
  try {
    isAvailable = await AppleAuthentication.isAvailableAsync();
    console.log('[Apple Auth] isAvailableAsync:', isAvailable);
  } catch (availError) {
    console.log('[Apple Auth] Could not check availability:', availError);
    // On production iOS builds, assume it's available if check fails
    isAvailable = Platform.OS === 'ios';
  }

  if (!isAvailable) {
    throw new Error('Apple Sign-In is not available on this device. Please try another sign-in method.');
  }

  console.log('[Apple Auth] Requesting Apple credentials...');

  let credential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (signInError: unknown) {
    const errorCode = (signInError as { code?: string })?.code;
    const errorMessage = signInError instanceof Error ? signInError.message : 'Unknown error';

    console.log('[Apple Auth] signInAsync error:', errorCode, errorMessage);

    // Handle specific Apple auth errors
    if (errorCode === 'ERR_REQUEST_CANCELED' || errorMessage.includes('canceled') || errorMessage.includes('cancelled') || errorCode === 'ERR_CANCELED') {
      throw new Error('Sign in was cancelled');
    }
    if (errorCode === 'ERR_REQUEST_FAILED') {
      throw new Error('Apple Sign-In failed. Please check your Apple ID settings and try again.');
    }
    if (errorCode === 'ERR_REQUEST_NOT_HANDLED') {
      throw new Error('Apple Sign-In is not configured properly. Please try another sign-in method.');
    }
    if (errorCode === 'ERR_INVALID_RESPONSE') {
      throw new Error('Invalid response from Apple. Please try again.');
    }

    throw new Error(`Apple Sign-In failed: ${errorMessage}`);
  }

  console.log('[Apple Auth] Received credential, has identity token:', !!credential.identityToken);

  if (!credential.identityToken) {
    throw new Error('No identity token received from Apple. Please try again.');
  }

  console.log('[Apple Auth] Signing in with Supabase...');

  // Sign in with Supabase using Apple's identity token
  let data, error;
  try {
    const result = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    data = result.data;
    error = result.error;
  } catch (supabaseError) {
    console.log('[Apple Auth] Supabase network error:', supabaseError);
    throw new Error('Network error while signing in. Please check your connection and try again.');
  }

  if (error) {
    console.log('[Apple Auth] Supabase error:', error.message);

    // Provide clearer error messages for common Supabase errors
    if (error.message.includes('provider is not enabled')) {
      throw new Error('Apple Sign-In is not enabled. Please contact support.');
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    throw new Error(`Sign in failed: ${error.message}`);
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
