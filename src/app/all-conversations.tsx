import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Search,
  MessageCircle,
  HelpCircle,
  Users,
  TrendingUp,
  Flame,
  Globe,
  MapPin,
  X,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useStore } from '@/lib/store';

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
  isGlobal?: boolean;
}

// LOCAL conversations
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
  {
    id: '5',
    type: 'question',
    title: 'Where can I find a reliable mechanic in the area?',
    author: {
      name: 'Zara',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    },
    replyCount: 15,
    lastActivity: '3h',
  },
  {
    id: '6',
    type: 'discussion',
    title: 'Thoughts on the new community center opening next month?',
    author: {
      name: 'Marcus',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    },
    replyCount: 31,
    lastActivity: '4h',
    isHot: true,
  },
  {
    id: '7',
    type: 'request',
    title: 'Looking for someone to teach Yoruba to my kids',
    author: {
      name: 'Blessing',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
    },
    replyCount: 7,
    lastActivity: '5h',
  },
  {
    id: '8',
    type: 'offer',
    title: 'Free coding bootcamp for diaspora youth this summer',
    author: {
      name: 'David',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop&crop=face',
      role: 'Tech Lead',
    },
    replyCount: 42,
    lastActivity: '6h',
    isHot: true,
  },
];

// GLOBAL conversations
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
    isGlobal: true,
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
    isGlobal: true,
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
    isGlobal: true,
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
    isGlobal: true,
  },
  {
    id: 'g5',
    type: 'discussion',
    title: 'Starting a business as an immigrant - share your experience',
    author: {
      name: 'Emeka',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
      city: 'Dubai',
    },
    replyCount: 72,
    lastActivity: '3h',
    isGlobal: true,
  },
  {
    id: 'g6',
    type: 'question',
    title: 'What documents do I need to visit home after getting citizenship?',
    author: {
      name: 'Folake',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face',
      city: 'Amsterdam',
    },
    replyCount: 28,
    lastActivity: '4h',
    isGlobal: true,
  },
];

type FilterType = 'all' | 'local' | 'global' | 'question' | 'discussion' | 'request' | 'offer';

export default function AllConversationsScreen() {
  const selectedLocation = useStore((s) => s.selectedLocation);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const allConversations = [...LOCAL_CONVERSATIONS, ...GLOBAL_CONVERSATIONS];

  const filteredConversations = allConversations.filter((conv) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      if (!conv.title.toLowerCase().includes(query) &&
          !conv.author.name.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Type filter
    if (activeFilter === 'local') return !conv.isGlobal;
    if (activeFilter === 'global') return conv.isGlobal;
    if (activeFilter === 'question' || activeFilter === 'discussion' ||
        activeFilter === 'request' || activeFilter === 'offer') {
      return conv.type === activeFilter;
    }

    return true;
  });

  const handleConversationPress = (conversation: Conversation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/post/${conversation.id}`);
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

  const filters: { key: FilterType; label: string; icon?: React.ReactNode }[] = [
    { key: 'all', label: 'All' },
    { key: 'local', label: 'Local', icon: <MapPin size={14} color="#6B7280" /> },
    { key: 'global', label: 'Global', icon: <Globe size={14} color="#6B7280" /> },
    { key: 'question', label: 'Questions' },
    { key: 'discussion', label: 'Discussions' },
    { key: 'request', label: 'Requests' },
    { key: 'offer', label: 'Offers' },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="px-5 pt-4 pb-3 bg-white border-b border-gray-100"
        >
          <View className="flex-row items-center mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="mr-4 p-1"
              hitSlop={8}
            >
              <ArrowLeft size={24} color="#1F2937" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900">All Conversations</Text>
              <Text className="text-sm text-gray-500">
                {selectedLocation?.city || 'Your Community'} & Global
              </Text>
            </View>
          </View>

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Search size={18} color="#9CA3AF" />
            <TextInput
              placeholder="Search conversations..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-gray-900 text-base"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <X size={18} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* Filter Chips */}
        <View className="bg-white pb-3 pt-2 border-b border-gray-100">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            style={{ flexGrow: 0 }}
          >
            {filters.map((filter) => (
              <Pressable
                key={filter.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveFilter(filter.key);
                }}
                className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
                  activeFilter === filter.key
                    ? 'bg-blue-500'
                    : 'bg-gray-100'
                }`}
              >
                {filter.icon && (
                  <View className="mr-1.5">
                    {React.cloneElement(filter.icon as React.ReactElement, {
                      color: activeFilter === filter.key ? '#FFFFFF' : '#6B7280',
                    })}
                  </View>
                )}
                <Text
                  className={`font-medium text-sm ${
                    activeFilter === filter.key ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Conversations List */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
        >
          {/* Results count */}
          <Text className="text-sm text-gray-500 mb-3">
            {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
          </Text>

          {filteredConversations.map((conversation, index) => {
            const colors = getTypeColor(conversation.type);
            return (
              <Animated.View
                key={conversation.id}
                entering={FadeInDown.delay(index * 30).springify()}
              >
                <Pressable
                  onPress={() => handleConversationPress(conversation)}
                  className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
                >
                  {/* Top Row - Type & Location */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <View
                        className="flex-row items-center px-2.5 py-1 rounded-full"
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
                      {conversation.isGlobal && (
                        <View className="flex-row items-center bg-blue-50 px-2 py-1 rounded-full ml-2">
                          <Globe size={12} color="#3B82F6" />
                          <Text className="text-xs font-medium text-blue-600 ml-1">
                            {conversation.author.city}
                          </Text>
                        </View>
                      )}
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
                    className="text-base font-semibold text-gray-900 mb-3 leading-5"
                    numberOfLines={2}
                  >
                    {conversation.title}
                  </Text>

                  {/* Author & Stats */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: conversation.author.avatar }}
                        style={{ width: 28, height: 28, borderRadius: 14 }}
                      />
                      <View className="ml-2">
                        <Text className="text-sm font-medium text-gray-700">
                          {conversation.author.name}
                        </Text>
                        {conversation.author.role && (
                          <Text className="text-xs text-gray-400">
                            {conversation.author.role}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <MessageCircle size={14} color="#9CA3AF" />
                      <Text className="text-sm text-gray-400 ml-1">
                        {conversation.replyCount} · {conversation.lastActivity}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}

          {/* Empty State */}
          {filteredConversations.length === 0 && (
            <View className="items-center py-16">
              <MessageCircle size={48} color="#D1D5DB" />
              <Text className="text-gray-500 text-lg mt-4">No conversations found</Text>
              <Text className="text-gray-400 text-sm mt-1">
                Try adjusting your search or filters
              </Text>
            </View>
          )}

          <View className="h-6" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
