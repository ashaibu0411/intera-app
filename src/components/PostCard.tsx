import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MessageCircle, Share2, MoreHorizontal, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';
import type { Post } from '@/lib/store';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const likeScale = useSharedValue(1);

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
    onLike?.(post.id);
  };

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const cardScale = useSharedValue(1);

  const handlePressIn = () => {
    cardScale.value = withTiming(0.98, { duration: 100 });
  };

  const handlePressOut = () => {
    cardScale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <AnimatedPressable
      style={cardAnimatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className="bg-white rounded-2xl mx-4 mb-4 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <View className="flex-row items-center p-4 pb-3">
        <Image
          source={{ uri: post.author.avatar }}
          style={{ width: 44, height: 44, borderRadius: 22 }}
          contentFit="cover"
        />
        <View className="flex-1 ml-3">
          <Text className="text-warmBrown font-semibold text-base">{post.author.name}</Text>
          <View className="flex-row items-center mt-0.5">
            <MapPin size={12} color="#8B7355" />
            <Text className="text-sm text-gray-500 ml-1">{post.location}</Text>
            <Text className="text-sm text-gray-400 mx-1">·</Text>
            <Text className="text-sm text-gray-400">{timeAgo}</Text>
          </View>
        </View>
        <Pressable className="p-2" hitSlop={8}>
          <MoreHorizontal size={20} color="#8B7355" />
        </Pressable>
      </View>

      {/* Content */}
      <View className="px-4 pb-3">
        <Text className="text-warmBrown text-base leading-6">{post.content}</Text>
      </View>

      {/* Image */}
      {post.images.length > 0 && (
        <View className="px-4 pb-3">
          <Image
            source={{ uri: post.images[0] }}
            style={{ width: '100%', height: 200, borderRadius: 12 }}
            contentFit="cover"
          />
        </View>
      )}

      {/* Actions */}
      <View className="flex-row items-center px-4 py-3 border-t border-gray-100">
        <Pressable onPress={handleLike} className="flex-row items-center mr-6">
          <Animated.View style={likeAnimatedStyle}>
            <Heart
              size={22}
              color={isLiked ? '#D4673A' : '#8B7355'}
              fill={isLiked ? '#D4673A' : 'transparent'}
            />
          </Animated.View>
          <Text className={`ml-2 text-sm ${isLiked ? 'text-terracotta-500' : 'text-gray-500'}`}>
            {likeCount}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onComment?.(post.id)}
          className="flex-row items-center mr-6"
        >
          <MessageCircle size={22} color="#8B7355" />
          <Text className="ml-2 text-sm text-gray-500">{post.comments}</Text>
        </Pressable>

        <Pressable onPress={() => onShare?.(post.id)} className="flex-row items-center">
          <Share2 size={20} color="#8B7355" />
        </Pressable>
      </View>
    </AnimatedPressable>
  );
}
