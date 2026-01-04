// Money Transfer Provider Configuration
// Includes deep links, affiliate links, and app store URLs

export interface TransferProvider {
  id: string;
  name: string;
  color: string;
  rating: number;
  reviews: string;
  speed: string;
  speedRank: number;
  // Deep linking
  iosAppId: string;
  androidPackage: string;
  webUrl: string;
  // Affiliate/Referral - Replace with your actual affiliate IDs
  affiliateUrl: string;
  hasAffiliate: boolean;
  // Supported corridors (sending country -> receiving countries)
  supportedCountries: string[];
  // Fee structure
  baseFeePercent: number;
  minFee: number;
}

// Provider configurations with real app IDs and affiliate links
// NOTE: Replace affiliate URLs with your actual referral links after signing up
export const TRANSFER_PROVIDERS: TransferProvider[] = [
  {
    id: 'wise',
    name: 'Wise',
    color: '#00B9A8',
    rating: 4.8,
    reviews: '125K',
    speed: '1-2 hours',
    speedRank: 1,
    iosAppId: '612261027',
    androidPackage: 'com.transferwise.android',
    webUrl: 'https://wise.com/send',
    // Sign up at: https://wise.com/invite - get your referral link
    affiliateUrl: 'https://wise.com/invite/',
    hasAffiliate: true,
    supportedCountries: ['NG', 'GH', 'KE', 'ZA', 'IN', 'PK', 'BD', 'PH', 'MX', 'CO', 'BR', 'GB', 'DE', 'FR', 'PL', 'UA'],
    baseFeePercent: 0.005,
    minFee: 0.99,
  },
  {
    id: 'remitly',
    name: 'Remitly',
    color: '#1D3557',
    rating: 4.7,
    reviews: '98K',
    speed: '1-3 hours',
    speedRank: 2,
    iosAppId: '585115587',
    androidPackage: 'com.remitly.androidapp',
    webUrl: 'https://www.remitly.com/us/en/send-money',
    // Sign up at: https://www.remitly.com/us/en/refer-a-friend
    affiliateUrl: 'https://remit.ly/',
    hasAffiliate: true,
    supportedCountries: ['NG', 'GH', 'KE', 'ET', 'UG', 'IN', 'PK', 'BD', 'PH', 'MX', 'CO', 'DO', 'HT', 'JM', 'GT'],
    baseFeePercent: 0.01,
    minFee: 1.99,
  },
  {
    id: 'sendwave',
    name: 'Sendwave',
    color: '#2563EB',
    rating: 4.6,
    reviews: '45K',
    speed: 'Instant',
    speedRank: 0,
    iosAppId: '907aborede913757',
    androidPackage: 'com.sendwave.android',
    webUrl: 'https://www.sendwave.com',
    // Sendwave referral: In-app only, users share their code
    affiliateUrl: 'https://www.sendwave.com',
    hasAffiliate: true,
    supportedCountries: ['NG', 'GH', 'KE', 'UG', 'TZ', 'SN', 'CM', 'ET', 'LR', 'ZM', 'ZW', 'BD'],
    baseFeePercent: 0.008,
    minFee: 0,
  },
  {
    id: 'worldremit',
    name: 'WorldRemit',
    color: '#6B46C1',
    rating: 4.5,
    reviews: '67K',
    speed: '1-4 hours',
    speedRank: 3,
    iosAppId: '391aboredo351595',
    androidPackage: 'com.worldremit.android',
    webUrl: 'https://www.worldremit.com/en/send-money',
    // Sign up at: https://www.worldremit.com/en/refer-a-friend
    affiliateUrl: 'https://www.worldremit.com/en/r/',
    hasAffiliate: true,
    supportedCountries: ['NG', 'GH', 'KE', 'ZA', 'UG', 'TZ', 'ZM', 'RW', 'CM', 'SN', 'IN', 'PK', 'BD', 'PH', 'JM', 'TT', 'HT'],
    baseFeePercent: 0.015,
    minFee: 2.99,
  },
  {
    id: 'taptap',
    name: 'Taptap Send',
    color: '#FF6B35',
    rating: 4.7,
    reviews: '52K',
    speed: 'Instant',
    speedRank: 0,
    iosAppId: '1458584018',
    androidPackage: 'com.taptapsend.app',
    webUrl: 'https://www.taptapsend.com',
    affiliateUrl: 'https://www.taptapsend.com',
    hasAffiliate: false,
    supportedCountries: ['NG', 'GH', 'KE', 'UG', 'ZM', 'ZW', 'ET', 'SN', 'CM', 'MX', 'CO', 'DO', 'GT', 'BD', 'NP', 'PK'],
    baseFeePercent: 0.003,
    minFee: 0,
  },
  {
    id: 'flutterwave',
    name: 'Flutterwave',
    color: '#F5A623',
    rating: 4.6,
    reviews: '78K',
    speed: '1-2 hours',
    speedRank: 1,
    iosAppId: '1540aboredg012348',
    androidPackage: 'com.flutterwave.send',
    webUrl: 'https://send.flutterwave.com',
    affiliateUrl: 'https://send.flutterwave.com',
    hasAffiliate: false,
    supportedCountries: ['NG', 'GH', 'KE', 'ZA', 'UG', 'TZ', 'RW', 'CM'],
    baseFeePercent: 0.012,
    minFee: 1.50,
  },
  {
    id: 'lemfi',
    name: 'LemFi',
    color: '#0066FF',
    rating: 4.8,
    reviews: '35K',
    speed: 'Instant',
    speedRank: 0,
    iosAppId: '1535851770',
    androidPackage: 'com.lemonade.finance',
    webUrl: 'https://www.lemfi.com',
    // LemFi referral available in-app
    affiliateUrl: 'https://www.lemfi.com',
    hasAffiliate: true,
    supportedCountries: ['NG', 'GH', 'KE', 'GB', 'CA'],
    baseFeePercent: 0.004,
    minFee: 0,
  },
  {
    id: 'chipper',
    name: 'Chipper Cash',
    color: '#6C5CE7',
    rating: 4.5,
    reviews: '42K',
    speed: 'Instant',
    speedRank: 0,
    iosAppId: '1440033897',
    androidPackage: 'com.chippercash.app',
    webUrl: 'https://chippercash.com',
    affiliateUrl: 'https://chippercash.com',
    hasAffiliate: true,
    supportedCountries: ['NG', 'GH', 'KE', 'UG', 'TZ', 'RW', 'ZA', 'GB', 'US'],
    baseFeePercent: 0.006,
    minFee: 0,
  },
  {
    id: 'westernunion',
    name: 'Western Union',
    color: '#FFCC00',
    rating: 4.2,
    reviews: '200K',
    speed: 'Minutes - 1 day',
    speedRank: 4,
    iosAppId: '351412882',
    androidPackage: 'com.westernunion.moneytransferr3app.es',
    webUrl: 'https://www.westernunion.com/send-money',
    affiliateUrl: 'https://www.westernunion.com',
    hasAffiliate: false,
    supportedCountries: ['NG', 'GH', 'KE', 'ZA', 'ET', 'TZ', 'UG', 'CM', 'SN', 'RW', 'ZM', 'ZW', 'JM', 'TT', 'BB', 'HT', 'DO', 'GY', 'GB', 'DE', 'FR', 'PL', 'UA', 'RO', 'IN', 'PK', 'BD', 'PH', 'VN', 'NP', 'MX', 'CO', 'BR', 'PE'],
    baseFeePercent: 0.02,
    minFee: 4.99,
  },
  {
    id: 'moneygram',
    name: 'MoneyGram',
    color: '#E31837',
    rating: 4.3,
    reviews: '150K',
    speed: 'Minutes - 1 day',
    speedRank: 4,
    iosAppId: '469aboredg309498',
    androidPackage: 'com.moneygram.mgo',
    webUrl: 'https://www.moneygram.com/mgo/us/en/send',
    affiliateUrl: 'https://www.moneygram.com',
    hasAffiliate: false,
    supportedCountries: ['NG', 'GH', 'KE', 'ZA', 'ET', 'TZ', 'UG', 'CM', 'SN', 'RW', 'ZM', 'ZW', 'JM', 'TT', 'BB', 'HT', 'DO', 'GY', 'GB', 'DE', 'FR', 'PL', 'UA', 'RO', 'IN', 'PK', 'BD', 'PH', 'VN', 'NP', 'MX', 'CO', 'BR', 'PE'],
    baseFeePercent: 0.018,
    minFee: 4.99,
  },
  {
    id: 'xoom',
    name: 'Xoom (PayPal)',
    color: '#003087',
    rating: 4.4,
    reviews: '95K',
    speed: '1-3 hours',
    speedRank: 2,
    iosAppId: '377890498',
    androidPackage: 'com.xoom.android.app',
    webUrl: 'https://www.xoom.com/send-money',
    affiliateUrl: 'https://www.xoom.com',
    hasAffiliate: false,
    supportedCountries: ['NG', 'GH', 'KE', 'ET', 'IN', 'PK', 'BD', 'PH', 'MX', 'CO', 'BR', 'PE', 'DO', 'JM', 'HT', 'GT'],
    baseFeePercent: 0.011,
    minFee: 2.99,
  },
  {
    id: 'paysend',
    name: 'Paysend',
    color: '#00D4AA',
    rating: 4.4,
    reviews: '89K',
    speed: '1-2 hours',
    speedRank: 1,
    iosAppId: '1445aboredo016791',
    androidPackage: 'com.paysend.app',
    webUrl: 'https://paysend.com/send-money',
    // Sign up at: https://paysend.com/en-gb/refer
    affiliateUrl: 'https://paysend.com/invite/',
    hasAffiliate: true,
    supportedCountries: ['NG', 'GH', 'KE', 'ZA', 'IN', 'PK', 'BD', 'PH', 'UA', 'PL', 'RO', 'MX', 'CO', 'BR'],
    baseFeePercent: 0.009,
    minFee: 2,
  },
];

// Get providers that support a specific country
export function getProvidersForCountry(countryCode: string): TransferProvider[] {
  return TRANSFER_PROVIDERS.filter(p => p.supportedCountries.includes(countryCode));
}

// Calculate provider quote
export function calculateQuote(
  provider: TransferProvider,
  amount: number,
  exchangeRate: number
): {
  fee: number;
  receiveAmount: number;
  rate: number;
} {
  const fee = Math.max(amount * provider.baseFeePercent, provider.minFee);
  const amountAfterFee = amount - fee;
  const receiveAmount = amountAfterFee * exchangeRate;

  return {
    fee,
    receiveAmount,
    rate: exchangeRate,
  };
}
