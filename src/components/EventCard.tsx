import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Clock, MapPin, Users, CheckCircle, Star } from 'lucide-react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import type { Event } from '@/lib/store';

interface EventCardProps {
  event: Event;
  variant?: 'full' | 'compact';
  isRsvped?: boolean;
  rsvpStatus?: 'interested' | 'going' | null;
  onRsvp?: (status: 'interested' | 'going') => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Social Gathering': '#D4673A',
  'Networking': '#1B4D3E',
  'Cultural Celebration': '#C9A227',
  'Sports & Fitness': '#10B981',
  'Food & Dining': '#E97451',
  'Music & Entertainment': '#8B5CF6',
  'Education & Workshop': '#3B82F6',
  'Business': '#6366F1',
  'Community Service': '#EC4899',
  'Other': '#6B7280',
};

function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === now.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
}

export function EventCard({
  event,
  variant = 'full',
  isRsvped = false,
  rsvpStatus = null,
  onRsvp,
}: EventCardProps) {
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
    router.push(`/event/${event.id}` as any);
  };

  const handleRsvp = (status: 'interested' | 'going') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRsvp?.(status);
  };

  const categoryColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS['Other'];

  if (variant === 'compact') {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={animatedStyle}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <View className="bg-white rounded-xl overflow-hidden shadow-sm" style={{ width: 200 }}>
            {event.image ? (
              <Image
                source={{ uri: event.image }}
                style={{ width: '100%', height: 100 }}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={[categoryColor, `${categoryColor}CC`]}
                style={{ width: '100%', height: 100, justifyContent: 'center', alignItems: 'center' }}
              >
                <Calendar size={32} color="#FFFFFF" />
              </LinearGradient>
            )}
            <View className="p-3">
              <View className="flex-row items-center mb-1">
                <Text style={{ color: categoryColor }} className="text-xs font-semibold">
                  {formatEventDate(event.date)}
                </Text>
                <Text className="text-gray-300 mx-1">•</Text>
                <Text className="text-gray-500 text-xs">{event.time}</Text>
              </View>
              <Text className="text-warmBrown font-semibold text-sm" numberOfLines={2}>
                {event.title}
              </Text>
              <View className="flex-row items-center mt-1.5">
                <MapPin size={10} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs ml-1" numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // Full variant
  return (
    <Animated.View entering={FadeIn.duration(400)} style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View className="bg-white rounded-2xl mx-4 mb-4 overflow-hidden shadow-sm">
          {/* Image Section */}
          <View className="relative">
            {event.image ? (
              <Image
                source={{ uri: event.image }}
                style={{ width: '100%', height: 160 }}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={[categoryColor, `${categoryColor}CC`]}
                style={{ width: '100%', height: 160, justifyContent: 'center', alignItems: 'center' }}
              >
                <Calendar size={48} color="#FFFFFF" />
              </LinearGradient>
            )}

            {/* Category Badge */}
            <View
              className="absolute top-3 left-3 px-2.5 py-1 rounded-full"
              style={{ backgroundColor: categoryColor }}
            >
              <Text className="text-white text-xs font-semibold">{event.category}</Text>
            </View>

            {/* Date Badge */}
            <View className="absolute top-3 right-3 bg-white rounded-lg px-2.5 py-1.5 items-center shadow-sm">
              <Text className="text-warmBrown font-bold text-sm">
                {new Date(event.date).getDate()}
              </Text>
              <Text className="text-gray-500 text-[10px] uppercase">
                {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
              </Text>
            </View>
          </View>

          {/* Content Section */}
          <View className="p-4">
            {/* Title */}
            <Text className="text-warmBrown font-bold text-lg" numberOfLines={2}>
              {event.title}
            </Text>

            {/* Description */}
            <Text className="text-gray-600 text-sm mt-1.5" numberOfLines={2}>
              {event.description}
            </Text>

            {/* Event Details */}
            <View className="mt-3 space-y-2">
              <View className="flex-row items-center">
                <Clock size={14} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm ml-2">
                  {event.time}{event.endTime ? ` - ${event.endTime}` : ''}
                </Text>
              </View>
              <View className="flex-row items-center mt-2">
                <MapPin size={14} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm ml-2" numberOfLines={1}>
                  {event.address || event.location}
                </Text>
              </View>
              <View className="flex-row items-center mt-2">
                <Users size={14} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm ml-2">
                  {event.rsvpCount} {event.rsvpCount === 1 ? 'person' : 'people'} going
                </Text>
              </View>
            </View>

            {/* Host */}
            <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
              <Image
                source={{ uri: event.creator.avatar }}
                style={{ width: 28, height: 28, borderRadius: 14 }}
                contentFit="cover"
              />
              <Text className="text-gray-500 text-sm ml-2">
                Hosted by <Text className="text-warmBrown font-medium">{event.creator.name}</Text>
              </Text>
            </View>

            {/* RSVP Buttons */}
            {onRsvp && (
              <View className="flex-row items-center mt-4 gap-3">
                <Pressable
                  onPress={() => handleRsvp('interested')}
                  className={`flex-1 py-3 rounded-full flex-row items-center justify-center ${
                    rsvpStatus === 'interested' ? 'bg-gold-500' : 'bg-gray-100'
                  }`}
                >
                  <Star
                    size={16}
                    color={rsvpStatus === 'interested' ? '#FFFFFF' : '#6B7280'}
                    fill={rsvpStatus === 'interested' ? '#FFFFFF' : 'transparent'}
                  />
                  <Text
                    className={`ml-2 font-medium ${
                      rsvpStatus === 'interested' ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    Interested
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleRsvp('going')}
                  className={`flex-1 py-3 rounded-full flex-row items-center justify-center ${
                    rsvpStatus === 'going' ? 'bg-forest-700' : 'bg-terracotta-500'
                  }`}
                >
                  <CheckCircle
                    size={16}
                    color="#FFFFFF"
                    fill={rsvpStatus === 'going' ? '#FFFFFF' : 'transparent'}
                  />
                  <Text className="text-white font-medium ml-2">
                    {rsvpStatus === 'going' ? 'Going!' : 'RSVP'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
