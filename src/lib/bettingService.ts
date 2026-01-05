import AsyncStorage from '@react-native-async-storage/async-storage';
import { addGems, getGemBalance, getOrCreateWallet } from './giftService';
import { supabase } from './supabase';

// Keys for AsyncStorage
const BETS_KEY = 'user_bets';
const BET_HISTORY_KEY = 'bet_history';
const BETTING_STATS_KEY = 'betting_stats';

export type SportType = 'football' | 'basketball' | 'soccer' | 'mma' | 'boxing' | 'other';
export type BetStatus = 'pending' | 'won' | 'lost' | 'cancelled' | 'refunded';

export interface SportEvent {
  id: string;
  sport: SportType;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  startTime: string;
  isLive: boolean;
  homeScore?: number;
  awayScore?: number;
  odds: {
    homeWin: number;
    draw?: number; // Only for soccer
    awayWin: number;
  };
  status: 'upcoming' | 'live' | 'finished' | 'cancelled';
  result?: 'home' | 'away' | 'draw';
}

export interface Bet {
  id: string;
  eventId: string;
  event: SportEvent;
  userId: string;
  prediction: 'home' | 'away' | 'draw';
  amount: number; // In gems
  odds: number;
  potentialWinnings: number;
  status: BetStatus;
  createdAt: string;
  settledAt?: string;
}

export interface BettingStats {
  totalBets: number;
  totalWon: number;
  totalLost: number;
  totalGemsWagered: number;
  totalGemsWon: number;
  totalGemsLost: number;
  winRate: number;
  currentStreak: number;
  longestWinStreak: number;
}

// Referral betting bonus
export const REFERRAL_BETTING_BONUS = {
  newUserBonus: 100, // 100 gems for betting when referred
  referrerBonus: 50, // 50 gems when your referral places first bet
};

// Mock sports events
const MOCK_EVENTS: SportEvent[] = [
  {
    id: 'evt_1',
    sport: 'football',
    league: 'NFL',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Buffalo Bills',
    homeTeamLogo: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=100',
    awayTeamLogo: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=100',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    isLive: false,
    odds: { homeWin: 1.75, awayWin: 2.15 },
    status: 'upcoming',
  },
  {
    id: 'evt_2',
    sport: 'basketball',
    league: 'NBA',
    homeTeam: 'Los Angeles Lakers',
    awayTeam: 'Golden State Warriors',
    homeTeamLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100',
    awayTeamLogo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=100',
    startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    isLive: false,
    odds: { homeWin: 1.90, awayWin: 1.95 },
    status: 'upcoming',
  },
  {
    id: 'evt_3',
    sport: 'soccer',
    league: 'Premier League',
    homeTeam: 'Manchester United',
    awayTeam: 'Liverpool',
    homeTeamLogo: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=100',
    awayTeamLogo: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=100',
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    isLive: false,
    odds: { homeWin: 2.50, draw: 3.20, awayWin: 2.80 },
    status: 'upcoming',
  },
  {
    id: 'evt_4',
    sport: 'soccer',
    league: 'AFCON',
    homeTeam: 'Nigeria',
    awayTeam: 'Ghana',
    homeTeamLogo: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=100',
    awayTeamLogo: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=100',
    startTime: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    isLive: true,
    homeScore: 1,
    awayScore: 0,
    odds: { homeWin: 1.45, draw: 3.80, awayWin: 4.20 },
    status: 'live',
  },
  {
    id: 'evt_5',
    sport: 'mma',
    league: 'UFC',
    homeTeam: 'Israel Adesanya',
    awayTeam: 'Alex Pereira',
    homeTeamLogo: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=100',
    awayTeamLogo: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=100',
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    isLive: false,
    odds: { homeWin: 2.10, awayWin: 1.80 },
    status: 'upcoming',
  },
  {
    id: 'evt_6',
    sport: 'boxing',
    league: 'World Championship',
    homeTeam: 'Anthony Joshua',
    awayTeam: 'Deontay Wilder',
    homeTeamLogo: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=100',
    awayTeamLogo: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=100',
    startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isLive: false,
    odds: { homeWin: 1.65, awayWin: 2.25 },
    status: 'upcoming',
  },
];

// Get all available events
export async function getEvents(sport?: SportType): Promise<SportEvent[]> {
  let events = [...MOCK_EVENTS];

  if (sport && sport !== 'other') {
    events = events.filter(e => e.sport === sport);
  }

  return events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

// Get live events
export async function getLiveEvents(): Promise<SportEvent[]> {
  return MOCK_EVENTS.filter(e => e.status === 'live');
}

// Get user's bets
export async function getUserBets(userId: string): Promise<Bet[]> {
  try {
    const stored = await AsyncStorage.getItem(`${BETS_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error getting user bets:', error);
  }
  return [];
}

// Save user's bets
async function saveUserBets(userId: string, bets: Bet[]): Promise<void> {
  try {
    await AsyncStorage.setItem(`${BETS_KEY}_${userId}`, JSON.stringify(bets));
  } catch (error) {
    console.error('Error saving user bets:', error);
  }
}

// Get betting stats
export async function getBettingStats(userId: string): Promise<BettingStats> {
  try {
    const stored = await AsyncStorage.getItem(`${BETTING_STATS_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error getting betting stats:', error);
  }

  return {
    totalBets: 0,
    totalWon: 0,
    totalLost: 0,
    totalGemsWagered: 0,
    totalGemsWon: 0,
    totalGemsLost: 0,
    winRate: 0,
    currentStreak: 0,
    longestWinStreak: 0,
  };
}

// Update betting stats
async function updateBettingStats(userId: string, updates: Partial<BettingStats>): Promise<void> {
  try {
    const current = await getBettingStats(userId);
    const updated = { ...current, ...updates };

    // Calculate win rate
    if (updated.totalBets > 0) {
      updated.winRate = Math.round((updated.totalWon / updated.totalBets) * 100);
    }

    await AsyncStorage.setItem(`${BETTING_STATS_KEY}_${userId}`, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating betting stats:', error);
  }
}

// Place a bet
export interface PlaceBetResult {
  success: boolean;
  error?: string;
  bet?: Bet;
  newBalance?: number;
}

export async function placeBet(
  userId: string,
  eventId: string,
  prediction: 'home' | 'away' | 'draw',
  amount: number
): Promise<PlaceBetResult> {
  try {
    // Validate amount
    if (amount < 10) {
      return { success: false, error: 'Minimum bet is 10 gems' };
    }

    if (amount > 10000) {
      return { success: false, error: 'Maximum bet is 10,000 gems' };
    }

    // Get event
    const events = await getEvents();
    const event = events.find(e => e.id === eventId);

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    if (event.status === 'finished' || event.status === 'cancelled') {
      return { success: false, error: 'This event is no longer available for betting' };
    }

    // Check user balance
    const balance = await getGemBalance(userId);
    if (balance < amount) {
      return { success: false, error: 'Insufficient gems' };
    }

    // Get odds for prediction
    let odds: number;
    if (prediction === 'home') {
      odds = event.odds.homeWin;
    } else if (prediction === 'away') {
      odds = event.odds.awayWin;
    } else {
      odds = event.odds.draw ?? 0;
      if (odds === 0) {
        return { success: false, error: 'Draw betting not available for this event' };
      }
    }

    // Calculate potential winnings
    const potentialWinnings = Math.floor(amount * odds);

    // Deduct gems from wallet
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) {
      return { success: false, error: 'Could not access wallet' };
    }

    const { error: updateError } = await supabase
      .from('user_wallets')
      .update({
        gem_balance: wallet.gem_balance - amount,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error deducting gems:', updateError);
      return { success: false, error: 'Failed to place bet' };
    }

    // Create bet
    const bet: Bet = {
      id: `bet_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      eventId,
      event,
      userId,
      prediction,
      amount,
      odds,
      potentialWinnings,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Save bet
    const userBets = await getUserBets(userId);
    userBets.unshift(bet);
    await saveUserBets(userId, userBets);

    // Update stats
    const stats = await getBettingStats(userId);
    await updateBettingStats(userId, {
      totalBets: stats.totalBets + 1,
      totalGemsWagered: stats.totalGemsWagered + amount,
    });

    return {
      success: true,
      bet,
      newBalance: wallet.gem_balance - amount,
    };
  } catch (error) {
    console.error('Error placing bet:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Settle a bet (would be called by backend in production)
export async function settleBet(
  userId: string,
  betId: string,
  result: 'won' | 'lost' | 'refunded'
): Promise<{ success: boolean; error?: string }> {
  try {
    const userBets = await getUserBets(userId);
    const betIndex = userBets.findIndex(b => b.id === betId);

    if (betIndex === -1) {
      return { success: false, error: 'Bet not found' };
    }

    const bet = userBets[betIndex];

    if (bet.status !== 'pending') {
      return { success: false, error: 'Bet already settled' };
    }

    // Update bet status
    bet.status = result === 'refunded' ? 'refunded' : result;
    bet.settledAt = new Date().toISOString();

    // Credit winnings if won or refund
    if (result === 'won') {
      await addGems(userId, bet.potentialWinnings);

      const stats = await getBettingStats(userId);
      await updateBettingStats(userId, {
        totalWon: stats.totalWon + 1,
        totalGemsWon: stats.totalGemsWon + bet.potentialWinnings,
        currentStreak: stats.currentStreak + 1,
        longestWinStreak: Math.max(stats.longestWinStreak, stats.currentStreak + 1),
      });
    } else if (result === 'refunded') {
      await addGems(userId, bet.amount);
    } else {
      const stats = await getBettingStats(userId);
      await updateBettingStats(userId, {
        totalLost: stats.totalLost + 1,
        totalGemsLost: stats.totalGemsLost + bet.amount,
        currentStreak: 0,
      });
    }

    userBets[betIndex] = bet;
    await saveUserBets(userId, userBets);

    return { success: true };
  } catch (error) {
    console.error('Error settling bet:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Get bet history with filters
export interface BetHistoryFilter {
  status?: BetStatus;
  sport?: SportType;
  limit?: number;
}

export async function getBetHistory(
  userId: string,
  filter?: BetHistoryFilter
): Promise<Bet[]> {
  let bets = await getUserBets(userId);

  if (filter?.status) {
    bets = bets.filter(b => b.status === filter.status);
  }

  if (filter?.sport) {
    bets = bets.filter(b => b.event.sport === filter.sport);
  }

  if (filter?.limit) {
    bets = bets.slice(0, filter.limit);
  }

  return bets;
}

// Add mock betting data for demo
export async function addMockBettingData(userId: string): Promise<void> {
  const mockBets: Bet[] = [
    {
      id: 'bet_mock_1',
      eventId: 'evt_past_1',
      event: {
        id: 'evt_past_1',
        sport: 'basketball',
        league: 'NBA',
        homeTeam: 'Boston Celtics',
        awayTeam: 'Miami Heat',
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isLive: false,
        homeScore: 112,
        awayScore: 98,
        odds: { homeWin: 1.65, awayWin: 2.25 },
        status: 'finished',
        result: 'home',
      },
      userId,
      prediction: 'home',
      amount: 100,
      odds: 1.65,
      potentialWinnings: 165,
      status: 'won',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      settledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'bet_mock_2',
      eventId: 'evt_past_2',
      event: {
        id: 'evt_past_2',
        sport: 'soccer',
        league: 'La Liga',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        isLive: false,
        homeScore: 2,
        awayScore: 2,
        odds: { homeWin: 2.10, draw: 3.40, awayWin: 3.50 },
        status: 'finished',
        result: 'draw',
      },
      userId,
      prediction: 'home',
      amount: 50,
      odds: 2.10,
      potentialWinnings: 105,
      status: 'lost',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      settledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    },
  ];

  await saveUserBets(userId, mockBets);
  await updateBettingStats(userId, {
    totalBets: 2,
    totalWon: 1,
    totalLost: 1,
    totalGemsWagered: 150,
    totalGemsWon: 165,
    totalGemsLost: 50,
    winRate: 50,
    currentStreak: 0,
    longestWinStreak: 1,
  });
}

// Claim referral betting bonus
export async function claimReferralBettingBonus(
  userId: string,
  isReferrer: boolean
): Promise<{ success: boolean; amount: number }> {
  const amount = isReferrer
    ? REFERRAL_BETTING_BONUS.referrerBonus
    : REFERRAL_BETTING_BONUS.newUserBonus;

  const result = await addGems(userId, amount);

  return {
    success: result.success,
    amount,
  };
}
