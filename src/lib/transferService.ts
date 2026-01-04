import { Linking, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TransferProvider, TRANSFER_PROVIDERS } from './transferProviders';

const AFFILIATE_CLICKS_KEY = 'affiliate_clicks';

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

// Track affiliate clicks for analytics
export async function trackAffiliateClick(providerId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(AFFILIATE_CLICKS_KEY);
    const clicks = stored ? JSON.parse(stored) : {};
    clicks[providerId] = (clicks[providerId] || 0) + 1;
    clicks.lastClick = {
      providerId,
      timestamp: new Date().toISOString(),
    };
    await AsyncStorage.setItem(AFFILIATE_CLICKS_KEY, JSON.stringify(clicks));
  } catch (error) {
    console.log('Failed to track affiliate click:', error);
  }
}

// Get affiliate stats
export async function getAffiliateStats(): Promise<Record<string, number>> {
  try {
    const stored = await AsyncStorage.getItem(AFFILIATE_CLICKS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Build deep link URL for each provider
function buildProviderUrl(provider: TransferProvider, intent: TransferIntent): string {
  const { amount, recipient } = intent;

  // Each provider has different URL schemes and parameters
  switch (provider.id) {
    case 'wise':
      // Wise supports URL parameters for pre-filling
      const wiseParams = new URLSearchParams({
        source: 'USD',
        target: recipient.currency,
        amount: amount.toString(),
        targetCountry: recipient.country,
      });
      return `${provider.webUrl}?${wiseParams.toString()}`;

    case 'remitly':
      // Remitly URL structure
      const remitlyParams = new URLSearchParams({
        amount: amount.toString(),
        toCountryCode: recipient.country,
      });
      return `${provider.webUrl}/${recipient.country.toLowerCase()}?${remitlyParams.toString()}`;

    case 'worldremit':
      // WorldRemit URL structure
      return `${provider.webUrl}/${recipient.country.toLowerCase()}?amount=${amount}`;

    case 'sendwave':
      // Sendwave - basic web URL (app deep link is more limited)
      return provider.webUrl;

    case 'taptap':
      // Taptap Send - basic web URL
      return provider.webUrl;

    case 'flutterwave':
      // Flutterwave Send
      return `${provider.webUrl}?amount=${amount}&country=${recipient.country}`;

    case 'lemfi':
      // LemFi
      return provider.webUrl;

    case 'chipper':
      // Chipper Cash
      return provider.webUrl;

    case 'westernunion':
      // Western Union
      const wuCountryMap: Record<string, string> = {
        'NG': 'nigeria',
        'GH': 'ghana',
        'KE': 'kenya',
        'IN': 'india',
        'MX': 'mexico',
        'PH': 'philippines',
      };
      const wuCountry = wuCountryMap[recipient.country] || recipient.country.toLowerCase();
      return `${provider.webUrl}/${wuCountry}`;

    case 'moneygram':
      // MoneyGram
      return `${provider.webUrl}/${recipient.country.toLowerCase()}`;

    case 'xoom':
      // Xoom (PayPal)
      return `${provider.webUrl}/${recipient.country.toLowerCase()}`;

    case 'paysend':
      // Paysend
      return `${provider.webUrl}/${recipient.country.toLowerCase()}`;

    default:
      return provider.webUrl;
  }
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
  // These are common patterns - actual schemes may vary
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
export async function openProviderForTransfer(
  provider: TransferProvider,
  intent: TransferIntent,
  preferApp: boolean = true
): Promise<{ opened: boolean; method: 'app' | 'web' | 'store' }> {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  // Track affiliate click
  if (provider.hasAffiliate) {
    await trackAffiliateClick(provider.id);
  }

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
          console.log('Failed to open app, falling back to web:', error);
        }
      }
    }
  }

  // Build and open web URL
  const webUrl = buildProviderUrl(provider, intent);

  try {
    const canOpen = await Linking.canOpenURL(webUrl);
    if (canOpen) {
      await Linking.openURL(webUrl);
      return { opened: true, method: 'web' };
    }
  } catch (error) {
    console.log('Failed to open web URL:', error);
  }

  // Fallback: Open app store
  try {
    const storeUrl = getAppStoreUrl(provider);
    await Linking.openURL(storeUrl);
    return { opened: true, method: 'store' };
  } catch (error) {
    console.log('Failed to open store:', error);
    return { opened: false, method: 'store' };
  }
}

// Get affiliate URL for sharing
export function getAffiliateUrl(provider: TransferProvider, referralCode?: string): string {
  if (!provider.hasAffiliate) {
    return provider.webUrl;
  }

  // If you have a referral code, append it
  if (referralCode) {
    return `${provider.affiliateUrl}${referralCode}`;
  }

  return provider.affiliateUrl;
}

// Store user's referral codes for different providers
const REFERRAL_CODES_KEY = 'user_referral_codes';

export async function saveReferralCode(providerId: string, code: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(REFERRAL_CODES_KEY);
    const codes = stored ? JSON.parse(stored) : {};
    codes[providerId] = code;
    await AsyncStorage.setItem(REFERRAL_CODES_KEY, JSON.stringify(codes));
  } catch (error) {
    console.log('Failed to save referral code:', error);
  }
}

export async function getReferralCodes(): Promise<Record<string, string>> {
  try {
    const stored = await AsyncStorage.getItem(REFERRAL_CODES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
