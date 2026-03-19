import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/lib/store';

function getExpoProjectId(): string | undefined {
  // Expo SDK 50+ best effort projectId resolution
  const anyConst: any = Constants as any;
  return (
    anyConst.easConfig?.projectId ||
    Constants.expoConfig?.extra?.eas?.projectId ||
    (Constants as any).expoConfig?.extra?.eas?.projectId ||
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID
  );
}

export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null; // simulators can't receive remote push

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('alerts', {
        name: 'Neighborhood Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#EF4444',
      });
    }

    const projectId = getExpoProjectId();
    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return tokenResponse.data || null;
  } catch (e) {
    // This is the #1 reason "push doesn't work": token generation throws in prod.
    console.log('[PushTokens] getExpoPushToken failed:', String((e as any)?.message ?? e));
    return null;
  }
}

export async function syncPushToken(params: {
  userId: string;
  enabled: boolean;
  city?: string | null;
  neighborhood?: string | null;
  country?: string | null;
  adminArea?: string | null;
}) {
  const token = await getExpoPushToken();
  if (!token) return;

  const city = params.city != null ? String(params.city).trim() : null;
  const neighborhood = params.neighborhood != null ? String(params.neighborhood).trim() : null;
  const country = params.country != null ? String(params.country).trim() : null;
  const adminArea = params.adminArea != null ? String(params.adminArea).trim() : null;

  const deviceId = `${Device.modelId || 'unknown'}:${Device.osInternalBuildId || Device.osBuildId || '0'}`;
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: params.userId,
        token,
        platform: Platform.OS,
        device_id: deviceId,
        enabled: params.enabled,
        city,
        neighborhood,
        country,
        admin_area: adminArea,
      },
      { onConflict: 'token' }
    );

  if (error) {
    const msg = String(error.message || '');
    // Common reasons this silently breaks in prod:
    // - push_tokens migration not deployed
    // - RLS mismatch / missing authenticated session
    console.log('[PushTokens] Failed to upsert push token:', {
      code: (error as any).code,
      message: msg,
    });
  }
}

/**
 * Call this after login and whenever the user changes location or notification prefs.
 */
export async function syncPushTokenFromStore() {
  const s = useStore.getState();
  let userId = s.currentUser?.id;
  if (!userId) {
    // Fallback: rely on the authenticated Supabase session (more reliable than app-level profile hydration)
    const { data } = await supabase.auth.getUser();
    userId = data?.user?.id ?? undefined;
  }
  if (!userId) return;

  const loc = s.selectedLocation;
  await syncPushToken({
    userId,
    enabled: !!s.notificationsEnabled,
    city: loc?.city ?? null,
    neighborhood: loc?.neighborhood ?? null,
    country: loc?.country ?? null,
    adminArea: loc?.state ?? null,
  });
}

