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
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  Send,
  MoreVertical,
  Ban,
  Flag,
  X,
  Shield,
  AlertTriangle,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import * as DropdownMenu from 'zeego/dropdown-menu';
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
import { reportBlockedUser } from '@/lib/reports';
import type { ViolationType } from '@/lib/contentModeration';
import { aiTrustSafety, type AiTrustSafetyResult } from '@/lib/aiTrustSafety';

// Report reasons for App Store Guideline 1.2 compliance
const REPORT_REASONS: { id: ViolationType | 'other'; label: string; description: string }[] = [
  { id: 'harassment', label: 'Harassment or Bullying', description: 'Targeting, intimidating, or threatening behavior' },
  { id: 'hate_speech', label: 'Hate Speech', description: 'Content promoting discrimination or hatred' },
  { id: 'sexual', label: 'Sexual Content', description: 'Inappropriate sexual content or solicitation' },
  { id: 'violence', label: 'Violence or Threats', description: 'Threatening violence or glorifying harm' },
  { id: 'scam', label: 'Scam or Fraud', description: 'Deceptive behavior or fraudulent activity' },
  { id: 'spam', label: 'Spam', description: 'Repetitive, unwanted, or misleading content' },
  { id: 'other', label: 'Other', description: 'Other violation of community guidelines' },
];

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
}

export default function ChatScreen() {
  const { id, name, avatar, recipientId, prefill } = useLocalSearchParams<{
    id: string;
    name: string;
    avatar: string;
    recipientId: string;
    prefill?: string;
  }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const decodedPrefill = prefill ? decodeURIComponent(prefill) : '';
  const [messageText, setMessageText] = useState(decodedPrefill);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportStep, setReportStep] = useState<'reason' | 'confirm' | 'done'>('reason');
  const [selectedReason, setSelectedReason] = useState<ViolationType | 'other' | null>(null);
  const [showBlockConfirmModal, setShowBlockConfirmModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyBusy, setSafetyBusy] = useState(false);
  const [safetyResult, setSafetyResult] = useState<AiTrustSafetyResult | null>(null);

  const currentUser = useStore((s) => s.currentUser);
  const blockUser = useStore((s) => s.blockUser);
  const blockedUserIds = useStore((s) => s.blockedUserIds);

  const decodedAvatar = avatar ? decodeURIComponent(avatar) : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
  const decodedName = name ? decodeURIComponent(name) : 'User';

  const routeId = id ? String(id) : '';
  const isBusinessConversation = routeId.startsWith('business_');

  // Some entry points navigate to `/chat/<userId>` without query params. Treat routeId as recipientId (unless business chat).
  const effectiveRecipientId = recipientId
    ? String(recipientId)
    : !isBusinessConversation && routeId
      ? routeId
      : '';

  // Check if user is blocked
  const isBlocked = effectiveRecipientId ? blockedUserIds.includes(effectiveRecipientId) : false;

  // Load or create conversation and messages
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let isSubscribed = true;
    let activeConvId: string | null = null;

    const initializeChat = async () => {
      if (!currentUser?.id) {
        setIsLoading(false);
        return;
      }

      try {
        let convId: string | null = null;
        if (isBusinessConversation) {
          // Business chats use a stable conversation id like `business_<businessId>`
          convId = routeId;
        } else {
          if (!effectiveRecipientId) {
            setIsLoading(false);
            return;
          }
          // Get or create conversation for two users
          convId = await getOrCreateConversation(currentUser.id, effectiveRecipientId);
        }

        activeConvId = convId;
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
      if (activeConvId) {
        unsubscribeFromMessages(activeConvId);
      }
    };
  }, [currentUser?.id, effectiveRecipientId, isBusinessConversation, routeId]);

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

  const runThreadSafetyCheck = async () => {
    if (safetyBusy) return;
    setSafetyBusy(true);
    setSafetyResult(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const last = messages
        .slice(-12)
        .map((m) => `${m.senderId === currentUser?.id ? 'Me' : 'Them'}: ${m.content}`)
        .join('\n');
      const res = await aiTrustSafety({ kind: 'dm_thread', text: last || messageText || '' });
      setSafetyResult(res);
      setShowSafetyModal(true);
    } catch (e) {
      console.log('[Chat] safety check failed:', e);
      Alert.alert('Safety check failed', 'Please try again in a moment.');
    } finally {
      setSafetyBusy(false);
    }
  };

  const handleBlockUser = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowBlockConfirmModal(true);
  };

  const confirmBlockUser = () => {
    if (!recipientId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Block the user - this automatically reports to moderation (App Store Guideline 1.2)
    blockUser(recipientId, decodedName, decodedAvatar);

    setShowBlockConfirmModal(false);

    // Show confirmation and navigate back
    Alert.alert(
      'User Blocked',
      `${decodedName} has been blocked and reported to our moderation team. You won't see their messages anymore.`,
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleReportUser = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setReportStep('reason');
    setSelectedReason(null);
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!selectedReason || !currentUser?.id || !recipientId) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Report the user to moderation
    await reportBlockedUser(currentUser.id, recipientId, decodedName);

    setReportStep('done');

    // Auto-close after 2 seconds
    setTimeout(() => {
      setShowReportModal(false);
      setReportStep('reason');
      setSelectedReason(null);
    }, 2000);
  };

  // If user is blocked, show blocked state
  if (isBlocked) {
    return (
      <View className="flex-1 bg-cream">
        <SafeAreaView edges={['top']} className="flex-1">
          <Animated.View
            entering={FadeIn.duration(300)}
            className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100"
          >
            <Pressable onPress={handleBack} className="p-1">
              <ChevronLeft size={28} color="#2D1F1A" />
            </Pressable>
            <Text className="text-xl font-bold text-warmBrown flex-1 ml-3">Chat</Text>
          </Animated.View>

          <View className="flex-1 items-center justify-center px-8">
            <View className="bg-red-100 rounded-full p-6 mb-4">
              <Ban size={48} color="#EF4444" />
            </View>
            <Text className="text-xl font-bold text-warmBrown text-center">User Blocked</Text>
            <Text className="text-gray-500 text-center mt-2">
              You have blocked this user. You cannot send or receive messages from them.
            </Text>
            <Pressable
              onPress={() => router.push('/settings')}
              className="mt-6 bg-gray-100 rounded-full px-6 py-3"
            >
              <Text className="text-warmBrown font-medium">Go to Settings</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Pressable className="p-2" hitSlop={8}>
                <MoreVertical size={22} color="#8B7355" />
              </Pressable>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item key="safety" onSelect={runThreadSafetyCheck}>
                <DropdownMenu.ItemIcon ios={{ name: 'shield' }} />
                <DropdownMenu.ItemTitle>Safety check (AI)</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
              <DropdownMenu.Item key="report" onSelect={handleReportUser}>
                <DropdownMenu.ItemIcon ios={{ name: 'flag' }} />
                <DropdownMenu.ItemTitle>Report User</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
              <DropdownMenu.Item key="block" onSelect={handleBlockUser} destructive>
                <DropdownMenu.ItemIcon ios={{ name: 'nosign' }} />
                <DropdownMenu.ItemTitle>Block User</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
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
                  disabled={!messageText.trim() || isSending || !conversationId}
                  className={`ml-2 p-3 rounded-full ${
                    messageText.trim() && !isSending && conversationId ? 'bg-terracotta-500' : 'bg-gray-200'
                  }`}
                >
                  {isSending ? (
                    <ActivityIndicator size={20} color="#9CA3AF" />
                  ) : (
                    <Send
                      size={20}
                      color={messageText.trim() && conversationId ? '#FFFFFF' : '#9CA3AF'}
                    />
                  )}
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Block Confirmation Modal */}
      <Modal
        visible={showBlockConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBlockConfirmModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center px-6"
          onPress={() => setShowBlockConfirmModal(false)}
        >
          <Animated.View
            entering={SlideInUp.duration(300)}
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View className="items-center pt-6 pb-4 px-6">
                <View className="bg-red-100 rounded-full p-4 mb-4">
                  <Ban size={32} color="#DC2626" />
                </View>
                <Text className="text-xl font-bold text-warmBrown text-center">
                  Block {decodedName}?
                </Text>
                <Text className="text-gray-500 text-center mt-2 leading-5">
                  When you block someone:
                </Text>
                <View className="mt-3 w-full">
                  <Text className="text-gray-600 text-sm mb-1">• You won't see their messages</Text>
                  <Text className="text-gray-600 text-sm mb-1">• They can't send you messages</Text>
                  <Text className="text-gray-600 text-sm mb-1">• Their content is hidden from your feed</Text>
                  <Text className="text-gray-600 text-sm">• Our team will be notified to review</Text>
                </View>
              </View>

              <View className="border-t border-gray-100 flex-row">
                <Pressable
                  onPress={() => setShowBlockConfirmModal(false)}
                  className="flex-1 py-4 border-r border-gray-100"
                >
                  <Text className="text-center font-semibold text-gray-600">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={confirmBlockUser}
                  className="flex-1 py-4"
                >
                  <Text className="text-center font-semibold text-red-600">Block</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View className="flex-1 bg-black/50">
          <Pressable
            className="flex-1"
            onPress={() => setShowReportModal(false)}
          />
          <Animated.View
            entering={SlideInUp.duration(300)}
            className="bg-white rounded-t-3xl max-h-[80%]"
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <Text className="text-lg font-bold text-warmBrown">
                {reportStep === 'done' ? 'Report Submitted' : 'Report User'}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowReportModal(false);
                }}
                className="p-1"
                hitSlop={8}
              >
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Content */}
            <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
              {reportStep === 'reason' && (
                <>
                  <Text className="text-gray-600 mb-4">
                    Why are you reporting {decodedName}? This will help our moderation team review the report.
                  </Text>

                  {REPORT_REASONS.map((reason) => (
                    <Pressable
                      key={reason.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedReason(reason.id);
                        setReportStep('confirm');
                      }}
                      className="flex-row items-center py-4 border-b border-gray-100"
                    >
                      <View className="flex-1">
                        <Text className="text-warmBrown font-medium">{reason.label}</Text>
                        <Text className="text-gray-500 text-sm mt-0.5">{reason.description}</Text>
                      </View>
                    </Pressable>
                  ))}

                  <View className="flex-row items-start bg-amber-50 rounded-xl p-3 mt-4">
                    <AlertTriangle size={16} color="#D97706" />
                    <Text className="flex-1 text-amber-700 text-xs ml-2">
                      False reports may result in your account being restricted.
                    </Text>
                  </View>
                </>
              )}

              {reportStep === 'confirm' && (
                <View className="items-center py-4">
                  <View className="bg-amber-100 rounded-full p-4 mb-4">
                    <Flag size={32} color="#D97706" />
                  </View>
                  <Text className="text-lg font-bold text-warmBrown text-center">
                    Confirm Report
                  </Text>
                  <Text className="text-gray-500 text-center mt-2">
                    You're reporting {decodedName} for:
                  </Text>
                  <View className="bg-gray-100 rounded-xl px-4 py-2 mt-3">
                    <Text className="text-warmBrown font-medium">
                      {REPORT_REASONS.find((r) => r.id === selectedReason)?.label}
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-sm text-center mt-4">
                    Our moderation team will review this report.
                  </Text>

                  <View className="flex-row mt-6 w-full">
                    <Pressable
                      onPress={() => setReportStep('reason')}
                      className="flex-1 bg-gray-100 rounded-xl py-3 mr-2"
                    >
                      <Text className="text-gray-600 font-medium text-center">Back</Text>
                    </Pressable>
                    <Pressable
                      onPress={submitReport}
                      className="flex-1 bg-amber-500 rounded-xl py-3 ml-2"
                    >
                      <Text className="text-white font-medium text-center">Submit Report</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {reportStep === 'done' && (
                <View className="items-center py-8">
                  <View className="bg-green-100 rounded-full p-4 mb-4">
                    <Shield size={32} color="#22C55E" />
                  </View>
                  <Text className="text-lg font-bold text-warmBrown text-center">
                    Thank You
                  </Text>
                  <Text className="text-gray-500 text-center mt-2">
                    Your report has been submitted. Our team will review it.
                  </Text>
                </View>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* AI Safety Result Modal */}
      <Modal visible={showSafetyModal} transparent animationType="slide" onRequestClose={() => setShowSafetyModal(false)}>
        <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowSafetyModal(false)}>
          <Pressable className="bg-white rounded-t-3xl px-5 pt-5 pb-8" onPress={(e) => e.stopPropagation()}>
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-warmBrown">Safety Check</Text>
              <Pressable onPress={() => setShowSafetyModal(false)} className="p-2">
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>

            {safetyResult ? (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <View className="mt-3 bg-gray-50 rounded-2xl p-4">
                  <Text className="text-gray-500 text-xs font-bold">RISK</Text>
                  <Text className="text-warmBrown font-bold text-xl mt-1">
                    {safetyResult.risk.toUpperCase()} ({safetyResult.score}/100)
                  </Text>
                  <Text className="text-gray-600 mt-2">{safetyResult.recommendation}</Text>
                </View>

                {safetyResult.red_flags?.length ? (
                  <View className="mt-3">
                    <Text className="text-warmBrown font-bold mb-2">Red flags</Text>
                    {safetyResult.red_flags.map((x, i) => (
                      <Text key={i} className="text-gray-700">• {x}</Text>
                    ))}
                  </View>
                ) : null}

                {safetyResult.suggested_questions?.length ? (
                  <View className="mt-3">
                    <Text className="text-warmBrown font-bold mb-2">Questions to ask</Text>
                    {safetyResult.suggested_questions.map((x, i) => (
                      <Text key={i} className="text-gray-700">• {x}</Text>
                    ))}
                  </View>
                ) : null}
              </ScrollView>
            ) : (
              <View className="py-8 items-center">
                <ActivityIndicator />
                <Text className="text-gray-500 mt-2">Working…</Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
