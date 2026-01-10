import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  FadeIn,
  FadeInRight,
} from 'react-native-reanimated';
import {
  MessageCircle,
  HelpCircle,
  Users,
  ChevronRight,
  TrendingUp,
  Flame,
  Globe,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

interface Conversation {
  id: string;
  type: 'question' | 'discussion' | 'request' | 'offer';
  title: string;
  author: {
    name: string;
    avatar: string;
    role?: string;
    city?: string;
  };
  replyCount: number;
  lastActivity: string;
  isHot?: boolean;
}

// LOCAL conversations (from the user's city)
const LOCAL_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    type: 'question',
    title: 'Does anyone know a good Nigerian restaurant near downtown?',
    author: {
      name: 'Amara',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face',
    },
    replyCount: 8,
    lastActivity: '5m',
    isHot: true,
  },
  {
    id: '2',
    type: 'request',
    title: 'New here, looking for roommates in the downtown area',
    author: {
      name: 'Kofi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      role: 'New Arrival',
    },
    replyCount: 12,
    lastActivity: '15m',
    isHot: true,
  },
  {
    id: '3',
    type: 'discussion',
    title: 'Anyone else experiencing issues with the DMV appointments?',
    author: {
      name: 'Fatou',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    },
    replyCount: 23,
    lastActivity: '1h',
  },
  {
    id: '4',
    type: 'offer',
    title: 'Who wants to join for a weekend hike?',
    author: {
      name: 'Chidi',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
      role: 'Organizer',
    },
    replyCount: 6,
    lastActivity: '2h',
  },
];

// GLOBAL conversations (from around the world)
const GLOBAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'g1',
    type: 'question',
    title: 'Best cities for African tech professionals in Europe?',
    author: {
      name: 'Yemi',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face',
      city: 'Berlin',
    },
    replyCount: 47,
    lastActivity: '10m',
    isHot: true,
  },
  {
    id: 'g2',
    type: 'discussion',
    title: 'How are you maintaining your native language with kids abroad?',
    author: {
      name: 'Grace',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
      city: 'Toronto',
    },
    replyCount: 89,
    lastActivity: '30m',
    isHot: true,
  },
  {
    id: 'g3',
    type: 'request',
    title: 'Looking for African grocery suppliers that ship internationally',
    author: {
      name: 'Kwame',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      city: 'New York',
    },
    replyCount: 34,
    lastActivity: '1h',
  },
  {
    id: 'g4',
    type: 'offer',
    title: 'Free immigration consultation for first-gen immigrants',
    author: {
      name: 'Aisha',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
      role: 'Immigration Lawyer',
      city: 'London',
    },
    replyCount: 156,
    lastActivity: '2h',
    isHot: true,
  },
];

interface ActiveConversationsProps {
  city: string;
  isGlobal?: boolean;
}

export function ActiveConversations({ city, isGlobal = false }: ActiveConversationsProps) {
  const conversations = isGlobal ? GLOBAL_CONVERSATIONS : LOCAL_CONVERSATIONS;

  const handleConversationPress = (conversation: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to the conversation/post detail with comments
    router.push(`/post/${conversation.id}`);
  };

  const handleSeeAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/all-conversations');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question':
        return <HelpCircle size={14} color="#3B82F6" />;
      case 'request':
        return <Users size={14} color="#EC4899" />;
      case 'offer':
        return <TrendingUp size={14} color="#10B981" />;
      default:
        return <MessageCircle size={14} color="#8B5CF6" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'question':
        return 'Question';
      case 'request':
        return 'Looking for';
      case 'offer':
        return 'Invitation';
      default:
        return 'Discussion';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'question':
        return { bg: '#DBEAFE', text: '#1D4ED8' };
      case 'request':
        return { bg: '#FCE7F3', text: '#BE185D' };
      case 'offer':
        return { bg: '#D1FAE5', text: '#047857' };
      default:
        return { bg: '#EDE9FE', text: '#6D28D9' };
    }
  };

  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(300)}
      className="mt-4"
    >
      {/* Section Header */}
      <View className="flex-row items-center justify-between px-4 mb-3">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2">
            {isGlobal ? <Globe size={18} color="#3B82F6" /> : <MessageCircle size={18} color="#3B82F6" />}
          </View>
          <View>
            <Text className="text-base font-bold text-gray-900">
              {isGlobal ? 'Global Conversations' : 'Active Conversations'}
            </Text>
            <Text className="text-xs text-gray-500">
              {isGlobal ? 'Trending worldwide' : 'Join the discussion'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={handleSeeAll}
          className="flex-row items-center"
        >
          <Text className="text-sm font-medium text-blue-600">See all</Text>
          <ChevronRight size={16} color="#2563EB" />
        </Pressable>
      </View>

      {/* Conversations List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        style={{ flexGrow: 0 }}
      >
        {conversations.map((conversation, index) => {
          const colors = getTypeColor(conversation.type);
          return (
            <Animated.View
              key={conversation.id}
              entering={FadeInRight.duration(300).delay(index * 50)}
            >
              <Pressable
                onPress={() => handleConversationPress(conversation)}
                className="bg-white rounded-2xl border border-gray-100 p-4 mr-3"
                style={{ width: 280 }}
              >
                {/* Type Badge & Hot */}
                <View className="flex-row items-center justify-between mb-2">
                  <View
                    className="flex-row items-center px-2 py-1 rounded-full"
                    style={{ backgroundColor: colors.bg }}
                  >
                    {getTypeIcon(conversation.type)}
                    <Text
                      className="text-xs font-medium ml-1"
                      style={{ color: colors.text }}
                    >
                      {getTypeLabel(conversation.type)}
                    </Text>
                  </View>
                  {conversation.isHot && (
                    <View className="flex-row items-center bg-orange-100 px-2 py-1 rounded-full">
                      <Flame size={12} color="#EA580C" />
                      <Text className="text-xs font-medium text-orange-600 ml-0.5">Hot</Text>
                    </View>
                  )}
                </View>

                {/* Title */}
                <Text
                  className="text-sm font-semibold text-gray-900 mb-3"
                  numberOfLines={2}
                >
                  {conversation.title}
                </Text>

                {/* Author & Stats */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Image
                      source={{ uri: conversation.author.avatar }}
                      style={{ width: 24, height: 24, borderRadius: 12 }}
                    />
                    <View className="ml-2">
                      <Text className="text-xs font-medium text-gray-700">
                        {conversation.author.name}
                      </Text>
                      {(conversation.author.role || conversation.author.city) && (
                        <Text className="text-xs text-gray-400">
                          {conversation.author.role || conversation.author.city}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <MessageCircle size={14} color="#9CA3AF" />
                    <Text className="text-xs text-gray-400 ml-1">
                      {conversation.replyCount} · {conversation.lastActivity}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}
