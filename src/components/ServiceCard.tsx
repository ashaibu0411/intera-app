import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Clock, DollarSign } from 'lucide-react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import type { BusinessService } from '@/lib/store';

interface ServiceCardProps {
  service: BusinessService;
  onSelect: () => void;
  isSelected?: boolean;
}

export function ServiceCard({ service, onSelect, isSelected = false }: ServiceCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect();
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View
          className={`bg-white rounded-xl p-4 mb-3 border-2 ${
            isSelected ? 'border-terracotta-500' : 'border-transparent'
          }`}
          style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 }}
        >
          <View className="flex-row">
            {service.image && (
              <Image
                source={{ uri: service.image }}
                style={{ width: 60, height: 60, borderRadius: 8 }}
                contentFit="cover"
              />
            )}
            <View className={`flex-1 ${service.image ? 'ml-3' : ''}`}>
              <Text className="text-warmBrown font-semibold text-base">{service.name}</Text>
              <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={2}>
                {service.description}
              </Text>

              <View className="flex-row items-center mt-2">
                <View className="flex-row items-center">
                  <Clock size={12} color="#9CA3AF" />
                  <Text className="text-gray-400 text-xs ml-1">{formatDuration(service.duration)}</Text>
                </View>
                <View className="flex-row items-center ml-4">
                  <DollarSign size={12} color="#D4673A" />
                  <Text className="text-terracotta-500 font-semibold text-sm">
                    {service.price} {service.currency}
                  </Text>
                </View>
              </View>
            </View>

            {isSelected && (
              <View className="bg-terracotta-500 rounded-full w-6 h-6 items-center justify-center ml-2">
                <Text className="text-white text-xs font-bold">✓</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
