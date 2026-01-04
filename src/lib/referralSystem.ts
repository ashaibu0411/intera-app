import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const REFERRAL_CODE_KEY = 'user_referral_code';
const REFERRED_BY_KEY = 'referred_by_code';
const REFERRAL_STATS_KEY = 'referral_stats';
const REFERRAL_HISTORY_KEY = 'referral_history';

export interface ReferralStats {
  totalReferrals: number;
  pendingRewards: number; // In cents
  earnedRewards: number; // In cents
  paidOutRewards: number; // In cents
  transfersFromReferrals: number;
  lastUpdated: string;
}

export interface ReferralHistoryItem {
  id: string;
  type: 'signup' | 'first_transfer' | 'transfer_commission';
  referredUserName?: string;
  amount: number; // In cents
  status: 'pending' | 'confirmed' | 'paid';
  createdAt: string;
  description: string;
}

export interface ReferralRewards {
  // Rewards for referrer
  referrerSignupBonus: number; // When referred user signs up (in cents)
  referrerFirstTransferBonus: number; // When referred user makes first transfer
  referrerTransferCommission: number; // Percentage of AfroConnect's commission per transfer

  // Rewards for new user (referred)
  newUserSignupBonus: number; // When they sign up with referral code
  newUserFirstTransferBonus: number; // Bonus on their first transfer
}

// Default reward structure - can be adjusted
export const REFERRAL_REWARDS: ReferralRewards = {
  // Referrer gets:
  referrerSignupBonus: 100, // $1.00 when friend signs up
  referrerFirstTransferBonus: 500, // $5.00 when friend makes first transfer
  referrerTransferCommission: 10, // 10% of AfroConnect's commission on each transfer

  // New user gets:
  newUserSignupBonus: 200, // $2.00 for using a referral code
  newUserFirstTransferBonus: 300, // $3.00 off their first transfer
};

// Generate a unique referral code for a user
export function generateReferralCode(userId: string, userName?: string): string {
  // Create a code like "AFRO-JOHN-A3X9"
  const namePrefix = userName
    ? userName.split(' ')[0].toUpperCase().slice(0, 4)
    : 'USER';
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AFRO-${namePrefix}-${randomSuffix}`;
}

// Get or create the user's referral code
export async function getUserReferralCode(userId: string, userName?: string): Promise<string> {
  try {
    const stored = await AsyncStorage.getItem(REFERRAL_CODE_KEY);
    if (stored) {
      return stored;
    }

    // Generate new code
    const newCode = generateReferralCode(userId, userName);
    await AsyncStorage.setItem(REFERRAL_CODE_KEY, newCode);
    return newCode;
  } catch (error) {
    console.error('Error getting referral code:', error);
    return generateReferralCode(userId, userName);
  }
}

// Save the code that referred this user
export async function saveReferredByCode(code: string): Promise<void> {
  try {
    // Check if already referred
    const existing = await AsyncStorage.getItem(REFERRED_BY_KEY);
    if (existing) {
      console.log('User already has a referral code applied');
      return;
    }

    await AsyncStorage.setItem(REFERRED_BY_KEY, code.toUpperCase());
  } catch (error) {
    console.error('Error saving referral code:', error);
  }
}

// Get who referred this user
export async function getReferredByCode(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(REFERRED_BY_KEY);
  } catch {
    return null;
  }
}

// Check if user was referred
export async function wasReferred(): Promise<boolean> {
  const code = await getReferredByCode();
  return code !== null;
}

// Get referral stats
export async function getReferralStats(): Promise<ReferralStats> {
  try {
    const stored = await AsyncStorage.getItem(REFERRAL_STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error getting referral stats:', error);
  }

  return {
    totalReferrals: 0,
    pendingRewards: 0,
    earnedRewards: 0,
    paidOutRewards: 0,
    transfersFromReferrals: 0,
    lastUpdated: new Date().toISOString(),
  };
}

// Update referral stats
export async function updateReferralStats(updates: Partial<ReferralStats>): Promise<void> {
  try {
    const current = await getReferralStats();
    const updated: ReferralStats = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    await AsyncStorage.setItem(REFERRAL_STATS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating referral stats:', error);
  }
}

// Get referral history
export async function getReferralHistory(): Promise<ReferralHistoryItem[]> {
  try {
    const stored = await AsyncStorage.getItem(REFERRAL_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error getting referral history:', error);
  }
  return [];
}

// Add referral history item
export async function addReferralHistoryItem(item: Omit<ReferralHistoryItem, 'id' | 'createdAt'>): Promise<void> {
  try {
    const history = await getReferralHistory();
    const newItem: ReferralHistoryItem = {
      ...item,
      id: `ref_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    };
    history.unshift(newItem);
    await AsyncStorage.setItem(REFERRAL_HISTORY_KEY, JSON.stringify(history.slice(0, 100))); // Keep last 100
  } catch (error) {
    console.error('Error adding referral history:', error);
  }
}

// Record a new referral (when someone signs up with your code)
export async function recordNewReferral(referredUserName: string): Promise<void> {
  const stats = await getReferralStats();

  await updateReferralStats({
    totalReferrals: stats.totalReferrals + 1,
    pendingRewards: stats.pendingRewards + REFERRAL_REWARDS.referrerSignupBonus,
  });

  await addReferralHistoryItem({
    type: 'signup',
    referredUserName,
    amount: REFERRAL_REWARDS.referrerSignupBonus,
    status: 'pending',
    description: `${referredUserName} signed up using your code`,
  });
}

// Record first transfer by referred user
export async function recordReferralFirstTransfer(referredUserName: string): Promise<void> {
  const stats = await getReferralStats();

  await updateReferralStats({
    pendingRewards: stats.pendingRewards + REFERRAL_REWARDS.referrerFirstTransferBonus,
    transfersFromReferrals: stats.transfersFromReferrals + 1,
  });

  await addReferralHistoryItem({
    type: 'first_transfer',
    referredUserName,
    amount: REFERRAL_REWARDS.referrerFirstTransferBonus,
    status: 'pending',
    description: `${referredUserName} made their first transfer`,
  });
}

// Record commission from referred user's transfer
export async function recordTransferCommission(
  referredUserName: string,
  afroConnectCommission: number // The commission AfroConnect earned
): Promise<void> {
  const userShare = Math.floor(afroConnectCommission * (REFERRAL_REWARDS.referrerTransferCommission / 100));

  if (userShare > 0) {
    const stats = await getReferralStats();

    await updateReferralStats({
      pendingRewards: stats.pendingRewards + userShare,
      transfersFromReferrals: stats.transfersFromReferrals + 1,
    });

    await addReferralHistoryItem({
      type: 'transfer_commission',
      referredUserName,
      amount: userShare,
      status: 'pending',
      description: `Commission from ${referredUserName}'s transfer`,
    });
  }
}

// Format cents to dollars
export function formatRewardAmount(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// Get shareable referral link
export function getReferralLink(code: string): string {
  // In production, this would be a deep link to the app
  return `https://afroconnect.app/join?ref=${code}`;
}

// Get share message for referrals
export function getReferralShareMessage(code: string, userName?: string): string {
  const name = userName || 'I';
  return `${name === 'I' ? "I'm" : `${name} is`} using AfroConnect to connect with the global expat community and send money home with the best rates!

Join using my code ${code} and get $2 bonus!

Download: ${getReferralLink(code)}`;
}

// Validate referral code format
export function isValidReferralCode(code: string): boolean {
  // Format: AFRO-XXXX-XXXX
  const pattern = /^AFRO-[A-Z0-9]{1,4}-[A-Z0-9]{4}$/;
  return pattern.test(code.toUpperCase());
}

// MOCK: Simulate referral rewards for demo purposes
export async function addMockReferralData(): Promise<void> {
  const mockHistory: ReferralHistoryItem[] = [
    {
      id: 'ref_1',
      type: 'signup',
      referredUserName: 'Amara K.',
      amount: 100,
      status: 'confirmed',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Amara K. signed up using your code',
    },
    {
      id: 'ref_2',
      type: 'first_transfer',
      referredUserName: 'Amara K.',
      amount: 500,
      status: 'confirmed',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Amara K. made their first transfer',
    },
    {
      id: 'ref_3',
      type: 'transfer_commission',
      referredUserName: 'Amara K.',
      amount: 25,
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Commission from Amara K.'s transfer",
    },
    {
      id: 'ref_4',
      type: 'signup',
      referredUserName: 'David O.',
      amount: 100,
      status: 'pending',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'David O. signed up using your code',
    },
  ];

  await AsyncStorage.setItem(REFERRAL_HISTORY_KEY, JSON.stringify(mockHistory));
  await updateReferralStats({
    totalReferrals: 2,
    pendingRewards: 125, // $1.25
    earnedRewards: 600, // $6.00
    paidOutRewards: 0,
    transfersFromReferrals: 2,
  });
}
