import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  Send,
  Phone,
  MoreVertical,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { useStore, MOCK_USERS } from '@/lib/store';

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

const MOCK_CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  '1': [
    {
      id: '1',
      senderId: MOCK_USERS[0].id,
      content: 'Hi! I saw your post about needing a Ghanaian tailor.',
      timestamp: '2024-12-30T10:00:00Z',
    },
    {
      id: '2',
      senderId: 'current',
      content: 'Yes! Do you know anyone good in the Denver area?',
      timestamp: '2024-12-30T10:05:00Z',
    },
    {
      id: '3',
      senderId: MOCK_USERS[0].id,
      content: 'Absolutely! Auntie Grace in Aurora is amazing. She does traditional kente work.',
      timestamp: '2024-12-30T10:10:00Z',
    },
    {
      id: '4',
      senderId: 'current',
      content: 'That sounds perfect! How can I reach her?',
      timestamp: '2024-12-30T10:15:00Z',
    },
    {
      id: '5',
      senderId: MOCK_USERS[0].id,
      content: 'I\'ll send you her contact info. She\'s on Colfax Ave, open Tuesday through Saturday.',
      timestamp: '2024-12-30T11:00:00Z',
    },
    {
      id: '6',
      senderId: 'current',
      content: 'Thank you for the tailor recommendation!',
      timestamp: '2024-12-30T11:30:00Z',
    },
  ],
  '2': [
    {
      id: '1',
      senderId: MOCK_USERS[1].id,
      content: 'Thanks for your interest in my restaurant!',
      timestamp: '2024-12-29T18:00:00Z',
    },
    {
      id: '2',
      senderId: 'current',
      content: 'I\'m so excited to try authentic Senegalese food! What time do you open?',
      timestamp: '2024-12-29T18:30:00Z',
    },
    {
      id: '3',
      senderId: MOCK_USERS[1].id,
      content: 'The restaurant opens at 11am! Looking forward to seeing you.',
      timestamp: '2024-12-29T19:45:00Z',
    },
  ],
  '3': [
    {
      id: '1',
      senderId: 'current',
      content: 'Hi! I\'d love to join the tech professionals meetup.',
      timestamp: '2024-12-28T14:00:00Z',
    },
    {
      id: '2',
      senderId: MOCK_USERS[2].id,
      content: 'Great! We\'d love to have you. It\'s next Thursday at WeWork downtown.',
      timestamp: '2024-12-28T14:30:00Z',
    },
    {
      id: '3',
      senderId: MOCK_USERS[2].id,
      content: 'I\'ll send you the meetup details soon.',
      timestamp: '2024-12-28T15:20:00Z',
    },
  ],
};

export default function ChatScreen() {
  const { id, name, avatar } = useLocalSearchParams<{
    id: string;
    name: string;
    avatar: string;
  }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messageText, setMessageText] = useState('');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);

  const currentUser = useStore((s) => s.currentUser);

  const chatMessages = [...(MOCK_CHAT_MESSAGES[id || '1'] || []), ...localMessages];

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      senderId: 'current',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    setLocalMessages((prev) => [...prev, newMessage]);
    setMessageText('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const decodedAvatar = avatar ? decodeURIComponent(avatar) : MOCK_USERS[0].avatar;
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
            <Phone size={22} color="#1B4D3E" />
          </Pressable>
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
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16 }}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: false })
            }
          >
            {chatMessages.map((message, index) => {
              const isCurrentUser = message.senderId === 'current';
              const showTimestamp =
                index === 0 ||
                new Date(message.timestamp).getTime() -
                  new Date(chatMessages[index - 1].timestamp).getTime() >
                  300000; // 5 minutes

              return (
                <Animated.View
                  key={message.id}
                  entering={FadeInUp.duration(300).delay(index * 30)}
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
            })}
          </ScrollView>

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
                  disabled={!messageText.trim()}
                  className={`ml-2 p-3 rounded-full ${
                    messageText.trim() ? 'bg-terracotta-500' : 'bg-gray-200'
                  }`}
                >
                  <Send
                    size={20}
                    color={messageText.trim() ? '#FFFFFF' : '#9CA3AF'}
                  />
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
