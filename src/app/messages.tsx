import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  Search,
  MessageSquarePlus,
  Circle,
  Trash2,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { useStore } from '@/lib/store';
import { getConversations, deleteConversation } from '@/lib/messages';
import { useUnreadStore, markAllMessagesAsReadForUser } from '@/lib/useUnreadMessages';
import { supabase, DbUser } from '@/lib/supabase';

interface ConversationPreview {
  id: string;
  otherUser: DbUser | null;
  lastMessage: {
    content: string;
    created_at: string;
    sender_id: string;
  } | null;
  unreadCount: number;
}

// Swipeable conversation item component
function SwipeableConversation({
  conversation,
  currentUserId,
  onPress,
  onDelete,
  index,
}: {
  conversation: ConversationPreview;
  currentUserId: string | undefined;
  onPress: () => void;
  onDelete: () => void;
  index: number;
}) {
  const translateX = useSharedValue(0);
  const DELETE_THRESHOLD = -80;

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      // Only allow swiping left
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -100);
      }
    })
    .onEnd((event) => {
      if (event.translationX < DELETE_THRESHOLD) {
        // Show delete button
        translateX.value = withSpring(-80);
      } else {
        // Reset position
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    translateX.value = withSpring(0);
    onDelete();
  };

  if (!conversation.otherUser) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(300).delay(100 + index * 50)}
      className="mb-3"
    >
      <View className="relative">
        {/* Delete button behind */}
        <View className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 rounded-2xl items-center justify-center">
          <Pressable onPress={handleDelete} className="items-center justify-center p-4">
            <Trash2 size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Conversation card */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={animatedStyle}>
            <Pressable
              onPress={onPress}
              className="bg-white rounded-2xl p-4 shadow-sm"
            >
              <View className="flex-row items-center">
                <View className="relative">
                  <Image
                    source={{ uri: conversation.otherUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' }}
                    style={{ width: 52, height: 52, borderRadius: 26 }}
                    contentFit="cover"
                  />
                  {conversation.unreadCount > 0 && (
                    <View className="absolute -top-0.5 -right-0.5 bg-terracotta-500 rounded-full p-1">
                      <Circle size={8} color="#FFFFFF" fill="#FFFFFF" />
                    </View>
                  )}
                </View>
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`font-semibold text-base ${
                        conversation.unreadCount > 0 ? 'text-warmBrown' : 'text-gray-700'
                      }`}
                    >
                      {conversation.otherUser.name}
                    </Text>
                    {conversation.lastMessage && (
                      <Text className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(conversation.lastMessage.created_at), {
                          addSuffix: false,
                        })}
                      </Text>
                    )}
                  </View>
                  {conversation.lastMessage && (
                    <Text
                      className={`mt-1 ${
                        conversation.unreadCount > 0
                          ? 'text-warmBrown font-medium'
                          : 'text-gray-500'
                      }`}
                      numberOfLines={1}
                    >
                      {conversation.lastMessage.sender_id === currentUserId ? 'You: ' : ''}
                      {conversation.lastMessage.content}
                    </Text>
                  )}
                </View>
              </View>
            </Pressable>
          </Animated.View>
        </GestureDetector>
      </View>
    </Animated.View>
  );
}

export default function MessagesScreen() {
  const { businessId, businessName } = useLocalSearchParams<{ businessId?: string; businessName?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isGuest = useStore((s) => s.isGuest);
  const currentUser = useStore((s) => s.currentUser);

  // Get the setUnreadCount from the store to update badge directly
  const setUnreadCount = useUnreadStore((s) => s.setUnreadCount);

  // Mark all messages as read directly and update badge
  const markMessagesAsRead = useCallback(async () => {
    try {
      // Get the current user from supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;

      // Mark messages as read using the exported function
      await markAllMessagesAsReadForUser(user.id);

      // Directly set unread count to 0 in the global store
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [setUnreadCount]);

  // Load conversations
  const loadConversations = useCallback(async (showRefresh = false) => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    if (showRefresh) {
      setIsRefreshing(true);
    }

    try {
      const data = await getConversations(currentUser.id);
      setConversations(data as ConversationPreview[]);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser?.id]);

  // Load on mount and mark messages as read
  useEffect(() => {
    loadConversations();
    // Mark all messages as read when entering messages screen
    markMessagesAsRead();
  }, [loadConversations, markMessagesAsRead]);

  // Reload when screen is focused and mark all messages as read
  useFocusEffect(
    useCallback(() => {
      loadConversations();
      // Mark all messages as read when screen gains focus
      markMessagesAsRead();
    }, [loadConversations, markMessagesAsRead])
  );

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

  const handleOpenChat = (conversationId: string, otherUser: DbUser) => {
    if (isGuest || !currentUser) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/signup');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(
      `/chat/${conversationId}?name=${encodeURIComponent(otherUser.name)}&avatar=${encodeURIComponent(otherUser.avatar_url || '')}&recipientId=${otherUser.id}`
    );
  };

  const handleNewMessage = () => {
    if (isGuest || !currentUser) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/signup');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/new-message');
  };

  const handleDeleteConversation = async (conversationId: string, userName: string) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete your conversation with ${userName}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!currentUser?.id) return;
            try {
              await deleteConversation(conversationId, currentUser.id);
              // Remove from local state
              setConversations((prev) => prev.filter((c) => c.id !== conversationId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error deleting conversation:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
          },
        },
      ]
    );
  };

  const filteredConversations = searchQuery
    ? conversations.filter((c) =>
        c.otherUser?.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

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
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadConversations(true)}
              tintColor="#C87941"
            />
          }
        >
          {isLoading ? (
            <View className="items-center pt-12">
              <ActivityIndicator size="large" color="#C87941" />
            </View>
          ) : filteredConversations.length === 0 ? (
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
              <Pressable
                onPress={handleNewMessage}
                className="mt-4 bg-terracotta-500 rounded-full px-6 py-3"
              >
                <Text className="text-white font-medium">Start a conversation</Text>
              </Pressable>
            </Animated.View>
          ) : (
            filteredConversations.map((conversation, index) => (
              <SwipeableConversation
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUser?.id}
                onPress={() => conversation.otherUser && handleOpenChat(conversation.id, conversation.otherUser)}
                onDelete={() => conversation.otherUser && handleDeleteConversation(conversation.id, conversation.otherUser.name)}
                index={index}
              />
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
