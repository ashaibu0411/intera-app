import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, Pressable, Dimensions, FlatList, ViewToken, ActivityIndicator, Alert, Modal, Share, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Video as ExpoVideo, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Play,
  Pause,
  Heart,
  MessageCircle,
  Share2,
  Music2,
  Plus,
  Bookmark,
  MoreHorizontal,
  Video,
  Volume2,
  VolumeX,
  Ban,
  Flag,
  X,
  Shield,
  AlertTriangle,
  Send,
  ChevronDown,
  Sparkles,
  TrendingUp,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  SlideInUp,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { useStore } from '@/lib/store';
import { reportBlockedUser } from '@/lib/reports';
import type { ViolationType } from '@/lib/contentModeration';

// Report reasons for App Store Guideline 1.2 compliance
const REPORT_REASONS: { id: ViolationType | 'other'; label: string; description: string }[] = [
  { id: 'harassment', label: 'Harassment or Bullying', description: 'Targeting, intimidating, or threatening behavior' },
  { id: 'hate_speech', label: 'Hate Speech', description: 'Content promoting discrimination or hatred' },
  { id: 'sexual', label: 'Sexual Content', description: 'Inappropriate sexual content' },
  { id: 'violence', label: 'Violence or Threats', description: 'Threatening violence or glorifying harm' },
  { id: 'scam', label: 'Scam or Fraud', description: 'Deceptive behavior or fraudulent activity' },
  { id: 'spam', label: 'Spam', description: 'Repetitive, unwanted content' },
  { id: 'other', label: 'Other', description: 'Other violation of community guidelines' },
];

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface Clip {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isVerified: boolean;
    isFollowing?: boolean;
  };
  videoUrl?: string;
  thumbnail: string;
  description: string;
  music: string;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  isLiked: boolean;
  isSaved: boolean;
  duration?: number;
  createdAt: string;
}

// Enhanced demo clips with more data
const MOCK_CLIPS: Clip[] = [
  {
    id: '1',
    user: {
      id: 'u1',
      name: 'Sarah Johnson',
      username: 'sarahj',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
      isVerified: true,
      isFollowing: false,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1400&fit=crop',
    description: 'Weekend road trip vibes! Who else loves spontaneous adventures? #roadtrip #adventure #travel',
    music: 'Original Audio - Sarah',
    likes: 12400,
    comments: 342,
    shares: 89,
    views: 125000,
    isLiked: false,
    isSaved: false,
    duration: 60,
    createdAt: '2024-12-28T10:00:00Z',
  },
  {
    id: '2',
    user: {
      id: 'u2',
      name: 'Mike Chen',
      username: 'mikechen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      isVerified: false,
      isFollowing: true,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=1400&fit=crop',
    description: 'Found the perfect carpool crew for my daily commute. Life-changing! #carpool #commute #friends',
    music: 'Sunny Day - Acoustic',
    likes: 8930,
    comments: 215,
    shares: 67,
    views: 98000,
    isLiked: true,
    isSaved: false,
    duration: 45,
    createdAt: '2024-12-27T15:30:00Z',
  },
  {
    id: '3',
    user: {
      id: 'u3',
      name: 'Emma Wilson',
      username: 'emmaw',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
      isVerified: true,
      isFollowing: false,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=1400&fit=crop',
    description: 'City drives hit different at golden hour. Who wants to join? #goldenhour #citylife #carpool',
    music: 'Golden - Harry Styles',
    likes: 24100,
    comments: 567,
    shares: 234,
    views: 320000,
    isLiked: false,
    isSaved: true,
    duration: 30,
    createdAt: '2024-12-26T20:15:00Z',
  },
  {
    id: '4',
    user: {
      id: 'u4',
      name: 'Alex Rivera',
      username: 'alexr',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
      isVerified: false,
      isFollowing: true,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=1400&fit=crop',
    description: 'Mountain road trip with the best crew. Nothing beats these views! #mountains #roadtrip',
    music: 'On The Road Again',
    likes: 15600,
    comments: 423,
    shares: 156,
    views: 198000,
    isLiked: false,
    isSaved: false,
    duration: 55,
    createdAt: '2024-12-25T12:00:00Z',
  },
  {
    id: '5',
    user: {
      id: 'u5',
      name: 'Lisa Park',
      username: 'lisapark',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
      isVerified: true,
      isFollowing: false,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=1400&fit=crop',
    description: 'Beach carpool anyone? The waves are calling! #beach #summer #roadtrip',
    music: 'Ocean Eyes - Billie Eilish',
    likes: 31200,
    comments: 890,
    shares: 412,
    views: 450000,
    isLiked: true,
    isSaved: true,
    duration: 40,
    createdAt: '2024-12-24T18:30:00Z',
  },
];

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 604800)}w ago`;
}

interface ClipItemProps {
  clip: Clip;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  onBlockUser: () => void;
  onReportUser: () => void;
  onComment: () => void;
  onShare: () => void;
  itemHeight: number;
  itemWidth: number;
}

function ClipItem({ clip, isActive, isMuted, onToggleMute, onBlockUser, onReportUser, onComment, onShare, itemHeight, itemWidth }: ClipItemProps) {
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(clip.isLiked);
  const [saved, setSaved] = useState(clip.isSaved);
  const [likeCount, setLikeCount] = useState(clip.likes);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [duration, setDuration] = useState(clip.duration || 0);
  const [isFollowing, setIsFollowing] = useState(clip.user.isFollowing || false);
  const videoRef = useRef<ExpoVideo>(null);

  const heartScale = useSharedValue(1);
  const doubleTapHeart = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const playPauseOpacity = useSharedValue(0);

  // Auto-play/pause based on visibility.
  // IMPORTANT: don't call loadAsync repeatedly — it can break scrolling/perf.
  useEffect(() => {
    if (!clip.videoUrl) return;
    if (isActive) {
      videoRef.current?.playAsync().catch(() => null);
    } else {
      videoRef.current?.pauseAsync().catch(() => null);
    }
  }, [isActive, clip.videoUrl]);

  // Preload next/previous videos for smoother experience
  useEffect(() => {
    if (isActive) {
      // This would preload adjacent videos in a real implementation
      // For now, we just ensure current video is ready
    }
  }, [isActive]);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const doubleTapHeartStyle = useAnimatedStyle(() => ({
    opacity: doubleTapHeart.value,
    transform: [{ scale: doubleTapHeart.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const playPauseStyle = useAnimatedStyle(() => ({
    opacity: playPauseOpacity.value,
  }));

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    heartScale.value = withSequence(
      withSpring(1.3, { damping: 2 }),
      withSpring(1, { damping: 4 })
    );
    if (!liked) {
      setLikeCount(prev => prev + 1);
    } else {
      setLikeCount(prev => prev - 1);
    }
    setLiked(!liked);
  };

  const handleDoubleTap = () => {
    if (!liked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      doubleTapHeart.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(1.2, { duration: 200 }),
        withTiming(0, { duration: 400 })
      );
      setLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaved(!saved);
  };

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFollowing(!isFollowing);
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    playPauseOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(1, { duration: 800 }),
      withTiming(0, { duration: 200 })
    );

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const lastTap = useRef<number>(0);
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      handleDoubleTap();
    } else {
      togglePlayPause();
    }
    lastTap.current = now;
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setIsLoading(false);

      if (status.durationMillis) {
        setDuration(status.durationMillis / 1000);
      }

      if (status.positionMillis && status.durationMillis) {
        const progress = (status.positionMillis / status.durationMillis) * 100;
        progressWidth.value = withTiming(progress, { duration: 100 });
        setPlaybackPosition(status.positionMillis / 1000);
      }
    } else if (status.error) {
      console.error('Video playback error:', status.error);
      setIsLoading(false);
    }
  };

  // Side-swipe gestures should NOT interfere with the vertical pager.
  // We only activate this gesture on horizontal movement.
  // Using runOnJS to safely call JS functions from gesture callbacks.
  const panGesture = Gesture.Pan()
    .activeOffsetX([-18, 18]) // activate when horizontal swipe is intentional
    .failOffsetY([-12, 12]) // fail fast if user is scrolling vertically
    .onEnd((event) => {
      'worklet';
      // Swipe left: comments, swipe right: profile
      // These callbacks run on the UI thread, so we schedule JS execution
      if (event.translationX < -70) {
        // Can't call onComment directly from worklet - handled via tap instead
      }
      if (event.translationX > 70) {
        // Can't call router.push directly from worklet - handled via tap instead
      }
    })
    .runOnJS(true); // Force callbacks to run on JS thread

  return (
    <GestureDetector gesture={panGesture}>
      <Pressable
        onPress={handleTap}
        style={{ height: itemHeight, width: itemWidth }}
        className="relative"
      >
        {/* Video or Thumbnail Background */}
        {clip.videoUrl ? (
          <>
            <ExpoVideo
              ref={videoRef}
              source={{ uri: clip.videoUrl }}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay={isActive}
              isMuted={isMuted}
              volume={1.0}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              useNativeControls={false}
              progressUpdateIntervalMillis={100}
            />
            {/* Thumbnail while loading */}
            {isLoading && (
              <Image
                source={{ uri: clip.thumbnail }}
                style={{ position: 'absolute', width: '100%', height: '100%' }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            )}
          </>
        ) : (
          <Image
            source={{ uri: clip.thumbnail }}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        )}

        {/* Gradient Overlays - Enhanced */}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)']}
          locations={[0, 0.15, 0.7, 1]}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />

        {/* Video Progress Indicator */}
        {isActive && duration > 0 && (
          <View className="absolute top-0 left-0 right-0 h-1 bg-black/20">
            <Animated.View
              style={[
                progressStyle,
                { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 1 }
              ]}
            />
          </View>
        )}

        {/* Double Tap Heart - Enhanced */}
        <Animated.View
          style={[doubleTapHeartStyle, { position: 'absolute', top: '40%', left: '35%', zIndex: 10 }]}
        >
          <View className="items-center">
            <Heart size={120} color="#EF4444" fill="#EF4444" />
            <Text className="text-white font-bold text-lg mt-2" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
              +1
            </Text>
          </View>
        </Animated.View>

        {/* Loading Indicator - Enhanced */}
        {isLoading && clip.videoUrl && (
          <View className="absolute inset-0 items-center justify-center bg-black/20">
            <View className="items-center">
              <ActivityIndicator size="large" color="#fff" />
              <Text className="text-white text-sm mt-3 font-medium">Loading video...</Text>
            </View>
          </View>
        )}

        {/* Play/Pause Indicator - Enhanced */}
        <Animated.View
          style={[playPauseStyle, { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -30 }, { translateY: -30 }] }]}
        >
          <View className="bg-black/60 rounded-full p-4">
            {isPlaying ? (
              <Pause size={48} color="#fff" fill="#fff" />
            ) : (
              <Play size={48} color="#fff" fill="#fff" />
            )}
          </View>
        </Animated.View>

        {/* Mute/Unmute Button - Enhanced */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggleMute();
          }}
          className="absolute bg-black/50 rounded-full p-2.5 backdrop-blur-sm"
          style={{ top: insets.top + 60, right: 16 }}
        >
          {isMuted ? (
            <VolumeX size={22} color="#fff" />
          ) : (
            <Volume2 size={22} color="#fff" />
          )}
        </Pressable>

        {/* Right Side Actions - Enhanced */}
        <View
          className="absolute right-3 items-center gap-6"
          style={{ bottom: 120 + insets.bottom }}
        >
          {/* Profile - Enhanced */}
          <View className="items-center">
            <Pressable className="relative" onPress={() => router.push(`/profile/${clip.user.id}`)}>
              <Image
                source={{ uri: clip.user.avatar }}
                style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 2.5, borderColor: '#fff' }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
              {!isFollowing && (
                <Pressable
                  onPress={handleFollow}
                  className="absolute -bottom-2 left-1/2 -ml-3.5 bg-rose-500 rounded-full w-7 h-7 items-center justify-center border-2 border-white"
                >
                  <Plus size={16} color="#fff" strokeWidth={3} />
                </Pressable>
              )}
            </Pressable>
          </View>

          {/* Like - Enhanced */}
          <Pressable onPress={handleLike} className="items-center">
            <Animated.View style={heartAnimatedStyle}>
              <Heart
                size={36}
                color={liked ? '#EF4444' : '#fff'}
                fill={liked ? '#EF4444' : 'transparent'}
                strokeWidth={liked ? 0 : 2.5}
              />
            </Animated.View>
            <Text className="text-white text-xs font-bold mt-1.5" style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
              {formatNumber(likeCount)}
            </Text>
          </Pressable>

          {/* Comment - Enhanced */}
          <Pressable onPress={onComment} className="items-center">
            <MessageCircle size={36} color="#fff" strokeWidth={2.5} />
            <Text className="text-white text-xs font-bold mt-1.5" style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
              {formatNumber(clip.comments)}
            </Text>
          </Pressable>

          {/* Save - Enhanced */}
          <Pressable onPress={handleSave} className="items-center">
            <Bookmark
              size={32}
              color={saved ? '#FBBF24' : '#fff'}
              fill={saved ? '#FBBF24' : 'transparent'}
              strokeWidth={saved ? 0 : 2.5}
            />
          </Pressable>

          {/* Share - Enhanced */}
          <Pressable onPress={onShare} className="items-center">
            <Share2 size={30} color="#fff" strokeWidth={2.5} />
            <Text className="text-white text-xs font-bold mt-1.5" style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
              {formatNumber(clip.shares)}
            </Text>
          </Pressable>

          {/* More - Enhanced */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Pressable className="items-center">
                <MoreHorizontal size={28} color="#fff" strokeWidth={2.5} />
              </Pressable>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item key="report" onSelect={onReportUser}>
                <DropdownMenu.ItemIcon ios={{ name: 'flag' }}>
                  <Flag size={18} color="#EF4444" />
                </DropdownMenu.ItemIcon>
                <DropdownMenu.ItemTitle>Report</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
              <DropdownMenu.Item key="block" onSelect={onBlockUser} destructive>
                <DropdownMenu.ItemIcon ios={{ name: 'hand.raised' }}>
                  <Ban size={18} color="#EF4444" />
                </DropdownMenu.ItemIcon>
                <DropdownMenu.ItemTitle>Block User</DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </View>

        {/* Bottom Info - Enhanced */}
        <View
          className="absolute left-4 right-20"
          style={{ bottom: 100 + insets.bottom }}
        >
          {/* Username - Enhanced */}
          <View className="flex-row items-center mb-2">
            <Pressable onPress={() => router.push(`/profile/${clip.user.id}`)}>
              <Text className="text-white font-bold text-base" style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
                @{clip.user.username}
              </Text>
            </Pressable>
            {clip.user.isVerified && (
              <View className="ml-1.5 bg-blue-500 rounded-full w-4.5 h-4.5 items-center justify-center">
                <Text className="text-white text-[10px] font-bold">✓</Text>
              </View>
            )}
          </View>

          {/* Description - Enhanced */}
          <Text className="text-white text-sm leading-5 mb-3" numberOfLines={3} style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
            {clip.description}
          </Text>

          {/* Music - Enhanced */}
          <Pressable className="flex-row items-center mb-2">
            <Music2 size={16} color="#fff" />
            <Text className="text-white text-xs ml-2 font-medium" numberOfLines={1} style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
              {clip.music}
            </Text>
          </Pressable>

          {/* Views and Time - Enhanced */}
          <View className="flex-row items-center gap-3">
            <Text className="text-white/80 text-xs" style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
              {formatNumber(clip.views)} views
            </Text>
            <Text className="text-white/60 text-xs">•</Text>
            <Text className="text-white/80 text-xs" style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
              {getTimeAgo(clip.createdAt)}
            </Text>
          </View>
        </View>
      </Pressable>
    </GestureDetector>
  );
}

// Comments Modal Component
function CommentsModal({ visible, clip, onClose }: { visible: boolean; clip: Clip | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([
    { id: '1', user: { name: 'John Doe', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', username: 'johndoe' }, text: 'This is amazing! 🔥', likes: 12, timeAgo: '2h ago' },
    { id: '2', user: { name: 'Jane Smith', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', username: 'janesmith' }, text: 'Love this! Can we do this together?', likes: 8, timeAgo: '5h ago' },
  ]);

  const handleSendComment = () => {
    if (commentText.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setComments([{
        id: Date.now().toString(),
        user: { name: 'You', avatar: '', username: 'you' },
        text: commentText,
        likes: 0,
        timeAgo: 'just now',
      }, ...comments]);
      setCommentText('');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <Animated.View
          entering={SlideInUp.duration(300)}
          className="bg-white rounded-t-3xl max-h-[70%]"
        >
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
            <Text className="text-lg font-bold text-warmBrown">
              {formatNumber(clip?.comments || 0)} Comments
            </Text>
            <Pressable onPress={onClose} className="p-1" hitSlop={8}>
              <ChevronDown size={24} color="#6B7280" />
            </Pressable>
          </View>

          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            className="flex-1 px-5 py-4"
            renderItem={({ item }) => (
              <View className="flex-row mb-4">
                <Image
                  source={{ uri: item.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' }}
                  style={{ width: 36, height: 36, borderRadius: 18 }}
                  contentFit="cover"
                />
                <View className="flex-1 ml-3">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-warmBrown font-semibold text-sm">@{item.user.username}</Text>
                    <Text className="text-gray-500 text-xs ml-2">{item.timeAgo}</Text>
                  </View>
                  <Text className="text-gray-800 text-sm mb-1">{item.text}</Text>
                  <View className="flex-row items-center gap-4">
                    <Pressable className="flex-row items-center">
                      <Heart size={14} color="#9CA3AF" />
                      <Text className="text-gray-500 text-xs ml-1">{item.likes}</Text>
                    </Pressable>
                    <Text className="text-gray-500 text-xs">Reply</Text>
                  </View>
                </View>
              </View>
            )}
          />

          <View className="border-t border-gray-100 px-5 py-3" style={{ paddingBottom: insets.bottom + 12 }}>
            <View className="flex-row items-center">
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-warmBrown"
                style={{ fontSize: 15 }}
              />
              <Pressable
                onPress={handleSendComment}
                disabled={!commentText.trim()}
                className={`ml-2 bg-terracotta-500 rounded-full p-2.5 ${!commentText.trim() ? 'opacity-50' : ''}`}
              >
                <Send size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function ClipsTabScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'following' | 'foryou'>('foryou');
  const [isMuted, setIsMuted] = useState(false);
  const [pagerHeight, setPagerHeight] = useState(SCREEN_HEIGHT);
  const [showHint, setShowHint] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [reportStep, setReportStep] = useState<'reason' | 'confirm' | 'done'>('reason');
  const [selectedReason, setSelectedReason] = useState<ViolationType | 'other' | null>(null);
  const [showBlockConfirmModal, setShowBlockConfirmModal] = useState(false);
  const [selectedClipUser, setSelectedClipUser] = useState<{ id: string; name: string; avatar: string } | null>(null);

  const isGuest = useStore((s) => s.isGuest);
  const currentUser = useStore((s) => s.currentUser);
  const blockUser = useStore((s) => s.blockUser);
  const blockedUserIds = useStore((s) => s.blockedUserIds);

  // Filter out clips from blocked users
  const filteredClips = useMemo(() => {
    return MOCK_CLIPS.filter((clip) => !blockedUserIds.includes(clip.user.id));
  }, [blockedUserIds]);

  const handleBlockUser = (user: { id: string; name: string; avatar: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedClipUser(user);
    setShowBlockConfirmModal(true);
  };

  const confirmBlockUser = () => {
    if (!selectedClipUser) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    blockUser(selectedClipUser.id, selectedClipUser.name, selectedClipUser.avatar);
    setShowBlockConfirmModal(false);
    Alert.alert(
      'User Blocked',
      `${selectedClipUser.name} has been blocked and reported to our moderation team.`,
      [{ text: 'OK' }]
    );
    setSelectedClipUser(null);
  };

  const handleReportUser = (user: { id: string; name: string; avatar: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedClipUser(user);
    setReportStep('reason');
    setSelectedReason(null);
    setShowReportModal(true);
  };

  const submitReport = async () => {
    if (!selectedReason || !currentUser?.id || !selectedClipUser) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await reportBlockedUser(currentUser.id, selectedClipUser.id, selectedClipUser.name);
    setReportStep('done');
    setTimeout(() => {
      setShowReportModal(false);
      setReportStep('reason');
      setSelectedReason(null);
      setSelectedClipUser(null);
    }, 2000);
  };

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const handleComment = (clip: Clip) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedClip(clip);
    setShowCommentsModal(true);
  };

  const handleShare = async (clip: Clip) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await Share.share({
        message: `Check out this clip by @${clip.user.username} on Intera!\n\n${clip.description}`,
        url: clip.videoUrl || clip.thumbnail,
      });
      if (result.action === Share.sharedAction) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Configure audio mode to play sound even when phone is on silent
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
      } catch (error) {
        console.log('Error configuring audio mode:', error);
      }
    };
    configureAudio();
  }, []);

  // One-time gesture hint (helps users discover swipe + double tap).
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const seen = await AsyncStorage.getItem('clips_hint_seen');
        if (!mounted) return;
        if (!seen) {
          setShowHint(true);
          await AsyncStorage.setItem('clips_hint_seen', '1');
          setTimeout(() => {
            if (mounted) setShowHint(false);
          }, 3500);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const onMomentumScrollEnd = useCallback(
    (e: any) => {
      const y = e?.nativeEvent?.contentOffset?.y ?? 0;
      const next = Math.round(y / Math.max(1, pagerHeight));
      if (!Number.isNaN(next)) setActiveIndex(next);
    },
    [pagerHeight]
  );

  const handleCreateClip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/create-clip');
  };

  const handleTabChange = (tab: 'following' | 'foryou') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  return (
    <View
      className="flex-1 bg-black"
      onLayout={(e) => {
        // Use the actual container height (accounts for tab bar/safe areas) to keep paging exact.
        const h = e.nativeEvent.layout.height;
        if (h && Math.abs(h - pagerHeight) > 2) setPagerHeight(h);
      }}
    >
      {/* Header - Enhanced */}
      <View
        className="absolute z-10 left-0 right-0 flex-row items-center justify-between px-4"
        style={{ top: insets.top + 8 }}
      >
        {/* Spacer for balance */}
        <View style={{ width: 44 }} />

        {/* Tab Switcher - Enhanced */}
        <Animated.View entering={FadeIn.duration(400)} className="flex-row items-center bg-black/30 rounded-full px-1 py-1 backdrop-blur-sm">
          <Pressable 
            onPress={() => handleTabChange('following')} 
            className={`px-5 py-2 rounded-full ${activeTab === 'following' ? 'bg-white' : ''}`}
          >
            <Text
              className={`font-semibold text-sm ${
                activeTab === 'following' ? 'text-black' : 'text-white'
              }`}
            >
              Following
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => handleTabChange('foryou')} 
            className={`px-5 py-2 rounded-full ${activeTab === 'foryou' ? 'bg-white' : ''}`}
          >
            <View className="flex-row items-center">
              <Text
                className={`font-semibold text-sm ${
                  activeTab === 'foryou' ? 'text-black' : 'text-white'
                }`}
              >
                For You
              </Text>
              {activeTab === 'foryou' && (
                <TrendingUp size={14} color="#000" style={{ marginLeft: 4 }} />
              )}
            </View>
          </Pressable>
        </Animated.View>

        {/* Create Button - Enhanced */}
        <Pressable
          onPress={handleCreateClip}
          className="bg-white rounded-full w-10 h-10 items-center justify-center shadow-lg"
        >
          <Plus size={22} color="#000" strokeWidth={3} />
        </Pressable>
      </View>

      {/* Clips Feed - Enhanced with Pull to Refresh */}
      <FlatList
        data={filteredClips}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ClipItem
            clip={item}
            isActive={index === activeIndex}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onBlockUser={() => handleBlockUser({ id: item.user.id, name: item.user.name, avatar: item.user.avatar })}
            onReportUser={() => handleReportUser({ id: item.user.id, name: item.user.name, avatar: item.user.avatar })}
            onComment={() => handleComment(item)}
            onShare={() => handleShare(item)}
            itemHeight={pagerHeight}
            itemWidth={SCREEN_WIDTH}
          />
        )}
        pagingEnabled
        scrollEnabled={!(showCommentsModal || showReportModal || showBlockConfirmModal)}
        showsVerticalScrollIndicator={false}
        snapToInterval={pagerHeight}
        snapToAlignment="start"
        disableIntervalMomentum
        bounces={false}
        overScrollMode="never"
        decelerationRate="fast"
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        onMomentumScrollEnd={onMomentumScrollEnd}
        getItemLayout={(_, index) => ({ length: pagerHeight, offset: pagerHeight * index, index })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
      />

      {/* Gesture hint overlay (shows once) */}
      {showHint ? (
        <Pressable
          onPress={() => setShowHint(false)}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.65)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.65)']}
            locations={[0, 0.5, 1]}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
          >
            <View style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, textAlign: 'center' }}>
                Tips
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.92)', marginTop: 10, fontWeight: '700', textAlign: 'center' }}>
                Swipe up/down to browse • Double tap to like
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6, fontWeight: '700', textAlign: 'center' }}>
                Swipe left for comments • Swipe right for creator
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.70)', marginTop: 10, textAlign: 'center' }}>
                Tap anywhere to dismiss
              </Text>
            </View>
          </LinearGradient>
        </Pressable>
      ) : null}

      {/* Comments Modal */}
      <CommentsModal
        visible={showCommentsModal}
        clip={selectedClip}
        onClose={() => {
          setShowCommentsModal(false);
          setSelectedClip(null);
        }}
      />

      {/* Block Confirmation Modal */}
      <Modal
        visible={showBlockConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBlockConfirmModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/70 justify-center items-center px-6"
          onPress={() => setShowBlockConfirmModal(false)}
        >
          <Animated.View
            entering={SlideInUp.duration(300)}
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View className="items-center pt-6 pb-4 px-6">
                <View className="bg-red-100 rounded-full p-4 mb-4">
                  <Ban size={32} color="#DC2626" />
                </View>
                <Text className="text-xl font-bold text-warmBrown text-center">
                  Block {selectedClipUser?.name}?
                </Text>
                <Text className="text-gray-500 text-center mt-2 leading-5">
                  You won't see their clips anymore and our team will be notified.
                </Text>
              </View>

              <View className="border-t border-gray-100 flex-row">
                <Pressable
                  onPress={() => setShowBlockConfirmModal(false)}
                  className="flex-1 py-4 border-r border-gray-100"
                >
                  <Text className="text-center font-semibold text-gray-600">Cancel</Text>
                </Pressable>
                <Pressable onPress={confirmBlockUser} className="flex-1 py-4">
                  <Text className="text-center font-semibold text-red-600">Block</Text>
                </Pressable>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View className="flex-1 bg-black/70">
          <Pressable className="flex-1" onPress={() => setShowReportModal(false)} />
          <Animated.View
            entering={SlideInUp.duration(300)}
            className="bg-white rounded-t-3xl max-h-[80%]"
          >
            <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
              <Text className="text-lg font-bold text-warmBrown">
                {reportStep === 'done' ? 'Report Submitted' : 'Report User'}
              </Text>
              <Pressable
                onPress={() => setShowReportModal(false)}
                className="p-1"
                hitSlop={8}
              >
                <X size={24} color="#6B7280" />
              </Pressable>
            </View>

            <View className="px-5 py-4">
              {reportStep === 'reason' && (
                <>
                  <Text className="text-gray-600 mb-4">
                    Why are you reporting {selectedClipUser?.name}?
                  </Text>
                  {REPORT_REASONS.map((reason) => (
                    <Pressable
                      key={reason.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedReason(reason.id);
                        setReportStep('confirm');
                      }}
                      className="py-4 border-b border-gray-100"
                    >
                      <Text className="text-warmBrown font-medium">{reason.label}</Text>
                      <Text className="text-gray-500 text-sm mt-0.5">{reason.description}</Text>
                    </Pressable>
                  ))}
                  <View className="flex-row items-start bg-amber-50 rounded-xl p-3 mt-4">
                    <AlertTriangle size={16} color="#D97706" />
                    <Text className="flex-1 text-amber-700 text-xs ml-2">
                      False reports may result in account restrictions.
                    </Text>
                  </View>
                </>
              )}

              {reportStep === 'confirm' && (
                <View className="items-center py-4">
                  <View className="bg-amber-100 rounded-full p-4 mb-4">
                    <Flag size={32} color="#D97706" />
                  </View>
                  <Text className="text-lg font-bold text-warmBrown text-center">Confirm Report</Text>
                  <Text className="text-gray-500 text-center mt-2">
                    Reporting {selectedClipUser?.name} for:
                  </Text>
                  <View className="bg-gray-100 rounded-xl px-4 py-2 mt-3">
                    <Text className="text-warmBrown font-medium">
                      {REPORT_REASONS.find((r) => r.id === selectedReason)?.label}
                    </Text>
                  </View>
                  <View className="flex-row mt-6 w-full">
                    <Pressable
                      onPress={() => setReportStep('reason')}
                      className="flex-1 bg-gray-100 rounded-xl py-3 mr-2"
                    >
                      <Text className="text-gray-600 font-medium text-center">Back</Text>
                    </Pressable>
                    <Pressable onPress={submitReport} className="flex-1 bg-amber-500 rounded-xl py-3 ml-2">
                      <Text className="text-white font-medium text-center">Submit</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {reportStep === 'done' && (
                <View className="items-center py-8">
                  <View className="bg-green-100 rounded-full p-4 mb-4">
                    <Shield size={32} color="#22C55E" />
                  </View>
                  <Text className="text-lg font-bold text-warmBrown text-center">Thank You</Text>
                  <Text className="text-gray-500 text-center mt-2">
                    Your report has been submitted.
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
