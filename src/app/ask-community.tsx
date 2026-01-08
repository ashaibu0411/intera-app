import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  HelpCircle,
  Send,
  ThumbsUp,
  MessageCircle,
  Clock,
  ChevronRight,
  Shield,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { NewArrivalBadge } from '@/components/RoleBadge';

// Common questions for newcomers
const SUGGESTED_QUESTIONS = [
  'Where can I find African grocery stores?',
  'How do I get a drivers license?',
  'What are good schools in this area?',
  'Where do people from my country usually live?',
  'How do I open a bank account?',
  'What public transport options are available?',
  'Where can I find a good doctor?',
  'Are there any cultural events coming up?',
];

// Mock community answers
const MOCK_QUESTIONS = [
  {
    id: 'q1',
    author: {
      name: 'New Arrival',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      isNewArrival: true,
    },
    question: 'Just arrived from Nigeria. Where can I find African grocery stores nearby?',
    answers: 3,
    upvotes: 12,
    createdAt: '2 hours ago',
    tags: ['shopping', 'food'],
  },
  {
    id: 'q2',
    author: {
      name: 'Fatima H.',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
      isNewArrival: true,
    },
    question: 'How do I enroll my kids in school here? What documents do I need?',
    answers: 5,
    upvotes: 24,
    createdAt: '5 hours ago',
    tags: ['schools', 'kids'],
  },
  {
    id: 'q3',
    author: {
      name: 'Carlos M.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      isNewArrival: true,
    },
    question: 'Best way to get around without a car? Is public transport reliable?',
    answers: 8,
    upvotes: 31,
    createdAt: '1 day ago',
    tags: ['transport'],
  },
];

export default function AskCommunityScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const [question, setQuestion] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmitQuestion = () => {
    if (!question.trim()) return;

    if (!currentUser) {
      router.push('/signup');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowSuccess(true);
    setQuestion('');

    // Hide success message after 3 seconds
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSuggestedQuestion = (q: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuestion(q);
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center px-5 pt-4 pb-4 border-b border-gray-100"
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="mr-4 p-1"
            hitSlop={8}
          >
            <ArrowLeft size={24} color="#2D1F1A" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-warmBrown">Ask Anything</Text>
            <Text className="text-gray-500 text-sm">
              No judgment • {selectedLocation?.city || 'Your City'}
            </Text>
          </View>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {/* Info Banner */}
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 pt-5">
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, padding: 16 }}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                    <Shield size={20} color="#FFFFFF" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-white font-bold">Safe Space</Text>
                    <Text className="text-white/80 text-sm">
                      Questions from new arrivals are protected. No stupid questions here.
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Success Message */}
            {showSuccess && (
              <Animated.View
                entering={FadeInUp.duration(300)}
                className="mx-5 mt-4 bg-green-100 rounded-xl p-4 flex-row items-center"
              >
                <View className="w-10 h-10 rounded-full bg-green-500 items-center justify-center">
                  <ThumbsUp size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-green-800 font-semibold">Question Posted!</Text>
                  <Text className="text-green-700 text-sm">
                    Community members will answer soon
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* Suggested Questions */}
            <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 mt-6">
              <Text className="text-lg font-bold text-warmBrown mb-3">
                Common Questions
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -20 }}
                contentContainerStyle={{ paddingHorizontal: 20 }}
              >
                {SUGGESTED_QUESTIONS.map((q, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleSuggestedQuestion(q)}
                    className="bg-white rounded-xl px-4 py-3 mr-2 shadow-sm"
                    style={{ maxWidth: 200 }}
                  >
                    <Text className="text-gray-700 text-sm" numberOfLines={2}>
                      {q}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Animated.View>

            {/* Recent Questions */}
            <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-6">
              <Text className="text-lg font-bold text-warmBrown mb-3">
                Recent Questions
              </Text>

              {MOCK_QUESTIONS.map((q, index) => (
                <Pressable
                  key={q.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Navigate to question detail
                  }}
                  className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                >
                  {/* Author */}
                  <View className="flex-row items-center">
                    <Image
                      source={{ uri: q.author.avatar }}
                      style={{ width: 32, height: 32, borderRadius: 16 }}
                      contentFit="cover"
                    />
                    <Text className="text-gray-700 font-medium ml-2">
                      {q.author.name}
                    </Text>
                    {q.author.isNewArrival && (
                      <View className="ml-2">
                        <NewArrivalBadge size="small" />
                      </View>
                    )}
                    <View className="flex-row items-center ml-auto">
                      <Clock size={14} color="#9CA3AF" />
                      <Text className="text-gray-500 text-sm ml-1">{q.createdAt}</Text>
                    </View>
                  </View>

                  {/* Question */}
                  <Text className="text-warmBrown font-medium mt-3 leading-5">
                    {q.question}
                  </Text>

                  {/* Tags */}
                  <View className="flex-row flex-wrap gap-2 mt-3">
                    {q.tags.map((tag) => (
                      <View
                        key={tag}
                        className="bg-purple-100 rounded-full px-3 py-1"
                      >
                        <Text className="text-purple-700 text-xs font-medium">
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Stats */}
                  <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                    <View className="flex-row items-center">
                      <ThumbsUp size={16} color="#10B981" />
                      <Text className="text-gray-600 text-sm ml-1">{q.upvotes}</Text>
                    </View>
                    <View className="flex-row items-center ml-4">
                      <MessageCircle size={16} color="#6B7280" />
                      <Text className="text-gray-600 text-sm ml-1">
                        {q.answers} answers
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" className="ml-auto" />
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          </ScrollView>

          {/* Question Input */}
          <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4">
            <SafeAreaView edges={['bottom']}>
              <View className="flex-row items-end">
                <View className="flex-1 bg-gray-100 rounded-xl px-4 py-3 mr-3">
                  <TextInput
                    placeholder="Ask your question..."
                    placeholderTextColor="#9CA3AF"
                    value={question}
                    onChangeText={setQuestion}
                    multiline
                    maxLength={500}
                    className="text-warmBrown text-base"
                    style={{ maxHeight: 100 }}
                  />
                </View>
                <Pressable
                  onPress={handleSubmitQuestion}
                  disabled={!question.trim()}
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    question.trim() ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                >
                  <Send size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
