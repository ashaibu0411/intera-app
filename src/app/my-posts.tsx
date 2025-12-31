import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowLeft, Heart, MessageCircle, MapPin, Trash2, MoreVertical, Video } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore, MOCK_POSTS, type Post } from '@/lib/store';

function PostCard({ post, onDelete, canDelete }: { post: Post; onDelete: () => void; canDelete: boolean }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowDeleteConfirm(false);
    onDelete();
  };

  return (
    <>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/post/${post.id}`);
        }}
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
      >
        {/* Header with menu */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-400 text-xs">{timeAgo(post.createdAt)}</Text>
          {canDelete && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowMenu(true);
              }}
              className="p-1"
              hitSlop={8}
            >
              <MoreVertical size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>

        <Text className="text-warmBrown text-base leading-6">{post.content}</Text>

        {post.images.length > 0 && (
          <View className="mt-3 rounded-xl overflow-hidden">
            <Image
              source={{ uri: post.images[0] }}
              style={{ width: '100%', height: 200 }}
              contentFit="cover"
            />
          </View>
        )}

        {post.video && (
          <View className="mt-3 rounded-xl overflow-hidden bg-gray-900" style={{ height: 200 }}>
            <View className="flex-1 items-center justify-center">
              <View className="bg-white/20 rounded-full p-4">
                <Video size={32} color="#FFFFFF" />
              </View>
              <Text className="text-white/80 mt-2 text-sm">Video post</Text>
            </View>
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
          </View>
        </View>
      </Pressable>

      {/* Menu Modal */}
      <Modal visible={showMenu} animationType="fade" transparent>
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowMenu(false)}
        >
          <View className="bg-white rounded-t-3xl">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mt-3" />
            <Pressable
              onPress={handleDelete}
              className="flex-row items-center px-5 py-4 border-b border-gray-100"
            >
              <View className="bg-red-100 rounded-full p-2 mr-3">
                <Trash2 size={20} color="#EF4444" />
              </View>
              <Text className="text-red-500 font-medium text-base">Delete Post</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowMenu(false)}
              className="px-5 py-4"
            >
              <Text className="text-gray-500 font-medium text-center">Cancel</Text>
            </Pressable>
            <View className="h-8" />
          </View>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} animationType="fade" transparent>
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full p-6">
            <View className="items-center mb-4">
              <View className="bg-red-100 rounded-full p-4 mb-3">
                <Trash2 size={28} color="#EF4444" />
              </View>
              <Text className="text-xl font-bold text-warmBrown mb-2">Delete Post?</Text>
              <Text className="text-gray-500 text-center">
                This action cannot be undone. Your post will be permanently removed.
              </Text>
            </View>
            <View className="flex-row space-x-3 mt-4">
              <Pressable
                onPress={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-100 rounded-xl py-3"
              >
                <Text className="text-warmBrown font-medium text-center">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                className="flex-1 bg-red-500 rounded-xl py-3 ml-3"
              >
                <Text className="text-white font-medium text-center">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function MyPostsScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const userPosts = useStore((s) => s.userPosts);
  const deletePost = useStore((s) => s.deletePost);

  // Get posts from both user-created posts and mock posts if user matches
  const allUserPosts = [
    ...userPosts,
    ...MOCK_POSTS.filter((p) => currentUser && p.author.id === currentUser.id),
  ];

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
          <Text className="text-xl font-bold text-warmBrown">My Posts</Text>
          <View className="ml-2 bg-terracotta-100 rounded-full px-2 py-0.5">
            <Text className="text-terracotta-600 font-medium text-sm">{allUserPosts.length}</Text>
          </View>
        </Animated.View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {allUserPosts.length === 0 ? (
            <Animated.View
              entering={FadeInUp.duration(400).delay(100)}
              className="items-center justify-center py-20"
            >
              <Text className="text-6xl mb-4">📝</Text>
              <Text className="text-lg font-semibold text-warmBrown mb-2">No posts yet</Text>
              <Text className="text-gray-500 text-center px-8">
                Share your first post with the community!
              </Text>
            </Animated.View>
          ) : (
            allUserPosts.map((post, index) => {
              // Only allow delete for user-created posts (not mock posts)
              const canDelete = userPosts.some((p) => p.id === post.id);
              return (
                <Animated.View
                  key={post.id}
                  entering={FadeInUp.duration(300).delay(index * 50)}
                >
                  <PostCard
                    post={post}
                    canDelete={canDelete}
                    onDelete={() => deletePost(post.id)}
                  />
                </Animated.View>
              );
            })
          )}
          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
