import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  Send,
  MoreVertical,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { useStore } from '@/lib/store';
import { supabase, DbMessage } from '@/lib/supabase';
import {
  getOrCreateConversation,
  getMessages,
  sendMessage,
  subscribeToMessages,
  unsubscribeFromMessages,
} from '@/lib/messages';
import { markConversationAsRead } from '@/lib/useUnreadMessages';

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export default function ChatScreen() {
  const { id, name, avatar, recipientId } = useLocalSearchParams<{
    id: string;
    name: string;
    avatar: string;
    recipientId: string;
  }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const currentUser = useStore((s) => s.currentUser);

  // Load or create conversation and messages
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    let isSubscribed = true;

    const initializeChat = async () => {
      if (!currentUser?.id || !recipientId) {
        setIsLoading(false);
        return;
      }

      try {
        // Get or create conversation
        const convId = await getOrCreateConversation(currentUser.id, recipientId);
        setConversationId(convId);

        // Load existing messages
        const loadMessages = async () => {
          const existingMessages = await getMessages(convId);
          if (!isSubscribed) return;

          const formattedMessages: ChatMessage[] = (existingMessages || []).map((msg: DbMessage) => ({
            id: msg.id,
            senderId: msg.sender_id,
            content: msg.content,
            timestamp: msg.created_at,
          }));

          setMessages((prev) => {
            // Only update if messages changed
            if (JSON.stringify(prev.map(m => m.id)) !== JSON.stringify(formattedMessages.map(m => m.id))) {
              return formattedMessages;
            }
            return prev;
          });
        };

        await loadMessages();

        // Mark messages as read and update global badge count
        await markConversationAsRead(convId, currentUser.id);

        // Subscribe to new messages (real-time)
        subscribeToMessages(convId, async (newMessage) => {
          if (!isSubscribed) return;

          // Fetch the full message with sender info
          const { data: fullMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('id', newMessage.id)
            .single();

          if (fullMessage && isSubscribed) {
            const formattedMsg: ChatMessage = {
              id: fullMessage.id,
              senderId: fullMessage.sender_id,
              content: fullMessage.content,
              timestamp: fullMessage.created_at,
            };

            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === formattedMsg.id)) {
                return prev;
              }
              return [...prev, formattedMsg];
            });

            // Mark as read if not from current user and update global badge
            if (fullMessage.sender_id !== currentUser.id) {
              markConversationAsRead(convId, currentUser.id);
            }
          }
        });

        // Poll for new messages every 2 seconds as fallback
        pollInterval = setInterval(async () => {
          if (!isSubscribed) return;
          await loadMessages();
          await markConversationAsRead(convId, currentUser.id);
        }, 2000);

      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    initializeChat();

    return () => {
      isSubscribed = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (conversationId) {
        unsubscribeFromMessages(conversationId);
      }
    };
  }, [currentUser?.id, recipientId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversationId || !currentUser?.id || isSending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSending(true);

    const messageContent = messageText.trim();
    setMessageText('');

    // Optimistically add message
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      senderId: currentUser.id,
      content: messageContent,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const sentMessage = await sendMessage(conversationId, currentUser.id, messageContent);

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                id: sentMessage.id,
                senderId: sentMessage.sender_id,
                content: sentMessage.content,
                timestamp: sentMessage.created_at,
              }
            : m
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSending(false);
    }
  };

  const decodedAvatar = avatar ? decodeURIComponent(avatar) : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
  const decodedName = name ? decodeURIComponent(name) : 'User';

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100"
        >
          <Pressable
            onPress={handleBack}
            className="p-1"
          >
            <ChevronLeft size={28} color="#2D1F1A" />
          </Pressable>
          <Image
            source={{ uri: decodedAvatar }}
            style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 8 }}
            contentFit="cover"
          />
          <View className="flex-1 ml-3">
            <Text className="text-warmBrown font-semibold text-base">
              {decodedName}
            </Text>
            <Text className="text-gray-500 text-xs">Active now</Text>
          </View>
          <Pressable className="p-2">
            <MoreVertical size={22} color="#8B7355" />
          </Pressable>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#C87941" />
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 px-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 16, flexGrow: 1 }}
              onContentSizeChange={() =>
                scrollViewRef.current?.scrollToEnd({ animated: false })
              }
            >
              {messages.length === 0 ? (
                <View className="flex-1 items-center justify-center">
                  <Text className="text-gray-400 text-center">
                    No messages yet
                  </Text>
                  <Text className="text-gray-400 text-sm text-center mt-1">
                    Send a message to start the conversation
                  </Text>
                </View>
              ) : (
                messages.map((message, index) => {
                  const isCurrentUser = message.senderId === currentUser?.id;
                  const showTimestamp =
                    index === 0 ||
                    new Date(message.timestamp).getTime() -
                      new Date(messages[index - 1].timestamp).getTime() >
                      300000; // 5 minutes

                  return (
                    <Animated.View
                      key={message.id}
                      entering={FadeInUp.duration(300).delay(Math.min(index * 30, 300))}
                    >
                      {showTimestamp && (
                        <Text className="text-center text-xs text-gray-400 mb-3 mt-2">
                          {formatDistanceToNow(new Date(message.timestamp), {
                            addSuffix: true,
                          })}
                        </Text>
                      )}
                      <View
                        className={`mb-2 max-w-[80%] ${
                          isCurrentUser ? 'self-end' : 'self-start'
                        }`}
                      >
                        <View
                          className={`rounded-2xl px-4 py-3 ${
                            isCurrentUser
                              ? 'bg-terracotta-500 rounded-br-sm'
                              : 'bg-white rounded-bl-sm shadow-sm'
                          }`}
                        >
                          <Text
                            className={`text-base ${
                              isCurrentUser ? 'text-white' : 'text-warmBrown'
                            }`}
                          >
                            {message.content}
                          </Text>
                        </View>
                      </View>
                    </Animated.View>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* Message Input */}
          <View className="bg-white border-t border-gray-100 px-4 py-3">
            <SafeAreaView edges={['bottom']}>
              <View className="flex-row items-center">
                <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2">
                  <TextInput
                    placeholder="Type a message..."
                    placeholderTextColor="#9CA3AF"
                    value={messageText}
                    onChangeText={setMessageText}
                    className="flex-1 text-warmBrown text-base"
                    multiline
                    maxLength={1000}
                  />
                </View>
                <Pressable
                  onPress={handleSendMessage}
                  disabled={!messageText.trim() || isSending}
                  className={`ml-2 p-3 rounded-full ${
                    messageText.trim() && !isSending ? 'bg-terracotta-500' : 'bg-gray-200'
                  }`}
                >
                  {isSending ? (
                    <ActivityIndicator size={20} color="#9CA3AF" />
                  ) : (
                    <Send
                      size={20}
                      color={messageText.trim() ? '#FFFFFF' : '#9CA3AF'}
                    />
                  )}
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
