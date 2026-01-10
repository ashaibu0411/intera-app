import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  FadeIn,
  FadeInUp,
  SlideInRight,
} from 'react-native-reanimated';
import {
  Zap,
  AlertTriangle,
  Utensils,
  Briefcase,
  Car,
  Calendar,
  HelpCircle,
  Home,
  Heart,
  Clock,
  ChevronRight,
  MapPin,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

interface PulseItem {
  id: string;
  type: 'alert' | 'event' | 'job' | 'offer' | 'request' | 'housing' | 'food';
  title: string;
  subtitle?: string;
  timeAgo: string;
  urgent?: boolean;
  responseCount?: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const generatePulseItems = (city: string): PulseItem[] => [
  {
    id: '1',
    type: 'event',
    title: 'Community dinner tonight',
    subtitle: '7:00 PM · Downtown Community Center',
    timeAgo: '2h',
    icon: <Utensils size={18} color="#F59E0B" />,
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    responseCount: 23,
  },
  {
    id: '2',
    type: 'job',
    title: 'Job opportunity posted',
    subtitle: 'Software Developer · Remote friendly',
    timeAgo: '3h',
    icon: <Briefcase size={18} color="#3B82F6" />,
    color: '#3B82F6',
    bgColor: '#DBEAFE',
    responseCount: 8,
  },
  {
    id: '3',
    type: 'offer',
    title: '3 people offering rides to airport',
    subtitle: 'Tomorrow morning · Free',
    timeAgo: '4h',
    icon: <Car size={18} color="#10B981" />,
    color: '#10B981',
    bgColor: '#D1FAE5',
  },
  {
    id: '4',
    type: 'request',
    title: 'Someone needs help moving',
    subtitle: '2.3 miles away · This Saturday',
    timeAgo: '5h',
    icon: <HelpCircle size={18} color="#8B5CF6" />,
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    urgent: true,
  },
  {
    id: '5',
    type: 'housing',
    title: 'Room available for newcomer',
    subtitle: '$650/mo · Near downtown',
    timeAgo: '6h',
    icon: <Home size={18} color="#EC4899" />,
    color: '#EC4899',
    bgColor: '#FCE7F3',
  },
  {
    id: '6',
    type: 'food',
    title: 'Free community lunch',
    subtitle: 'Ethiopian cuisine · 12:00 PM',
    timeAgo: '8h',
    icon: <Heart size={18} color="#EF4444" />,
    color: '#EF4444',
    bgColor: '#FEE2E2',
    responseCount: 15,
  },
];

interface LocalPulseProps {
  city: string;
}

export function LocalPulse({ city }: LocalPulseProps) {
  const [pulseItems, setPulseItems] = useState<PulseItem[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setPulseItems(generatePulseItems(city));
  }, [city]);

  const displayItems = expanded ? pulseItems : pulseItems.slice(0, 4);

  const handleItemPress = (item: PulseItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate based on type
    switch (item.type) {
      case 'event':
      case 'food':
        router.push('/(tabs)/events');
        break;
      case 'job':
        router.push('/jobs');
        break;
      case 'housing':
        router.push('/housing');
        break;
      default:
        router.push('/app-search');
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(100)}
      className="mx-4 mt-4"
    >
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-amber-100 items-center justify-center mr-2">
            <Zap size={18} color="#F59E0B" />
          </View>
          <View>
            <Text className="text-base font-bold text-gray-900">What's Happening</Text>
            <Text className="text-xs text-gray-500">Near you right now</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <MapPin size={14} color="#9CA3AF" />
          <Text className="text-xs text-gray-400 ml-1">{city}</Text>
        </View>
      </View>

      {/* Pulse Items */}
      <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {displayItems.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={SlideInRight.duration(300).delay(index * 50)}
          >
            <Pressable
              onPress={() => handleItemPress(item)}
              className={`flex-row items-center p-3 ${
                index < displayItems.length - 1 ? 'border-b border-gray-50' : ''
              }`}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#F9FAFB' : 'white',
              })}
            >
              {/* Icon */}
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: item.bgColor }}
              >
                {item.icon}
              </View>

              {/* Content */}
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <Text className="text-sm font-semibold text-gray-900 flex-1" numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.urgent && (
                    <View className="bg-red-100 px-2 py-0.5 rounded-full ml-2">
                      <Text className="text-xs font-medium text-red-600">Urgent</Text>
                    </View>
                  )}
                </View>
                {item.subtitle && (
                  <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                )}
              </View>

              {/* Meta */}
              <View className="items-end ml-2">
                <Text className="text-xs text-gray-400">{item.timeAgo}</Text>
                {item.responseCount && (
                  <Text className="text-xs text-gray-400 mt-0.5">
                    {item.responseCount} interested
                  </Text>
                )}
              </View>
            </Pressable>
          </Animated.View>
        ))}

        {/* See More / Less */}
        {pulseItems.length > 4 && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setExpanded(!expanded);
            }}
            className="flex-row items-center justify-center py-3 border-t border-gray-100"
          >
            <Text className="text-sm font-medium text-gray-600">
              {expanded ? 'Show less' : `See ${pulseItems.length - 4} more`}
            </Text>
            <ChevronRight
              size={16}
              color="#6B7280"
              style={{ transform: [{ rotate: expanded ? '-90deg' : '90deg' }] }}
            />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
