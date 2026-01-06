import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Image, Dimensions, Modal, TextInput, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Send,
  Eye,
  Camera,
  ImageIcon,
  MessageCircle,
  MoreHorizontal,
  Flag,
  Trash2,
  Clock,
  Video,
  Image as ImageIconLucide,
  Type,
  Play
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/lib/store';
import { moderateText } from '@/lib/contentModeration';
import { ContentGuidelinesModal } from '@/components/ContentGuidelinesModal';
import { ReportContentModal } from '@/components/ReportContentModal';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Story interfaces
interface StoryItem {
  id: string;
  type: 'image' | 'text' | 'video';
  content: string; // URL for image/video, text content for text
  backgroundColor?: string;
  textColor?: string;
  duration: number; // seconds to show (default 5, videos play full duration)
  views: number;
  reactions: StoryReaction[];
  replies: StoryReply[];
  createdAt: string;
}

interface StoryReaction {
  userId: string;
  emoji: string;
  timestamp: string;
}

interface StoryReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  message: string;
  timestamp: string;
}

interface UserStories {
  userId: string;
  userName: string;
  userAvatar: string;
  stories: StoryItem[];
  hasUnseenStories: boolean;
  lastUpdated: string;
}

// Mock stories data
const MOCK_USER_STORIES: UserStories[] = [
  {
    userId: 'u1',
    userName: 'Amara J.',
    userAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200',
    stories: [
      {
        id: 's1',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
        duration: 5,
        views: 234,
        reactions: [],
        replies: [],
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 's2',
        type: 'text',
        content: 'Big announcement coming tomorrow! Stay tuned!',
        backgroundColor: '#7C3AED',
        textColor: '#FFFFFF',
        duration: 5,
        views: 189,
        reactions: [],
        replies: [],
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    hasUnseenStories: true,
    lastUpdated: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    userId: 'u2',
    userName: 'Kwame A.',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    stories: [
      {
        id: 's3',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        duration: 5,
        views: 456,
        reactions: [],
        replies: [],
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
    hasUnseenStories: true,
    lastUpdated: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    userId: 'u3',
    userName: 'Fatou S.',
    userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    stories: [
      {
        id: 's4',
        type: 'text',
        content: 'Just hit 10k followers! Thank you all!',
        backgroundColor: '#EC4899',
        textColor: '#FFFFFF',
        duration: 5,
        views: 890,
        reactions: [],
        replies: [],
        createdAt: new Date(Date.now() - 14400000).toISOString(),
      },
    ],
    hasUnseenStories: false,
    lastUpdated: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    userId: 'u4',
    userName: 'Grace N.',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    stories: [
      {
        id: 's5',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=800',
        duration: 5,
        views: 1200,
        reactions: [],
        replies: [],
        createdAt: new Date(Date.now() - 21600000).toISOString(),
      },
    ],
    hasUnseenStories: true,
    lastUpdated: new Date(Date.now() - 21600000).toISOString(),
  },
  {
    userId: 'u5',
    userName: 'David O.',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    stories: [
      {
        id: 's6',
        type: 'image',
        content: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800',
        duration: 5,
        views: 2300,
        reactions: [],
        replies: [],
        createdAt: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: 's7',
        type: 'text',
        content: 'Comedy show tonight at 8PM EST! Don\'t miss it!',
        backgroundColor: '#F97316',
        textColor: '#FFFFFF',
        duration: 5,
        views: 1800,
        reactions: [],
        replies: [],
        createdAt: new Date(Date.now() - 36000000).toISOString(),
      },
    ],
    hasUnseenStories: false,
    lastUpdated: new Date(Date.now() - 36000000).toISOString(),
  },
];

// Text story background options
const TEXT_BACKGROUNDS: [string, string][] = [
  ['#7C3AED', '#4C1D95'],
  ['#EC4899', '#DB2777'],
  ['#F97316', '#C2410C'],
  ['#10B981', '#059669'],
  ['#3B82F6', '#1D4ED8'],
  ['#EF4444', '#DC2626'],
  ['#000000', '#1F2937'],
];

// Animated progress bar component - must be separate to use hooks properly
function StoryProgressBar({ isActive, progress }: { isActive: boolean; progress: Animated.SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!isActive) return null;

  return (
    <Animated.View
      style={[
        { backgroundColor: 'white', height: '100%' },
        animatedStyle,
      ]}
    />
  );
}

export default function StoriesScreen() {
  const [userStories, setUserStories] = useState<UserStories[]>(MOCK_USER_STORIES);
  const [viewingStories, setViewingStories] = useState<UserStories | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [replyText, setReplyText] = useState('');

  const currentUser = useStore((s) => s.currentUser);

  // Progress bar animation
  const progress = useSharedValue(0);

  useEffect(() => {
    if (viewingStories && viewingStories.stories[currentStoryIndex]) {
      const duration = viewingStories.stories[currentStoryIndex].duration * 1000;
      progress.value = 0;
      progress.value = withTiming(1, { duration, easing: Easing.linear }, (finished) => {
        if (finished) {
          runOnJS(handleNextStory)();
        }
      });
    }
  }, [viewingStories, currentStoryIndex]);

  const handleNextStory = () => {
    if (!viewingStories) return;

    if (currentStoryIndex < viewingStories.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else {
      // Move to next user's stories
      const currentUserIndex = userStories.findIndex(u => u.userId === viewingStories.userId);
      if (currentUserIndex < userStories.length - 1) {
        setViewingStories(userStories[currentUserIndex + 1]);
        setCurrentStoryIndex(0);
      } else {
        closeStoryViewer();
      }
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
  };

  const openStoryViewer = (userStory: UserStories) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewingStories(userStory);
    setCurrentStoryIndex(0);
    // Mark as seen
    setUserStories(userStories.map(u =>
      u.userId === userStory.userId ? { ...u, hasUnseenStories: false } : u
    ));
  };

  const closeStoryViewer = () => {
    setViewingStories(null);
    setCurrentStoryIndex(0);
    progress.value = 0;
  };

  const handleCreateStory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowGuidelines(true);
  };

  const handleGuidelinesAccepted = () => {
    setShowGuidelines(false);
    setShowCreateModal(true);
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !viewingStories) return;

    // Check content moderation
    const modResult = moderateText(replyText);
    if (modResult.action === 'blocked') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert(modResult.message);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In real app, send reply to backend
    setReplyText('');
  };

  const getTimeRemaining = (createdAt: string): string => {
    const created = new Date(createdAt).getTime();
    const expires = created + 24 * 60 * 60 * 1000; // 24 hours
    const remaining = expires - Date.now();

    if (remaining <= 0) return 'Expired';

    const hours = Math.floor(remaining / 3600000);
    if (hours > 0) return `${hours}h left`;

    const minutes = Math.floor(remaining / 60000);
    return `${minutes}m left`;
  };

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          title: 'Stories',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerBackVisible: true,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} className="p-2 -ml-2">
              <ChevronLeft size={28} color="#fff" />
            </Pressable>
          ),
        }}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Story Row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="py-4"
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {/* Add Story Button */}
          <Pressable
            onPress={handleCreateStory}
            className="items-center mr-4"
          >
            <View className="w-20 h-20 rounded-full bg-gray-800 items-center justify-center border-2 border-dashed border-gray-600">
              <Plus size={32} color="#9CA3AF" />
            </View>
            <Text className="text-white text-xs mt-2 text-center">Add Story</Text>
          </Pressable>

          {/* User Stories */}
          {userStories.map((userStory) => (
            <Pressable
              key={userStory.userId}
              onPress={() => openStoryViewer(userStory)}
              className="items-center mr-4"
            >
              <View
                className={`w-20 h-20 rounded-full p-0.5 ${
                  userStory.hasUnseenStories
                    ? 'bg-gradient-to-tr'
                    : 'bg-gray-600'
                }`}
              >
                <LinearGradient
                  colors={userStory.hasUnseenStories ? ['#7C3AED', '#EC4899'] : ['#4B5563', '#4B5563']}
                  style={{ borderRadius: 40, padding: 2 }}
                >
                  <Image
                    source={{ uri: userStory.userAvatar }}
                    className="w-full h-full rounded-full"
                    style={{ width: 72, height: 72 }}
                  />
                </LinearGradient>
              </View>
              <Text
                className={`text-xs mt-2 text-center ${
                  userStory.hasUnseenStories ? 'text-white' : 'text-gray-500'
                }`}
                numberOfLines={1}
              >
                {userStory.userName}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Info Section */}
        <View className="px-4 mt-4">
          <View className="bg-gray-900 rounded-2xl p-4">
            <View className="flex-row items-center mb-3">
              <Clock size={20} color="#A855F7" />
              <Text className="text-white font-bold text-lg ml-2">24-Hour Stories</Text>
            </View>
            <Text className="text-gray-400 text-sm">
              Stories disappear after 24 hours. Share moments, updates, and behind-the-scenes content with your followers.
            </Text>
            <View className="flex-row mt-4">
              <View className="flex-1 items-center">
                <Text className="text-purple-400 font-bold text-xl">{userStories.length}</Text>
                <Text className="text-gray-500 text-xs">Active Stories</Text>
              </View>
              <View className="flex-1 items-center border-l border-gray-800">
                <Text className="text-purple-400 font-bold text-xl">
                  {userStories.filter(u => u.hasUnseenStories).length}
                </Text>
                <Text className="text-gray-500 text-xs">Unseen</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Story Viewer Modal */}
      <Modal
        visible={!!viewingStories}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeStoryViewer}
      >
        {viewingStories && viewingStories.stories[currentStoryIndex] && (
          <View className="flex-1 bg-black">
            <SafeAreaView edges={['top']} className="flex-1">
              {/* Progress Bars */}
              <View className="flex-row px-2 pt-2">
                {viewingStories.stories.map((_, index) => (
                  <View key={index} className="flex-1 h-1 bg-gray-700 mx-0.5 rounded-full overflow-hidden">
                    {index < currentStoryIndex ? (
                      <View className="flex-1 bg-white" />
                    ) : index === currentStoryIndex ? (
                      <StoryProgressBar isActive={true} progress={progress} />
                    ) : null}
                  </View>
                ))}
              </View>

              {/* Header */}
              <View className="flex-row items-center px-4 py-3">
                <Image
                  source={{ uri: viewingStories.userAvatar }}
                  className="w-10 h-10 rounded-full"
                />
                <View className="flex-1 ml-3">
                  <Text className="text-white font-semibold">{viewingStories.userName}</Text>
                  <Text className="text-gray-400 text-xs">
                    {getTimeRemaining(viewingStories.stories[currentStoryIndex].createdAt)}
                  </Text>
                </View>
                <Pressable onPress={closeStoryViewer} className="p-2">
                  <X size={24} color="white" />
                </Pressable>
              </View>

              {/* Story Content */}
              <Pressable
                onPress={(e) => {
                  const x = e.nativeEvent.locationX;
                  if (x < SCREEN_WIDTH / 3) {
                    handlePrevStory();
                  } else {
                    handleNextStory();
                  }
                }}
                className="flex-1"
              >
                {viewingStories.stories[currentStoryIndex].type === 'image' ? (
                  <Image
                    source={{ uri: viewingStories.stories[currentStoryIndex].content }}
                    className="flex-1"
                    resizeMode="cover"
                  />
                ) : viewingStories.stories[currentStoryIndex].type === 'video' ? (
                  <ExpoVideo
                    source={{ uri: viewingStories.stories[currentStoryIndex].content }}
                    style={{ flex: 1 }}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping={false}
                    onPlaybackStatusUpdate={(status) => {
                      if (status.isLoaded && status.didJustFinish) {
                        handleNextStory();
                      }
                    }}
                  />
                ) : (
                  <LinearGradient
                    colors={TEXT_BACKGROUNDS[0]}
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}
                  >
                    <Text
                      className="text-white text-2xl font-bold text-center"
                      style={{ color: viewingStories.stories[currentStoryIndex].textColor }}
                    >
                      {viewingStories.stories[currentStoryIndex].content}
                    </Text>
                  </LinearGradient>
                )}
              </Pressable>

              {/* Footer - Reply */}
              <View className="px-4 pb-4">
                <View className="flex-row items-center">
                  <View className="flex-1 bg-gray-800 rounded-full flex-row items-center px-4 py-2">
                    <TextInput
                      value={replyText}
                      onChangeText={setReplyText}
                      placeholder="Send a reply..."
                      placeholderTextColor="#6B7280"
                      className="flex-1 text-white"
                    />
                  </View>
                  <Pressable
                    onPress={handleSendReply}
                    disabled={!replyText.trim()}
                    className="ml-3 bg-purple-600 rounded-full p-3"
                    style={{ opacity: replyText.trim() ? 1 : 0.5 }}
                  >
                    <Send size={20} color="white" />
                  </Pressable>
                </View>

                {/* Views count */}
                <View className="flex-row items-center justify-center mt-3">
                  <Eye size={16} color="#6B7280" />
                  <Text className="text-gray-500 text-sm ml-1">
                    {viewingStories.stories[currentStoryIndex].views} views
                  </Text>
                </View>
              </View>
            </SafeAreaView>
          </View>
        )}
      </Modal>

      {/* Guidelines Modal */}
      <ContentGuidelinesModal
        visible={showGuidelines}
        onClose={() => setShowGuidelines(false)}
        onAccept={handleGuidelinesAccepted}
        contentType="image"
      />

      {/* Create Story Modal */}
      <CreateStoryModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(story) => {
          // In real app, upload story to backend
          setShowCreateModal(false);
        }}
      />
    </View>
  );
}

interface CreateStoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (story: Partial<StoryItem>) => void;
}

function CreateStoryModal({ visible, onClose, onSubmit }: CreateStoryModalProps) {
  const [storyType, setStoryType] = useState<'image' | 'text' | 'video'>('text');
  const [textContent, setTextContent] = useState('');
  const [selectedBg, setSelectedBg] = useState(0);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setTextContent('');
    setSelectedMedia(null);
    setModerationError(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload photos.');
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedMedia(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedMedia(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to upload videos.');
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        videoMaxDuration: 30,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedMedia(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const recordVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera to record videos.');
        return;
      }

      setIsLoading(true);
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        videoMaxDuration: 30,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedMedia(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record video. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = () => {
    if (storyType === 'text') return textContent.trim().length > 0;
    return selectedMedia !== null;
  };

  const handleSubmit = () => {
    if (storyType === 'text') {
      if (!textContent.trim()) return;

      const modResult = moderateText(textContent);
      if (modResult.action === 'blocked') {
        setModerationError(modResult.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSubmit({
        type: 'text',
        content: textContent,
        backgroundColor: TEXT_BACKGROUNDS[selectedBg][0],
        textColor: '#FFFFFF',
        duration: 5,
      });
    } else if (storyType === 'image' && selectedMedia) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSubmit({
        type: 'image',
        content: selectedMedia,
        duration: 5,
      });
    } else if (storyType === 'video' && selectedMedia) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSubmit({
        type: 'video',
        content: selectedMedia,
        duration: 30,
      });
    }

    resetState();
  };

  const handleTypeChange = (type: 'text' | 'image' | 'video') => {
    setStoryType(type);
    setSelectedMedia(null);
    setModerationError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-black">
        <SafeAreaView edges={['top', 'bottom']} className="flex-1">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <Pressable onPress={handleClose}>
              <X size={24} color="white" />
            </Pressable>
            <Text className="text-white font-bold text-lg">Create Story</Text>
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit()}
              style={{ opacity: canSubmit() ? 1 : 0.5 }}
            >
              <Text className="text-purple-400 font-bold">Share</Text>
            </Pressable>
          </View>

          {/* Type Selector - 3 options */}
          <View className="flex-row px-4 mb-4">
            <Pressable
              onPress={() => handleTypeChange('text')}
              className={`flex-1 py-3 rounded-l-xl items-center flex-row justify-center ${
                storyType === 'text' ? 'bg-purple-600' : 'bg-gray-800'
              }`}
            >
              <Type size={16} color="white" />
              <Text className="text-white font-medium ml-2">Text</Text>
            </Pressable>
            <Pressable
              onPress={() => handleTypeChange('image')}
              className={`flex-1 py-3 items-center flex-row justify-center border-x border-gray-700 ${
                storyType === 'image' ? 'bg-purple-600' : 'bg-gray-800'
              }`}
            >
              <ImageIconLucide size={16} color="white" />
              <Text className="text-white font-medium ml-2">Photo</Text>
            </Pressable>
            <Pressable
              onPress={() => handleTypeChange('video')}
              className={`flex-1 py-3 rounded-r-xl items-center flex-row justify-center ${
                storyType === 'video' ? 'bg-purple-600' : 'bg-gray-800'
              }`}
            >
              <Video size={16} color="white" />
              <Text className="text-white font-medium ml-2">Video</Text>
            </Pressable>
          </View>

          {/* Content Area */}
          {storyType === 'text' ? (
            <View className="flex-1">
              {/* Preview */}
              <LinearGradient
                colors={TEXT_BACKGROUNDS[selectedBg] as [string, string]}
                style={{ flex: 1, margin: 16, borderRadius: 20, justifyContent: 'center', alignItems: 'center', padding: 20 }}
              >
                <TextInput
                  value={textContent}
                  onChangeText={(text) => {
                    setTextContent(text);
                    setModerationError(null);
                  }}
                  placeholder="Type your story..."
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  multiline
                  className="text-white text-2xl font-bold text-center"
                  style={{ maxHeight: 200 }}
                />
              </LinearGradient>

              {/* Moderation Error */}
              {moderationError && (
                <View className="mx-4 mb-4 bg-red-500/20 rounded-xl p-4">
                  <Text className="text-red-400 text-center">{moderationError}</Text>
                </View>
              )}

              {/* Background Colors */}
              <View className="px-4 pb-4">
                <Text className="text-gray-400 text-sm mb-3">Background Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {TEXT_BACKGROUNDS.map((colors, index) => (
                    <Pressable
                      key={index}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedBg(index);
                      }}
                      className="mr-3"
                    >
                      <LinearGradient
                        colors={colors as [string, string]}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          borderWidth: selectedBg === index ? 3 : 0,
                          borderColor: 'white',
                        }}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          ) : storyType === 'image' ? (
            <View className="flex-1">
              {selectedMedia ? (
                <View className="flex-1 m-4">
                  <Image
                    source={{ uri: selectedMedia }}
                    className="flex-1 rounded-2xl"
                    resizeMode="cover"
                  />
                  <Pressable
                    onPress={() => setSelectedMedia(null)}
                    className="absolute top-4 right-4 bg-black/60 rounded-full p-2"
                  >
                    <X size={20} color="white" />
                  </Pressable>
                </View>
              ) : (
                <View className="flex-1 items-center justify-center px-4">
                  <View className="w-full bg-gray-900 rounded-2xl p-6">
                    <Text className="text-white font-bold text-lg text-center mb-6">Add a Photo</Text>

                    <Pressable
                      onPress={takePhoto}
                      disabled={isLoading}
                      className="bg-purple-600 rounded-xl py-4 flex-row items-center justify-center mb-3"
                    >
                      <Camera size={22} color="white" />
                      <Text className="text-white font-semibold ml-3">Take Photo</Text>
                    </Pressable>

                    <Pressable
                      onPress={pickImage}
                      disabled={isLoading}
                      className="bg-gray-800 rounded-xl py-4 flex-row items-center justify-center"
                    >
                      <ImageIconLucide size={22} color="white" />
                      <Text className="text-white font-semibold ml-3">Choose from Gallery</Text>
                    </Pressable>

                    {isLoading && (
                      <Text className="text-gray-400 text-center mt-4">Loading...</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View className="flex-1">
              {selectedMedia ? (
                <View className="flex-1 m-4">
                  <ExpoVideo
                    source={{ uri: selectedMedia }}
                    style={{ flex: 1, borderRadius: 20 }}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay
                    isLooping
                    isMuted={false}
                  />
                  <Pressable
                    onPress={() => setSelectedMedia(null)}
                    className="absolute top-4 right-4 bg-black/60 rounded-full p-2"
                  >
                    <X size={20} color="white" />
                  </Pressable>
                  <View className="absolute bottom-4 left-4 bg-black/60 rounded-full px-3 py-1.5 flex-row items-center">
                    <Play size={14} color="white" fill="white" />
                    <Text className="text-white text-sm ml-1">Video</Text>
                  </View>
                </View>
              ) : (
                <View className="flex-1 items-center justify-center px-4">
                  <View className="w-full bg-gray-900 rounded-2xl p-6">
                    <Text className="text-white font-bold text-lg text-center mb-2">Add a Video</Text>
                    <Text className="text-gray-400 text-sm text-center mb-6">Maximum 30 seconds</Text>

                    <Pressable
                      onPress={recordVideo}
                      disabled={isLoading}
                      className="bg-purple-600 rounded-xl py-4 flex-row items-center justify-center mb-3"
                    >
                      <Video size={22} color="white" />
                      <Text className="text-white font-semibold ml-3">Record Video</Text>
                    </Pressable>

                    <Pressable
                      onPress={pickVideo}
                      disabled={isLoading}
                      className="bg-gray-800 rounded-xl py-4 flex-row items-center justify-center"
                    >
                      <ImageIcon size={22} color="white" />
                      <Text className="text-white font-semibold ml-3">Choose from Gallery</Text>
                    </Pressable>

                    {isLoading && (
                      <Text className="text-gray-400 text-center mt-4">Loading...</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}
