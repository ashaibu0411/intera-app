import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Share2,
  Send,
  MoreHorizontal,
  MapPin,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, useSharedValue, useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import {
  useStore,
  MOCK_POSTS,
  MOCK_COMMENTS,
  type Comment,
} from '@/lib/store';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState<Comment[]>([]);

  const isGuest = useStore((s) => s.isGuest);
  const currentUser = useStore((s) => s.currentUser);

  const post = useMemo(() => MOCK_POSTS.find((p) => p.id === id), [id]);

  const comments = useMemo(() => {
    const mockComments = MOCK_COMMENTS.filter((c) => c.postId === id);
    return [...mockComments, ...localComments];
  }, [id, localComments]);

  const [isLiked, setIsLiked] = useState(post?.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post?.likes ?? 0);
  const likeScale = useSharedValue(1);

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  if (!post) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <Text className="text-gray-500">Post not found</Text>
      </View>
    );
  }

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    likeScale.value = withSequence(
      withSpring(1.3, { damping: 2, stiffness: 200 }),
      withSpring(1, { damping: 6, stiffness: 200 })
    );

    if (isLiked) {
      setLikeCount((prev) => prev - 1);
    } else {
      setLikeCount((prev) => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Check out this post from ${post.author.name} on AfroConnect:\n\n"${post.content}"\n\nJoin our community: afroconnect.app`,
        title: 'Share Post',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handleSendComment = () => {
    if (!commentText.trim()) return;

    if (isGuest || !currentUser) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/signup');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const newComment: Comment = {
      id: `local-${Date.now()}`,
      postId: id || '',
      author: currentUser,
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      likes: 0,
    };

    setLocalComments((prev) => [...prev, newComment]);
    setCommentText('');

    // Scroll to bottom after adding comment
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center px-4 py-3 bg-cream border-b border-gray-100"
        >
          <Pressable
            onPress={handleBack}
            className="bg-white rounded-full p-2 shadow-sm"
          >
            <ChevronLeft size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-semibold text-warmBrown">
            Post
          </Text>
          <Pressable className="p-2">
            <MoreHorizontal size={24} color="#2D1F1A" />
          </Pressable>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Post Content */}
            <Animated.View
              entering={FadeInUp.duration(400).delay(100)}
              className="bg-white mx-4 mt-4 rounded-2xl shadow-sm overflow-hidden"
            >
              {/* Author Header */}
              <View className="flex-row items-center p-4 pb-3">
                <Image
                  source={{ uri: post.author.avatar }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                  contentFit="cover"
                />
                <View className="flex-1 ml-3">
                  <Text className="text-warmBrown font-semibold text-base">
                    {post.author.name}
                  </Text>
                  <View className="flex-row items-center mt-0.5">
                    <MapPin size={12} color="#8B7355" />
                    <Text className="text-sm text-gray-500 ml-1">{post.location}</Text>
                    <Text className="text-sm text-gray-400 mx-1">·</Text>
                    <Text className="text-sm text-gray-400">{timeAgo}</Text>
                  </View>
                </View>
              </View>

              {/* Post Text */}
              <View className="px-4 pb-3">
                <Text className="text-warmBrown text-base leading-6">
                  {post.content}
                </Text>
              </View>

              {/* Post Image */}
              {post.images.length > 0 && (
                <View className="px-4 pb-3">
                  <Image
                    source={{ uri: post.images[0] }}
                    style={{ width: '100%', height: 250, borderRadius: 12 }}
                    contentFit="cover"
                  />
                </View>
              )}

              {/* Actions */}
              <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
                <Pressable onPress={handleLike} className="flex-row items-center mr-6">
                  <Animated.View style={likeAnimatedStyle}>
                    <Heart
                      size={24}
                      color={isLiked ? '#D4673A' : '#8B7355'}
                      fill={isLiked ? '#D4673A' : 'transparent'}
                    />
                  </Animated.View>
                  <Text
                    className={`ml-2 text-sm font-medium ${
                      isLiked ? 'text-terracotta-500' : 'text-gray-500'
                    }`}
                  >
                    {likeCount}
                  </Text>
                </Pressable>

                <View className="flex-row items-center mr-6">
                  <MessageCircle size={24} color="#8B7355" />
                  <Text className="ml-2 text-sm font-medium text-gray-500">
                    {comments.length}
                  </Text>
                </View>

                <Pressable onPress={handleShare} className="flex-row items-center">
                  <Share2 size={22} color="#8B7355" />
                </Pressable>
              </View>
            </Animated.View>

            {/* Comments Section */}
            <View className="mt-4 px-4">
              <Text className="text-lg font-bold text-warmBrown mb-3">
                Comments ({comments.length})
              </Text>

              {comments.length === 0 ? (
                <Animated.View
                  entering={FadeInUp.duration(400).delay(200)}
                  className="bg-white rounded-2xl p-6 items-center"
                >
                  <MessageCircle size={40} color="#D1D5DB" />
                  <Text className="text-gray-400 mt-2 text-center">
                    No comments yet. Be the first to comment!
                  </Text>
                </Animated.View>
              ) : (
                comments.map((comment, index) => (
                  <Animated.View
                    key={comment.id}
                    entering={FadeInUp.duration(300).delay(200 + index * 50)}
                    className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                  >
                    <View className="flex-row items-start">
                      <Image
                        source={{ uri: comment.author.avatar }}
                        style={{ width: 36, height: 36, borderRadius: 18 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 ml-3">
                        <View className="flex-row items-center">
                          <Text className="font-semibold text-warmBrown">
                            {comment.author.name}
                          </Text>
                          <Text className="text-xs text-gray-400 ml-2">
                            {formatDistanceToNow(new Date(comment.createdAt), {
                              addSuffix: true,
                            })}
                          </Text>
                        </View>
                        <Text className="text-warmBrown mt-1 leading-5">
                          {comment.content}
                        </Text>
                        <View className="flex-row items-center mt-2">
                          <Pressable className="flex-row items-center">
                            <Heart size={16} color="#8B7355" />
                            <Text className="text-xs text-gray-500 ml-1">
                              {comment.likes}
                            </Text>
                          </Pressable>
                          <Pressable className="flex-row items-center ml-4">
                            <Text className="text-xs text-gray-500">Reply</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </Animated.View>
                ))
              )}
            </View>
          </ScrollView>

          {/* Comment Input */}
          <View className="bg-white border-t border-gray-100 px-4 py-3">
            <SafeAreaView edges={['bottom']}>
              <View className="flex-row items-center">
                <Image
                  source={{
                    uri: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
                  }}
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                  contentFit="cover"
                />
                <View className="flex-1 flex-row items-center bg-gray-100 rounded-full ml-3 px-4 py-2">
                  <TextInput
                    placeholder={
                      isGuest || !currentUser
                        ? 'Sign up to comment...'
                        : 'Write a comment...'
                    }
                    placeholderTextColor="#9CA3AF"
                    value={commentText}
                    onChangeText={setCommentText}
                    className="flex-1 text-warmBrown text-sm"
                    multiline
                    maxLength={500}
                    editable={!isGuest && !!currentUser}
                    onFocus={() => {
                      if (isGuest || !currentUser) {
                        router.push('/signup');
                      }
                    }}
                  />
                </View>
                <Pressable
                  onPress={handleSendComment}
                  disabled={!commentText.trim()}
                  className={`ml-2 p-2 rounded-full ${
                    commentText.trim() ? 'bg-terracotta-500' : 'bg-gray-200'
                  }`}
                >
                  <Send
                    size={20}
                    color={commentText.trim() ? '#FFFFFF' : '#9CA3AF'}
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
