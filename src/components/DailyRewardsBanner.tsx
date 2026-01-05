import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Gift, Flame, ChevronRight, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useStore } from '@/lib/store';
import { useEffect } from 'react';

interface DailyRewardsBannerProps {
  onPress: () => void;
}

export function DailyRewardsBanner({ onPress }: DailyRewardsBannerProps) {
  const dailyRewards = useStore((s) => s.dailyRewards);
  const currentStreak = dailyRewards.currentStreak;

  const today = new Date().toISOString().split('T')[0];
  const canClaim = dailyRewards.lastClaimDate !== today;

  // Animated values
  const glowOpacity = useSharedValue(0.5);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (canClaim) {
      // Pulsing glow effect
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1000 }),
          withTiming(0.5, { duration: 1000 })
        ),
        -1,
        true
      );
      // Subtle bounce
      scale.value = withRepeat(
        withSequence(
          withSpring(1.02, { damping: 10 }),
          withSpring(1, { damping: 10 })
        ),
        -1,
        true
      );
    }
  }, [canClaim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View
      entering={FadeInRight.duration(500).delay(100)}
      style={animatedStyle}
      className="mx-4 mb-4"
    >
      <Pressable onPress={handlePress}>
        <LinearGradient
          colors={canClaim ? ['#7C3AED', '#6D28D9', '#5B21B6'] : ['#374151', '#1F2937', '#111827']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 16, overflow: 'hidden' }}
        >
          {/* Animated glow effect for claimable state */}
          {canClaim && (
            <Animated.View
              style={[
                glowStyle,
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(167, 139, 250, 0.3)',
                },
              ]}
            />
          )}

          <View className="p-4 flex-row items-center">
            {/* Gift Icon */}
            <View
              className={`rounded-full p-3 mr-3 ${
                canClaim ? 'bg-white/20' : 'bg-white/10'
              }`}
            >
              {canClaim ? (
                <Gift size={24} color="#FFF" />
              ) : (
                <Gift size={24} color="rgba(255,255,255,0.5)" />
              )}
            </View>

            {/* Content */}
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text
                  className={`font-bold text-base ${
                    canClaim ? 'text-white' : 'text-white/60'
                  }`}
                >
                  {canClaim ? 'Daily Reward Ready!' : 'Daily Rewards'}
                </Text>
                {canClaim && (
                  <View className="ml-2 bg-amber-400 rounded-full px-2 py-0.5">
                    <Text className="text-amber-900 text-xs font-bold">NEW</Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center mt-1">
                <Flame size={14} color={currentStreak > 0 ? '#F97316' : 'rgba(255,255,255,0.4)'} />
                <Text
                  className={`ml-1 text-sm ${
                    canClaim ? 'text-white/80' : 'text-white/40'
                  }`}
                >
                  {currentStreak > 0
                    ? `${currentStreak} day streak`
                    : 'Start your streak!'}
                </Text>
                {canClaim && (
                  <>
                    <Text className="text-white/40 mx-2">•</Text>
                    <Sparkles size={14} color="#FCD34D" />
                    <Text className="text-amber-300 text-sm ml-1 font-medium">
                      Tap to claim
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Arrow */}
            <ChevronRight
              size={20}
              color={canClaim ? 'white' : 'rgba(255,255,255,0.3)'}
            />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
