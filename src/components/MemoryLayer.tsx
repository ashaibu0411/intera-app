import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  FadeIn,
  FadeInUp,
} from 'react-native-reanimated';
import {
  Clock,
  Calendar,
  Users,
  Heart,
  Sparkles,
  ChevronRight,
  Star,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

interface Memory {
  id: string;
  type: 'anniversary' | 'milestone' | 'throwback' | 'connection';
  title: string;
  subtitle: string;
  date: string;
  image?: string;
  highlight?: boolean;
}

const generateMemories = (city: string, joinDate: Date): Memory[] => {
  const now = new Date();
  const daysSinceJoin = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24));
  const monthsSinceJoin = Math.floor(daysSinceJoin / 30);

  const memories: Memory[] = [];

  // Anniversary memories
  if (monthsSinceJoin >= 3 && monthsSinceJoin % 3 === 0) {
    memories.push({
      id: '1',
      type: 'anniversary',
      title: `${monthsSinceJoin} months in ${city}!`,
      subtitle: 'Celebrate your journey with the community',
      date: 'Today',
      highlight: true,
    });
  }

  // Throwback
  memories.push({
    id: '2',
    type: 'throwback',
    title: 'Last year this week',
    subtitle: 'Your community organized a cultural festival',
    date: '1 year ago',
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop',
  });

  // Connection milestone
  if (daysSinceJoin > 30) {
    memories.push({
      id: '3',
      type: 'connection',
      title: 'You\'ve helped 12 people',
      subtitle: 'Your impact in the community grows',
      date: 'This month',
    });
  }

  // First post memory
  memories.push({
    id: '4',
    type: 'milestone',
    title: 'Your first post here',
    subtitle: 'Remember when you introduced yourself?',
    date: `${daysSinceJoin} days ago`,
  });

  return memories;
};

interface MemoryLayerProps {
  city: string;
  joinDate?: Date;
}

export function MemoryLayer({ city, joinDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }: MemoryLayerProps) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setMemories(generateMemories(city, joinDate));
  }, [city, joinDate]);

  const currentMemory = memories[currentIndex];

  if (!currentMemory) return null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/time-capsules');
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentIndex((prev) => (prev + 1) % memories.length);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'anniversary':
        return <Sparkles size={18} color="#F59E0B" />;
      case 'throwback':
        return <Clock size={18} color="#8B5CF6" />;
      case 'connection':
        return <Heart size={18} color="#EC4899" />;
      case 'milestone':
        return <Star size={18} color="#3B82F6" />;
      default:
        return <Calendar size={18} color="#6B7280" />;
    }
  };

  const getGradient = (type: string): readonly [string, string] => {
    switch (type) {
      case 'anniversary':
        return ['#FEF3C7', '#FDE68A'] as const;
      case 'throwback':
        return ['#EDE9FE', '#DDD6FE'] as const;
      case 'connection':
        return ['#FCE7F3', '#FBCFE8'] as const;
      case 'milestone':
        return ['#DBEAFE', '#BFDBFE'] as const;
      default:
        return ['#F3F4F6', '#E5E7EB'] as const;
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(200)}
      className="mx-4 mt-4"
    >
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center mr-2">
            <Clock size={18} color="#8B5CF6" />
          </View>
          <View>
            <Text className="text-base font-bold text-gray-900">Community Remembers</Text>
            <Text className="text-xs text-gray-500">Your story with us</Text>
          </View>
        </View>
        {memories.length > 1 && (
          <View className="flex-row items-center gap-1">
            {memories.map((_, idx) => (
              <View
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${
                  idx === currentIndex ? 'bg-purple-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </View>
        )}
      </View>

      {/* Memory Card */}
      <Pressable onPress={handlePress}>
        <LinearGradient
          colors={getGradient(currentMemory.type)}
          style={{
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <View className="p-4">
            <View className="flex-row items-start">
              {/* Icon */}
              <View className="w-10 h-10 rounded-xl bg-white/80 items-center justify-center">
                {getIcon(currentMemory.type)}
              </View>

              {/* Content */}
              <View className="flex-1 ml-3">
                <Text className="text-sm font-bold text-gray-900">
                  {currentMemory.title}
                </Text>
                <Text className="text-xs text-gray-600 mt-0.5">
                  {currentMemory.subtitle}
                </Text>
                <Text className="text-xs text-gray-400 mt-1">
                  {currentMemory.date}
                </Text>
              </View>

              {/* Image if exists */}
              {currentMemory.image && (
                <Image
                  source={{ uri: currentMemory.image }}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 12,
                  }}
                  contentFit="cover"
                />
              )}
            </View>

            {/* Action Row */}
            <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-black/5">
              <Pressable
                onPress={handlePress}
                className="flex-row items-center"
              >
                <Text className="text-sm font-medium text-gray-700">View memories</Text>
                <ChevronRight size={16} color="#374151" />
              </Pressable>

              {memories.length > 1 && (
                <Pressable
                  onPress={handleNext}
                  className="px-3 py-1.5 bg-white/60 rounded-full"
                >
                  <Text className="text-xs font-medium text-gray-600">Next</Text>
                </Pressable>
              )}
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
