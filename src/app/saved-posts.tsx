import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowLeft, Heart, MessageCircle, MapPin, Bookmark } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore, MOCK_POSTS, type Post } from '@/lib/store';

function SavedPostCard({ post, onUnsave }: { post: Post; onUnsave: () => void }) {
  const timeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/post/${post.id}`);
      }}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
    >
      {/* Author */}
      <View className="flex-row items-center mb-3">
        <Image
          source={{ uri: post.author.avatar }}
          style={{ width: 36, height: 36, borderRadius: 18 }}
          contentFit="cover"
        />
        <View className="flex-1 ml-3">
          <Text className="text-warmBrown font-semibold">{post.author.name}</Text>
          <Text className="text-gray-400 text-xs">@{post.author.username}</Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onUnsave();
          }}
          className="p-2"
          hitSlop={8}
        >
          <Bookmark size={20} color="#D4673A" fill="#D4673A" />
        </Pressable>
      </View>

      <Text className="text-warmBrown text-base leading-6">{post.content}</Text>

      {post.images.length > 0 && (
        <View className="mt-3 rounded-xl overflow-hidden">
          <Image
            source={{ uri: post.images[0] }}
            style={{ width: '100%', height: 180 }}
            contentFit="cover"
          />
        </View>
      )}

      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <View className="flex-row items-center">
          <MapPin size={14} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs ml-1">{post.location}</Text>
        </View>

        <View className="flex-row items-center space-x-4">
          <View className="flex-row items-center">
            <Heart size={16} color={post.isLiked ? '#EF4444' : '#9CA3AF'} fill={post.isLiked ? '#EF4444' : 'transparent'} />
            <Text className="text-gray-500 text-sm ml-1">{post.likes}</Text>
          </View>
          <View className="flex-row items-center ml-3">
            <MessageCircle size={16} color="#9CA3AF" />
            <Text className="text-gray-500 text-sm ml-1">{post.comments}</Text>
          </View>
          <Text className="text-gray-400 text-xs ml-3">{timeAgo(post.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function SavedPostsScreen() {
  const savedPostIds = useStore((s) => s.savedPostIds);
  const toggleSavePost = useStore((s) => s.toggleSavePost);

  // Get saved posts from mock posts
  const savedPosts = MOCK_POSTS.filter((p) => savedPostIds.includes(p.id));

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center px-5 pt-4 pb-4"
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
          <Text className="text-xl font-bold text-warmBrown">Saved Posts</Text>
          <View className="ml-2 bg-terracotta-100 rounded-full px-2 py-0.5">
            <Text className="text-terracotta-600 font-medium text-sm">{savedPosts.length}</Text>
          </View>
        </Animated.View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {savedPosts.length === 0 ? (
            <Animated.View
              entering={FadeInUp.duration(400).delay(100)}
              className="items-center justify-center py-20"
            >
              <Text className="text-6xl mb-4">🔖</Text>
              <Text className="text-lg font-semibold text-warmBrown mb-2">No saved posts</Text>
              <Text className="text-gray-500 text-center px-8">
                Save posts you want to revisit later by tapping the bookmark icon
              </Text>
            </Animated.View>
          ) : (
            savedPosts.map((post, index) => (
              <Animated.View
                key={post.id}
                entering={FadeInUp.duration(300).delay(index * 50)}
              >
                <SavedPostCard
                  post={post}
                  onUnsave={() => toggleSavePost(post.id)}
                />
              </Animated.View>
            ))
          )}
          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
