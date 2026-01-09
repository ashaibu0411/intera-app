import { Linking, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { TransferProvider, TRANSFER_PROVIDERS } from './transferProviders';

export interface RecipientInfo {
  name: string;
  phone?: string;
  email?: string;
  country: string;
  currency: string;
}

export interface TransferIntent {
  amount: number;
  currency: string; // Sending currency (USD)
  recipient: RecipientInfo;
  provider: TransferProvider;
}

// Build app store URL
function getAppStoreUrl(provider: TransferProvider): string {
  if (Platform.OS === 'ios') {
    return `https://apps.apple.com/app/id${provider.iosAppId}`;
  } else {
    return `https://play.google.com/store/apps/details?id=${provider.androidPackage}`;
  }
}

// Build app deep link (for opening directly in app if installed)
function getAppDeepLink(provider: TransferProvider): string | null {
  // App URL schemes vary by provider
  switch (provider.id) {
    case 'wise':
      return Platform.OS === 'ios' ? 'wise://' : 'transferwise://';
    case 'remitly':
      return 'remitly://';
    case 'sendwave':
      return 'sendwave://';
    case 'worldremit':
      return 'worldremit://';
    case 'westernunion':
      return 'westernunion://';
    case 'moneygram':
      return 'moneygram://';
    case 'xoom':
      return 'xoom://';
    case 'chipper':
      return 'chippercash://';
    case 'lemfi':
      return 'lemfi://';
    default:
      return null;
  }
}

// Check if app is installed
async function isAppInstalled(provider: TransferProvider): Promise<boolean> {
  const deepLink = getAppDeepLink(provider);
  if (!deepLink) return false;

  try {
    return await Linking.canOpenURL(deepLink);
  } catch {
    return false;
  }
}

// Main function to open provider for transfer
// Opens the app directly if installed, otherwise opens the app store
export async function openProviderForTransfer(
  provider: TransferProvider,
  intent: TransferIntent,
  preferApp: boolean = true
): Promise<{ opened: boolean; method: 'app' | 'store' }> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  // Try to open the app first if preferred
  if (preferApp) {
    const appInstalled = await isAppInstalled(provider);
    if (appInstalled) {
      const deepLink = getAppDeepLink(provider);
      if (deepLink) {
        try {
          await Linking.openURL(deepLink);
          return { opened: true, method: 'app' };
        } catch (error) {
          console.log('Failed to open app, falling back to store:', error);
        }
      }
    }
  }

  // Fallback: Open app store to download the app
  try {
    const storeUrl = getAppStoreUrl(provider);
    await Linking.openURL(storeUrl);
    return { opened: true, method: 'store' };
  } catch (error) {
    console.log('Failed to open store:', error);
    return { opened: false, method: 'store' };
  }
}
