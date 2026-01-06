import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const PARTNER_REFERRAL_STATS_KEY = 'partner_referral_stats';
const PARTNER_REFERRAL_HISTORY_KEY = 'partner_referral_history';

// Partner categories
export type PartnerCategory = 'invest' | 'crypto' | 'banking' | 'cashback';

// Partner information
export interface Partner {
  id: string;
  name: string;
  category: PartnerCategory;
  logo: string;
  description: string;
  signupBonus: string; // e.g., "Free stock worth $5-$200"
  referrerReward: number; // In cents, what you earn
  referreeReward: string; // What your friend gets (display text)
  tier2Percentage: number; // Percentage of tier 1 earnings for tier 2
  color: string;
  gradient: readonly [string, string];
  popular?: boolean;
  requirements?: string;
  link?: string;
}

// Partner referral stats
export interface PartnerReferralStats {
  totalReferrals: number;
  totalEarnings: number; // In cents
  pendingEarnings: number; // In cents
  tier2Earnings: number; // In cents
  byCategory: {
    [key in PartnerCategory]: {
      referrals: number;
      earnings: number;
    };
  };
  lastUpdated: string;
}

// Referral history item
export interface PartnerReferralHistoryItem {
  id: string;
  partnerId: string;
  partnerName: string;
  category: PartnerCategory;
  tier: 1 | 2;
  referredUserName: string;
  amount: number; // In cents
  status: 'pending' | 'confirmed' | 'paid';
  createdAt: string;
  description: string;
}

// All available partners
export const PARTNERS: Partner[] = [
  // INVESTMENT APPS
  {
    id: 'robinhood',
    name: 'Robinhood',
    category: 'invest',
    logo: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop',
    description: 'Commission-free stock trading',
    signupBonus: 'Free stock worth $5-$200',
    referrerReward: 1000, // $10
    referreeReward: 'Free stock worth $5-$200',
    tier2Percentage: 20,
    color: '#00C805',
    gradient: ['#00C805', '#00A804'] as const,
    popular: true,
    requirements: 'Friend must link bank account',
  },
  {
    id: 'webull',
    name: 'Webull',
    category: 'invest',
    logo: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=100&h=100&fit=crop',
    description: 'Advanced trading platform',
    signupBonus: 'Up to 12 free stocks',
    referrerReward: 1200, // $12
    referreeReward: 'Up to 12 free stocks',
    tier2Percentage: 15,
    color: '#FF5722',
    gradient: ['#FF5722', '#E64A19'] as const,
    popular: true,
    requirements: 'Deposit $0.01 or more',
  },
  {
    id: 'public',
    name: 'Public',
    category: 'invest',
    logo: 'https://images.unsplash.com/photo-1565373679580-fc0cb2e0a53e?w=100&h=100&fit=crop',
    description: 'Social investing platform',
    signupBonus: 'Free stock slice',
    referrerReward: 500, // $5
    referreeReward: 'Free stock slice',
    tier2Percentage: 20,
    color: '#7C3AED',
    gradient: ['#7C3AED', '#6D28D9'] as const,
  },
  {
    id: 'acorns',
    name: 'Acorns',
    category: 'invest',
    logo: 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=100&h=100&fit=crop',
    description: 'Round-up investing',
    signupBonus: '$5 bonus',
    referrerReward: 500, // $5
    referreeReward: '$5 signup bonus',
    tier2Percentage: 20,
    color: '#5DBF63',
    gradient: ['#5DBF63', '#4CAF50'] as const,
  },

  // CRYPTO EXCHANGES
  {
    id: 'coinbase',
    name: 'Coinbase',
    category: 'crypto',
    logo: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=100&h=100&fit=crop',
    description: 'Buy, sell & trade crypto',
    signupBonus: '$10 in Bitcoin',
    referrerReward: 1000, // $10
    referreeReward: '$10 in Bitcoin',
    tier2Percentage: 25,
    color: '#0052FF',
    gradient: ['#0052FF', '#0040CC'] as const,
    popular: true,
    requirements: 'Trade $100 or more',
  },
  {
    id: 'crypto_com',
    name: 'Crypto.com',
    category: 'crypto',
    logo: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=100&h=100&fit=crop',
    description: 'Crypto rewards & trading',
    signupBonus: '$25 bonus',
    referrerReward: 2500, // $25
    referreeReward: '$25 in CRO',
    tier2Percentage: 20,
    color: '#103F68',
    gradient: ['#103F68', '#0A2944'] as const,
    popular: true,
    requirements: 'Stake for Metal Visa Card',
  },
  {
    id: 'binance_us',
    name: 'Binance US',
    category: 'crypto',
    logo: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=100&h=100&fit=crop',
    description: 'Trade 100+ cryptos',
    signupBonus: 'Up to $50',
    referrerReward: 1500, // $15
    referreeReward: 'Up to $50 bonus',
    tier2Percentage: 20,
    color: '#F0B90B',
    gradient: ['#F0B90B', '#D4A009'] as const,
  },
  {
    id: 'gemini',
    name: 'Gemini',
    category: 'crypto',
    logo: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&h=100&fit=crop',
    description: 'Secure crypto exchange',
    signupBonus: '$10 in Bitcoin',
    referrerReward: 1000, // $10
    referreeReward: '$10 in Bitcoin',
    tier2Percentage: 15,
    color: '#00DCFA',
    gradient: ['#00DCFA', '#00B4D8'] as const,
  },

  // BANKING / FINTECH
  {
    id: 'chime',
    name: 'Chime',
    category: 'banking',
    logo: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=100&h=100&fit=crop',
    description: 'Fee-free banking',
    signupBonus: '$100 bonus',
    referrerReward: 10000, // $100
    referreeReward: '$100 bonus',
    tier2Percentage: 10,
    color: '#1EC677',
    gradient: ['#1EC677', '#18A35F'] as const,
    popular: true,
    requirements: 'Direct deposit $200+',
  },
  {
    id: 'cashapp',
    name: 'Cash App',
    category: 'banking',
    logo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop',
    description: 'Send & receive money',
    signupBonus: '$5-$15 bonus',
    referrerReward: 1500, // $15
    referreeReward: '$5-$15 bonus',
    tier2Percentage: 20,
    color: '#00D632',
    gradient: ['#00D632', '#00B32A'] as const,
    popular: true,
    requirements: 'Send $5 within 14 days',
  },
  {
    id: 'sofi',
    name: 'SoFi',
    category: 'banking',
    logo: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=100&h=100&fit=crop',
    description: 'Bank, invest & borrow',
    signupBonus: 'Up to $300',
    referrerReward: 5000, // $50
    referreeReward: 'Up to $300 bonus',
    tier2Percentage: 15,
    color: '#BC96FE',
    gradient: ['#BC96FE', '#9B6FEA'] as const,
  },
  {
    id: 'venmo',
    name: 'Venmo',
    category: 'banking',
    logo: 'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?w=100&h=100&fit=crop',
    description: 'Social payments',
    signupBonus: '$10 bonus',
    referrerReward: 1000, // $10
    referreeReward: '$10 when they send $5',
    tier2Percentage: 20,
    color: '#008CFF',
    gradient: ['#008CFF', '#0070CC'] as const,
  },

  // CASHBACK / SHOPPING
  {
    id: 'rakuten',
    name: 'Rakuten',
    category: 'cashback',
    logo: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=100&h=100&fit=crop',
    description: 'Cashback on shopping',
    signupBonus: '$30 bonus',
    referrerReward: 3000, // $30
    referreeReward: '$30 when they spend $30',
    tier2Percentage: 20,
    color: '#BF0000',
    gradient: ['#BF0000', '#990000'] as const,
    popular: true,
    requirements: 'Spend $30 within 90 days',
  },
  {
    id: 'ibotta',
    name: 'Ibotta',
    category: 'cashback',
    logo: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=100&h=100&fit=crop',
    description: 'Grocery cashback',
    signupBonus: '$10 welcome bonus',
    referrerReward: 1000, // $10
    referreeReward: '$10 welcome bonus',
    tier2Percentage: 25,
    color: '#F15A2B',
    gradient: ['#F15A2B', '#D94A1E'] as const,
    popular: true,
    requirements: 'Redeem first offer',
  },
  {
    id: 'honey',
    name: 'Honey',
    category: 'cashback',
    logo: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=100&h=100&fit=crop',
    description: 'Automatic coupons & rewards',
    signupBonus: '500 Gold ($5)',
    referrerReward: 500, // $5
    referreeReward: '500 Gold ($5 value)',
    tier2Percentage: 20,
    color: '#FF8C00',
    gradient: ['#FF8C00', '#E67E00'] as const,
  },
  {
    id: 'fetch',
    name: 'Fetch Rewards',
    category: 'cashback',
    logo: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=100&h=100&fit=crop',
    description: 'Scan receipts for rewards',
    signupBonus: '2,000 points',
    referrerReward: 200, // $2
    referreeReward: '2,000 points ($2)',
    tier2Percentage: 25,
    color: '#FF6B00',
    gradient: ['#FF6B00', '#E65C00'] as const,
  },
];

// Get partners by category
export function getPartnersByCategory(category: PartnerCategory): Partner[] {
  return PARTNERS.filter(p => p.category === category);
}

// Get popular partners
export function getPopularPartners(): Partner[] {
  return PARTNERS.filter(p => p.popular);
}

// Get partner by ID
export function getPartnerById(id: string): Partner | undefined {
  return PARTNERS.find(p => p.id === id);
}

// Category display info
export const CATEGORY_INFO: Record<PartnerCategory, {
  name: string;
  icon: string;
  description: string;
  gradient: readonly [string, string];
}> = {
  invest: {
    name: 'Invest',
    icon: 'trending-up',
    description: 'Stock & investment apps',
    gradient: ['#10B981', '#059669'] as const,
  },
  crypto: {
    name: 'Crypto',
    icon: 'bitcoin',
    description: 'Crypto exchanges',
    gradient: ['#F59E0B', '#D97706'] as const,
  },
  banking: {
    name: 'Banking',
    icon: 'landmark',
    description: 'Bank & fintech apps',
    gradient: ['#3B82F6', '#2563EB'] as const,
  },
  cashback: {
    name: 'Cashback',
    icon: 'percent',
    description: 'Shopping & rewards',
    gradient: ['#EC4899', '#DB2777'] as const,
  },
};

// Get default stats
function getDefaultStats(): PartnerReferralStats {
  return {
    totalReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    tier2Earnings: 0,
    byCategory: {
      invest: { referrals: 0, earnings: 0 },
      crypto: { referrals: 0, earnings: 0 },
      banking: { referrals: 0, earnings: 0 },
      cashback: { referrals: 0, earnings: 0 },
    },
    lastUpdated: new Date().toISOString(),
  };
}

// Get partner referral stats
export async function getPartnerReferralStats(): Promise<PartnerReferralStats> {
  try {
    const stored = await AsyncStorage.getItem(PARTNER_REFERRAL_STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error getting partner referral stats:', error);
  }
  return getDefaultStats();
}

// Update partner referral stats
export async function updatePartnerReferralStats(updates: Partial<PartnerReferralStats>): Promise<void> {
  try {
    const current = await getPartnerReferralStats();
    const updated: PartnerReferralStats = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    await AsyncStorage.setItem(PARTNER_REFERRAL_STATS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating partner referral stats:', error);
  }
}

// Get partner referral history
export async function getPartnerReferralHistory(): Promise<PartnerReferralHistoryItem[]> {
  try {
    const stored = await AsyncStorage.getItem(PARTNER_REFERRAL_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error getting partner referral history:', error);
  }
  return [];
}

// Add partner referral history item
export async function addPartnerReferralHistoryItem(
  item: Omit<PartnerReferralHistoryItem, 'id' | 'createdAt'>
): Promise<void> {
  try {
    const history = await getPartnerReferralHistory();
    const newItem: PartnerReferralHistoryItem = {
      ...item,
      id: `pref_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
    history.unshift(newItem);
    await AsyncStorage.setItem(PARTNER_REFERRAL_HISTORY_KEY, JSON.stringify(history.slice(0, 200)));
  } catch (error) {
    console.error('Error adding partner referral history:', error);
  }
}

// Record a partner referral
export async function recordPartnerReferral(
  partner: Partner,
  referredUserName: string,
  tier: 1 | 2 = 1
): Promise<void> {
  const stats = await getPartnerReferralStats();
  const earnings = tier === 1
    ? partner.referrerReward
    : Math.floor(partner.referrerReward * (partner.tier2Percentage / 100));

  const categoryStats = stats.byCategory[partner.category];

  await updatePartnerReferralStats({
    totalReferrals: stats.totalReferrals + 1,
    pendingEarnings: stats.pendingEarnings + earnings,
    tier2Earnings: tier === 2 ? stats.tier2Earnings + earnings : stats.tier2Earnings,
    byCategory: {
      ...stats.byCategory,
      [partner.category]: {
        referrals: categoryStats.referrals + 1,
        earnings: categoryStats.earnings + earnings,
      },
    },
  });

  await addPartnerReferralHistoryItem({
    partnerId: partner.id,
    partnerName: partner.name,
    category: partner.category,
    tier,
    referredUserName,
    amount: earnings,
    status: 'pending',
    description: tier === 1
      ? `${referredUserName} signed up for ${partner.name}`
      : `Tier 2: ${referredUserName} signed up for ${partner.name}`,
  });
}

// Format cents to dollars
export function formatPartnerReward(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Get share message for a partner
export function getPartnerShareMessage(partner: Partner, referralCode: string): string {
  return `I've been using ${partner.name} and it's great! ${partner.signupBonus}

Sign up with my code: ${referralCode}

${partner.description}`;
}

// Generate a user-specific referral link for a partner
export function getPartnerReferralLink(partnerId: string, userCode: string): string {
  return `https://afroconnect.app/partner/${partnerId}?ref=${userCode}`;
}

// Add mock data for demo
export async function addMockPartnerReferralData(): Promise<void> {
  const mockHistory: PartnerReferralHistoryItem[] = [
    {
      id: 'pref_1',
      partnerId: 'robinhood',
      partnerName: 'Robinhood',
      category: 'invest',
      tier: 1,
      referredUserName: 'Marcus T.',
      amount: 1000,
      status: 'confirmed',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Marcus T. signed up for Robinhood',
    },
    {
      id: 'pref_2',
      partnerId: 'coinbase',
      partnerName: 'Coinbase',
      category: 'crypto',
      tier: 1,
      referredUserName: 'Sarah M.',
      amount: 1000,
      status: 'confirmed',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Sarah M. signed up for Coinbase',
    },
    {
      id: 'pref_3',
      partnerId: 'chime',
      partnerName: 'Chime',
      category: 'banking',
      tier: 1,
      referredUserName: 'David K.',
      amount: 10000,
      status: 'pending',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'David K. signed up for Chime',
    },
    {
      id: 'pref_4',
      partnerId: 'rakuten',
      partnerName: 'Rakuten',
      category: 'cashback',
      tier: 2,
      referredUserName: 'Lisa N.',
      amount: 600,
      status: 'confirmed',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Tier 2: Lisa N. signed up for Rakuten',
    },
  ];

  await AsyncStorage.setItem(PARTNER_REFERRAL_HISTORY_KEY, JSON.stringify(mockHistory));
  await updatePartnerReferralStats({
    totalReferrals: 4,
    totalEarnings: 2000, // $20
    pendingEarnings: 10600, // $106
    tier2Earnings: 600, // $6
    byCategory: {
      invest: { referrals: 1, earnings: 1000 },
      crypto: { referrals: 1, earnings: 1000 },
      banking: { referrals: 1, earnings: 10000 },
      cashback: { referrals: 1, earnings: 600 },
    },
  });
}
