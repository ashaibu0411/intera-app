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
  FadeOut,
  ZoomIn,
  SlideInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { formatDistanceToNow } from 'date-fns';
import { router } from 'expo-router';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { useStore, MOCK_COMMENTS, type Post } from '@/lib/store';
import { getCommentsCount, getLikesCount, likePost, unlikePost, checkIfLiked } from '@/lib/posts';
import { StoryAvatar } from '@/components/StoryAvatar';
import { reportPost } from '@/lib/reports';

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

// Post type detection for impact metrics
type PostType = 'question' | 'request' | 'offer' | 'invitation' | 'checkin' | 'general';

const detectPostType = (content: string): PostType => {
  const lowerContent = content.toLowerCase();
  if (lowerContent.includes('?') || lowerContent.includes('anyone know') || lowerContent.includes('can someone') || lowerContent.includes('does anyone')) {
    return 'question';
  }
  if (lowerContent.includes('looking for') || lowerContent.includes('need help') || lowerContent.includes('searching for') || lowerContent.includes('new here')) {
    return 'request';
  }
  if (lowerContent.includes('offering') || lowerContent.includes('i can help') || lowerContent.includes('free') || lowerContent.includes('available')) {
    return 'offer';
  }
  if (lowerContent.includes('join') || lowerContent.includes('come') || lowerContent.includes('hosting') || lowerContent.includes('event') || lowerContent.includes('meetup')) {
    return 'invitation';
  }
  if (lowerContent.includes('anyone else') || lowerContent.includes('is it just me') || lowerContent.includes('experiencing')) {
    return 'checkin';
  }
  return 'general';
};

// Generate impact text based on post type and engagement
const getImpactText = (postType: PostType, likes: number, comments: number): string => {
  if (likes === 0 && comments === 0) return '';

  switch (postType) {
    case 'question':
      if (comments > 0) {
        return `Got ${comments} answer${comments > 1 ? 's' : ''} from the community`;
      }
      return `${likes} people want to help`;
    case 'request':
      if (comments > 0) {
        return `${comments} people responded to help`;
      }
      return `${likes} people saw this`;
    case 'offer':
      return `Helped ${Math.max(1, Math.floor(comments / 2))} people`;
    case 'invitation':
      return `${likes + comments} interested`;
    case 'checkin':
      if (comments > 0) {
        return `${comments} people relate`;
      }
      return `${likes} feel the same`;
    default:
      return `${likes} people connected`;
  }
};

// Get community identity headline
const getCommunityIdentity = (user: { location: string; bio?: string; communityRoles?: Array<{ role: string }> }): string => {
  // Extract city from location (format: "City, Country" or "City, State, Country")
  const locationParts = user.location.split(',').map(s => s.trim());
  const city = locationParts[0] || 'Community';

  // Check for roles
  if (user.communityRoles && user.communityRoles.length > 0) {
    const primaryRole = user.communityRoles[0].role;
    return `${primaryRole} · ${city}`;
  }

  // Check bio for identity hints
  const bio = user.bio?.toLowerCase() || '';
  if (bio.includes('student')) return `Student · ${city}`;
  if (bio.includes('business') || bio.includes('entrepreneur') || bio.includes('owner')) return `Business Owner · ${city}`;
  if (bio.includes('teacher') || bio.includes('professor') || bio.includes('educator')) return `Educator · ${city}`;
  if (bio.includes('doctor') || bio.includes('nurse') || bio.includes('medical')) return `Healthcare · ${city}`;
  if (bio.includes('engineer') || bio.includes('developer') || bio.includes('tech')) return `Tech · ${city}`;
  if (bio.includes('artist') || bio.includes('creative') || bio.includes('designer')) return `Creative · ${city}`;
  if (bio.includes('chef') || bio.includes('cook') || bio.includes('food')) return `Food · ${city}`;
  if (bio.includes('pastor') || bio.includes('imam') || bio.includes('faith')) return `Faith Leader · ${city}`;

  // Default: Member of city
  return `Member · ${city}`;
};

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
  const blockUser = useStore((s) => s.blockUser);
  const userComments = useStore((s) => s.userComments);
  const postReactions = useStore((s) => s.postReactions);
  const setPostReaction = useStore((s) => s.setPostReaction);
  const [dbCommentCount, setDbCommentCount] = useState<number>(0);
  const [dbLikeCount, setDbLikeCount] = useState<number>(0);
  const [isLikedInDb, setIsLikedInDb] = useState<boolean>(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string }>>([]);
  const [burstEmojis, setBurstEmojis] = useState<BurstEmoji[]>([]);
  const [showBigHeart, setShowBigHeart] = useState(false);
  const lastTapRef = useRef<number>(0);

  // Use database like status if available, otherwise fall back to local state
  const isLiked = isLikedInDb || likedPostIds.includes(post.id);
  const isSaved = savedPostIds.includes(post.id);
  const isOwnPost = currentUser?.id === post.author.id;
  const currentReaction = postReactions[post.id];

  // Use database like count if available
  const likeCount = dbLikeCount > 0 ? dbLikeCount : (typeof post.likes === 'object' && post.likes !== null
    ? (post.likes as any).count ?? 0
    : (post.likes ?? 0));

  // Fetch like count and liked status from database
  useEffect(() => {
    const fetchLikeData = async () => {
      try {
        const count = await getLikesCount(post.id);
        setDbLikeCount(count);

        if (currentUser?.id) {
          const liked = await checkIfLiked(currentUser.id, post.id);
          setIsLikedInDb(liked);
        }
      } catch (error) {
        // Silently fail, use local state
      }
    };
    fetchLikeData();
  }, [post.id, currentUser?.id]);

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
  // Safely extract comments count - handle object or number
  const baseComments = typeof post.comments === 'object' && post.comments !== null
    ? (post.comments as any).count ?? 0
    : (post.comments ?? 0);
  // Use database count if available, otherwise use local counts
  const commentCount = dbCommentCount > 0 ? dbCommentCount : (mockCommentsCount + userCommentsCount + baseComments);

  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const videoRef = useRef<Video>(null);
  const likeScale = useSharedValue(1);

  const handleQuickLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    likeScale.value = withSequence(
      withSpring(1.3, { damping: 2, stiffness: 200 }),
      withSpring(1, { damping: 6, stiffness: 200 })
    );

    // Update local state immediately for responsiveness
    toggleLikePost(post.id);

    // Sync with database
    if (currentUser?.id) {
      try {
        if (!isLiked) {
          await likePost(currentUser.id, post.id);
          setIsLikedInDb(true);
          setDbLikeCount((prev) => prev + 1);
          setPostReaction(post.id, '❤️');
          addFloatingEmoji('❤️');
        } else {
          await unlikePost(currentUser.id, post.id);
          setIsLikedInDb(false);
          setDbLikeCount((prev) => Math.max(0, prev - 1));
          setPostReaction(post.id, null);
        }
      } catch (error) {
        console.log('Error syncing like:', error);
      }
    } else {
      // For guests, just update local state
      if (!isLiked) {
        setPostReaction(post.id, '❤️');
        addFloatingEmoji('❤️');
      } else {
        setPostReaction(post.id, null);
      }
    }

    onLike?.(post.id);
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowReactionPicker(true);
  };

  const handleSelectReaction = async (emoji: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowReactionPicker(false);

    // If same reaction, remove it
    if (currentReaction === emoji) {
      setPostReaction(post.id, null);
      if (isLiked) {
        toggleLikePost(post.id);
        if (currentUser?.id) {
          try {
            await unlikePost(currentUser.id, post.id);
            setIsLikedInDb(false);
            setDbLikeCount((prev) => Math.max(0, prev - 1));
          } catch (error) {
            console.log('Error removing like:', error);
          }
        }
      }
    } else {
      setPostReaction(post.id, emoji);
      if (!isLiked) {
        toggleLikePost(post.id);
        if (currentUser?.id) {
          try {
            await likePost(currentUser.id, post.id);
            setIsLikedInDb(true);
            setDbLikeCount((prev) => prev + 1);
          } catch (error) {
            console.log('Error adding like:', error);
          }
        }
      }
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
  const handleImageDoubleTap = useCallback(async () => {
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

        // Sync with database
        if (currentUser?.id) {
          try {
            await likePost(currentUser.id, post.id);
            setIsLikedInDb(true);
            setDbLikeCount((prev) => prev + 1);
          } catch (error) {
            console.log('Error adding like:', error);
          }
        }

        likeScale.value = withSequence(
          withSpring(1.4, { damping: 2, stiffness: 200 }),
          withSpring(1, { damping: 6, stiffness: 200 })
        );
      }
    }
    lastTapRef.current = now;
  }, [isLiked, post.id, toggleLikePost, setPostReaction, likeScale, currentUser?.id]);

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
        message: `Check out this post from ${post.author.name} on Diaspora:\n\n"${post.content}"\n\nJoin our community: diaspora.app`,
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
    await Clipboard.setStringAsync(`diaspora.app/post/${post.id}`);
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
          onPress: async () => {
            // Send report to database
            if (currentUser?.id) {
              await reportPost(
                currentUser.id,
                post.author.id,
                post.author.name,
                post.id,
                'other',
                'Reported via post menu'
              );
            }
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

  const handleBlockUser = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${post.author.name}? You won't see their posts or comments anymore.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            blockUser(post.author.id, post.author.name, post.author.avatar);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              'User Blocked',
              `${post.author.name} has been blocked. You can unblock them in Settings.`
            );
          },
        },
      ]
    );
  };

  const handleViewProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/profile/${post.author.id}` as any);
  };

  // Safely parse date - handle invalid dates gracefully
  const getTimeAgo = () => {
    try {
      const date = new Date(post.createdAt);
      if (isNaN(date.getTime())) {
        return 'recently';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'recently';
    }
  };
  const timeAgo = getTimeAgo();

  // Get display emoji for reaction button
  const displayEmoji = currentReaction || '❤️';
  const reactionColor = REACTIONS.find(r => r.emoji === currentReaction)?.color || '#D4673A';

  // Get country flag from location
  const countryFlag = getCountryFlag(post.location);

  // Get community identity headline
  const communityIdentity = getCommunityIdentity({
    location: post.location,
    bio: post.author.bio,
    communityRoles: (post.author as any).communityRoles,
  });

  // Detect post type and get impact text
  const postType = detectPostType(post.content);
  const impactText = getImpactText(postType, likeCount, commentCount);

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
        <StoryAvatar
          userId={post.author.id}
          avatarUrl={post.author.avatar}
          size={44}
        />
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text className="text-warmBrown font-semibold text-base">{post.author.name}</Text>
            <Text className="ml-1.5" style={{ fontSize: 14 }}>{countryFlag}</Text>
          </View>
          {/* Community-First Identity Headline */}
          <View className="flex-row items-center mt-0.5">
            <Text className="text-sm text-gray-600 font-medium">{communityIdentity}</Text>
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
              <DropdownMenu.Item key="block" onSelect={handleBlockUser} destructive>
                <DropdownMenu.ItemTitle>Block User</DropdownMenu.ItemTitle>
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
        {/* Impact Metrics - Community-first language instead of vanity metrics */}
        {(likeCount > 0 || commentCount > 0) && impactText && (
          <Pressable onPress={handleQuickLike} className="flex-row items-center mb-2">
            <View className="flex-row items-center">
              {/* Show mix of reaction emojis */}
              <View className="flex-row -space-x-1">
                {[currentReaction || '❤️', '🔥', '👏🏿'].slice(0, Math.min(3, Math.max(likeCount, 1))).map((emoji, i) => (
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
              {/* Impact text instead of "Liked by X people" */}
              <Text className="text-xs text-gray-600 ml-2 font-medium">
                {impactText}
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
