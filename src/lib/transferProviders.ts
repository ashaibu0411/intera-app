// Money Transfer Provider Configuration
// Information only - no affiliate links per App Store guidelines

export interface TransferProvider {
  id: string;
  name: string;
  color: string;
  rating: number;
  reviews: string;
  speed: string;
  speedRank: number;
  // Deep linking to open the app
  iosAppId: string;
  androidPackage: string;
  // Supported corridors (sending country -> receiving countries)
  supportedCountries: string[];
  // Fee structure (approximate)
  baseFeePercent: number;
  minFee: number;
}

// Provider configurations - informational only
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
    iosAppId: '907913757',
    androidPackage: 'com.sendwave.android',
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
    iosAppId: '391351595',
    androidPackage: 'com.worldremit.android',
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
    iosAppId: '1540012348',
    androidPackage: 'com.flutterwave.send',
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
    iosAppId: '469309498',
    androidPackage: 'com.moneygram.mgo',
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
    iosAppId: '1445016791',
    androidPackage: 'com.paysend.app',
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
