import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Image, Dimensions, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Plus,
  X,
  ChevronLeft,
  Send,
  Eye,
  Camera,
  Clock,
  Video,
  Image as ImageIconLucide,
  Type,
  Play,
  Settings,
  Shield,
  UserX,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore, UserStory, StoryItem } from '@/lib/store';
import { moderateText } from '@/lib/contentModeration';
import { ContentGuidelinesModal } from '@/components/ContentGuidelinesModal';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// Progress bar component
function StoryProgressBar({ isActive, progress }: { isActive: boolean; progress: Animated.SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  if (!isActive) return null;

  return (
    <Animated.View
      style={[{ backgroundColor: 'white', height: '100%' }, animatedStyle]}
    />
  );
}

// Video story component using expo-video
function VideoStoryPlayer({ uri, onEnd }: { uri: string; onEnd: () => void }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    const subscription = player.addListener('playingChange', (isPlaying) => {
      if (!isPlaying && player.currentTime > 0 && player.currentTime >= player.duration - 0.5) {
        onEnd();
      }
    });
    return () => subscription.remove();
  }, [player, onEnd]);

  return (
    <VideoView
      player={player}
      style={{ flex: 1 }}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

export default function StoriesScreen() {
  // Get URL params - if userId is passed, auto-play their stories
  const { userId: targetUserId } = useLocalSearchParams<{ userId?: string }>();

  // Get stories from the store
  const userStories = useStore((s) => s.userStories);
  const currentUser = useStore((s) => s.currentUser);
  const markStoryAsSeen = useStore((s) => s.markStoryAsSeen);

  const [viewingStories, setViewingStories] = useState<UserStory | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  const progress = useSharedValue(0);

  // Get current user's stories
  const myStories = userStories.find((s) => s.userId === currentUser?.id);
  // Get other users' stories
  const otherStories = userStories.filter((s) => s.userId !== currentUser?.id);

  // Auto-play stories if userId param is passed
  useEffect(() => {
    if (targetUserId && !hasAutoPlayed) {
      const targetUserStories = userStories.find((s) => s.userId === targetUserId);
      if (targetUserStories && targetUserStories.stories.length > 0) {
        setViewingStories(targetUserStories);
        setCurrentStoryIndex(0);
        setHasAutoPlayed(true);
        // Mark as seen if it's not the current user
        if (targetUserId !== currentUser?.id) {
          markStoryAsSeen(targetUserId);
        }
      }
    }
  }, [targetUserId, userStories, hasAutoPlayed, currentUser?.id, markStoryAsSeen]);

  // Close story viewer
  const closeStoryViewer = useCallback(() => {
    console.log('[Stories] Closing story viewer');
    setViewingStories(null);
    setCurrentStoryIndex(0);
    progress.value = 0;
  }, [progress]);

  // Go to next story
  const handleNextStory = useCallback(() => {
    if (!viewingStories) return;

    if (currentStoryIndex < viewingStories.stories.length - 1) {
      setCurrentStoryIndex((prev) => prev + 1);
    } else {
      // Find next user's stories
      const allStories = myStories ? [myStories, ...otherStories] : otherStories;
      const currentUserIndex = allStories.findIndex((u) => u.userId === viewingStories.userId);
      if (currentUserIndex < allStories.length - 1) {
        setViewingStories(allStories[currentUserIndex + 1]);
        setCurrentStoryIndex(0);
      } else {
        closeStoryViewer();
      }
    }
  }, [viewingStories, currentStoryIndex, myStories, otherStories, closeStoryViewer]);

  // Progress animation
  useEffect(() => {
    if (viewingStories && viewingStories.stories[currentStoryIndex]) {
      const story = viewingStories.stories[currentStoryIndex];
      // Skip progress animation for videos (they auto-advance on end)
      if (story.type === 'video') {
        progress.value = 0;
        return;
      }
      const duration = story.duration * 1000;
      progress.value = 0;
      progress.value = withTiming(1, { duration, easing: Easing.linear }, (finished) => {
        if (finished) {
          runOnJS(handleNextStory)();
        }
      });
    }
  }, [viewingStories, currentStoryIndex, progress, handleNextStory]);

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex((prev) => prev - 1);
    }
  };

  const openStoryViewer = (userStory: UserStory) => {
    console.log('[Stories] Opening story viewer for:', userStory.userName, 'with', userStory.stories.length, 'stories');
    if (userStory.stories.length === 0) {
      console.log('[Stories] No stories to view');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setViewingStories(userStory);
    setCurrentStoryIndex(0);
    // Mark as seen if not current user
    if (userStory.userId !== currentUser?.id) {
      markStoryAsSeen(userStory.userId);
    }
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
    const modResult = moderateText(replyText);
    if (modResult.action === 'blocked') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      alert(modResult.message);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReplyText('');
  };

  const getTimeRemaining = (createdAt: string): string => {
    const created = new Date(createdAt).getTime();
    const expires = created + 24 * 60 * 60 * 1000;
    const remaining = expires - Date.now();
    if (remaining <= 0) return 'Expired';
    const hours = Math.floor(remaining / 3600000);
    if (hours > 0) return `${hours}h left`;
    const minutes = Math.floor(remaining / 60000);
    return `${minutes}m left`;
  };

  const currentStory = viewingStories?.stories[currentStoryIndex];

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen
        options={{
          title: 'Stories',
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
          headerBackVisible: true,
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={20}
              className="p-2 -ml-2"
            >
              <ChevronLeft size={28} color="#fff" />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowPrivacyModal(true);
              }}
              hitSlop={20}
              className="p-2 -mr-2"
            >
              <Settings size={24} color="#fff" />
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
          style={{ flexGrow: 0 }}
        >
          {/* Your Story - Add or View */}
          {myStories && myStories.stories.length > 0 ? (
            <Pressable
              onPress={() => openStoryViewer(myStories)}
              className="items-center mr-4"
            >
              <LinearGradient
                colors={['#7C3AED', '#EC4899']}
                style={{ borderRadius: 40, padding: 2 }}
              >
                <View style={{ position: 'relative' }}>
                  <Image
                    source={{ uri: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' }}
                    style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: '#000' }}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      backgroundColor: '#7C3AED',
                      borderRadius: 12,
                      width: 24,
                      height: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: '#000',
                    }}
                  >
                    <Plus size={14} color="#fff" />
                  </View>
                </View>
              </LinearGradient>
              <Text className="text-white text-xs mt-2 text-center font-medium">Your Story</Text>
              <Text className="text-gray-500 text-xs">{myStories.stories.length} {myStories.stories.length === 1 ? 'story' : 'stories'}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={handleCreateStory} className="items-center mr-4">
              <View className="w-20 h-20 rounded-full bg-gray-800 items-center justify-center border-2 border-dashed border-gray-600">
                <Plus size={32} color="#9CA3AF" />
              </View>
              <Text className="text-white text-xs mt-2 text-center">Add Story</Text>
            </Pressable>
          )}

          {/* Other Users' Stories */}
          {otherStories.map((userStory) => (
            <Pressable
              key={userStory.userId}
              onPress={() => openStoryViewer(userStory)}
              className="items-center mr-4"
            >
              <LinearGradient
                colors={userStory.hasUnseenStories ? ['#7C3AED', '#EC4899'] : ['#4B5563', '#4B5563']}
                style={{ borderRadius: 40, padding: 2 }}
              >
                <Image
                  source={{ uri: userStory.userAvatar }}
                  style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: '#000' }}
                />
              </LinearGradient>
              <Text
                className={`text-xs mt-2 text-center ${userStory.hasUnseenStories ? 'text-white' : 'text-gray-500'}`}
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
                <Text className="text-purple-400 font-bold text-xl">{myStories?.stories.length ?? 0}</Text>
                <Text className="text-gray-500 text-xs">Your Stories</Text>
              </View>
              <View className="flex-1 items-center border-l border-gray-800">
                <Text className="text-purple-400 font-bold text-xl">
                  {otherStories.filter((u) => u.hasUnseenStories).length}
                </Text>
                <Text className="text-gray-500 text-xs">Unseen</Text>
              </View>
            </View>
          </View>

          {/* Add Story Button (if you have stories already) */}
          {myStories && myStories.stories.length > 0 && (
            <Pressable
              onPress={handleCreateStory}
              style={{
                marginTop: 16,
                backgroundColor: '#7C3AED',
                borderRadius: 12,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Add Another Story</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Story Viewer Modal */}
      <Modal
        visible={!!viewingStories}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeStoryViewer}
      >
        {viewingStories && currentStory && (
          <View style={{ flex: 1, backgroundColor: '#000' }}>
            <SafeAreaView edges={['top']} style={{ flex: 1 }}>
              {/* Progress Bars */}
              <View style={{ flexDirection: 'row', paddingHorizontal: 8, paddingTop: 8 }}>
                {viewingStories.stories.map((_, index) => (
                  <View
                    key={index}
                    style={{
                      flex: 1,
                      height: 3,
                      backgroundColor: '#374151',
                      marginHorizontal: 2,
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    {index < currentStoryIndex ? (
                      <View style={{ flex: 1, backgroundColor: '#fff' }} />
                    ) : index === currentStoryIndex ? (
                      <StoryProgressBar isActive={true} progress={progress} />
                    ) : null}
                  </View>
                ))}
              </View>

              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
                <Image
                  source={{ uri: viewingStories.userAvatar }}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>
                    {viewingStories.userId === currentUser?.id ? 'Your Story' : viewingStories.userName}
                  </Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 12 }}>{getTimeRemaining(currentStory.createdAt)}</Text>
                </View>
                <Pressable
                  onPress={() => {
                    console.log('[Stories] X button pressed in viewer');
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    closeStoryViewer();
                  }}
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={28} color="#fff" />
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
                style={{ flex: 1 }}
              >
                {currentStory.type === 'image' ? (
                  <Image
                    source={{ uri: currentStory.content }}
                    style={{ flex: 1 }}
                    resizeMode="cover"
                  />
                ) : currentStory.type === 'video' ? (
                  <VideoStoryPlayer uri={currentStory.content} onEnd={handleNextStory} />
                ) : (
                  <LinearGradient
                    colors={[currentStory.backgroundColor || '#7C3AED', '#4C1D95']}
                    style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}
                  >
                    <Text
                      style={{
                        color: currentStory.textColor || '#fff',
                        fontSize: 24,
                        fontWeight: 'bold',
                        textAlign: 'center',
                      }}
                    >
                      {currentStory.content}
                    </Text>
                  </LinearGradient>
                )}
              </Pressable>

              {/* Footer */}
              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                {viewingStories.userId !== currentUser?.id ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: '#1F2937',
                        borderRadius: 24,
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                      }}
                    >
                      <TextInput
                        value={replyText}
                        onChangeText={setReplyText}
                        placeholder="Send a reply..."
                        placeholderTextColor="#6B7280"
                        style={{ flex: 1, color: '#fff', fontSize: 15 }}
                      />
                    </View>
                    <Pressable
                      onPress={handleSendReply}
                      disabled={!replyText.trim()}
                      style={{
                        marginLeft: 12,
                        backgroundColor: '#7C3AED',
                        borderRadius: 24,
                        padding: 12,
                        opacity: replyText.trim() ? 1 : 0.5,
                      }}
                    >
                      <Send size={20} color="#fff" />
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Eye size={16} color="#6B7280" />
                    <Text style={{ color: '#6B7280', fontSize: 13, marginLeft: 4 }}>{currentStory.views} views</Text>
                  </View>
                )}
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
      <CreateStoryModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} />

      {/* Story Privacy Modal */}
      <StoryPrivacyModal visible={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
    </View>
  );
}

// Create Story Modal Component
function CreateStoryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [storyType, setStoryType] = useState<'image' | 'text' | 'video'>('text');
  const [textContent, setTextContent] = useState('');
  const [selectedBg, setSelectedBg] = useState(0);
  const [moderationError, setModerationError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addStory = useStore((s) => s.addStory);

  const resetState = useCallback(() => {
    setTextContent('');
    setSelectedMedia(null);
    setModerationError(null);
    setIsLoading(false);
    setStoryType('text');
    setSelectedBg(0);
  }, []);

  const handleClose = useCallback(() => {
    console.log('[CreateStoryModal] Close button pressed');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    resetState();
    onClose();
  }, [resetState, onClose]);

  const canSubmit = () => {
    if (storyType === 'text') return textContent.trim().length > 0;
    return selectedMedia !== null;
  };

  const handleSubmit = useCallback(() => {
    console.log('[CreateStoryModal] Share pressed');

    if (storyType === 'text') {
      if (!textContent.trim()) return;
      const modResult = moderateText(textContent);
      if (modResult.action === 'blocked') {
        setModerationError(modResult.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addStory({
        id: uuidv4(),
        type: 'text',
        content: textContent,
        backgroundColor: TEXT_BACKGROUNDS[selectedBg][0],
        textColor: '#FFFFFF',
        duration: 5,
        views: 0,
        createdAt: new Date().toISOString(),
      });
    } else if (storyType === 'image' && selectedMedia) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addStory({
        id: uuidv4(),
        type: 'image',
        content: selectedMedia,
        duration: 5,
        views: 0,
        createdAt: new Date().toISOString(),
      });
    } else if (storyType === 'video' && selectedMedia) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addStory({
        id: uuidv4(),
        type: 'video',
        content: selectedMedia,
        duration: 30,
        views: 0,
        createdAt: new Date().toISOString(),
      });
    } else {
      return;
    }

    console.log('[CreateStoryModal] Story added successfully');
    resetState();
    onClose();
  }, [storyType, textContent, selectedMedia, selectedBg, addStory, resetState, onClose]);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Please allow access to your photo library.');
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
      console.log('[CreateStoryModal] Image picker error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Please allow access to your camera.');
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
      console.log('[CreateStoryModal] Camera error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pickVideo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Please allow access to your photo library.');
        return;
      }
      setIsLoading(true);
      console.log('[CreateStoryModal] Opening video picker');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: true,
        videoMaxDuration: 30,
        quality: 0.8,
      });
      console.log('[CreateStoryModal] Video picker result:', result.canceled ? 'canceled' : 'selected');
      if (!result.canceled && result.assets?.[0]?.uri) {
        console.log('[CreateStoryModal] Setting video:', result.assets[0].uri);
        setSelectedMedia(result.assets[0].uri);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.log('[CreateStoryModal] Video picker error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const recordVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Please allow access to your camera.');
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
      console.log('[CreateStoryModal] Record video error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: '#000', paddingTop: insets.top }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
        >
          <Pressable
            onPress={handleClose}
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderRadius: 22,
            }}
          >
            <X size={24} color="#fff" />
          </Pressable>

          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>Create Story</Text>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit()}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: canSubmit() ? '#7C3AED' : 'rgba(255,255,255,0.15)',
              borderRadius: 20,
              opacity: canSubmit() ? 1 : 0.5,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Share</Text>
          </Pressable>
        </View>

        {/* Type Selector */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 }}>
          {(['text', 'image', 'video'] as const).map((type, idx) => (
            <Pressable
              key={type}
              onPress={() => {
                setStoryType(type);
                setSelectedMedia(null);
                setModerationError(null);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={{
                flex: 1,
                paddingVertical: 12,
                backgroundColor: storyType === type ? '#7C3AED' : '#1F2937',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                borderTopLeftRadius: idx === 0 ? 12 : 0,
                borderBottomLeftRadius: idx === 0 ? 12 : 0,
                borderTopRightRadius: idx === 2 ? 12 : 0,
                borderBottomRightRadius: idx === 2 ? 12 : 0,
                borderLeftWidth: idx > 0 ? 1 : 0,
                borderLeftColor: '#374151',
              }}
            >
              {type === 'text' && <Type size={16} color="#fff" />}
              {type === 'image' && <ImageIconLucide size={16} color="#fff" />}
              {type === 'video' && <Video size={16} color="#fff" />}
              <Text style={{ color: '#fff', fontWeight: '500', marginLeft: 8, textTransform: 'capitalize' }}>
                {type === 'image' ? 'Photo' : type}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {storyType === 'text' && (
            <View style={{ flex: 1 }}>
              <LinearGradient
                colors={TEXT_BACKGROUNDS[selectedBg]}
                style={{
                  flex: 1,
                  margin: 16,
                  borderRadius: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 24,
                }}
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
                  style={{
                    color: '#fff',
                    fontSize: 24,
                    fontWeight: 'bold',
                    textAlign: 'center',
                    maxHeight: 200,
                  }}
                />
              </LinearGradient>

              {moderationError && (
                <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 12, padding: 16 }}>
                  <Text style={{ color: '#F87171', textAlign: 'center' }}>{moderationError}</Text>
                </View>
              )}

              <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 12 }}>Background Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                  {TEXT_BACKGROUNDS.map((colors, index) => (
                    <Pressable
                      key={index}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedBg(index);
                      }}
                      style={{ marginRight: 12 }}
                    >
                      <LinearGradient
                        colors={colors}
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          borderWidth: selectedBg === index ? 3 : 0,
                          borderColor: '#fff',
                        }}
                      />
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}

          {storyType === 'image' && (
            <View style={{ flex: 1 }}>
              {selectedMedia ? (
                <View style={{ flex: 1, margin: 16 }}>
                  <Image source={{ uri: selectedMedia }} style={{ flex: 1, borderRadius: 20 }} resizeMode="cover" />
                  <Pressable
                    onPress={() => setSelectedMedia(null)}
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      borderRadius: 20,
                      padding: 10,
                    }}
                  >
                    <X size={22} color="#fff" />
                  </Pressable>
                </View>
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                  <View style={{ width: '100%', backgroundColor: '#111827', borderRadius: 20, padding: 24 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, textAlign: 'center', marginBottom: 24 }}>
                      Add a Photo
                    </Text>
                    <Pressable
                      onPress={takePhoto}
                      disabled={isLoading}
                      style={{
                        backgroundColor: '#7C3AED',
                        borderRadius: 12,
                        paddingVertical: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Camera size={22} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 12 }}>Take Photo</Text>
                    </Pressable>
                    <Pressable
                      onPress={pickImage}
                      disabled={isLoading}
                      style={{
                        backgroundColor: '#1F2937',
                        borderRadius: 12,
                        paddingVertical: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ImageIconLucide size={22} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 12 }}>Choose from Gallery</Text>
                    </Pressable>
                    {isLoading && <ActivityIndicator size="small" color="#7C3AED" style={{ marginTop: 16 }} />}
                  </View>
                </View>
              )}
            </View>
          )}

          {storyType === 'video' && (
            <View style={{ flex: 1 }}>
              {selectedMedia ? (
                <View style={{ flex: 1, margin: 16 }}>
                  <VideoPreview uri={selectedMedia} />
                  <Pressable
                    onPress={() => setSelectedMedia(null)}
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      borderRadius: 20,
                      padding: 10,
                    }}
                  >
                    <X size={22} color="#fff" />
                  </Pressable>
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      borderRadius: 16,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Play size={14} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 13, marginLeft: 4 }}>Video</Text>
                  </View>
                </View>
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                  <View style={{ width: '100%', backgroundColor: '#111827', borderRadius: 20, padding: 24 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18, textAlign: 'center', marginBottom: 8 }}>
                      Add a Video
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', marginBottom: 24 }}>
                      Maximum 30 seconds
                    </Text>
                    <Pressable
                      onPress={recordVideo}
                      disabled={isLoading}
                      style={{
                        backgroundColor: '#7C3AED',
                        borderRadius: 12,
                        paddingVertical: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Video size={22} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 12 }}>Record Video</Text>
                    </Pressable>
                    <Pressable
                      onPress={pickVideo}
                      disabled={isLoading}
                      style={{
                        backgroundColor: '#1F2937',
                        borderRadius: 12,
                        paddingVertical: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ImageIconLucide size={22} color="#fff" />
                      <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 12 }}>Choose from Gallery</Text>
                    </Pressable>
                    {isLoading && <ActivityIndicator size="small" color="#7C3AED" style={{ marginTop: 16 }} />}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// Video preview component
function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={{ flex: 1, borderRadius: 20, overflow: 'hidden' }}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

// Mock users for blocking
const MOCK_USERS_TO_BLOCK = [
  { id: 'u1', name: 'Amara J.', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200' },
  { id: 'u2', name: 'Kwame A.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  { id: 'u3', name: 'Fatou S.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200' },
  { id: 'u4', name: 'Grace N.', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
  { id: 'u5', name: 'David O.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' },
];

// Story Privacy Modal
function StoryPrivacyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const storyBlockedUserIds = useStore((s) => s.storyBlockedUserIds);
  const blockUserFromStories = useStore((s) => s.blockUserFromStories);
  const unblockUserFromStories = useStore((s) => s.unblockUserFromStories);

  const toggleBlockUser = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (storyBlockedUserIds.includes(userId)) {
      unblockUserFromStories(userId);
    } else {
      blockUserFromStories(userId);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000', paddingTop: insets.top }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#1F2937',
          }}
        >
          <Pressable
            onPress={onClose}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={28} color="#fff" />
          </Pressable>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>Story Privacy</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
          {/* Info Card */}
          <View style={{ backgroundColor: '#111827', borderRadius: 16, padding: 16, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Shield size={20} color="#A855F7" />
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Hide Your Stories</Text>
            </View>
            <Text style={{ color: '#9CA3AF', fontSize: 14, lineHeight: 20 }}>
              Select people who won't be able to see your stories. They won't be notified.
            </Text>
          </View>

          {storyBlockedUserIds.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <UserX size={16} color="#EF4444" />
              <Text style={{ color: '#F87171', fontSize: 13, marginLeft: 8 }}>
                {storyBlockedUserIds.length} {storyBlockedUserIds.length === 1 ? 'person' : 'people'} hidden
              </Text>
            </View>
          )}

          <Text style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 12 }}>Your Connections</Text>

          {MOCK_USERS_TO_BLOCK.map((user) => {
            const isBlocked = storyBlockedUserIds.includes(user.id);
            return (
              <Pressable
                key={user.id}
                onPress={() => toggleBlockUser(user.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#1F2937',
                }}
              >
                <Image source={{ uri: user.avatar }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                <Text style={{ flex: 1, color: '#fff', fontWeight: '500', marginLeft: 12 }}>{user.name}</Text>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: isBlocked ? '#EF4444' : '#374151',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isBlocked && <Check size={14} color="#fff" />}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}
