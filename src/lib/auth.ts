import { supabase } from './supabase';
import { useStore } from './store';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

function normalizePhoneE164(input: string): string {
  const raw = (input || '').trim();
  if (!raw) return '';

  // Convert common international prefix "00" → "+"
  const withPlus = raw.startsWith('00') ? `+${raw.slice(2)}` : raw;

  // Keep leading + if present, strip all other non-digits
  const normalized =
    (withPlus.startsWith('+') ? '+' : '') +
    withPlus.replace(/^\+/, '').replace(/[^\d]/g, '');

  // Basic E.164 sanity checks: + then 8-15 digits (E.164 max is 15)
  if (!normalized.startsWith('+')) {
    throw new Error('Please enter a valid phone number with country code (e.g., +14155552671).');
  }
  const digits = normalized.slice(1);
  if (digits.length < 8 || digits.length > 15) {
    throw new Error('Please enter a valid phone number with country code (e.g., +14155552671).');
  }

  return normalized;
}

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

  // On iOS, we skip the availability check and try to sign in directly
  // The isAvailableAsync() can return false incorrectly on some iPad configurations
  // If Apple Sign-In is truly unavailable, the signInAsync will throw an appropriate error
  if (Platform.OS !== 'ios') {
    throw new Error('Apple Sign-In is only available on iOS devices.');
  }

  console.log('[Apple Auth] Requesting Apple credentials...');

  // First, verify Apple Sign-In is available
  try {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      console.log('[Apple Auth] Apple Sign-In is not available on this device');
      throw new Error('Apple Sign-In is not available on this device. This may be a configuration issue.');
    }
  } catch (availabilityError) {
    console.log('[Apple Auth] Availability check failed:', availabilityError);
    // Continue anyway - the check might fail but sign-in could still work
  }

  let credential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (signInError: unknown) {
    // Log the full error object for debugging
    console.log('[Apple Auth] signInAsync error (full):', JSON.stringify(signInError, null, 2));
    
    const errorCode = (signInError as { code?: string })?.code;
    const errorMessage = signInError instanceof Error ? signInError.message : 'Unknown error';
    const errorUserInfo = (signInError as { userInfo?: any })?.userInfo;
    const nativeError = (signInError as { nativeError?: any })?.nativeError;

    console.log('[Apple Auth] signInAsync error details:', {
      errorCode,
      errorMessage,
      errorUserInfo,
      nativeError,
    });

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
    if (errorCode === 'ERR_NOT_AVAILABLE') {
      throw new Error('Apple Sign-In is not available. Please ensure the capability is enabled in your Apple Developer account.');
    }

    // Handle "unknown reason" errors - typically a configuration issue
    if (errorMessage.includes('unknown reason') || errorMessage.includes('authorization attempt failed')) {
      throw new Error('Apple Sign-In configuration error. Please ensure "Sign in with Apple" is enabled in your Apple Developer account for this app\'s bundle ID, and that a new build has been created after enabling it.');
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
  const normalizedPhone = normalizePhoneE164(phone);

  const { data, error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
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
  const normalizedPhone = normalizePhoneE164(phone);
  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizedPhone,
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
