import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface DetectedLocation {
  city: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
}

// Request location permissions
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.log('[Location] Error requesting permissions:', error);
    return false;
  }
}

// Check if location permissions are granted
export async function hasLocationPermissions(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.log('[Location] Error checking permissions:', error);
    return false;
  }
}

// Get current location with reverse geocoding
export async function detectCurrentLocation(): Promise<DetectedLocation | null> {
  try {
    // Check permissions first
    const hasPermission = await hasLocationPermissions();
    if (!hasPermission) {
      const granted = await requestLocationPermissions();
      if (!granted) {
        console.log('[Location] Permission not granted');
        return null;
      }
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;

    // Reverse geocode to get city/country
    const [geocode] = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (!geocode) {
      console.log('[Location] Reverse geocoding failed');
      return null;
    }

    console.log('[Location] Geocode result:', geocode);

    // Extract city - try multiple fields
    const city = geocode.city || geocode.subregion || geocode.district || geocode.name || 'Unknown City';
    const state = geocode.region || undefined;
    const country = geocode.country || 'Unknown Country';

    return {
      city,
      state,
      country,
      latitude,
      longitude,
    };
  } catch (error) {
    console.log('[Location] Error detecting location:', error);
    return null;
  }
}

// Check if detected location is different from stored location
export function isLocationDifferent(
  detected: DetectedLocation,
  stored: { city: string; state?: string; country: string } | null
): boolean {
  if (!stored) return true;

  // Normalize strings for comparison
  const normalize = (str: string) => str.toLowerCase().trim();

  const cityDifferent = normalize(detected.city) !== normalize(stored.city);
  const countryDifferent = normalize(detected.country) !== normalize(stored.country);

  // Consider location different if city OR country changed
  return cityDifferent || countryDifferent;
}
