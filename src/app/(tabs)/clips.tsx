import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, Pressable, Dimensions, FlatList, ViewToken, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Video as ExpoVideo, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
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
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

interface Clip {
  id: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isVerified: boolean;
  };
  videoUrl?: string;
  thumbnail: string;
  description: string;
  music: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
}

// Demo clips with sample video URLs (using public sample videos)
const MOCK_CLIPS: Clip[] = [
  {
    id: '1',
    user: {
      id: 'u1',
      name: 'Sarah Johnson',
      username: 'sarahj',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
      isVerified: true,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=1400&fit=crop',
    description: 'Weekend road trip vibes! Who else loves spontaneous adventures? #roadtrip #adventure #travel',
    music: 'Original Audio - Sarah',
    likes: 12400,
    comments: 342,
    shares: 89,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '2',
    user: {
      id: 'u2',
      name: 'Mike Chen',
      username: 'mikechen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      isVerified: false,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=1400&fit=crop',
    description: 'Found the perfect carpool crew for my daily commute. Life-changing! #carpool #commute #friends',
    music: 'Sunny Day - Acoustic',
    likes: 8930,
    comments: 215,
    shares: 67,
    isLiked: true,
    isSaved: false,
  },
  {
    id: '3',
    user: {
      id: 'u3',
      name: 'Emma Wilson',
      username: 'emmaw',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
      isVerified: true,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=1400&fit=crop',
    description: 'City drives hit different at golden hour. Who wants to join? #goldenhour #citylife #carpool',
    music: 'Golden - Harry Styles',
    likes: 24100,
    comments: 567,
    shares: 234,
    isLiked: false,
    isSaved: true,
  },
  {
    id: '4',
    user: {
      id: 'u4',
      name: 'Alex Rivera',
      username: 'alexr',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
      isVerified: false,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&h=1400&fit=crop',
    description: 'Mountain road trip with the best crew. Nothing beats these views! #mountains #roadtrip',
    music: 'On The Road Again',
    likes: 15600,
    comments: 423,
    shares: 156,
    isLiked: false,
    isSaved: false,
  },
  {
    id: '5',
    user: {
      id: 'u5',
      name: 'Lisa Park',
      username: 'lisapark',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
      isVerified: true,
    },
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=1400&fit=crop',
    description: 'Beach carpool anyone? The waves are calling! #beach #summer #roadtrip',
    music: 'Ocean Eyes - Billie Eilish',
    likes: 31200,
    comments: 890,
    shares: 412,
    isLiked: true,
    isSaved: true,
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

interface ClipItemProps {
  clip: Clip;
  isActive: boolean;
}

function ClipItem({ clip, isActive }: ClipItemProps) {
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(clip.isLiked);
  const [saved, setSaved] = useState(clip.isSaved);
  const [likeCount, setLikeCount] = useState(clip.likes);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<ExpoVideo>(null);

  const heartScale = useSharedValue(1);
  const doubleTapHeart = useSharedValue(0);

  // Auto-play/pause based on visibility
  useEffect(() => {
    if (isActive && clip.videoUrl) {
      videoRef.current?.playAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
  }, [isActive, clip.videoUrl]);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const doubleTapHeartStyle = useAnimatedStyle(() => ({
    opacity: doubleTapHeart.value,
    transform: [{ scale: doubleTapHeart.value }],
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
        withTiming(1, { duration: 600 }),
        withTiming(0, { duration: 200 })
      );
      setLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaved(!saved);
  };

  const handleComment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

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
      // Single tap toggles play/pause
      togglePlayPause();
    }
    lastTap.current = now;
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setIsLoading(false);
    }
  };

  return (
    <Pressable
      onPress={handleTap}
      style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH }}
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
            isMuted={false}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          />
          {/* Thumbnail while loading */}
          {isLoading && (
            <Image
              source={{ uri: clip.thumbnail }}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
              contentFit="cover"
            />
          )}
        </>
      ) : (
        <Image
          source={{ uri: clip.thumbnail }}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
          contentFit="cover"
        />
      )}

      {/* Gradient Overlays */}
      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'transparent', 'transparent', 'rgba(0,0,0,0.6)']}
        locations={[0, 0.2, 0.6, 1]}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* Double Tap Heart */}
      <Animated.View
        style={[doubleTapHeartStyle, { position: 'absolute', top: '40%', left: '35%' }]}
      >
        <Heart size={120} color="#fff" fill="#fff" />
      </Animated.View>

      {/* Loading Indicator */}
      {isLoading && clip.videoUrl && (
        <View className="absolute inset-0 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Play/Pause Indicator (shows briefly when toggling) */}
      {!isPlaying && !isLoading && (
        <View className="absolute inset-0 items-center justify-center">
          <View className="bg-black/30 rounded-full p-4">
            <Play size={48} color="#fff" fill="#fff" />
          </View>
        </View>
      )}

      {/* Right Side Actions */}
      <View
        className="absolute right-3 items-center gap-5"
        style={{ bottom: 120 + insets.bottom }}
      >
        {/* Profile */}
        <View className="items-center">
          <Pressable className="relative">
            <Image
              source={{ uri: clip.user.avatar }}
              style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#fff' }}
              contentFit="cover"
            />
            <Pressable
              onPress={handleFollow}
              className="absolute -bottom-2 left-1/2 -ml-3 bg-rose-500 rounded-full w-6 h-6 items-center justify-center"
            >
              <Plus size={14} color="#fff" strokeWidth={3} />
            </Pressable>
          </Pressable>
        </View>

        {/* Like */}
        <Pressable onPress={handleLike} className="items-center">
          <Animated.View style={heartAnimatedStyle}>
            <Heart
              size={32}
              color={liked ? '#EF4444' : '#fff'}
              fill={liked ? '#EF4444' : 'transparent'}
            />
          </Animated.View>
          <Text className="text-white text-xs font-semibold mt-1">
            {formatNumber(likeCount)}
          </Text>
        </Pressable>

        {/* Comment */}
        <Pressable onPress={handleComment} className="items-center">
          <MessageCircle size={32} color="#fff" />
          <Text className="text-white text-xs font-semibold mt-1">
            {formatNumber(clip.comments)}
          </Text>
        </Pressable>

        {/* Save */}
        <Pressable onPress={handleSave} className="items-center">
          <Bookmark
            size={30}
            color={saved ? '#FBBF24' : '#fff'}
            fill={saved ? '#FBBF24' : 'transparent'}
          />
        </Pressable>

        {/* Share */}
        <Pressable onPress={handleShare} className="items-center">
          <Share2 size={28} color="#fff" />
          <Text className="text-white text-xs font-semibold mt-1">
            {formatNumber(clip.shares)}
          </Text>
        </Pressable>

        {/* More */}
        <Pressable className="items-center">
          <MoreHorizontal size={26} color="#fff" />
        </Pressable>
      </View>

      {/* Bottom Info */}
      <View
        className="absolute left-4 right-20"
        style={{ bottom: 100 + insets.bottom }}
      >
        {/* Username */}
        <View className="flex-row items-center mb-2">
          <Text className="text-white font-bold text-base">@{clip.user.username}</Text>
          {clip.user.isVerified && (
            <View className="ml-1 bg-blue-500 rounded-full w-4 h-4 items-center justify-center">
              <Text className="text-white text-xs">✓</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <Text className="text-white text-sm leading-5 mb-3" numberOfLines={3}>
          {clip.description}
        </Text>

        {/* Music */}
        <View className="flex-row items-center">
          <Music2 size={14} color="#fff" />
          <Text className="text-white text-xs ml-2" numberOfLines={1}>
            {clip.music}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function ClipsTabScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'following' | 'foryou'>('foryou');
  const isGuest = useStore((s) => s.isGuest);
  const currentUser = useStore((s) => s.currentUser);

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

  const handleCreateClip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/create-clip');
  };

  const handleTabChange = (tab: 'following' | 'foryou') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View
        className="absolute z-10 left-0 right-0 flex-row items-center justify-between px-4"
        style={{ top: insets.top + 8 }}
      >
        {/* Spacer for balance */}
        <View style={{ width: 44 }} />

        {/* Tab Switcher */}
        <Animated.View entering={FadeIn.duration(400)} className="flex-row items-center">
          <Pressable onPress={() => handleTabChange('following')} className="px-4 py-2">
            <Text
              className={`font-semibold text-base ${
                activeTab === 'following' ? 'text-white' : 'text-white/60'
              }`}
            >
              Following
            </Text>
            {activeTab === 'following' && (
              <View className="absolute bottom-1 left-4 right-4 h-0.5 bg-white rounded-full" />
            )}
          </Pressable>
          <View className="w-px h-4 bg-white/30 mx-1" />
          <Pressable onPress={() => handleTabChange('foryou')} className="px-4 py-2">
            <Text
              className={`font-semibold text-base ${
                activeTab === 'foryou' ? 'text-white' : 'text-white/60'
              }`}
            >
              For You
            </Text>
            {activeTab === 'foryou' && (
              <View className="absolute bottom-1 left-4 right-4 h-0.5 bg-white rounded-full" />
            )}
          </Pressable>
        </Animated.View>

        {/* Create Button */}
        <Pressable
          onPress={handleCreateClip}
          className="bg-white rounded-lg w-11 h-7 items-center justify-center"
        >
          <Plus size={20} color="#000" strokeWidth={3} />
        </Pressable>
      </View>

      {/* Clips Feed */}
      <FlatList
        data={MOCK_CLIPS}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ClipItem clip={item} isActive={index === activeIndex} />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
      />
    </View>
  );
}
