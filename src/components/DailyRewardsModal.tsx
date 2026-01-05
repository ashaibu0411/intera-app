import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { X, Flame, Gift, Gem, Check, Lock, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useStore } from '@/lib/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DailyReward {
  day: number;
  gems: number;
  isBonus: boolean;
}

const DAILY_REWARDS: DailyReward[] = [
  { day: 1, gems: 10, isBonus: false },
  { day: 2, gems: 15, isBonus: false },
  { day: 3, gems: 20, isBonus: false },
  { day: 4, gems: 25, isBonus: false },
  { day: 5, gems: 30, isBonus: false },
  { day: 6, gems: 40, isBonus: false },
  { day: 7, gems: 100, isBonus: true },
];

interface DailyRewardsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DailyRewardsModal({ visible, onClose }: DailyRewardsModalProps) {
  const [claimingDay, setClaimingDay] = useState<number | null>(null);
  const [justClaimed, setJustClaimed] = useState(false);

  const dailyRewards = useStore((s) => s.dailyRewards);
  const claimDailyReward = useStore((s) => s.claimDailyReward);
  const currentUser = useStore((s) => s.currentUser);

  const today = new Date().toISOString().split('T')[0];
  const canClaimToday = dailyRewards.lastClaimDate !== today;
  const nextClaimDay = dailyRewards.claimedDays.length + 1;

  // Check if we need to reset the week (all 7 days claimed)
  useEffect(() => {
    if (dailyRewards.claimedDays.length >= 7) {
      useStore.getState().resetWeeklyRewards();
    }
  }, [dailyRewards.claimedDays.length]);

  // Check for streak break (missed a day)
  useEffect(() => {
    if (dailyRewards.lastClaimDate) {
      const lastClaim = new Date(dailyRewards.lastClaimDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastClaim.getTime()) / (1000 * 60 * 60 * 24));

      // If more than 1 day passed, reset the streak
      if (diffDays > 1 && dailyRewards.claimedDays.length > 0) {
        useStore.getState().resetWeeklyRewards();
      }
    }
  }, [visible]);

  const handleClaim = async (day: number) => {
    if (!canClaimToday || day !== nextClaimDay || claimingDay !== null) return;

    setClaimingDay(day);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const reward = DAILY_REWARDS.find((r) => r.day === day);
    if (reward) {
      // Small delay for animation
      setTimeout(() => {
        claimDailyReward(day, reward.gems);
        setJustClaimed(true);
        setClaimingDay(null);

        // Auto close after claiming
        setTimeout(() => {
          onClose();
          setJustClaimed(false);
        }, 2000);
      }, 500);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setJustClaimed(false);
  };

  const getDayStatus = (day: number): 'claimed' | 'available' | 'locked' => {
    if (dailyRewards.claimedDays.includes(day)) return 'claimed';
    if (day === nextClaimDay && canClaimToday) return 'available';
    return 'locked';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View className="flex-1">
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          className="absolute inset-0"
        >
          <BlurView intensity={40} tint="dark" style={{ flex: 1 }}>
            <Pressable className="flex-1" onPress={handleClose} />
          </BlurView>
        </Animated.View>

        <View className="flex-1 justify-center items-center px-4">
          <Animated.View
            entering={SlideInUp.springify().damping(15)}
            className="w-full max-w-sm"
          >
            <LinearGradient
              colors={['#1a1a2e', '#16213e', '#0f3460']}
              style={{ borderRadius: 24, overflow: 'hidden' }}
            >
              {/* Header */}
              <View className="relative pt-6 pb-4 px-5">
                <Pressable
                  onPress={handleClose}
                  className="absolute top-4 right-4 bg-white/10 rounded-full p-2 z-10"
                >
                  <X size={20} color="white" />
                </Pressable>

                <View className="items-center">
                  <View className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-full p-3 mb-3">
                    <Gift size={32} color="#FFF" />
                  </View>
                  <Text className="text-white text-2xl font-bold">Daily Rewards</Text>
                  <Text className="text-white/60 text-sm mt-1">
                    Come back every day to earn gems!
                  </Text>
                </View>

                {/* Streak Display */}
                <View className="flex-row justify-center items-center mt-4 bg-white/10 rounded-full py-2 px-4 self-center">
                  <Flame size={20} color="#F97316" />
                  <Text className="text-white font-bold ml-2">
                    {dailyRewards.currentStreak} Day Streak
                  </Text>
                  {dailyRewards.longestStreak > 0 && (
                    <Text className="text-white/50 text-xs ml-2">
                      (Best: {dailyRewards.longestStreak})
                    </Text>
                  )}
                </View>
              </View>

              {/* Rewards Grid */}
              <View className="px-4 pb-4">
                <View className="flex-row flex-wrap justify-between">
                  {DAILY_REWARDS.map((reward) => {
                    const status = getDayStatus(reward.day);
                    const isClaimable = status === 'available' && !justClaimed;

                    return (
                      <RewardDay
                        key={reward.day}
                        reward={reward}
                        status={status}
                        isClaiming={claimingDay === reward.day}
                        onClaim={() => handleClaim(reward.day)}
                        isClaimable={isClaimable}
                      />
                    );
                  })}
                </View>
              </View>

              {/* Current Balance */}
              <View className="border-t border-white/10 px-5 py-4">
                <View className="flex-row justify-between items-center">
                  <Text className="text-white/60 text-sm">Your Balance</Text>
                  <View className="flex-row items-center">
                    <Gem size={18} color="#A855F7" />
                    <Text className="text-white font-bold text-lg ml-2">
                      {(currentUser?.gemBalance ?? 500).toLocaleString()}
                    </Text>
                  </View>
                </View>

                {justClaimed && (
                  <Animated.View
                    entering={FadeIn.duration(300)}
                    className="mt-3 bg-green-500/20 rounded-xl py-3 px-4"
                  >
                    <View className="flex-row items-center justify-center">
                      <Sparkles size={20} color="#22C55E" />
                      <Text className="text-green-400 font-semibold ml-2">
                        Reward Claimed!
                      </Text>
                    </View>
                  </Animated.View>
                )}
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

interface RewardDayProps {
  reward: DailyReward;
  status: 'claimed' | 'available' | 'locked';
  isClaiming: boolean;
  onClaim: () => void;
  isClaimable: boolean;
}

function RewardDay({ reward, status, isClaiming, onClaim, isClaimable }: RewardDayProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (isClaiming) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
      rotation.value = withSequence(
        withSpring(-10),
        withSpring(10),
        withSpring(0)
      );
    }
  }, [isClaiming]);

  useEffect(() => {
    if (isClaimable) {
      // Pulsing animation for claimable day
      const pulse = () => {
        scale.value = withSequence(
          withSpring(1.05, { damping: 10 }),
          withDelay(500, withSpring(1, { damping: 10 }))
        );
      };
      pulse();
      const interval = setInterval(pulse, 2000);
      return () => clearInterval(interval);
    }
  }, [isClaimable]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const isDay7 = reward.day === 7;
  const cardWidth = isDay7 ? '100%' : '30%';

  const getBackgroundColors = (): [string, string] => {
    if (status === 'claimed') return ['#22C55E', '#16A34A'];
    if (status === 'available') return ['#F97316', '#EA580C'];
    return ['#374151', '#1F2937'];
  };

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          width: isDay7 ? '100%' : '30%',
          marginBottom: 12,
        },
      ]}
    >
      <Pressable
        onPress={isClaimable ? onClaim : undefined}
        disabled={!isClaimable}
      >
        <LinearGradient
          colors={getBackgroundColors()}
          style={{
            borderRadius: 16,
            padding: isDay7 ? 16 : 12,
            alignItems: 'center',
            minHeight: isDay7 ? 80 : 90,
            justifyContent: 'center',
          }}
        >
          {/* Day Label */}
          <Text
            className={`font-semibold text-xs ${
              status === 'locked' ? 'text-white/40' : 'text-white/80'
            }`}
          >
            {isDay7 ? 'Day 7 Bonus!' : `Day ${reward.day}`}
          </Text>

          {/* Icon/Status */}
          <View className="my-2">
            {status === 'claimed' ? (
              <View className="bg-white/20 rounded-full p-1.5">
                <Check size={isDay7 ? 24 : 18} color="white" />
              </View>
            ) : status === 'locked' ? (
              <Lock size={isDay7 ? 24 : 18} color="rgba(255,255,255,0.3)" />
            ) : (
              <View className="bg-white/20 rounded-full p-1.5">
                <Gem size={isDay7 ? 24 : 18} color="white" />
              </View>
            )}
          </View>

          {/* Gems Amount */}
          <View className="flex-row items-center">
            <Gem size={14} color={status === 'locked' ? 'rgba(255,255,255,0.3)' : '#A855F7'} />
            <Text
              className={`font-bold ml-1 ${
                status === 'locked' ? 'text-white/30' : 'text-white'
              } ${isDay7 ? 'text-xl' : 'text-base'}`}
            >
              {reward.gems}
            </Text>
          </View>

          {/* Claim Button for available day */}
          {isClaimable && (
            <View className="mt-2 bg-white/20 rounded-full px-3 py-1">
              <Text className="text-white text-xs font-semibold">
                {isClaiming ? 'Claiming...' : 'Tap to Claim'}
              </Text>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
