import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Heart,
  Users,
  Send,
  MessageCircle,
  Calendar,
  Shield,
  Plus,
  ThumbsUp,
  MoreHorizontal,
  Lock,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/lib/store';

// Support circle data
const CIRCLES = {
  grief: {
    id: 'grief',
    name: 'Grief & Loss Support',
    description: 'A safe space to process grief and find comfort in shared experiences.',
    memberCount: 156,
    color: ['#8B5CF6', '#7C3AED'] as [string, string],
    icon: Heart,
    rules: [
      'Everything shared here stays here',
      'Listen without judgment',
      'No unsolicited advice',
      'Respect everyone\'s pace of healing',
    ],
  },
  anxiety: {
    id: 'anxiety',
    name: 'Anxiety & Stress',
    description: 'Share coping strategies and support each other through anxious times.',
    memberCount: 234,
    color: ['#3B82F6', '#2563EB'] as [string, string],
    icon: Shield,
    rules: [
      'Be kind and supportive',
      'Share what helps you',
      'Triggers should be warned',
      'Professional help is encouraged',
    ],
  },
  immigration: {
    id: 'immigration',
    name: 'Immigration Stress',
    description: 'Understanding the unique challenges of living between two worlds.',
    memberCount: 312,
    color: ['#10B981', '#059669'] as [string, string],
    icon: Users,
    rules: [
      'All experiences are valid',
      'Support over judgment',
      'Share resources freely',
      'Respect different journeys',
    ],
  },
};

// Mock posts
interface SupportPost {
  id: string;
  author: {
    name: string;
    avatar: string;
    memberSince: string;
  };
  content: string;
  createdAt: string;
  hugs: number;
  replies: number;
  hasGivenHug: boolean;
}

const MOCK_POSTS: SupportPost[] = [
  {
    id: 'sp1',
    author: {
      name: 'Anonymous Member',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
      memberSince: '6 months',
    },
    content: 'Today marks one year since I lost my father. I thought it would get easier, but some days still feel impossible. Thank you all for being here when I need to talk.',
    createdAt: '3 hours ago',
    hugs: 47,
    replies: 23,
    hasGivenHug: false,
  },
  {
    id: 'sp2',
    author: {
      name: 'Anonymous Member',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
      memberSince: '2 months',
    },
    content: 'I finally went to therapy today. It was scary but I\'m proud of myself. This group gave me the courage to take that step. 💜',
    createdAt: '5 hours ago',
    hugs: 89,
    replies: 34,
    hasGivenHug: true,
  },
  {
    id: 'sp3',
    author: {
      name: 'Anonymous Member',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      memberSince: '1 year',
    },
    content: 'For those struggling today: you are not alone. Whatever you\'re carrying right now, this community sees you and we\'re here. One day at a time.',
    createdAt: '1 day ago',
    hugs: 156,
    replies: 45,
    hasGivenHug: false,
  },
];

export default function SupportCircleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = useStore((s) => s.currentUser);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [newPost, setNewPost] = useState('');
  const [showRules, setShowRules] = useState(true);

  // Get circle data
  const circle = CIRCLES[id as keyof typeof CIRCLES] || CIRCLES.grief;
  const CircleIcon = circle.icon;

  const handleHug = (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              hasGivenHug: !post.hasGivenHug,
              hugs: post.hasGivenHug ? post.hugs - 1 : post.hugs + 1,
            }
          : post
      )
    );
  };

  const handlePost = () => {
    if (!newPost.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const post: SupportPost = {
      id: `sp${Date.now()}`,
      author: {
        name: 'Anonymous Member',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
        memberSince: 'Just joined',
      },
      content: newPost,
      createdAt: 'Just now',
      hugs: 0,
      replies: 0,
      hasGivenHug: false,
    };

    setPosts([post, ...posts]);
    setNewPost('');
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)}>
          <LinearGradient
            colors={circle.color}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}
          >
            <View className="flex-row items-center">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                className="mr-4 p-1"
                hitSlop={8}
              >
                <ArrowLeft size={24} color="#FFFFFF" />
              </Pressable>
              <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
                <CircleIcon size={20} color="#FFFFFF" />
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-white font-bold text-lg">{circle.name}</Text>
                <View className="flex-row items-center">
                  <Lock size={12} color="#FFFFFF" />
                  <Text className="text-white/70 text-sm ml-1">
                    Private • {circle.memberCount} members
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Safety Rules Banner */}
          {showRules && (
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-4 pt-4">
              <View className="bg-purple-50 rounded-xl p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Shield size={18} color="#7C3AED" />
                    <Text className="text-purple-700 font-semibold ml-2">Safe Space Guidelines</Text>
                  </View>
                  <Pressable
                    onPress={() => setShowRules(false)}
                    className="p-1"
                  >
                    <Text className="text-purple-500 text-sm">Hide</Text>
                  </Pressable>
                </View>
                {circle.rules.map((rule, index) => (
                  <View key={index} className="flex-row items-start mt-2">
                    <Text className="text-purple-500 mr-2">•</Text>
                    <Text className="text-purple-600 text-sm flex-1">{rule}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Description */}
          <Animated.View entering={FadeInUp.duration(400).delay(150)} className="px-4 pt-4">
            <Text className="text-gray-600">{circle.description}</Text>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-4 pt-4">
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                className="flex-1 bg-white rounded-xl p-4 flex-row items-center justify-center"
              >
                <Calendar size={18} color="#7C3AED" />
                <Text className="text-purple-600 font-medium ml-2">Group Sessions</Text>
              </Pressable>
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                className="flex-1 bg-white rounded-xl p-4 flex-row items-center justify-center"
              >
                <Users size={18} color="#7C3AED" />
                <Text className="text-purple-600 font-medium ml-2">Resources</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Posts */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-4 pt-4">
            <Text className="text-lg font-bold text-warmBrown mb-4">Community Posts</Text>

            {posts.map((post, index) => (
              <Animated.View
                key={post.id}
                entering={FadeInUp.duration(300).delay(350 + index * 50)}
                className="bg-white rounded-xl p-4 mb-4"
              >
                {/* Author */}
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center">
                    <Users size={20} color="#7C3AED" />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-warmBrown font-semibold">{post.author.name}</Text>
                    <Text className="text-gray-500 text-sm">
                      Member for {post.author.memberSince} • {post.createdAt}
                    </Text>
                  </View>
                  <Pressable className="p-2">
                    <MoreHorizontal size={20} color="#9CA3AF" />
                  </Pressable>
                </View>

                {/* Content */}
                <Text className="text-warmBrown mt-3 leading-6">{post.content}</Text>

                {/* Actions */}
                <View className="flex-row items-center mt-4 pt-3 border-t border-gray-100">
                  <Pressable
                    onPress={() => handleHug(post.id)}
                    className="flex-row items-center mr-6"
                  >
                    <Heart
                      size={20}
                      color={post.hasGivenHug ? '#EC4899' : '#9CA3AF'}
                      fill={post.hasGivenHug ? '#EC4899' : 'transparent'}
                    />
                    <Text
                      className={`ml-2 font-medium ${
                        post.hasGivenHug ? 'text-pink-500' : 'text-gray-500'
                      }`}
                    >
                      {post.hugs} hugs
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    className="flex-row items-center"
                  >
                    <MessageCircle size={20} color="#9CA3AF" />
                    <Text className="text-gray-500 ml-2 font-medium">
                      {post.replies} replies
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        </ScrollView>

        {/* Compose Post */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
            <SafeAreaView edges={['bottom']}>
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center">
                  <Users size={20} color="#7C3AED" />
                </View>
                <View className="flex-1 mx-3 bg-gray-100 rounded-full px-4 py-2">
                  <TextInput
                    placeholder="Share with the circle (posted anonymously)..."
                    placeholderTextColor="#9CA3AF"
                    value={newPost}
                    onChangeText={setNewPost}
                    className="text-warmBrown text-base"
                    multiline
                    style={{ maxHeight: 80 }}
                  />
                </View>
                <Pressable
                  onPress={handlePost}
                  disabled={!newPost.trim()}
                  style={{ opacity: newPost.trim() ? 1 : 0.5 }}
                >
                  <LinearGradient
                    colors={circle.color}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Send size={18} color="#FFFFFF" />
                  </LinearGradient>
                </Pressable>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
