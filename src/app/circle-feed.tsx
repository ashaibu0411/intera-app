import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Users,
  Globe,
  GraduationCap,
  Church,
  Briefcase,
  Baby,
  Heart,
  MapPin,
  Send,
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Calendar,
  Image as ImageIcon,
  Link,
  Languages,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/lib/store';

// Circle data mapping
const CIRCLES = {
  c1: {
    id: 'c1',
    name: 'First-Gen Africans',
    description: 'Born in Africa, now living abroad. Share experiences of adapting while preserving roots.',
    icon: Globe,
    memberCount: 2453,
    color: ['#8B5CF6', '#7C3AED'] as [string, string],
  },
  c3: {
    id: 'c3',
    name: 'Diaspora Students',
    description: 'International students and those pursuing education abroad.',
    icon: GraduationCap,
    memberCount: 3241,
    color: ['#3B82F6', '#2563EB'] as [string, string],
  },
  c5: {
    id: 'c5',
    name: 'Diaspora Professionals',
    description: 'Career networking and professional development.',
    icon: Briefcase,
    memberCount: 4521,
    color: ['#10B981', '#059669'] as [string, string],
  },
  c8: {
    id: 'c8',
    name: 'Diaspora Entrepreneurs',
    description: 'Building businesses that bridge continents.',
    icon: Briefcase,
    memberCount: 2156,
    color: ['#EF4444', '#DC2626'] as [string, string],
  },
};

// Post interface
interface CirclePost {
  id: string;
  author: {
    name: string;
    avatar: string;
    city: string;
    badge?: string;
  };
  content: string;
  image?: string;
  createdAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

// Mock posts
const MOCK_POSTS: CirclePost[] = [
  {
    id: 'p1',
    author: {
      name: 'Amara Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
      city: 'Aurora, CO',
      badge: 'Welcomer',
    },
    content: 'Just helped a family from Ghana settle in Aurora! They were looking for African grocery stores and I connected them with 3 amazing shops. This is what community is all about! 🇬🇭❤️',
    createdAt: '2 hours ago',
    likes: 47,
    comments: 12,
    isLiked: false,
  },
  {
    id: 'p2',
    author: {
      name: 'Kwame Asante',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      city: 'Denver, CO',
    },
    content: 'Does anyone know a good immigration lawyer in the Denver area? Need help with my green card renewal. Any recommendations would be appreciated!',
    createdAt: '5 hours ago',
    likes: 23,
    comments: 34,
    isLiked: true,
  },
  {
    id: 'p3',
    author: {
      name: 'Fatima Hassan',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
      city: 'Chicago, IL',
      badge: 'Mentor',
    },
    content: 'Throwback to our community picnic last summer. Can\'t wait for the spring gathering! Who\'s planning to come this year?',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=400&fit=crop',
    createdAt: '1 day ago',
    likes: 89,
    comments: 28,
    isLiked: false,
  },
  {
    id: 'p4',
    author: {
      name: 'David Mensah',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
      city: 'Atlanta, GA',
    },
    content: 'Just got promoted to Senior Engineer! Thank you to everyone in this circle who helped me prep for interviews and reviewed my resume. This community is amazing! 🎉',
    createdAt: '2 days ago',
    likes: 156,
    comments: 45,
    isLiked: true,
  },
  {
    id: 'p5',
    author: {
      name: 'Grace Okonkwo',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
      city: 'Houston, TX',
      badge: 'Organizer',
    },
    content: 'ANNOUNCEMENT: We\'re organizing a virtual career fair specifically for diaspora professionals next month. Companies looking to hire diverse talent will be there. More details coming soon!',
    createdAt: '3 days ago',
    likes: 234,
    comments: 67,
    isLiked: false,
  },
];

export default function CircleFeedScreen() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const currentUser = useStore((s) => s.currentUser);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [newPost, setNewPost] = useState('');

  // Get circle data
  const circle = CIRCLES[circleId as keyof typeof CIRCLES] || CIRCLES.c1;
  const CircleIcon = circle.icon;

  const handleLike = (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handlePost = () => {
    if (!newPost.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const post: CirclePost = {
      id: `p${Date.now()}`,
      author: {
        name: currentUser?.name || 'You',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
        city: 'Aurora, CO',
      },
      content: newPost,
      createdAt: 'Just now',
      likes: 0,
      comments: 0,
      isLiked: false,
    };

    setPosts([post, ...posts]);
    setNewPost('');
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="border-b border-gray-100"
        >
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
                <Text className="text-white/70 text-sm">
                  {circle.memberCount.toLocaleString()} members
                </Text>
              </View>
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                className="p-2"
              >
                <MoreHorizontal size={24} color="#FFFFFF" />
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Posts Feed */}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* About Section */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="bg-white mx-4 mt-4 rounded-xl p-4">
            <Text className="text-gray-600 text-sm">{circle.description}</Text>
            <View className="flex-row mt-3 pt-3 border-t border-gray-100">
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                className="flex-1 flex-row items-center justify-center py-2"
              >
                <Users size={18} color="#7C3AED" />
                <Text className="text-purple-600 font-medium ml-2">Members</Text>
              </Pressable>
              <View className="w-px bg-gray-200" />
              <Pressable
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                className="flex-1 flex-row items-center justify-center py-2"
              >
                <Calendar size={18} color="#7C3AED" />
                <Text className="text-purple-600 font-medium ml-2">Events</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Posts */}
          {posts.map((post, index) => (
            <Animated.View
              key={post.id}
              entering={FadeInUp.duration(300).delay(150 + index * 50)}
              className="bg-white mx-4 mt-4 rounded-xl overflow-hidden"
            >
              {/* Post Header */}
              <View className="flex-row items-center p-4">
                <Image
                  source={{ uri: post.author.avatar }}
                  style={{ width: 44, height: 44, borderRadius: 22 }}
                  contentFit="cover"
                />
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center">
                    <Text className="text-warmBrown font-semibold">{post.author.name}</Text>
                    {post.author.badge && (
                      <View className="bg-purple-100 rounded-full px-2 py-0.5 ml-2">
                        <Text className="text-purple-600 text-xs font-medium">
                          {post.author.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="flex-row items-center">
                    <MapPin size={12} color="#9CA3AF" />
                    <Text className="text-gray-500 text-sm ml-1">{post.author.city}</Text>
                    <Text className="text-gray-400 text-sm ml-2">• {post.createdAt}</Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  className="p-2"
                >
                  <MoreHorizontal size={20} color="#9CA3AF" />
                </Pressable>
              </View>

              {/* Post Content */}
              <View className="px-4 pb-3">
                <Text className="text-warmBrown leading-6">{post.content}</Text>
              </View>

              {/* Post Image */}
              {post.image && (
                <Image
                  source={{ uri: post.image }}
                  style={{ width: '100%', height: 200 }}
                  contentFit="cover"
                />
              )}

              {/* Post Actions */}
              <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
                <Pressable
                  onPress={() => handleLike(post.id)}
                  className="flex-row items-center mr-6"
                >
                  <ThumbsUp
                    size={20}
                    color={post.isLiked ? '#7C3AED' : '#9CA3AF'}
                    fill={post.isLiked ? '#7C3AED' : 'transparent'}
                  />
                  <Text
                    className={`ml-2 font-medium ${
                      post.isLiked ? 'text-purple-600' : 'text-gray-500'
                    }`}
                  >
                    {post.likes}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  className="flex-row items-center mr-6"
                >
                  <MessageCircle size={20} color="#9CA3AF" />
                  <Text className="text-gray-500 ml-2 font-medium">{post.comments}</Text>
                </Pressable>
                <Pressable
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  className="flex-row items-center"
                >
                  <Share2 size={20} color="#9CA3AF" />
                </Pressable>
              </View>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Compose Post */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3">
            <SafeAreaView edges={['bottom']}>
              <View className="flex-row items-center">
                <Image
                  source={{
                    uri: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
                  }}
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                  contentFit="cover"
                />
                <View className="flex-1 mx-3 bg-gray-100 rounded-full px-4 py-2 flex-row items-center">
                  <TextInput
                    placeholder="Share with your circle..."
                    placeholderTextColor="#9CA3AF"
                    value={newPost}
                    onChangeText={setNewPost}
                    className="flex-1 text-warmBrown text-base"
                    multiline
                    style={{ maxHeight: 80 }}
                  />
                </View>
                <View className="flex-row items-center">
                  <Pressable
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                    className="p-2 mr-1"
                  >
                    <ImageIcon size={22} color="#9CA3AF" />
                  </Pressable>
                  <Pressable
                    onPress={handlePost}
                    disabled={!newPost.trim()}
                    style={{ opacity: newPost.trim() ? 1 : 0.5 }}
                  >
                    <LinearGradient
                      colors={circle.color}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Send size={18} color="#FFFFFF" />
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </SafeAreaView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
