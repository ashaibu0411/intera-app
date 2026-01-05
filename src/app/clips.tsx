import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, TextInput, Dimensions, Modal } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Scissors,
  Play,
  Pause,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Clock,
  Eye,
  TrendingUp,
  Search,
  Filter,
  Flag,
  Bookmark,
  BookmarkCheck,
  X,
  Send,
  ChevronRight,
  Flame,
  Music,
  Laugh,
  Sparkles,
  Users
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/lib/store';
import { moderateText, type ModerationResult } from '@/lib/contentModeration';
import { ReportContentModal } from '@/components/ReportContentModal';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Clip interface
interface Clip {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  sourceType: 'stream' | 'battle' | 'voice_room';
  sourceId: string;
  sourceTitle: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration: number; // seconds (15-60)
  views: number;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
  category: string;
  tags: string[];
  createdAt: string;
}

// Mock clips data
const MOCK_CLIPS: Clip[] = [
  {
    id: '1',
    creatorId: 'u1',
    creatorName: 'Amara Johnson',
    creatorAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
    sourceType: 'battle',
    sourceId: 'b1',
    sourceTitle: 'Epic Battle Moment',
    title: 'When the crowd went WILD!',
    description: 'That moment when I received 500 gems in one minute during the battle! Thank you all!',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    videoUrl: '',
    duration: 30,
    views: 12500,
    likes: 890,
    comments: 156,
    shares: 45,
    isLiked: false,
    isSaved: false,
    category: 'entertainment',
    tags: ['battle', 'epic', 'gems'],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    creatorId: 'u2',
    creatorName: 'Kwame Asante',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    sourceType: 'stream',
    sourceId: 's1',
    sourceTitle: 'Music Session Live',
    title: 'Afrobeats freestyle that broke the internet',
    description: 'My freestyle session that everyone loved. More music coming soon!',
    thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    videoUrl: '',
    duration: 45,
    views: 28900,
    likes: 2100,
    comments: 342,
    shares: 189,
    isLiked: true,
    isSaved: true,
    category: 'music',
    tags: ['music', 'afrobeats', 'freestyle'],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: '3',
    creatorId: 'u3',
    creatorName: 'Fatou Sow',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    sourceType: 'voice_room',
    sourceId: 'v1',
    sourceTitle: 'Business Talk',
    title: 'The advice that changed my business',
    description: 'This golden nugget from our business discussion helped me scale to 6 figures!',
    thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
    videoUrl: '',
    duration: 58,
    views: 8700,
    likes: 567,
    comments: 89,
    shares: 234,
    isLiked: false,
    isSaved: false,
    category: 'business',
    tags: ['business', 'advice', 'entrepreneur'],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    id: '4',
    creatorId: 'u4',
    creatorName: 'Grace Nwosu',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    sourceType: 'battle',
    sourceId: 'b2',
    sourceTitle: 'Dance Battle Finals',
    title: 'The dance move that won it all',
    description: 'When I pulled out THIS move, the crowd lost it! Dance battle champion!',
    thumbnailUrl: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400',
    videoUrl: '',
    duration: 22,
    views: 45200,
    likes: 4300,
    comments: 567,
    shares: 890,
    isLiked: false,
    isSaved: false,
    category: 'dance',
    tags: ['dance', 'battle', 'winner'],
    createdAt: new Date(Date.now() - 28800000).toISOString(),
  },
  {
    id: '5',
    creatorId: 'u5',
    creatorName: 'David Okonkwo',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    sourceType: 'stream',
    sourceId: 's2',
    sourceTitle: 'Comedy Hour',
    title: 'The joke that had everyone crying',
    description: 'Y\'all asked for this clip! The funniest moment from yesterday\'s stream',
    thumbnailUrl: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400',
    videoUrl: '',
    duration: 35,
    views: 67800,
    likes: 5600,
    comments: 1200,
    shares: 2300,
    isLiked: true,
    isSaved: false,
    category: 'comedy',
    tags: ['comedy', 'funny', 'viral'],
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'comedy', label: 'Comedy', icon: Laugh },
  { id: 'dance', label: 'Dance', icon: Users },
  { id: 'battle', label: 'Battles', icon: Flame },
];

export default function ClipsScreen() {
  const [clips, setClips] = useState<Clip[]>(MOCK_CLIPS);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingClipId, setReportingClipId] = useState<string | null>(null);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);

  const currentUser = useStore((s) => s.currentUser);

  const filteredClips = clips.filter((clip) => {
    const matchesCategory = selectedCategory === 'all' ||
      selectedCategory === 'trending' ||
      clip.category === selectedCategory ||
      clip.tags.includes(selectedCategory);

    const matchesSearch = !searchQuery ||
      clip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clip.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clip.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Sort by views for trending
  const sortedClips = selectedCategory === 'trending'
    ? [...filteredClips].sort((a, b) => b.views - a.views)
    : filteredClips;

  const handleLike = (clipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setClips(clips.map(clip =>
      clip.id === clipId
        ? { ...clip, isLiked: !clip.isLiked, likes: clip.isLiked ? clip.likes - 1 : clip.likes + 1 }
        : clip
    ));
  };

  const handleSave = (clipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setClips(clips.map(clip =>
      clip.id === clipId ? { ...clip, isSaved: !clip.isSaved } : clip
    ));
  };

  const handleReport = (clipId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setReportingClipId(clipId);
    setShowReportModal(true);
  };

  const handleShare = (clip: Clip) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In real app, would open share sheet
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeAgo = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          title: 'Clips',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerBackVisible: true,
        }}
      />

      {/* Search Bar */}
      <View className="px-4 py-3">
        <View className="bg-gray-900 rounded-xl flex-row items-center px-4 py-3">
          <Search size={20} color="#6B7280" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search clips, creators, tags..."
            placeholderTextColor="#6B7280"
            className="flex-1 text-white ml-3"
          />
          {searchQuery && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={20} color="#6B7280" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-4 mb-2"
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: 8 }}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const Icon = cat.icon;

          return (
            <Pressable
              key={cat.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(cat.id);
              }}
              className={`flex-row items-center px-4 py-2 rounded-full ${
                isSelected ? 'bg-purple-600' : 'bg-gray-900'
              }`}
            >
              <Icon size={16} color={isSelected ? 'white' : '#9CA3AF'} />
              <Text className={`ml-2 font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                {cat.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Clips Feed */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {sortedClips.map((clip, index) => (
          <Animated.View
            key={clip.id}
            entering={FadeInUp.duration(400).delay(index * 100)}
          >
            <ClipCard
              clip={clip}
              isPlaying={playingClipId === clip.id}
              onPlay={() => setPlayingClipId(playingClipId === clip.id ? null : clip.id)}
              onLike={() => handleLike(clip.id)}
              onSave={() => handleSave(clip.id)}
              onShare={() => handleShare(clip)}
              onReport={() => handleReport(clip.id)}
              formatNumber={formatNumber}
              formatDuration={formatDuration}
              getTimeAgo={getTimeAgo}
            />
          </Animated.View>
        ))}

        {sortedClips.length === 0 && (
          <View className="py-12 items-center">
            <Scissors size={48} color="#6B7280" />
            <Text className="text-gray-400 text-lg mt-4">No clips found</Text>
            <Text className="text-gray-600 text-sm mt-1">Try a different search or category</Text>
          </View>
        )}
      </ScrollView>

      {/* Report Modal */}
      <ReportContentModal
        visible={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setReportingClipId(null);
        }}
        onSubmit={(reason, description) => {
          console.log('Report submitted:', { clipId: reportingClipId, reason, description });
        }}
        contentType="video"
        contentId={reportingClipId || ''}
      />
    </View>
  );
}

interface ClipCardProps {
  clip: Clip;
  isPlaying: boolean;
  onPlay: () => void;
  onLike: () => void;
  onSave: () => void;
  onShare: () => void;
  onReport: () => void;
  formatNumber: (num: number) => string;
  formatDuration: (seconds: number) => string;
  getTimeAgo: (dateStr: string) => string;
}

function ClipCard({
  clip,
  isPlaying,
  onPlay,
  onLike,
  onSave,
  onShare,
  onReport,
  formatNumber,
  formatDuration,
  getTimeAgo,
}: ClipCardProps) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <View className="mx-4 mb-4 bg-gray-900 rounded-2xl overflow-hidden">
      {/* Creator Header */}
      <View className="flex-row items-center p-3">
        <Image
          source={{ uri: clip.creatorAvatar }}
          className="w-10 h-10 rounded-full"
        />
        <View className="flex-1 ml-3">
          <Text className="text-white font-semibold">{clip.creatorName}</Text>
          <Text className="text-gray-500 text-xs">{getTimeAgo(clip.createdAt)}</Text>
        </View>
        <Pressable
          onPress={() => setShowOptions(!showOptions)}
          className="p-2"
        >
          <MoreHorizontal size={20} color="#9CA3AF" />
        </Pressable>
      </View>

      {/* Options Dropdown */}
      {showOptions && (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="absolute top-14 right-4 bg-gray-800 rounded-xl z-20 overflow-hidden"
        >
          <Pressable
            onPress={() => {
              onSave();
              setShowOptions(false);
            }}
            className="flex-row items-center px-4 py-3 border-b border-gray-700"
          >
            {clip.isSaved ? (
              <BookmarkCheck size={18} color="#A855F7" />
            ) : (
              <Bookmark size={18} color="#9CA3AF" />
            )}
            <Text className="text-white ml-3">{clip.isSaved ? 'Unsave' : 'Save'}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onReport();
              setShowOptions(false);
            }}
            className="flex-row items-center px-4 py-3"
          >
            <Flag size={18} color="#EF4444" />
            <Text className="text-red-400 ml-3">Report</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Video Thumbnail */}
      <Pressable onPress={onPlay} className="relative">
        <Image
          source={{ uri: clip.thumbnailUrl }}
          className="w-full aspect-video"
          resizeMode="cover"
        />

        {/* Play Button Overlay */}
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          <View className="bg-white/90 rounded-full p-4">
            {isPlaying ? (
              <Pause size={28} color="#000" fill="#000" />
            ) : (
              <Play size={28} color="#000" fill="#000" />
            )}
          </View>
        </View>

        {/* Duration Badge */}
        <View className="absolute bottom-2 right-2 bg-black/70 rounded px-2 py-1">
          <Text className="text-white text-xs font-medium">{formatDuration(clip.duration)}</Text>
        </View>

        {/* Source Badge */}
        <View className="absolute top-2 left-2 bg-purple-600/90 rounded-full px-3 py-1 flex-row items-center">
          <Scissors size={12} color="white" />
          <Text className="text-white text-xs font-medium ml-1 capitalize">
            {clip.sourceType.replace('_', ' ')}
          </Text>
        </View>
      </Pressable>

      {/* Content */}
      <View className="p-3">
        <Text className="text-white font-semibold text-base" numberOfLines={2}>
          {clip.title}
        </Text>
        {clip.description && (
          <Text className="text-gray-400 text-sm mt-1" numberOfLines={2}>
            {clip.description}
          </Text>
        )}

        {/* Tags */}
        <View className="flex-row flex-wrap mt-2">
          {clip.tags.slice(0, 3).map((tag) => (
            <View key={tag} className="bg-gray-800 rounded-full px-2 py-1 mr-2 mb-1">
              <Text className="text-purple-400 text-xs">#{tag}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Stats & Actions */}
      <View className="flex-row items-center justify-between px-3 pb-3 border-t border-gray-800 pt-3">
        {/* Views */}
        <View className="flex-row items-center">
          <Eye size={16} color="#6B7280" />
          <Text className="text-gray-400 text-sm ml-1">{formatNumber(clip.views)}</Text>
        </View>

        {/* Actions */}
        <View className="flex-row items-center">
          <Pressable onPress={onLike} className="flex-row items-center mr-4">
            <Heart
              size={20}
              color={clip.isLiked ? '#EF4444' : '#6B7280'}
              fill={clip.isLiked ? '#EF4444' : 'transparent'}
            />
            <Text className={`ml-1 text-sm ${clip.isLiked ? 'text-red-400' : 'text-gray-400'}`}>
              {formatNumber(clip.likes)}
            </Text>
          </Pressable>

          <Pressable className="flex-row items-center mr-4">
            <MessageCircle size={20} color="#6B7280" />
            <Text className="text-gray-400 text-sm ml-1">{formatNumber(clip.comments)}</Text>
          </Pressable>

          <Pressable onPress={onShare} className="flex-row items-center">
            <Share2 size={20} color="#6B7280" />
            <Text className="text-gray-400 text-sm ml-1">{formatNumber(clip.shares)}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
