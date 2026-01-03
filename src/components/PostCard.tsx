import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Share, Alert, Modal, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { MessageCircle, Share2, MoreHorizontal, MapPin, Play, Volume2, VolumeX } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  FadeIn,
  FadeOut,
  ZoomIn,
  SlideInDown,
  SlideInUp,
  FadeInUp,
} from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { useStore, MOCK_COMMENTS, type Post } from '@/lib/store';
import { getCommentsCount } from '@/lib/posts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

// Afrocentric emoji reactions
const REACTIONS = [
  { emoji: '❤️', label: 'Love', color: '#E53E3E' },
  { emoji: '🔥', label: 'Fire', color: '#F6AD55' },
  { emoji: '👏🏿', label: 'Clap', color: '#C9A227' },
  { emoji: '💯', label: 'Real', color: '#1B4D3E' },
  { emoji: '🙏🏿', label: 'Bless', color: '#8B5CF6' },
  { emoji: '😂', label: 'Haha', color: '#F59E0B' },
];

// Country flag mapping
const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  'USA': '🇺🇸',
  'Nigeria': '🇳🇬',
  'Ghana': '🇬🇭',
  'Kenya': '🇰🇪',
  'South Africa': '🇿🇦',
  'Ethiopia': '🇪🇹',
  'Tanzania': '🇹🇿',
  'Uganda': '🇺🇬',
  'Cameroon': '🇨🇲',
  'Senegal': '🇸🇳',
  'Ivory Coast': '🇨🇮',
  'Zimbabwe': '🇿🇼',
  'Rwanda': '🇷🇼',
  'Zambia': '🇿🇲',
  'Botswana': '🇧🇼',
  'Namibia': '🇳🇦',
  'Mozambique': '🇲🇿',
  'Angola': '🇦🇴',
  'DR Congo': '🇨🇩',
  'Egypt': '🇪🇬',
  'Morocco': '🇲🇦',
  'Algeria': '🇩🇿',
  'Tunisia': '🇹🇳',
  'Sudan': '🇸🇩',
  'United Kingdom': '🇬🇧',
  'UK': '🇬🇧',
  'Canada': '🇨🇦',
  'France': '🇫🇷',
  'Germany': '🇩🇪',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Portugal': '🇵🇹',
  'Brazil': '🇧🇷',
  'Jamaica': '🇯🇲',
  'Trinidad': '🇹🇹',
  'Haiti': '🇭🇹',
  'Barbados': '🇧🇧',
  'Australia': '🇦🇺',
  'New Zealand': '🇳🇿',
};

// Get flag from location string
const getCountryFlag = (location: string): string => {
  for (const [country, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (location.toLowerCase().includes(country.toLowerCase())) {
      return flag;
    }
  }
  return '🌍'; // Default globe for unknown locations
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Burst emoji particle for double-tap effect
interface BurstEmoji {
  id: number;
  emoji: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

export function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  const likedPostIds = useStore((s) => s.likedPostIds);
  const toggleLikePost = useStore((s) => s.toggleLikePost);
  const savedPostIds = useStore((s) => s.savedPostIds);
  const toggleSavePost = useStore((s) => s.toggleSavePost);
  const currentUser = useStore((s) => s.currentUser);
  const deletePost = useStore((s) => s.deletePost);
  const userComments = useStore((s) => s.userComments);
  const postReactions = useStore((s) => s.postReactions);
  const setPostReaction = useStore((s) => s.setPostReaction);
  const [dbCommentCount, setDbCommentCount] = useState<number>(0);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string }>>([]);
  const [burstEmojis, setBurstEmojis] = useState<BurstEmoji[]>([]);
  const [showBigHeart, setShowBigHeart] = useState(false);
  const lastTapRef = useRef<number>(0);

  const isLiked = likedPostIds.includes(post.id);
  const isSaved = savedPostIds.includes(post.id);
  const isOwnPost = currentUser?.id === post.author.id;
  const currentReaction = postReactions[post.id];
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

  const handleQuickLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    likeScale.value = withSequence(
      withSpring(1.3, { damping: 2, stiffness: 200 }),
      withSpring(1, { damping: 6, stiffness: 200 })
    );

    toggleLikePost(post.id);

    // If we just liked, set default reaction to heart
    if (!isLiked) {
      setPostReaction(post.id, '❤️');
      // Add floating emoji
      addFloatingEmoji('❤️');
    } else {
      setPostReaction(post.id, null);
    }

    onLike?.(post.id);
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowReactionPicker(true);
  };

  const handleSelectReaction = (emoji: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowReactionPicker(false);

    // If same reaction, remove it
    if (currentReaction === emoji) {
      setPostReaction(post.id, null);
      if (isLiked) toggleLikePost(post.id);
    } else {
      setPostReaction(post.id, emoji);
      if (!isLiked) toggleLikePost(post.id);
      // Add floating emoji animation
      addFloatingEmoji(emoji);
    }

    likeScale.value = withSequence(
      withSpring(1.4, { damping: 2, stiffness: 200 }),
      withSpring(1, { damping: 6, stiffness: 200 })
    );
  };

  const addFloatingEmoji = (emoji: string) => {
    const id = Date.now();
    setFloatingEmojis(prev => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 1000);
  };

  // Double-tap handler for images - Instagram style
  const handleImageDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Show big heart animation
      setShowBigHeart(true);
      setTimeout(() => setShowBigHeart(false), 800);

      // Create burst of emojis
      const emojis = ['❤️', '🔥', '✨', '💫', '💖'];
      const newBurst: BurstEmoji[] = [];
      for (let i = 0; i < 6; i++) {
        newBurst.push({
          id: Date.now() + i,
          emoji: emojis[Math.floor(Math.random() * emojis.length)],
          x: Math.random() * 120 - 60,
          y: Math.random() * -80 - 20,
          rotation: Math.random() * 60 - 30,
          scale: 0.6 + Math.random() * 0.6,
        });
      }
      setBurstEmojis(newBurst);
      setTimeout(() => setBurstEmojis([]), 1000);

      // Like the post if not already liked
      if (!isLiked) {
        toggleLikePost(post.id);
        setPostReaction(post.id, '❤️');

        likeScale.value = withSequence(
          withSpring(1.4, { damping: 2, stiffness: 200 }),
          withSpring(1, { damping: 6, stiffness: 200 })
        );
      }
    }
    lastTapRef.current = now;
  }, [isLiked, post.id, toggleLikePost, setPostReaction, likeScale]);

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

  // Get display emoji for reaction button
  const displayEmoji = currentReaction || '❤️';
  const reactionColor = REACTIONS.find(r => r.emoji === currentReaction)?.color || '#D4673A';

  // Get country flag from location
  const countryFlag = getCountryFlag(post.location);

  return (
    <AnimatedPressable
      style={cardAnimatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handleOpenPost}
      className="bg-white rounded-2xl mx-4 mb-4 shadow-sm overflow-hidden"
    >
      {/* Floating Emojis Animation */}
      {floatingEmojis.map((item) => (
        <Animated.View
          key={item.id}
          entering={ZoomIn.duration(200)}
          exiting={FadeOut.duration(300)}
          className="absolute z-50 left-1/2 top-1/2"
          style={{ marginLeft: -20, marginTop: -20 }}
        >
          <Animated.Text
            style={{ fontSize: 48 }}
            entering={SlideInDown.duration(500)}
          >
            {item.emoji}
          </Animated.Text>
        </Animated.View>
      ))}

      {/* Header */}
      <View className="flex-row items-center p-4 pb-3">
        <Image
          source={{ uri: post.author.avatar }}
          style={{ width: 44, height: 44, borderRadius: 22 }}
          contentFit="cover"
        />
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text className="text-warmBrown font-semibold text-base">{post.author.name}</Text>
            <Text className="ml-1.5" style={{ fontSize: 14 }}>{countryFlag}</Text>
          </View>
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

      {/* Image with double-tap to like */}
      {post.images.length > 0 && (
        <Pressable onPress={handleImageDoubleTap} className="px-4 pb-3 relative">
          <Image
            source={{ uri: post.images[0] }}
            style={{ width: '100%', height: 200, borderRadius: 12 }}
            contentFit="cover"
          />

          {/* Big heart animation on double-tap */}
          {showBigHeart && (
            <Animated.View
              entering={ZoomIn.duration(200)}
              exiting={FadeOut.duration(400)}
              className="absolute inset-0 items-center justify-center"
            >
              <Text style={{ fontSize: 80 }}>❤️</Text>
            </Animated.View>
          )}

          {/* Burst emojis */}
          {burstEmojis.map((burst) => (
            <Animated.View
              key={burst.id}
              entering={FadeInUp.duration(600)}
              exiting={FadeOut.duration(300)}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                transform: [
                  { translateX: burst.x },
                  { translateY: burst.y },
                  { rotate: `${burst.rotation}deg` },
                  { scale: burst.scale },
                ],
              }}
            >
              <Text style={{ fontSize: 28 }}>{burst.emoji}</Text>
            </Animated.View>
          ))}
        </Pressable>
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
      <View className="px-4 py-3 border-t border-gray-100">
        {/* Reaction Summary Bar - shows which emojis were used */}
        {likeCount > 0 && (
          <Pressable onPress={handleQuickLike} className="flex-row items-center mb-2">
            <View className="flex-row items-center">
              {/* Show mix of reaction emojis */}
              <View className="flex-row -space-x-1">
                {[currentReaction || '❤️', '🔥', '👏🏿'].slice(0, Math.min(3, likeCount)).map((emoji, i) => (
                  <View
                    key={i}
                    className="bg-white rounded-full"
                    style={{
                      marginLeft: i > 0 ? -4 : 0,
                      zIndex: 3 - i,
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>{emoji}</Text>
                  </View>
                ))}
              </View>
              <Text className="text-xs text-gray-500 ml-2">
                {likeCount === 1
                  ? 'You and no others'
                  : likeCount < 5
                    ? `Liked by ${likeCount} people`
                    : `Liked by ${likeCount} people`}
              </Text>
            </View>
          </Pressable>
        )}

        {/* Action Buttons */}
        <View className="flex-row items-center">
          {/* Reaction Button - tap for quick like, long press for picker */}
          <Pressable
            onPress={handleQuickLike}
            onLongPress={handleLongPress}
            delayLongPress={300}
            className="flex-row items-center mr-6"
          >
            <Animated.View style={likeAnimatedStyle}>
              <Text style={{ fontSize: 22 }}>
                {isLiked ? displayEmoji : '🤍'}
              </Text>
            </Animated.View>
            <Text
              className="ml-2 text-sm font-medium"
              style={{ color: isLiked ? reactionColor : '#6B7280' }}
            >
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

          <Pressable onPress={handleShare} className="flex-row items-center ml-auto">
            <Share2 size={20} color="#8B7355" />
            <Text className="ml-1.5 text-sm text-gray-500">Share</Text>
          </Pressable>
        </View>

        {/* Community Guidelines Reminder */}
        <View className="mt-2 pt-2 border-t border-gray-50">
          <Text className="text-[10px] text-gray-400 text-center">
            Be respectful. No vulgar language, hate speech, or inappropriate content.
          </Text>
        </View>
      </View>

      {/* Reaction Picker Modal */}
      <Modal
        visible={showReactionPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReactionPicker(false)}
      >
        <Pressable
          className="flex-1 bg-black/30 justify-center items-center"
          onPress={() => setShowReactionPicker(false)}
        >
          <Animated.View
            entering={ZoomIn.duration(200)}
            className="bg-white rounded-3xl px-4 py-3 flex-row shadow-xl"
          >
            {REACTIONS.map((reaction, index) => (
              <Pressable
                key={reaction.emoji}
                onPress={() => handleSelectReaction(reaction.emoji)}
                className="mx-2 items-center"
              >
                <Animated.View
                  entering={ZoomIn.delay(index * 50).duration(200)}
                >
                  <Text
                    style={{
                      fontSize: currentReaction === reaction.emoji ? 40 : 32,
                      opacity: currentReaction === reaction.emoji ? 1 : 0.8,
                    }}
                  >
                    {reaction.emoji}
                  </Text>
                  <Text
                    className="text-xs text-center mt-1"
                    style={{ color: reaction.color }}
                  >
                    {reaction.label}
                  </Text>
                </Animated.View>
              </Pressable>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </AnimatedPressable>
  );
}
