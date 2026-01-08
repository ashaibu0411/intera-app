import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plane, ChevronRight, HelpCircle, Users } from 'lucide-react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

interface ArrivalModeBannerProps {
  onPress?: () => void;
}

export function ArrivalModeBanner({ onPress }: ArrivalModeBannerProps) {
  const currentUser = useStore((s) => s.currentUser);

  // Calculate days remaining in arrival mode (30 day window)
  const daysRemaining = React.useMemo(() => {
    if (!currentUser?.arrivalDate) return 0;
    const arrivalDate = new Date(currentUser.arrivalDate);
    const now = new Date();
    const diff = 30 - Math.floor((now.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [currentUser?.arrivalDate]);

  // Check if should show banner
  const shouldShow = currentUser?.isNewArrival && daysRemaining > 0;

  // Pulsing animation for the glow effect - must be before any early returns
  const pulseValue = useSharedValue(1);

  React.useEffect(() => {
    if (shouldShow) {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1,
        true
      );
    }
  }, [shouldShow, pulseValue]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  // Don't show if not in arrival mode or expired
  if (!shouldShow) {
    return null;
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onPress) {
      onPress();
    } else {
      router.push('/arrival-mode');
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.duration(400).delay(100)}
      className="mx-4 mt-3"
    >
      <Pressable onPress={handlePress}>
        <Animated.View style={animatedStyle}>
          <LinearGradient
            colors={['#F59E0B', '#D97706', '#B45309']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              padding: 16,
              shadowColor: '#F59E0B',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <View className="flex-row items-center">
              {/* Icon */}
              <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                <Plane size={24} color="#FFFFFF" />
              </View>

              {/* Content */}
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <Text className="text-white font-bold text-base">
                    Arrival Mode Active
                  </Text>
                  <View className="bg-white/30 rounded-full px-2 py-0.5 ml-2">
                    <Text className="text-white text-xs font-semibold">
                      {daysRemaining} days left
                    </Text>
                  </View>
                </View>
                <Text className="text-white/80 text-sm mt-0.5">
                  Get help settling in • Ask anything
                </Text>
              </View>

              <ChevronRight size={20} color="#FFFFFF" />
            </View>

            {/* Quick Actions */}
            <View className="flex-row mt-3 gap-2">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/find-helpers');
                }}
                className="flex-1 bg-white/20 rounded-xl py-2.5 flex-row items-center justify-center"
              >
                <Users size={16} color="#FFFFFF" />
                <Text className="text-white font-medium text-sm ml-1.5">
                  Find Helpers
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/ask-community');
                }}
                className="flex-1 bg-white/20 rounded-xl py-2.5 flex-row items-center justify-center"
              >
                <HelpCircle size={16} color="#FFFFFF" />
                <Text className="text-white font-medium text-sm ml-1.5">
                  Ask Anything
                </Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// Compact version for profile
export function ArrivalModeCompactBadge() {
  const currentUser = useStore((s) => s.currentUser);

  const daysRemaining = React.useMemo(() => {
    if (!currentUser?.arrivalDate) return 0;
    const arrivalDate = new Date(currentUser.arrivalDate);
    const now = new Date();
    const diff = 30 - Math.floor((now.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [currentUser?.arrivalDate]);

  if (!currentUser?.isNewArrival || daysRemaining <= 0) {
    return null;
  }

  return (
    <LinearGradient
      colors={['#F59E0B', '#D97706']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
      }}
    >
      <Plane size={12} color="#FFFFFF" />
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: '600',
          marginLeft: 4,
        }}
      >
        New in {currentUser.arrivalCity || currentUser.location?.split(',')[0]}
      </Text>
      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.3)',
          borderRadius: 999,
          paddingHorizontal: 5,
          paddingVertical: 1,
          marginLeft: 6,
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '700',
          }}
        >
          {daysRemaining}d
        </Text>
      </View>
    </LinearGradient>
  );
}
