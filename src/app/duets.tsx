import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, Dimensions, Modal, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SplitSquareVertical,
  Play,
  Pause,
  Video,
  Music,
  Users,
  Heart,
  MessageCircle,
  Share2,
  Plus,
  X,
  Camera,
  Sparkles,
  TrendingUp,
  Clock,
  AlertTriangle,
  Check
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/lib/store';
import { moderateText, validateStreamContent } from '@/lib/contentModeration';
import { ContentGuidelinesModal } from '@/components/ContentGuidelinesModal';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Duet Types
interface DuetVideo {
  id: string;
  originalVideoId: string;
  originalCreator: {
    id: string;
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  duetCreator: {
    id: string;
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  originalThumbnail: string;
  duetThumbnail: string;
  title: string;
  description: string;
  category: 'music' | 'dance' | 'comedy' | 'reaction' | 'challenge';
  layout: 'side_by_side' | 'top_bottom' | 'picture_in_picture';
  views: number;
  likes: number;
  comments: number;
  shares: number;
  duration: number;
  createdAt: string;
  isLiked?: boolean;
}

interface OriginalVideo {
  id: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  thumbnail: string;
  title: string;
  category: string;
  duetsEnabled: boolean;
  duetCount: number;
  views: number;
  duration: number;
}

// Mock data
const MOCK_DUETS: DuetVideo[] = [
  {
    id: 'd1',
    originalVideoId: 'v1',
    originalCreator: {
      id: 'u1',
      name: 'Amara J.',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
      isVerified: true,
    },
    duetCreator: {
      id: 'u2',
      name: 'Kwame A.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      isVerified: false,
    },
    originalThumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    duetThumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
    title: 'Harmonizing with Amara!',
    description: 'Had to duet this beautiful melody',
    category: 'music',
    layout: 'side_by_side',
    views: 12500,
    likes: 890,
    comments: 45,
    shares: 23,
    duration: 45,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isLiked: false,
  },
  {
    id: 'd2',
    originalVideoId: 'v2',
    originalCreator: {
      id: 'u3',
      name: 'Grace N.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      isVerified: true,
    },
    duetCreator: {
      id: 'u4',
      name: 'Fatou S.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      isVerified: false,
    },
    originalThumbnail: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400',
    duetThumbnail: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
    title: 'Dance Challenge Accepted!',
    description: 'Trying to keep up with Grace!',
    category: 'dance',
    layout: 'side_by_side',
    views: 23400,
    likes: 1560,
    comments: 89,
    shares: 67,
    duration: 30,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    isLiked: true,
  },
  {
    id: 'd3',
    originalVideoId: 'v3',
    originalCreator: {
      id: 'u5',
      name: 'David O.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      isVerified: true,
    },
    duetCreator: {
      id: 'u6',
      name: 'Marcus T.',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
      isVerified: false,
    },
    originalThumbnail: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400',
    duetThumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    title: 'Comedy Duo React!',
    description: 'Our reaction to David\'s latest skit',
    category: 'reaction',
    layout: 'top_bottom',
    views: 45600,
    likes: 3200,
    comments: 234,
    shares: 156,
    duration: 60,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    isLiked: false,
  },
];

const MOCK_ORIGINAL_VIDEOS: OriginalVideo[] = [
  {
    id: 'v1',
    creator: {
      id: 'u1',
      name: 'Amara J.',
      avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
      isVerified: true,
    },
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    title: 'Original Song - Acoustic',
    category: 'music',
    duetsEnabled: true,
    duetCount: 45,
    views: 125000,
    duration: 90,
  },
  {
    id: 'v2',
    creator: {
      id: 'u3',
      name: 'Grace N.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      isVerified: true,
    },
    thumbnail: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400',
    title: 'New Dance Challenge',
    category: 'dance',
    duetsEnabled: true,
    duetCount: 234,
    views: 890000,
    duration: 30,
  },
  {
    id: 'v3',
    creator: {
      id: 'u5',
      name: 'David O.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
      isVerified: true,
    },
    thumbnail: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400',
    title: 'Comedy Skit Ep. 5',
    category: 'comedy',
    duetsEnabled: true,
    duetCount: 89,
    views: 450000,
    duration: 60,
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'dance', label: 'Dance', icon: Users },
  { id: 'comedy', label: 'Comedy', icon: Video },
  { id: 'reaction', label: 'Reactions', icon: MessageCircle },
];

export default function DuetsScreen() {
  const [duets, setDuets] = useState<DuetVideo[]>(MOCK_DUETS);
  const [originalVideos, setOriginalVideos] = useState<OriginalVideo[]>(MOCK_ORIGINAL_VIDEOS);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreateDuet, setShowCreateDuet] = useState(false);
  const [selectedOriginal, setSelectedOriginal] = useState<OriginalVideo | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [activeTab, setActiveTab] = useState<'duets' | 'originals'>('duets');

  const filteredDuets = selectedCategory === 'all'
    ? duets
    : duets.filter(d => d.category === selectedCategory);

  const handleLike = (duetId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDuets(duets.map(d =>
      d.id === duetId
        ? { ...d, isLiked: !d.isLiked, likes: d.isLiked ? d.likes - 1 : d.likes + 1 }
        : d
    ));
  };

  const handleCreateDuet = (video: OriginalVideo) => {
    setSelectedOriginal(video);
    setShowGuidelines(true);
  };

  const handleGuidelinesAccepted = () => {
    setShowGuidelines(false);
    setShowCreateDuet(true);
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

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          title: 'Duets',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerBackVisible: true,
        }}
      />

      {/* Tab Switcher */}
      <View className="flex-row mx-4 mt-2 bg-gray-900 rounded-xl p-1">
        <Pressable
          onPress={() => setActiveTab('duets')}
          className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${
            activeTab === 'duets' ? 'bg-purple-600' : ''
          }`}
        >
          <SplitSquareVertical size={18} color={activeTab === 'duets' ? 'white' : '#9CA3AF'} />
          <Text className={`ml-2 font-medium ${activeTab === 'duets' ? 'text-white' : 'text-gray-400'}`}>
            Duets
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('originals')}
          className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${
            activeTab === 'originals' ? 'bg-purple-600' : ''
          }`}
        >
          <Video size={18} color={activeTab === 'originals' ? 'white' : '#9CA3AF'} />
          <Text className={`ml-2 font-medium ${activeTab === 'originals' ? 'text-white' : 'text-gray-400'}`}>
            Duet With
          </Text>
        </Pressable>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="py-4"
        contentContainerStyle={{ paddingHorizontal: 16 }}
        style={{ flexGrow: 0 }}
      >
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory(cat.id);
            }}
            className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
              selectedCategory === cat.id ? 'bg-purple-600' : 'bg-gray-800'
            }`}
          >
            <cat.icon size={16} color={selectedCategory === cat.id ? 'white' : '#9CA3AF'} />
            <Text className={`ml-2 ${selectedCategory === cat.id ? 'text-white' : 'text-gray-400'}`}>
              {cat.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {activeTab === 'duets' ? (
          <>
            {/* Trending Duets Header */}
            <View className="flex-row items-center px-4 mb-4">
              <TrendingUp size={20} color="#A855F7" />
              <Text className="text-white font-bold text-lg ml-2">Trending Duets</Text>
            </View>

            {/* Duets Grid */}
            {filteredDuets.map((duet, index) => (
              <Animated.View
                key={duet.id}
                entering={FadeInUp.delay(index * 100)}
                className="mx-4 mb-4"
              >
                <Pressable className="bg-gray-900 rounded-2xl overflow-hidden">
                  {/* Split Screen Preview */}
                  <View className="flex-row h-48">
                    {/* Original Side */}
                    <View className="flex-1 relative">
                      <Image
                        source={{ uri: duet.originalThumbnail }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-full flex-row items-center">
                        <Image
                          source={{ uri: duet.originalCreator.avatar }}
                          className="w-5 h-5 rounded-full"
                        />
                        <Text className="text-white text-xs ml-1" numberOfLines={1}>
                          {duet.originalCreator.name}
                        </Text>
                      </View>
                    </View>

                    {/* Divider */}
                    <View className="w-1 bg-purple-500" />

                    {/* Duet Side */}
                    <View className="flex-1 relative">
                      <Image
                        source={{ uri: duet.duetThumbnail }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                      <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-full flex-row items-center">
                        <Image
                          source={{ uri: duet.duetCreator.avatar }}
                          className="w-5 h-5 rounded-full"
                        />
                        <Text className="text-white text-xs ml-1" numberOfLines={1}>
                          {duet.duetCreator.name}
                        </Text>
                      </View>
                      {/* Duration Badge */}
                      <View className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded-full">
                        <Text className="text-white text-xs">{formatDuration(duet.duration)}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Content */}
                  <View className="p-4">
                    <Text className="text-white font-bold text-lg">{duet.title}</Text>
                    <Text className="text-gray-400 text-sm mt-1">{duet.description}</Text>

                    {/* Category Badge */}
                    <View className="flex-row items-center mt-3">
                      <View className="bg-purple-500/20 px-3 py-1 rounded-full">
                        <Text className="text-purple-400 text-xs capitalize">{duet.category}</Text>
                      </View>
                      <Text className="text-gray-500 text-xs ml-3">
                        <Clock size={12} color="#6B7280" /> {new Date(duet.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    {/* Actions */}
                    <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-gray-800">
                      <View className="flex-row">
                        <Pressable
                          onPress={() => handleLike(duet.id)}
                          className="flex-row items-center mr-6"
                        >
                          <Heart
                            size={22}
                            color={duet.isLiked ? '#EF4444' : '#9CA3AF'}
                            fill={duet.isLiked ? '#EF4444' : 'transparent'}
                          />
                          <Text className={`ml-2 ${duet.isLiked ? 'text-red-400' : 'text-gray-400'}`}>
                            {formatNumber(duet.likes)}
                          </Text>
                        </Pressable>
                        <Pressable className="flex-row items-center mr-6">
                          <MessageCircle size={22} color="#9CA3AF" />
                          <Text className="text-gray-400 ml-2">{formatNumber(duet.comments)}</Text>
                        </Pressable>
                        <Pressable className="flex-row items-center">
                          <Share2 size={22} color="#9CA3AF" />
                          <Text className="text-gray-400 ml-2">{formatNumber(duet.shares)}</Text>
                        </Pressable>
                      </View>
                      <Text className="text-gray-500 text-sm">{formatNumber(duet.views)} views</Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}

            {filteredDuets.length === 0 && (
              <View className="items-center py-12">
                <SplitSquareVertical size={48} color="#4B5563" />
                <Text className="text-gray-500 mt-4">No duets in this category</Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Original Videos to Duet With */}
            <View className="px-4 mb-4">
              <Text className="text-white font-bold text-lg">Create a Duet</Text>
              <Text className="text-gray-400 text-sm mt-1">
                Choose a video to duet with
              </Text>
            </View>

            {originalVideos.map((video, index) => (
              <Animated.View
                key={video.id}
                entering={FadeInUp.delay(index * 100)}
                className="mx-4 mb-4"
              >
                <Pressable
                  onPress={() => handleCreateDuet(video)}
                  className="bg-gray-900 rounded-2xl overflow-hidden"
                >
                  {/* Thumbnail */}
                  <View className="relative h-48">
                    <Image
                      source={{ uri: video.thumbnail }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 }}
                    />
                    {/* Duration */}
                    <View className="absolute top-3 right-3 bg-black/60 px-2 py-1 rounded-full">
                      <Text className="text-white text-xs">{formatDuration(video.duration)}</Text>
                    </View>
                    {/* Creator Info */}
                    <View className="absolute bottom-3 left-3 flex-row items-center">
                      <Image
                        source={{ uri: video.creator.avatar }}
                        className="w-10 h-10 rounded-full border-2 border-white"
                      />
                      <View className="ml-3">
                        <View className="flex-row items-center">
                          <Text className="text-white font-bold">{video.creator.name}</Text>
                          {video.creator.isVerified && (
                            <View className="bg-blue-500 rounded-full p-0.5 ml-1">
                              <Check size={10} color="white" />
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-300 text-xs">{video.title}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Stats & Action */}
                  <View className="p-4 flex-row items-center justify-between">
                    <View>
                      <View className="flex-row items-center">
                        <SplitSquareVertical size={16} color="#A855F7" />
                        <Text className="text-purple-400 ml-2 font-medium">
                          {video.duetCount} duets
                        </Text>
                      </View>
                      <Text className="text-gray-500 text-xs mt-1">
                        {formatNumber(video.views)} views
                      </Text>
                    </View>
                    <View className="bg-purple-600 px-4 py-2 rounded-full flex-row items-center">
                      <Plus size={18} color="white" />
                      <Text className="text-white font-medium ml-1">Duet</Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Guidelines Modal */}
      <ContentGuidelinesModal
        visible={showGuidelines}
        onClose={() => setShowGuidelines(false)}
        onAccept={handleGuidelinesAccepted}
        contentType="video"
      />

      {/* Create Duet Modal */}
      <CreateDuetModal
        visible={showCreateDuet}
        onClose={() => {
          setShowCreateDuet(false);
          setSelectedOriginal(null);
        }}
        originalVideo={selectedOriginal}
        onSubmit={(duet) => {
          setDuets([duet, ...duets]);
          setShowCreateDuet(false);
          setSelectedOriginal(null);
        }}
      />
    </View>
  );
}

// Create Duet Modal Component
interface CreateDuetModalProps {
  visible: boolean;
  onClose: () => void;
  originalVideo: OriginalVideo | null;
  onSubmit: (duet: DuetVideo) => void;
}

function CreateDuetModal({ visible, onClose, originalVideo, onSubmit }: CreateDuetModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [layout, setLayout] = useState<'side_by_side' | 'top_bottom'>('side_by_side');
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Please add a title for your duet');
      return;
    }

    // Check content moderation
    const modResult = validateStreamContent(title, description);
    if (modResult.action === 'blocked') {
      setError(modResult.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!originalVideo) return;

    const newDuet: DuetVideo = {
      id: `duet_${Date.now()}`,
      originalVideoId: originalVideo.id,
      originalCreator: originalVideo.creator,
      duetCreator: {
        id: 'current_user',
        name: 'You',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        isVerified: false,
      },
      originalThumbnail: originalVideo.thumbnail,
      duetThumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400',
      title: title.trim(),
      description: description.trim(),
      category: originalVideo.category as DuetVideo['category'],
      layout,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      duration: originalVideo.duration,
      createdAt: new Date().toISOString(),
      isLiked: false,
    };

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(newDuet);

    // Reset form
    setTitle('');
    setDescription('');
    setError(null);
  };

  if (!originalVideo) return null;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View className="flex-1 bg-black">
        <SafeAreaView edges={['top', 'bottom']} className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-800">
            <Pressable onPress={onClose}>
              <X size={24} color="white" />
            </Pressable>
            <Text className="text-white font-bold text-lg">Create Duet</Text>
            <Pressable onPress={handleSubmit}>
              <Text className="text-purple-400 font-bold">Post</Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1 p-4">
            {/* Error */}
            {error && (
              <View className="bg-red-500/20 rounded-xl p-4 mb-4 flex-row items-center">
                <AlertTriangle size={20} color="#EF4444" />
                <Text className="text-red-400 ml-3 flex-1">{error}</Text>
              </View>
            )}

            {/* Preview */}
            <Text className="text-gray-400 text-sm mb-2">Preview</Text>
            <View className="bg-gray-900 rounded-2xl overflow-hidden mb-6">
              <View className={`h-48 ${layout === 'side_by_side' ? 'flex-row' : 'flex-col'}`}>
                {/* Original Video */}
                <View className={layout === 'side_by_side' ? 'flex-1' : 'flex-1'}>
                  <Image
                    source={{ uri: originalVideo.thumbnail }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-full">
                    <Text className="text-white text-xs">{originalVideo.creator.name}</Text>
                  </View>
                </View>

                {/* Divider */}
                <View className={layout === 'side_by_side' ? 'w-1 bg-purple-500' : 'h-1 bg-purple-500'} />

                {/* Your Video Placeholder */}
                <View className={`${layout === 'side_by_side' ? 'flex-1' : 'flex-1'} bg-gray-800 items-center justify-center`}>
                  {isRecording ? (
                    <View className="items-center">
                      <View className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                      <Text className="text-white mt-2">Recording...</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setIsRecording(true)}
                      className="items-center"
                    >
                      <View className="bg-purple-600 rounded-full p-4">
                        <Camera size={32} color="white" />
                      </View>
                      <Text className="text-gray-400 mt-3">Tap to record</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            {/* Layout Options */}
            <Text className="text-gray-400 text-sm mb-2">Layout</Text>
            <View className="flex-row mb-6">
              <Pressable
                onPress={() => setLayout('side_by_side')}
                className={`flex-1 py-3 mr-2 rounded-xl items-center ${
                  layout === 'side_by_side' ? 'bg-purple-600' : 'bg-gray-800'
                }`}
              >
                <SplitSquareVertical size={24} color="white" />
                <Text className="text-white text-sm mt-1">Side by Side</Text>
              </Pressable>
              <Pressable
                onPress={() => setLayout('top_bottom')}
                className={`flex-1 py-3 ml-2 rounded-xl items-center ${
                  layout === 'top_bottom' ? 'bg-purple-600' : 'bg-gray-800'
                }`}
              >
                <View className="transform rotate-90">
                  <SplitSquareVertical size={24} color="white" />
                </View>
                <Text className="text-white text-sm mt-1">Top & Bottom</Text>
              </Pressable>
            </View>

            {/* Title */}
            <Text className="text-gray-400 text-sm mb-2">Title</Text>
            <TextInput
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                setError(null);
              }}
              placeholder="Give your duet a title..."
              placeholderTextColor="#6B7280"
              className="bg-gray-800 rounded-xl p-4 text-white mb-4"
            />

            {/* Description */}
            <Text className="text-gray-400 text-sm mb-2">Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description..."
              placeholderTextColor="#6B7280"
              className="bg-gray-800 rounded-xl p-4 text-white"
              multiline
              numberOfLines={3}
            />

            {/* Original Video Info */}
            <View className="bg-gray-900 rounded-xl p-4 mt-6">
              <Text className="text-gray-400 text-sm mb-2">Dueting with</Text>
              <View className="flex-row items-center">
                <Image
                  source={{ uri: originalVideo.creator.avatar }}
                  className="w-10 h-10 rounded-full"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-white font-medium">{originalVideo.creator.name}</Text>
                  <Text className="text-gray-500 text-sm">{originalVideo.title}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
