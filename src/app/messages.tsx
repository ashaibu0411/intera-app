import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  Search,
  MessageSquarePlus,
  Circle,
  Store,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { useStore, MOCK_USERS, type User } from '@/lib/store';

interface ConversationPreview {
  id: string;
  user: User;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

const MOCK_CONVERSATIONS: ConversationPreview[] = [
  {
    id: '1',
    user: MOCK_USERS[0],
    lastMessage: 'Thank you for the tailor recommendation!',
    timestamp: '2024-12-30T11:30:00Z',
    unread: true,
  },
  {
    id: '2',
    user: MOCK_USERS[1],
    lastMessage: 'The restaurant opens at 11am! Looking forward to seeing you.',
    timestamp: '2024-12-29T19:45:00Z',
    unread: false,
  },
  {
    id: '3',
    user: MOCK_USERS[2],
    lastMessage: 'I\'ll send you the meetup details soon.',
    timestamp: '2024-12-28T15:20:00Z',
    unread: true,
  },
];

export default function MessagesScreen() {
  const { businessId, businessName } = useLocalSearchParams<{ businessId?: string; businessName?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const isGuest = useStore((s) => s.isGuest);
  const currentUser = useStore((s) => s.currentUser);

  // If a business was passed in, open a chat with that business directly
  useEffect(() => {
    if (businessId && businessName && currentUser && !isGuest) {
      // Create a unique conversation ID for this business
      const conversationId = `business_${businessId}`;
      // Navigate to chat with the business
      router.replace(
        `/chat/${conversationId}?name=${encodeURIComponent(businessName)}&avatar=${encodeURIComponent('https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&h=200&fit=crop')}&isBusiness=true`
      );
    }
  }, [businessId, businessName, currentUser, isGuest]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleOpenChat = (conversationId: string, user: User) => {
    if (isGuest || !currentUser) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/signup');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/chat/${conversationId}?name=${encodeURIComponent(user.name)}&avatar=${encodeURIComponent(user.avatar)}`);
  };

  const handleNewMessage = () => {
    if (isGuest || !currentUser) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/signup');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Could open a user selector modal here
  };

  const filteredConversations = searchQuery
    ? MOCK_CONVERSATIONS.filter((c) =>
        c.user.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : MOCK_CONVERSATIONS;

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="px-4 pt-4 pb-3"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={handleBack}
              className="bg-white rounded-full p-2 shadow-sm"
            >
              <ChevronLeft size={24} color="#2D1F1A" />
            </Pressable>
            <Text className="text-xl font-bold text-warmBrown">Messages</Text>
            <Pressable
              onPress={handleNewMessage}
              className="bg-terracotta-500 rounded-full p-2 shadow-sm"
            >
              <MessageSquarePlus size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
            <Search size={20} color="#8B7355" />
            <TextInput
              placeholder="Search conversations..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-warmBrown text-base"
            />
          </View>
        </Animated.View>

        {/* Guest Banner */}
        {(isGuest || !currentUser) && (
          <Animated.View
            entering={FadeInUp.duration(400).delay(100)}
            className="mx-4 mb-4"
          >
            <Pressable onPress={() => router.push('/signup')}>
              <View className="bg-gold-50 border border-gold-200 rounded-2xl p-4">
                <Text className="text-warmBrown font-semibold text-center">
                  Sign up to message other community members
                </Text>
                <Text className="text-gray-500 text-sm text-center mt-1">
                  Create an account to start conversations
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* Conversations List */}
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {filteredConversations.length === 0 ? (
            <Animated.View
              entering={FadeInUp.duration(400).delay(200)}
              className="items-center pt-12"
            >
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <MessageSquarePlus size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-500 text-center">
                No conversations yet
              </Text>
              <Text className="text-gray-400 text-sm text-center mt-1">
                Start messaging community members
              </Text>
            </Animated.View>
          ) : (
            filteredConversations.map((conversation, index) => (
              <Animated.View
                key={conversation.id}
                entering={FadeInUp.duration(300).delay(100 + index * 50)}
              >
                <Pressable
                  onPress={() => handleOpenChat(conversation.id, conversation.user)}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  <View className="flex-row items-center">
                    <View className="relative">
                      <Image
                        source={{ uri: conversation.user.avatar }}
                        style={{ width: 52, height: 52, borderRadius: 26 }}
                        contentFit="cover"
                      />
                      {conversation.unread && (
                        <View className="absolute -top-0.5 -right-0.5 bg-terracotta-500 rounded-full p-1">
                          <Circle size={8} color="#FFFFFF" fill="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <View className="flex-1 ml-3">
                      <View className="flex-row items-center justify-between">
                        <Text
                          className={`font-semibold text-base ${
                            conversation.unread ? 'text-warmBrown' : 'text-gray-700'
                          }`}
                        >
                          {conversation.user.name}
                        </Text>
                        <Text className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(conversation.timestamp), {
                            addSuffix: false,
                          })}
                        </Text>
                      </View>
                      <Text
                        className={`mt-1 ${
                          conversation.unread
                            ? 'text-warmBrown font-medium'
                            : 'text-gray-500'
                        }`}
                        numberOfLines={1}
                      >
                        {conversation.lastMessage}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
