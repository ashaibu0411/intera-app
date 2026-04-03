/**
 * Self-attestation gate for the Open to connect **post wall** (not ID verification).
 * Stored locally only — aligns with common “18+” / dating-adjacent UX without collecting DOB in-app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'intera_connect_wall_age_attested_v1';

export async function getConnectWallAgeAttested(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function setConnectWallAgeAttested(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}
