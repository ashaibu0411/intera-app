import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Image,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import {
  Trophy,
  Gem,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Zap,
  Target,
  Award,
  Users,
  Flame,
  Activity,
  CircleDot,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useStore } from '@/lib/store';
import { getGemBalance } from '@/lib/giftService';
import {
  getEvents,
  getLiveEvents,
  getUserBets,
  placeBet,
  getBettingStats,
  addMockBettingData,
  SportEvent,
  Bet,
  BettingStats,
  SportType,
} from '@/lib/bettingService';

const SPORT_TABS: { id: SportType | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🏆' },
  { id: 'football', label: 'NFL', icon: '🏈' },
  { id: 'basketball', label: 'NBA', icon: '🏀' },
  { id: 'soccer', label: 'Soccer', icon: '⚽' },
  { id: 'mma', label: 'MMA', icon: '🥊' },
  { id: 'boxing', label: 'Boxing', icon: '🥋' },
];

export default function SportsBettingScreen() {
  const currentUser = useStore(s => s.currentUser);
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [liveEvents, setLiveEvents] = useState<SportEvent[]>([]);
  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<BettingStats | null>(null);
  const [gemBalance, setGemBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'events' | 'mybets' | 'stats'>('events');

  // Bet modal state
  const [selectedEvent, setSelectedEvent] = useState<SportEvent | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<'home' | 'away' | 'draw' | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [betResult, setBetResult] = useState<{ success: boolean; message: string } | null>(null);

  const userId = currentUser?.id || 'user_123';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Add mock data if no bets exist
      const existingBets = await getUserBets(userId);
      if (existingBets.length === 0) {
        await addMockBettingData(userId);
      }

      const [eventsData, liveData, betsData, statsData, balance] = await Promise.all([
        getEvents(selectedSport === 'all' ? undefined : selectedSport),
        getLiveEvents(),
        getUserBets(userId),
        getBettingStats(userId),
        getGemBalance(userId),
      ]);

      setEvents(eventsData);
      setLiveEvents(liveData);
      setUserBets(betsData);
      setStats(statsData);
      setGemBalance(balance);
    } catch (error) {
      console.error('Error loading betting data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, selectedSport]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSelectEvent = (event: SportEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedEvent(event);
    setSelectedPrediction(null);
    setBetAmount('');
    setBetResult(null);
  };

  const handlePlaceBet = async () => {
    if (!selectedEvent || !selectedPrediction || !betAmount) return;

    const amount = parseInt(betAmount, 10);
    if (isNaN(amount) || amount < 10) {
      setBetResult({ success: false, message: 'Minimum bet is 10 gems' });
      return;
    }

    setIsPlacingBet(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const result = await placeBet(userId, selectedEvent.id, selectedPrediction, amount);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setBetResult({ success: true, message: `Bet placed! Potential win: ${result.bet?.potentialWinnings} gems` });
      setGemBalance(result.newBalance || gemBalance);

      // Refresh bets
      const updatedBets = await getUserBets(userId);
      setUserBets(updatedBets);

      // Close modal after delay
      setTimeout(() => {
        setSelectedEvent(null);
        setBetResult(null);
      }, 2000);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setBetResult({ success: false, message: result.error || 'Failed to place bet' });
    }

    setIsPlacingBet(false);
  };

  const getOddsColor = (odds: number) => {
    if (odds < 1.5) return '#EF4444';
    if (odds < 2.0) return '#F59E0B';
    return '#10B981';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHrs < 0) return 'Started';
    if (diffHrs === 0) return `${diffMins}m`;
    if (diffHrs < 24) return `${diffHrs}h ${diffMins}m`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getPotentialWin = () => {
    if (!selectedEvent || !selectedPrediction || !betAmount) return 0;
    const amount = parseInt(betAmount, 10);
    if (isNaN(amount)) return 0;

    let odds: number;
    if (selectedPrediction === 'home') odds = selectedEvent.odds.homeWin;
    else if (selectedPrediction === 'away') odds = selectedEvent.odds.awayWin;
    else odds = selectedEvent.odds.draw || 0;

    return Math.floor(amount * odds);
  };

  return (
    <View className="flex-1 bg-gray-900">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient
        colors={['#1F2937', '#111827']}
        style={{ paddingTop: 60, paddingBottom: 16, paddingHorizontal: 20 }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Text className="text-gray-400 text-base">← Back</Text>
          </Pressable>

          {/* Gem Balance */}
          <Pressable
            onPress={() => router.push('/gem-store')}
            className="flex-row items-center bg-amber-500/20 px-4 py-2 rounded-full"
          >
            <Gem size={18} color="#F59E0B" />
            <Text className="text-amber-400 font-bold ml-2">{gemBalance.toLocaleString()}</Text>
          </Pressable>
        </View>

        <View className="flex-row items-center">
          <Trophy size={28} color="#F59E0B" />
          <View className="ml-3">
            <Text className="text-white text-2xl font-bold">Sports Betting</Text>
            <Text className="text-gray-400 text-sm">Bet gems on your favorite games</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Sport Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-gray-800/50 py-3"
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {SPORT_TABS.map((sport) => (
          <Pressable
            key={sport.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedSport(sport.id);
            }}
            className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${
              selectedSport === sport.id ? 'bg-amber-500' : 'bg-gray-700'
            }`}
          >
            <Text className="mr-1">{sport.icon}</Text>
            <Text
              className={`font-semibold ${
                selectedSport === sport.id ? 'text-gray-900' : 'text-gray-300'
              }`}
            >
              {sport.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Section Tabs */}
      <View className="flex-row bg-gray-800 border-b border-gray-700">
        {(['events', 'mybets', 'stats'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab);
            }}
            className={`flex-1 py-4 ${activeTab === tab ? 'border-b-2 border-amber-500' : ''}`}
          >
            <Text
              className={`text-center font-semibold capitalize ${
                activeTab === tab ? 'text-amber-500' : 'text-gray-500'
              }`}
            >
              {tab === 'mybets' ? 'My Bets' : tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />}
      >
        {activeTab === 'events' && (
          <View className="p-4">
            {/* Live Events */}
            {liveEvents.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400)}>
                <View className="flex-row items-center mb-3">
                  <View className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2" />
                  <Text className="text-red-500 font-bold text-lg">LIVE NOW</Text>
                </View>

                {liveEvents.map((event, index) => (
                  <Animated.View
                    key={event.id}
                    entering={SlideInRight.delay(index * 100)}
                  >
                    <Pressable
                      onPress={() => handleSelectEvent(event)}
                      className="bg-gradient-to-r from-red-900/50 to-gray-800 rounded-2xl p-4 mb-3 border border-red-500/30"
                    >
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                          <Activity size={14} color="#EF4444" />
                          <Text className="text-red-400 text-xs ml-1 font-semibold">LIVE</Text>
                        </View>
                        <Text className="text-gray-400 text-xs">{event.league}</Text>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 items-center">
                          <Text className="text-white font-bold text-center" numberOfLines={1}>
                            {event.homeTeam}
                          </Text>
                          <Text className="text-3xl font-bold text-amber-400 mt-1">
                            {event.homeScore ?? 0}
                          </Text>
                          <View
                            className="px-3 py-1 rounded-full mt-2"
                            style={{ backgroundColor: `${getOddsColor(event.odds.homeWin)}20` }}
                          >
                            <Text style={{ color: getOddsColor(event.odds.homeWin) }} className="font-bold">
                              {event.odds.homeWin.toFixed(2)}
                            </Text>
                          </View>
                        </View>

                        <View className="px-4">
                          <Text className="text-gray-500 text-2xl font-bold">VS</Text>
                        </View>

                        <View className="flex-1 items-center">
                          <Text className="text-white font-bold text-center" numberOfLines={1}>
                            {event.awayTeam}
                          </Text>
                          <Text className="text-3xl font-bold text-amber-400 mt-1">
                            {event.awayScore ?? 0}
                          </Text>
                          <View
                            className="px-3 py-1 rounded-full mt-2"
                            style={{ backgroundColor: `${getOddsColor(event.odds.awayWin)}20` }}
                          >
                            <Text style={{ color: getOddsColor(event.odds.awayWin) }} className="font-bold">
                              {event.odds.awayWin.toFixed(2)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </Animated.View>
            )}

            {/* Upcoming Events */}
            <Text className="text-gray-400 font-bold text-lg mt-4 mb-3">Upcoming</Text>

            {events.filter(e => e.status === 'upcoming').map((event, index) => (
              <Animated.View
                key={event.id}
                entering={FadeInDown.delay(index * 80)}
              >
                <Pressable
                  onPress={() => handleSelectEvent(event)}
                  className="bg-gray-800 rounded-2xl p-4 mb-3 border border-gray-700"
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center">
                      <Clock size={14} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs ml-1">{formatTime(event.startTime)}</Text>
                    </View>
                    <Text className="text-gray-500 text-xs">{event.league}</Text>
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-white font-semibold" numberOfLines={1}>
                        {event.homeTeam}
                      </Text>
                      <View
                        className="px-3 py-1 rounded-full mt-2 self-start"
                        style={{ backgroundColor: `${getOddsColor(event.odds.homeWin)}20` }}
                      >
                        <Text style={{ color: getOddsColor(event.odds.homeWin) }} className="font-bold text-sm">
                          {event.odds.homeWin.toFixed(2)}
                        </Text>
                      </View>
                    </View>

                    {event.odds.draw && (
                      <View className="px-4 items-center">
                        <Text className="text-gray-600 text-xs">Draw</Text>
                        <View
                          className="px-3 py-1 rounded-full mt-1"
                          style={{ backgroundColor: `${getOddsColor(event.odds.draw)}20` }}
                        >
                          <Text style={{ color: getOddsColor(event.odds.draw) }} className="font-bold text-sm">
                            {event.odds.draw.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View className="flex-1 items-end">
                      <Text className="text-white font-semibold text-right" numberOfLines={1}>
                        {event.awayTeam}
                      </Text>
                      <View
                        className="px-3 py-1 rounded-full mt-2"
                        style={{ backgroundColor: `${getOddsColor(event.odds.awayWin)}20` }}
                      >
                        <Text style={{ color: getOddsColor(event.odds.awayWin) }} className="font-bold text-sm">
                          {event.odds.awayWin.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        )}

        {activeTab === 'mybets' && (
          <View className="p-4">
            {userBets.length === 0 ? (
              <View className="items-center py-12">
                <Target size={48} color="#4B5563" />
                <Text className="text-gray-500 text-center mt-4">No bets yet</Text>
                <Text className="text-gray-600 text-center mt-2">
                  Place your first bet on an upcoming game!
                </Text>
              </View>
            ) : (
              userBets.map((bet, index) => (
                <Animated.View
                  key={bet.id}
                  entering={FadeInDown.delay(index * 80)}
                  className={`rounded-2xl p-4 mb-3 border ${
                    bet.status === 'won'
                      ? 'bg-green-900/30 border-green-500/30'
                      : bet.status === 'lost'
                      ? 'bg-red-900/30 border-red-500/30'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-gray-400 text-xs">{bet.event.league}</Text>
                    <View
                      className={`px-2 py-1 rounded-full ${
                        bet.status === 'won'
                          ? 'bg-green-500/20'
                          : bet.status === 'lost'
                          ? 'bg-red-500/20'
                          : 'bg-amber-500/20'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold capitalize ${
                          bet.status === 'won'
                            ? 'text-green-400'
                            : bet.status === 'lost'
                            ? 'text-red-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {bet.status}
                      </Text>
                    </View>
                  </View>

                  <Text className="text-white font-semibold">
                    {bet.event.homeTeam} vs {bet.event.awayTeam}
                  </Text>

                  <View className="flex-row items-center justify-between mt-3">
                    <View>
                      <Text className="text-gray-500 text-xs">Your Pick</Text>
                      <Text className="text-amber-400 font-semibold capitalize">
                        {bet.prediction === 'home' ? bet.event.homeTeam : bet.prediction === 'away' ? bet.event.awayTeam : 'Draw'}
                      </Text>
                    </View>

                    <View className="items-center">
                      <Text className="text-gray-500 text-xs">Odds</Text>
                      <Text className="text-white font-semibold">{bet.odds.toFixed(2)}</Text>
                    </View>

                    <View className="items-end">
                      <Text className="text-gray-500 text-xs">
                        {bet.status === 'won' ? 'Won' : bet.status === 'lost' ? 'Lost' : 'Potential'}
                      </Text>
                      <View className="flex-row items-center">
                        <Gem size={14} color={bet.status === 'won' ? '#10B981' : bet.status === 'lost' ? '#EF4444' : '#F59E0B'} />
                        <Text
                          className={`font-bold ml-1 ${
                            bet.status === 'won'
                              ? 'text-green-400'
                              : bet.status === 'lost'
                              ? 'text-red-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {bet.status === 'won' ? `+${bet.potentialWinnings}` : bet.status === 'lost' ? `-${bet.amount}` : bet.potentialWinnings}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              ))
            )}
          </View>
        )}

        {activeTab === 'stats' && stats && (
          <View className="p-4">
            {/* Stats Overview */}
            <Animated.View entering={FadeInDown.duration(400)} className="bg-gray-800 rounded-2xl p-4 mb-4">
              <Text className="text-gray-400 font-semibold mb-4">Your Betting Stats</Text>

              <View className="flex-row justify-between mb-4">
                <View className="items-center">
                  <Text className="text-3xl font-bold text-white">{stats.totalBets}</Text>
                  <Text className="text-gray-500 text-xs">Total Bets</Text>
                </View>
                <View className="items-center">
                  <Text className="text-3xl font-bold text-green-400">{stats.totalWon}</Text>
                  <Text className="text-gray-500 text-xs">Won</Text>
                </View>
                <View className="items-center">
                  <Text className="text-3xl font-bold text-red-400">{stats.totalLost}</Text>
                  <Text className="text-gray-500 text-xs">Lost</Text>
                </View>
                <View className="items-center">
                  <Text className="text-3xl font-bold text-amber-400">{stats.winRate}%</Text>
                  <Text className="text-gray-500 text-xs">Win Rate</Text>
                </View>
              </View>

              {/* Win Rate Bar */}
              <View className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <View
                  className="h-full bg-gradient-to-r from-green-500 to-amber-500 rounded-full"
                  style={{ width: `${stats.winRate}%` }}
                />
              </View>
            </Animated.View>

            {/* Gem Stats */}
            <Animated.View entering={FadeInDown.delay(100)} className="flex-row mb-4">
              <View className="flex-1 bg-green-900/30 rounded-2xl p-4 mr-2 border border-green-500/30">
                <View className="flex-row items-center mb-2">
                  <TrendingUp size={20} color="#10B981" />
                  <Text className="text-green-400 font-semibold ml-2">Gems Won</Text>
                </View>
                <View className="flex-row items-center">
                  <Gem size={20} color="#10B981" />
                  <Text className="text-2xl font-bold text-green-400 ml-2">
                    {stats.totalGemsWon.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View className="flex-1 bg-red-900/30 rounded-2xl p-4 ml-2 border border-red-500/30">
                <View className="flex-row items-center mb-2">
                  <TrendingDown size={20} color="#EF4444" />
                  <Text className="text-red-400 font-semibold ml-2">Gems Lost</Text>
                </View>
                <View className="flex-row items-center">
                  <Gem size={20} color="#EF4444" />
                  <Text className="text-2xl font-bold text-red-400 ml-2">
                    {stats.totalGemsLost.toLocaleString()}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Streaks */}
            <Animated.View entering={FadeInDown.delay(200)} className="bg-gray-800 rounded-2xl p-4">
              <Text className="text-gray-400 font-semibold mb-4">Streaks</Text>

              <View className="flex-row justify-around">
                <View className="items-center">
                  <View className="w-16 h-16 bg-amber-500/20 rounded-full items-center justify-center mb-2">
                    <Flame size={28} color="#F59E0B" />
                  </View>
                  <Text className="text-2xl font-bold text-white">{stats.currentStreak}</Text>
                  <Text className="text-gray-500 text-xs">Current Streak</Text>
                </View>

                <View className="items-center">
                  <View className="w-16 h-16 bg-purple-500/20 rounded-full items-center justify-center mb-2">
                    <Award size={28} color="#A855F7" />
                  </View>
                  <Text className="text-2xl font-bold text-white">{stats.longestWinStreak}</Text>
                  <Text className="text-gray-500 text-xs">Best Streak</Text>
                </View>

                <View className="items-center">
                  <View className="w-16 h-16 bg-blue-500/20 rounded-full items-center justify-center mb-2">
                    <Gem size={28} color="#3B82F6" />
                  </View>
                  <Text className="text-2xl font-bold text-white">
                    {stats.totalGemsWagered.toLocaleString()}
                  </Text>
                  <Text className="text-gray-500 text-xs">Total Wagered</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Bet Placement Modal */}
      <Modal
        visible={selectedEvent !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-gray-900 rounded-t-3xl">
            {/* Header */}
            <View className="p-4 border-b border-gray-800">
              <View className="flex-row items-center justify-between">
                <Text className="text-white text-lg font-bold">Place Bet</Text>
                <Pressable
                  onPress={() => setSelectedEvent(null)}
                  className="w-8 h-8 bg-gray-800 rounded-full items-center justify-center"
                >
                  <X size={18} color="#9CA3AF" />
                </Pressable>
              </View>
            </View>

            {selectedEvent && (
              <ScrollView className="p-4">
                {/* Event Info */}
                <View className="bg-gray-800 rounded-xl p-4 mb-4">
                  <Text className="text-gray-400 text-xs mb-2">{selectedEvent.league}</Text>
                  <Text className="text-white font-bold text-center text-lg">
                    {selectedEvent.homeTeam} vs {selectedEvent.awayTeam}
                  </Text>
                  <View className="flex-row items-center justify-center mt-2">
                    <Clock size={14} color="#9CA3AF" />
                    <Text className="text-gray-400 text-sm ml-1">
                      {formatTime(selectedEvent.startTime)}
                    </Text>
                  </View>
                </View>

                {/* Prediction Selection */}
                <Text className="text-gray-400 font-semibold mb-3">Select Your Prediction</Text>

                <View className="flex-row mb-4">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPrediction('home');
                    }}
                    className={`flex-1 p-4 rounded-xl mr-2 border ${
                      selectedPrediction === 'home'
                        ? 'bg-amber-500/20 border-amber-500'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        selectedPrediction === 'home' ? 'text-amber-400' : 'text-white'
                      }`}
                      numberOfLines={1}
                    >
                      {selectedEvent.homeTeam}
                    </Text>
                    <Text
                      className={`text-center text-lg font-bold mt-1 ${
                        selectedPrediction === 'home' ? 'text-amber-400' : 'text-gray-400'
                      }`}
                    >
                      {selectedEvent.odds.homeWin.toFixed(2)}
                    </Text>
                  </Pressable>

                  {selectedEvent.odds.draw && (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedPrediction('draw');
                      }}
                      className={`px-4 py-4 rounded-xl mx-1 border ${
                        selectedPrediction === 'draw'
                          ? 'bg-amber-500/20 border-amber-500'
                          : 'bg-gray-800 border-gray-700'
                      }`}
                    >
                      <Text
                        className={`text-center font-semibold ${
                          selectedPrediction === 'draw' ? 'text-amber-400' : 'text-white'
                        }`}
                      >
                        Draw
                      </Text>
                      <Text
                        className={`text-center text-lg font-bold mt-1 ${
                          selectedPrediction === 'draw' ? 'text-amber-400' : 'text-gray-400'
                        }`}
                      >
                        {selectedEvent.odds.draw.toFixed(2)}
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPrediction('away');
                    }}
                    className={`flex-1 p-4 rounded-xl ml-2 border ${
                      selectedPrediction === 'away'
                        ? 'bg-amber-500/20 border-amber-500'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <Text
                      className={`text-center font-semibold ${
                        selectedPrediction === 'away' ? 'text-amber-400' : 'text-white'
                      }`}
                      numberOfLines={1}
                    >
                      {selectedEvent.awayTeam}
                    </Text>
                    <Text
                      className={`text-center text-lg font-bold mt-1 ${
                        selectedPrediction === 'away' ? 'text-amber-400' : 'text-gray-400'
                      }`}
                    >
                      {selectedEvent.odds.awayWin.toFixed(2)}
                    </Text>
                  </Pressable>
                </View>

                {/* Bet Amount */}
                <Text className="text-gray-400 font-semibold mb-3">Bet Amount</Text>

                <View className="bg-gray-800 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center">
                    <Gem size={24} color="#F59E0B" />
                    <TextInput
                      value={betAmount}
                      onChangeText={setBetAmount}
                      placeholder="0"
                      placeholderTextColor="#4B5563"
                      keyboardType="number-pad"
                      className="flex-1 text-white text-2xl font-bold ml-3"
                    />
                  </View>

                  <View className="flex-row justify-between mt-3">
                    {[50, 100, 250, 500].map((amount) => (
                      <Pressable
                        key={amount}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setBetAmount(amount.toString());
                        }}
                        className="bg-gray-700 px-4 py-2 rounded-lg"
                      >
                        <Text className="text-gray-300 font-semibold">{amount}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text className="text-gray-500 text-xs mt-3">
                    Balance: {gemBalance.toLocaleString()} gems
                  </Text>
                </View>

                {/* Potential Win */}
                {selectedPrediction && betAmount && (
                  <Animated.View
                    entering={FadeIn}
                    className="bg-amber-500/20 rounded-xl p-4 mb-4 border border-amber-500/30"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-amber-400 font-semibold">Potential Win</Text>
                      <View className="flex-row items-center">
                        <Gem size={20} color="#F59E0B" />
                        <Text className="text-amber-400 text-xl font-bold ml-2">
                          {getPotentialWin().toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                )}

                {/* Result Message */}
                {betResult && (
                  <Animated.View
                    entering={FadeIn}
                    className={`rounded-xl p-4 mb-4 flex-row items-center ${
                      betResult.success ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}
                  >
                    {betResult.success ? (
                      <Check size={20} color="#10B981" />
                    ) : (
                      <AlertCircle size={20} color="#EF4444" />
                    )}
                    <Text
                      className={`ml-2 font-semibold ${
                        betResult.success ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {betResult.message}
                    </Text>
                  </Animated.View>
                )}

                {/* Place Bet Button */}
                <Pressable
                  onPress={handlePlaceBet}
                  disabled={!selectedPrediction || !betAmount || isPlacingBet || betResult?.success}
                  className={`py-4 rounded-xl mb-8 ${
                    !selectedPrediction || !betAmount || isPlacingBet || betResult?.success
                      ? 'bg-gray-700'
                      : 'bg-amber-500'
                  }`}
                >
                  <Text
                    className={`text-center font-bold text-lg ${
                      !selectedPrediction || !betAmount || isPlacingBet || betResult?.success
                        ? 'text-gray-500'
                        : 'text-gray-900'
                    }`}
                  >
                    {isPlacingBet ? 'Placing Bet...' : betResult?.success ? 'Bet Placed!' : 'Place Bet'}
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
