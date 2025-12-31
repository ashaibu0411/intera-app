import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Pressable, Share, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Heart, MessageCircle, Share2, MoreHorizontal, MapPin, Play, Volume2, VolumeX } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { useStore, MOCK_COMMENTS, type Post } from '@/lib/store';
import { getCommentsCount } from '@/lib/posts';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const likedPostIds = useStore((s) => s.likedPostIds);
  const toggleLikePost = useStore((s) => s.toggleLikePost);
  const savedPostIds = useStore((s) => s.savedPostIds);
  const toggleSavePost = useStore((s) => s.toggleSavePost);
  const currentUser = useStore((s) => s.currentUser);
  const deletePost = useStore((s) => s.deletePost);
  const userComments = useStore((s) => s.userComments);
  const [dbCommentCount, setDbCommentCount] = useState<number>(0);

  const isLiked = likedPostIds.includes(post.id);
  const isSaved = savedPostIds.includes(post.id);
  const isOwnPost = currentUser?.id === post.author.id;
  const baseLikes = post.likes;
  // If the post was originally liked but we unliked it, subtract 1. If it wasn't liked but we liked it, add 1.
  const likeCount = post.isLiked
    ? (isLiked ? baseLikes : baseLikes - 1)
    : (isLiked ? baseLikes + 1 : baseLikes);

  // Fetch comment count from database
  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const count = await getCommentsCount(post.id);
        setDbCommentCount(count);
      } catch (error) {
        // Silently fail, use local count
      }
    };
    fetchCommentCount();
  }, [post.id]);

  // Calculate total comment count: database count OR (mock comments + user comments for this post)
  const mockCommentsCount = MOCK_COMMENTS.filter((c) => c.postId === post.id).length;
  const userCommentsCount = userComments.filter((c) => c.postId === post.id).length;
  // Use database count if available, otherwise use local counts
  const commentCount = dbCommentCount > 0 ? dbCommentCount : (mockCommentsCount + userCommentsCount + (post.comments || 0));

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const videoRef = useRef<Video>(null);
  const likeScale = useSharedValue(1);

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    likeScale.value = withSequence(
      withSpring(1.3, { damping: 2, stiffness: 200 }),
      withSpring(1, { damping: 6, stiffness: 200 })
    );

    toggleLikePost(post.id);
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

  const handleOpenPost = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/post/${post.id}`);
  };

  const handleComment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/post/${post.id}`);
    onComment?.(post.id);
  };

  const handleVideoPlayPause = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleToggleMute = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (videoRef.current) {
      await videoRef.current.setIsMutedAsync(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Check out this post from ${post.author.name} on AfroConnect:\n\n"${post.content}"\n\nJoin our community: afroconnect.app`,
        title: 'Share Post',
      });
      onShare?.(post.id);
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  // Menu action handlers
  const handleSavePost = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleSavePost(post.id);
  };

  const handleCopyLink = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(`afroconnect.app/post/${post.id}`);
    Alert.alert('Copied', 'Post link copied to clipboard');
  };

  const handleReportPost = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Report Post',
      'Are you sure you want to report this post for inappropriate content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Reported', 'Thank you for your report. We will review this post.');
          },
        },
      ]
    );
  };

  const handleDeletePost = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePost(post.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleViewProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/profile/${post.author.id}` as any);
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <AnimatedPressable
      style={cardAnimatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleOpenPost}
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
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Pressable className="p-2" hitSlop={8}>
              <MoreHorizontal size={20} color="#8B7355" />
            </Pressable>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item key="save" onSelect={handleSavePost}>
              <DropdownMenu.ItemTitle>
                {isSaved ? 'Unsave Post' : 'Save Post'}
              </DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
            <DropdownMenu.Item key="copy" onSelect={handleCopyLink}>
              <DropdownMenu.ItemTitle>Copy Link</DropdownMenu.ItemTitle>
            </DropdownMenu.Item>
            {!isOwnPost && (
              <DropdownMenu.Item key="profile" onSelect={handleViewProfile}>
                <DropdownMenu.ItemTitle>View Profile</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
            )}
            {!isOwnPost && (
              <DropdownMenu.Item key="report" onSelect={handleReportPost} destructive>
                <DropdownMenu.ItemTitle>Report Post</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
            )}
            {isOwnPost && (
              <DropdownMenu.Item key="delete" onSelect={handleDeletePost} destructive>
                <DropdownMenu.ItemTitle>Delete Post</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
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

      {/* Video */}
      {post.video && (
        <View className="px-4 pb-3">
          <Pressable onPress={handleVideoPlayPause} className="relative">
            <Video
              ref={videoRef}
              source={{ uri: post.video }}
              style={{ width: '100%', height: 250, borderRadius: 12, backgroundColor: '#000' }}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              isMuted={isMuted}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) {
                  setIsPlaying(status.isPlaying);
                }
              }}
            />
            {/* Play/Pause overlay */}
            {!isPlaying && (
              <View
                className="absolute inset-0 items-center justify-center"
                style={{ borderRadius: 12 }}
              >
                <View className="bg-black/50 rounded-full p-4">
                  <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              </View>
            )}
            {/* Mute button */}
            <Pressable
              onPress={handleToggleMute}
              className="absolute bottom-3 right-3 bg-black/50 rounded-full p-2"
            >
              {isMuted ? (
                <VolumeX size={18} color="#FFFFFF" />
              ) : (
                <Volume2 size={18} color="#FFFFFF" />
              )}
            </Pressable>
          </Pressable>
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
          onPress={handleComment}
          className="flex-row items-center mr-6"
        >
          <MessageCircle size={22} color="#8B7355" />
          <Text className="ml-2 text-sm text-gray-500">{commentCount}</Text>
        </Pressable>

        <Pressable onPress={handleShare} className="flex-row items-center">
          <Share2 size={20} color="#8B7355" />
        </Pressable>
      </View>
    </AnimatedPressable>
  );
}
