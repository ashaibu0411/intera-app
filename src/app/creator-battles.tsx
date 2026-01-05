import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Image, Modal, Dimensions } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Swords,
  Users,
  Trophy,
  Flame,
  Crown,
  Gem,
  Heart,
  Star,
  Sparkles,
  X,
  Play,
  Clock,
  ChevronRight,
  Zap,
  Timer,
  Gift
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  runOnJS,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useStore } from '@/lib/store';
import { useAdvancedFeatures, type CreatorBattle, type BattleCreator, type BattleGift } from '@/lib/advancedFeatures';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Gift types with values
const GIFTS = [
  { id: 'heart', icon: Heart, name: 'Heart', value: 1, color: '#EF4444' },
  { id: 'star', icon: Star, name: 'Star', value: 5, color: '#F59E0B' },
  { id: 'flame', icon: Flame, name: 'Fire', value: 10, color: '#F97316' },
  { id: 'gem', icon: Gem, name: 'Diamond', value: 50, color: '#8B5CF6' },
  { id: 'crown', icon: Crown, name: 'Crown', value: 100, color: '#EAB308' },
  { id: 'sparkle', icon: Sparkles, name: 'Sparkle', value: 500, color: '#EC4899' },
];

// Mock live battles
const MOCK_LIVE_BATTLES: CreatorBattle[] = [
  {
    id: '1',
    status: 'live',
    creator1: {
      id: 'c1',
      odooUserId: 'u1',
      name: 'Amara J.',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
      score: 1250,
      giftsReceived: [],
      isReady: true,
    },
    creator2: {
      id: 'c2',
      odooUserId: 'u2',
      name: 'Kwame A.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      score: 980,
      giftsReceived: [],
      isReady: true,
    },
    duration: 180,
    startedAt: new Date(Date.now() - 60000).toISOString(),
    endedAt: null,
    winnerId: null,
    viewerCount: 234,
    totalGifts: 2230,
    category: 'entertainment',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    status: 'live',
    creator1: {
      id: 'c3',
      odooUserId: 'u3',
      name: 'Fatou S.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      score: 3400,
      giftsReceived: [],
      isReady: true,
    },
    creator2: {
      id: 'c4',
      odooUserId: 'u4',
      name: 'Grace N.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      score: 2890,
      giftsReceived: [],
      isReady: true,
    },
    duration: 300,
    startedAt: new Date(Date.now() - 120000).toISOString(),
    endedAt: null,
    winnerId: null,
    viewerCount: 567,
    totalGifts: 6290,
    category: 'music',
    createdAt: new Date().toISOString(),
  },
];

// Mock waiting battles
const MOCK_WAITING_BATTLES: CreatorBattle[] = [
  {
    id: '3',
    status: 'waiting',
    creator1: {
      id: 'c5',
      odooUserId: 'u5',
      name: 'David O.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      score: 0,
      giftsReceived: [],
      isReady: true,
    },
    creator2: null,
    duration: 180,
    startedAt: null,
    endedAt: null,
    winnerId: null,
    viewerCount: 45,
    totalGifts: 0,
    category: 'comedy',
    createdAt: new Date().toISOString(),
  },
];

export default function CreatorBattlesScreen() {
  const [selectedBattle, setSelectedBattle] = useState<CreatorBattle | null>(null);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<'creator1' | 'creator2' | null>(null);
  const [battleTime, setBattleTime] = useState(0);
  const [floatingGifts, setFloatingGifts] = useState<{ id: string; gift: typeof GIFTS[0]; side: 'left' | 'right' }[]>([]);

  const currentUser = useStore((s) => s.currentUser);
  const gemBalance = currentUser?.gemBalance ?? 500;
  const deductGems = useStore((s) => s.deductGems);

  // Timer for active battle
  useEffect(() => {
    if (!selectedBattle || selectedBattle.status !== 'live' || !selectedBattle.startedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(selectedBattle.startedAt!).getTime()) / 1000);
      const remaining = selectedBattle.duration - elapsed;
      setBattleTime(Math.max(0, remaining));

      if (remaining <= 0) {
        // Battle ended
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedBattle]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendGift = (gift: typeof GIFTS[0]) => {
    if (!selectedBattle || !selectedCreator) return;
    if (gemBalance < gift.value) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    deductGems(gift.value);

    // Add floating gift animation
    const newGift = {
      id: uuidv4(),
      gift,
      side: selectedCreator === 'creator1' ? 'left' as const : 'right' as const,
    };
    setFloatingGifts((prev) => [...prev, newGift]);

    // Remove after animation
    setTimeout(() => {
      setFloatingGifts((prev) => prev.filter((g) => g.id !== newGift.id));
    }, 2000);

    // Update battle score (in real app, this would sync to server)
    if (selectedBattle) {
      const creator = selectedCreator === 'creator1' ? selectedBattle.creator1 : selectedBattle.creator2;
      if (creator) {
        creator.score += gift.value;
      }
    }

    setShowGiftPanel(false);
    setSelectedCreator(null);
  };

  const openGiftPanel = (side: 'creator1' | 'creator2') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCreator(side);
    setShowGiftPanel(true);
  };

  const joinBattle = (battle: CreatorBattle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedBattle(battle);
    if (battle.startedAt) {
      const elapsed = Math.floor((Date.now() - new Date(battle.startedAt).getTime()) / 1000);
      setBattleTime(Math.max(0, battle.duration - elapsed));
    }
  };

  const leaveBattle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Battle Room View
  if (selectedBattle) {
    const { creator1, creator2 } = selectedBattle;
    const totalScore = creator1.score + (creator2?.score ?? 0);
    const creator1Percent = totalScore > 0 ? (creator1.score / totalScore) * 100 : 50;

    return (
      <View className="flex-1 bg-black">
        <Stack.Screen options={{ headerShown: false }} />

        {/* Battle Arena */}
        <View className="flex-1">
          {/* Split Screen */}
          <View className="flex-1 flex-row">
            {/* Creator 1 Side */}
            <Pressable
              onPress={() => openGiftPanel('creator1')}
              className="flex-1 relative"
            >
              <LinearGradient
                colors={['#7C3AED', '#4C1D95']}
                style={{ flex: 1 }}
              >
                <Image
                  source={{ uri: creator1.avatar }}
                  style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.3 }}
                  resizeMode="cover"
                />
                <View className="flex-1 items-center justify-center">
                  <Image
                    source={{ uri: creator1.avatar }}
                    className="w-24 h-24 rounded-full border-4 border-white"
                  />
                  <Text className="text-white font-bold text-xl mt-3">{creator1.name}</Text>
                  <View className="flex-row items-center mt-2 bg-black/30 rounded-full px-4 py-2">
                    <Gem size={18} color="#A855F7" />
                    <Text className="text-white font-bold text-lg ml-2">
                      {creator1.score.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Tap to Gift hint */}
                <View className="absolute bottom-20 left-0 right-0 items-center">
                  <View className="bg-white/20 rounded-full px-4 py-2">
                    <Text className="text-white/80 text-sm">Tap to send gift</Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            {/* VS Divider */}
            <View className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <View className="bg-black rounded-full p-4 border-4 border-yellow-400">
                <Swords size={32} color="#EAB308" />
              </View>
            </View>

            {/* Creator 2 Side */}
            <Pressable
              onPress={() => creator2 && openGiftPanel('creator2')}
              className="flex-1 relative"
            >
              <LinearGradient
                colors={['#F97316', '#C2410C']}
                style={{ flex: 1 }}
              >
                {creator2 ? (
                  <>
                    <Image
                      source={{ uri: creator2.avatar }}
                      style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.3 }}
                      resizeMode="cover"
                    />
                    <View className="flex-1 items-center justify-center">
                      <Image
                        source={{ uri: creator2.avatar }}
                        className="w-24 h-24 rounded-full border-4 border-white"
                      />
                      <Text className="text-white font-bold text-xl mt-3">{creator2.name}</Text>
                      <View className="flex-row items-center mt-2 bg-black/30 rounded-full px-4 py-2">
                        <Gem size={18} color="#F97316" />
                        <Text className="text-white font-bold text-lg ml-2">
                          {creator2.score.toLocaleString()}
                        </Text>
                      </View>
                    </View>
                    <View className="absolute bottom-20 left-0 right-0 items-center">
                      <View className="bg-white/20 rounded-full px-4 py-2">
                        <Text className="text-white/80 text-sm">Tap to send gift</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <View className="bg-white/20 rounded-full p-6">
                      <Users size={48} color="white" />
                    </View>
                    <Text className="text-white/80 font-medium mt-4">Waiting for opponent...</Text>
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          {/* Floating Gifts */}
          {floatingGifts.map((fg) => (
            <Animated.View
              key={fg.id}
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(500)}
              style={{
                position: 'absolute',
                left: fg.side === 'left' ? SCREEN_WIDTH * 0.25 - 20 : SCREEN_WIDTH * 0.75 - 20,
                top: SCREEN_HEIGHT * 0.4,
              }}
            >
              <FloatingGift gift={fg.gift} />
            </Animated.View>
          ))}

          {/* Top Bar */}
          <SafeAreaView edges={['top']} className="absolute top-0 left-0 right-0">
            <View className="flex-row items-center justify-between px-4 py-2">
              <Pressable onPress={leaveBattle} className="bg-black/50 rounded-full p-2">
                <X size={24} color="white" />
              </Pressable>

              {/* Timer */}
              <View className="bg-black/50 rounded-full px-4 py-2 flex-row items-center">
                <Timer size={18} color={battleTime <= 30 ? '#EF4444' : 'white'} />
                <Text className={`font-bold text-lg ml-2 ${battleTime <= 30 ? 'text-red-500' : 'text-white'}`}>
                  {formatTime(battleTime)}
                </Text>
              </View>

              {/* Viewers */}
              <View className="bg-black/50 rounded-full px-3 py-2 flex-row items-center">
                <Users size={16} color="white" />
                <Text className="text-white font-medium ml-1">{selectedBattle.viewerCount}</Text>
              </View>
            </View>

            {/* Score Bar */}
            <View className="mx-4 mt-2">
              <View className="h-3 bg-gray-800 rounded-full overflow-hidden flex-row">
                <Animated.View
                  style={{ width: `${creator1Percent}%` }}
                  className="bg-purple-500 h-full"
                />
                <View
                  style={{ width: `${100 - creator1Percent}%` }}
                  className="bg-orange-500 h-full"
                />
              </View>
            </View>
          </SafeAreaView>

          {/* Bottom Bar */}
          <SafeAreaView edges={['bottom']} className="absolute bottom-0 left-0 right-0 bg-black/70">
            <View className="px-4 py-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Gem size={20} color="#A855F7" />
                  <Text className="text-white font-bold ml-2">{gemBalance.toLocaleString()}</Text>
                </View>

                <Pressable
                  onPress={() => router.push('/gem-store')}
                  className="bg-purple-600 rounded-full px-4 py-2"
                >
                  <Text className="text-white font-semibold">Get Gems</Text>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Gift Panel Modal */}
        <Modal
          visible={showGiftPanel}
          transparent
          animationType="slide"
          onRequestClose={() => setShowGiftPanel(false)}
        >
          <Pressable
            className="flex-1"
            onPress={() => setShowGiftPanel(false)}
          />
          <View className="bg-gray-900 rounded-t-3xl">
            <SafeAreaView edges={['bottom']}>
              <View className="p-4">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white font-bold text-lg">Send Gift</Text>
                  <View className="flex-row items-center">
                    <Gem size={18} color="#A855F7" />
                    <Text className="text-white font-bold ml-2">{gemBalance}</Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap justify-between">
                  {GIFTS.map((gift) => {
                    const GiftIcon = gift.icon;
                    const canAfford = gemBalance >= gift.value;

                    return (
                      <Pressable
                        key={gift.id}
                        onPress={() => canAfford && handleSendGift(gift)}
                        className={`w-[30%] items-center p-3 rounded-xl mb-3 ${
                          canAfford ? 'bg-gray-800' : 'bg-gray-800/50'
                        }`}
                        style={{ opacity: canAfford ? 1 : 0.5 }}
                      >
                        <View
                          className="w-12 h-12 rounded-full items-center justify-center mb-2"
                          style={{ backgroundColor: `${gift.color}30` }}
                        >
                          <GiftIcon size={28} color={gift.color} />
                        </View>
                        <Text className="text-white text-xs font-medium">{gift.name}</Text>
                        <View className="flex-row items-center mt-1">
                          <Gem size={12} color="#A855F7" />
                          <Text className="text-purple-400 text-xs ml-1">{gift.value}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      </View>
    );
  }

  // Battle Lobby View
  return (
    <View className="flex-1 bg-gray-950">
      <Stack.Screen
        options={{
          title: 'Creator Battles',
          headerStyle: { backgroundColor: '#030712' },
          headerTintColor: '#fff',
          headerBackVisible: true,
        }}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header Banner */}
        <LinearGradient
          colors={['#7C3AED', '#DB2777']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ margin: 16, borderRadius: 20, padding: 20 }}
        >
          <View className="flex-row items-center">
            <View className="bg-white/20 rounded-full p-3">
              <Swords size={32} color="white" />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-white text-xl font-bold">Creator Battles</Text>
              <Text className="text-white/80 text-sm mt-1">
                Watch creators compete for gifts in real-time!
              </Text>
            </View>
          </View>

          <View className="flex-row mt-4 pt-4 border-t border-white/20">
            <View className="flex-1 items-center">
              <Text className="text-white/60 text-xs">Live Battles</Text>
              <Text className="text-white font-bold text-lg">{MOCK_LIVE_BATTLES.length}</Text>
            </View>
            <View className="flex-1 items-center border-l border-white/20">
              <Text className="text-white/60 text-xs">Total Viewers</Text>
              <Text className="text-white font-bold text-lg">
                {MOCK_LIVE_BATTLES.reduce((sum, b) => sum + b.viewerCount, 0)}
              </Text>
            </View>
            <View className="flex-1 items-center border-l border-white/20">
              <Text className="text-white/60 text-xs">Gifts Sent</Text>
              <Text className="text-white font-bold text-lg">
                {MOCK_LIVE_BATTLES.reduce((sum, b) => sum + b.totalGifts, 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* Live Battles */}
        <View className="px-4">
          <View className="flex-row items-center mb-3">
            <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
            <Text className="text-white font-bold text-lg">Live Now</Text>
          </View>

          {MOCK_LIVE_BATTLES.map((battle, index) => (
            <Animated.View
              key={battle.id}
              entering={FadeInUp.duration(400).delay(index * 100)}
            >
              <Pressable
                onPress={() => joinBattle(battle)}
                className="bg-gray-900 rounded-2xl mb-4 overflow-hidden"
              >
                {/* Battle Preview */}
                <View className="flex-row h-32">
                  {/* Creator 1 */}
                  <View className="flex-1 relative">
                    <LinearGradient
                      colors={['#7C3AED', '#4C1D95']}
                      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <Image
                        source={{ uri: battle.creator1.avatar }}
                        className="w-16 h-16 rounded-full border-2 border-white"
                      />
                      <Text className="text-white font-semibold text-sm mt-1">
                        {battle.creator1.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Gem size={12} color="#A855F7" />
                        <Text className="text-purple-300 text-xs ml-1">
                          {battle.creator1.score.toLocaleString()}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>

                  {/* VS Badge */}
                  <View className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <View className="bg-yellow-500 rounded-full p-2">
                      <Swords size={16} color="#000" />
                    </View>
                  </View>

                  {/* Creator 2 */}
                  <View className="flex-1 relative">
                    <LinearGradient
                      colors={['#F97316', '#C2410C']}
                      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                    >
                      {battle.creator2 && (
                        <>
                          <Image
                            source={{ uri: battle.creator2.avatar }}
                            className="w-16 h-16 rounded-full border-2 border-white"
                          />
                          <Text className="text-white font-semibold text-sm mt-1">
                            {battle.creator2.name}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <Gem size={12} color="#F97316" />
                            <Text className="text-orange-200 text-xs ml-1">
                              {battle.creator2.score.toLocaleString()}
                            </Text>
                          </View>
                        </>
                      )}
                    </LinearGradient>
                  </View>
                </View>

                {/* Battle Info */}
                <View className="p-3 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2" />
                    <Text className="text-red-400 text-xs font-medium">LIVE</Text>
                    <Text className="text-gray-500 mx-2">•</Text>
                    <Users size={14} color="#6B7280" />
                    <Text className="text-gray-400 text-xs ml-1">{battle.viewerCount}</Text>
                  </View>

                  <View className="flex-row items-center bg-purple-500/20 rounded-full px-3 py-1">
                    <Gift size={14} color="#A855F7" />
                    <Text className="text-purple-400 text-xs font-medium ml-1">
                      {battle.totalGifts.toLocaleString()} gems
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Waiting for Opponent */}
        {MOCK_WAITING_BATTLES.length > 0 && (
          <View className="px-4 mt-4">
            <View className="flex-row items-center mb-3">
              <Clock size={18} color="#F59E0B" />
              <Text className="text-white font-bold text-lg ml-2">Waiting for Opponent</Text>
            </View>

            {MOCK_WAITING_BATTLES.map((battle) => (
              <Pressable
                key={battle.id}
                onPress={() => joinBattle(battle)}
                className="bg-gray-900 rounded-2xl p-4 flex-row items-center"
              >
                <Image
                  source={{ uri: battle.creator1.avatar }}
                  className="w-14 h-14 rounded-full border-2 border-yellow-500"
                />
                <View className="flex-1 ml-3">
                  <Text className="text-white font-semibold">{battle.creator1.name}</Text>
                  <Text className="text-gray-400 text-sm">Waiting for challenger...</Text>
                </View>
                <View className="bg-yellow-500 rounded-full px-4 py-2">
                  <Text className="text-black font-bold text-sm">Join Battle</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* How It Works */}
        <View className="px-4 mt-6">
          <Text className="text-white font-bold text-lg mb-3">How It Works</Text>

          <View className="bg-gray-900 rounded-2xl p-4">
            {[
              { icon: Swords, title: 'Two Creators Battle', desc: 'Watch head-to-head competitions' },
              { icon: Gift, title: 'Send Gifts', desc: 'Support your favorite creator with gems' },
              { icon: Trophy, title: 'Highest Score Wins', desc: 'Creator with most gifts wins the battle' },
            ].map((item, index) => (
              <View key={index} className={`flex-row items-center ${index > 0 ? 'mt-4 pt-4 border-t border-gray-800' : ''}`}>
                <View className="bg-purple-500/20 rounded-full p-3">
                  <item.icon size={20} color="#A855F7" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-white font-semibold">{item.title}</Text>
                  <Text className="text-gray-400 text-sm">{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Start Battle Button */}
      <SafeAreaView edges={['bottom']} className="absolute bottom-0 left-0 right-0 bg-gray-950/90">
        <View className="px-4 py-3">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              // In real app, this would create a new battle
            }}
            className="bg-gradient-to-r overflow-hidden rounded-full"
          >
            <LinearGradient
              colors={['#7C3AED', '#DB2777']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
            >
              <Swords size={20} color="white" />
              <Text className="text-white font-bold text-lg ml-2">Start a Battle</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Floating gift animation component
function FloatingGift({ gift }: { gift: typeof GIFTS[0] }) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withTiming(-150, { duration: 1500, easing: Easing.out(Easing.ease) });
    scale.value = withSequence(
      withSpring(1.5, { damping: 8 }),
      withTiming(0.8, { duration: 1000 })
    );
    opacity.value = withTiming(0, { duration: 1500 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const GiftIcon = gift.icon;

  return (
    <Animated.View style={animatedStyle} className="items-center">
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{ backgroundColor: gift.color }}
      >
        <GiftIcon size={24} color="white" />
      </View>
      <Text className="text-white font-bold text-xs mt-1">+{gift.value}</Text>
    </Animated.View>
  );
}
