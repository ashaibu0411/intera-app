import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Video,
  Camera,
  Image as ImageIcon,
  Music2,
  X,
  Check,
  Play,
  Upload,
  Type,
  Smile,
  Sparkles,
  Palette,
  Wand2,
  Timer,
  Zap,
  Heart,
  Star,
  Flame,
  Snowflake,
  Sun,
  Moon,
  CloudRain,
  Undo2,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { createClip, uploadClipVideo, uploadClipThumbnail } from '@/lib/clips-api';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { aiClipEnhancer } from '@/lib/aiClipEnhancer';
import { aiClipCaptionsFromVideoUrl } from '@/lib/aiClipCaptions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Filter definitions
const FILTERS = [
  { id: 'none', name: 'Normal', icon: null, overlay: null },
  { id: 'sparkle', name: 'Sparkle', icon: Sparkles, overlay: 'rgba(255,215,0,0.15)', gradient: ['transparent', 'rgba(255,215,0,0.2)', 'transparent'] },
  { id: 'hearts', name: 'Hearts', icon: Heart, overlay: 'rgba(255,105,180,0.12)', gradient: ['transparent', 'rgba(255,105,180,0.15)', 'transparent'] },
  { id: 'fire', name: 'Fire', icon: Flame, overlay: 'rgba(255,69,0,0.15)', gradient: ['transparent', 'rgba(255,100,0,0.2)', 'rgba(255,50,0,0.1)'] },
  { id: 'ice', name: 'Ice', icon: Snowflake, overlay: 'rgba(135,206,250,0.15)', gradient: ['rgba(135,206,250,0.1)', 'transparent', 'rgba(200,230,255,0.15)'] },
  { id: 'vintage', name: 'Vintage', icon: Sun, overlay: 'rgba(255,235,205,0.2)', gradient: ['rgba(139,69,19,0.1)', 'transparent', 'rgba(210,180,140,0.15)'] },
  { id: 'night', name: 'Night', icon: Moon, overlay: 'rgba(25,25,112,0.2)', gradient: ['rgba(0,0,50,0.2)', 'transparent', 'rgba(75,0,130,0.15)'] },
  { id: 'rain', name: 'Moody', icon: CloudRain, overlay: 'rgba(70,130,180,0.15)', gradient: ['rgba(50,50,70,0.2)', 'transparent', 'rgba(100,100,130,0.1)'] },
  { id: 'golden', name: 'Golden', icon: Star, overlay: 'rgba(255,215,0,0.12)', gradient: ['rgba(255,200,0,0.1)', 'transparent', 'rgba(255,180,0,0.15)'] },
];

// Sticker definitions
const STICKERS = [
  { id: 'heart', emoji: '❤️' },
  { id: 'fire', emoji: '🔥' },
  { id: 'star', emoji: '⭐' },
  { id: 'sparkles', emoji: '✨' },
  { id: '100', emoji: '💯' },
  { id: 'laugh', emoji: '😂' },
  { id: 'cool', emoji: '😎' },
  { id: 'love', emoji: '😍' },
  { id: 'party', emoji: '🎉' },
  { id: 'clap', emoji: '👏' },
  { id: 'thumbsup', emoji: '👍' },
  { id: 'rocket', emoji: '🚀' },
  { id: 'crown', emoji: '👑' },
  { id: 'diamond', emoji: '💎' },
  { id: 'rainbow', emoji: '🌈' },
  { id: 'music', emoji: '🎵' },
  { id: 'camera', emoji: '📸' },
  { id: 'gift', emoji: '🎁' },
];

// Text style presets
const TEXT_STYLES = [
  { id: 'classic', name: 'Classic', color: '#FFFFFF', bg: 'transparent', font: 'normal' },
  { id: 'neon', name: 'Neon', color: '#00FF00', bg: 'transparent', font: 'bold', glow: true },
  { id: 'retro', name: 'Retro', color: '#FF6B6B', bg: 'rgba(0,0,0,0.7)', font: 'bold' },
  { id: 'minimal', name: 'Minimal', color: '#FFFFFF', bg: 'rgba(0,0,0,0.5)', font: 'normal' },
  { id: 'bold', name: 'Bold', color: '#FFD700', bg: 'transparent', font: 'bold' },
  { id: 'outline', name: 'Outline', color: '#FFFFFF', bg: 'transparent', font: 'bold', outline: true },
];

interface TextOverlay {
  id: string;
  text: string;
  style: typeof TEXT_STYLES[0];
  position: { x: number; y: number };
}

interface StickerOverlay {
  id: string;
  emoji: string;
  position: { x: number; y: number };
  scale: number;
}

export default function CreateClipScreen() {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [musicTag, setMusicTag] = useState('');
  const [enhanceBusy, setEnhanceBusy] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<ExpoVideo>(null);

  // Snapchat-style features
  const [selectedFilter, setSelectedFilter] = useState(FILTERS[0]);
  const [showFilters, setShowFilters] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [stickerOverlays, setStickerOverlays] = useState<StickerOverlay[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [selectedTextStyle, setSelectedTextStyle] = useState(TEXT_STYLES[0]);
  const [showTimer, setShowTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(3);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(0);
  const [editMode, setEditMode] = useState<'none' | 'filters' | 'text' | 'stickers'>('none');

  // Animation values
  const sparkleOpacity = useSharedValue(0.5);
  const countdownScale = useSharedValue(1);

  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);

  // Sparkle animation
  useEffect(() => {
    if (selectedFilter.id === 'sparkle') {
      sparkleOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 800 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        true
      );
    }
  }, [selectedFilter]);

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  const countdownStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countdownScale.value }],
  }));

  // Redirect guests to signup
  if (isGuest || !currentUser) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <Video size={64} color="#D4673A" />
        <Text className="text-white text-xl font-bold mt-4 text-center">
          Sign up to create clips
        </Text>
        <Text className="text-gray-400 text-center mt-2">
          Share your moments with the community
        </Text>
        <Pressable
          onPress={() => router.push('/signup')}
          className="mt-6 bg-terracotta px-8 py-4 rounded-full"
        >
          <Text className="text-white font-bold text-lg">Sign Up</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-gray-400">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const handlePickVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to upload clips.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      videoMaxDuration: 60,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      let uri = asset.uri;

      if (asset.assetId) {
        try {
          const info = await MediaLibrary.getAssetInfoAsync(asset.assetId);
          uri = info.localUri || info.uri || uri;
        } catch {
          // ignore
        }
      }

      if (uri && !uri.startsWith('file://')) {
        try {
          const ext = uri.split('.').pop()?.toLowerCase() || 'mp4';
          const dest = `${FileSystem.cacheDirectory}clip_${Date.now()}.${ext}`;
          await FileSystem.copyAsync({ from: uri, to: dest });
          uri = dest;
        } catch {
          // ignore
        }
      }

      setVideoUri(uri);
      setThumbnailUri(null);
    }
  };

  const enhanceWithAi = async () => {
    if (!videoUri || enhanceBusy) return;
    setEnhanceBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      // Generate transcript from the selected video (client -> Edge Function)
      const caps = await aiClipCaptionsFromVideoUrl({ videoUrl: videoUri, targetLang: 'en' });
      const transcript = caps?.text || '';
      if (!transcript.trim()) {
        Alert.alert('Could not enhance', 'No transcript found for this clip.');
        return;
      }

      const res = await aiClipEnhancer({
        transcript,
        currentDescription: description,
        goal: 'more_views',
        voice: 'community',
      });

      if (res?.description) {
        const tagStr = (res.hashtags || []).slice(0, 12).join(' ');
        const merged = `${res.description}${tagStr ? `\n\n${tagStr}` : ''}`.trim();
        setDescription(merged.slice(0, 500));
      }
    } catch (e) {
      console.log('[CreateClip] AI enhance failed:', e);
      Alert.alert('AI enhance failed', 'Please try again in a moment.');
    } finally {
      setEnhanceBusy(false);
    }
  };

  const startCountdown = () => {
    setIsCountingDown(true);
    setCountdownValue(timerSeconds);

    const interval = setInterval(() => {
      setCountdownValue((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsCountingDown(false);
          handleRecordVideo();
          return 0;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        countdownScale.value = withSequence(
          withTiming(1.5, { duration: 150 }),
          withTiming(1, { duration: 150 })
        );
        return prev - 1;
      });
    }, 1000);
  };

  const handleRecordVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to record clips.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      videoMaxDuration: 60,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      let uri = asset.uri;

      if (uri && !uri.startsWith('file://')) {
        try {
          const ext = uri.split('.').pop()?.toLowerCase() || 'mp4';
          const dest = `${FileSystem.cacheDirectory}clip_${Date.now()}.${ext}`;
          await FileSystem.copyAsync({ from: uri, to: dest });
          uri = dest;
        } catch {
          // ignore
        }
      }

      setVideoUri(uri);
      setThumbnailUri(null);
    }
  };

  const handlePickThumbnail = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setThumbnailUri(result.assets[0].uri);
    }
  };

  const handleClearVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVideoUri(null);
    setThumbnailUri(null);
    setIsPlaying(false);
    setSelectedFilter(FILTERS[0]);
    setTextOverlays([]);
    setStickerOverlays([]);
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const addTextOverlay = () => {
    if (!currentText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: currentText.trim(),
      style: selectedTextStyle,
      position: { x: SCREEN_WIDTH / 2 - 100, y: SCREEN_WIDTH * 0.6 },
    };

    setTextOverlays([...textOverlays, newOverlay]);
    setCurrentText('');
    setShowTextEditor(false);
  };

  const addSticker = (emoji: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newSticker: StickerOverlay = {
      id: Date.now().toString(),
      emoji,
      position: { x: SCREEN_WIDTH / 2 - 25, y: SCREEN_WIDTH * 0.6 },
      scale: 1,
    };

    setStickerOverlays([...stickerOverlays, newSticker]);
  };

  const removeLastOverlay = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (stickerOverlays.length > 0) {
      setStickerOverlays(stickerOverlays.slice(0, -1));
    } else if (textOverlays.length > 0) {
      setTextOverlays(textOverlays.slice(0, -1));
    }
  };

  const canSubmit = videoUri && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || !currentUser || isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      setUploadProgress(10);
      const videoPath = await uploadClipVideo(currentUser.id, videoUri!);

      if (!videoPath) {
        throw new Error(
          "Upload failed. Please make sure your Supabase Storage bucket 'clips' exists and your Storage policies allow uploads, then try again."
        );
      }

      setUploadProgress(60);

      let thumbnailUrl: string | null = null;
      if (thumbnailUri) {
        thumbnailUrl = await uploadClipThumbnail(currentUser.id, thumbnailUri);
        setUploadProgress(80);
      }

      // Include filter info in description if applied
      const filterInfo = selectedFilter.id !== 'none' ? ` #${selectedFilter.name.toLowerCase()}` : '';
      const fullDescription = description.trim() + filterInfo;

      const clip = await createClip({
        user_id: currentUser.id,
        video_url: videoPath,
        thumbnail_url: thumbnailUrl || undefined,
        description: fullDescription,
        music_tag: musicTag.trim() || undefined,
      });

      setUploadProgress(100);

      if (clip) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success!', 'Your clip has been posted.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        throw new Error("Clip was uploaded but couldn't be saved.");
      }
    } catch (error) {
      console.error('Error creating clip:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', String((error as any)?.message ?? 'Failed to upload clip. Please try again.'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center justify-between px-5 py-4"
        >
          <Pressable
            onPress={() => router.back()}
            className="bg-white/10 rounded-full p-2"
          >
            <ChevronLeft size={24} color="#fff" />
          </Pressable>
          <Text className="text-white text-lg font-bold">Create Clip</Text>
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit || isUploading}
            className={`rounded-full px-4 py-2 ${
              canSubmit && !isUploading ? 'bg-terracotta' : 'bg-white/10'
            }`}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className={`font-bold ${canSubmit ? 'text-white' : 'text-white/40'}`}>
                Post
              </Text>
            )}
          </Pressable>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Video Preview / Selection */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(100)}
            className="px-5 mb-4"
          >
            {videoUri ? (
              <View className="relative">
                <Pressable
                  onPress={togglePlayPause}
                  className="rounded-3xl overflow-hidden bg-gray-900"
                  style={{ height: SCREEN_WIDTH * 1.2 }}
                >
                  {/* Video */}
                  <ExpoVideo
                    ref={videoRef}
                    source={{ uri: videoUri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode={ResizeMode.COVER}
                    isLooping
                    shouldPlay={false}
                    onPlaybackStatusUpdate={(status) => {
                      if (status.isLoaded) {
                        setIsPlaying(status.isPlaying);
                      }
                    }}
                  />

                  {/* Filter overlay */}
                  {selectedFilter.overlay && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: selectedFilter.overlay,
                      }}
                    />
                  )}

                  {/* Filter gradient */}
                  {selectedFilter.gradient && (
                    <LinearGradient
                      colors={selectedFilter.gradient as [string, string, ...string[]]}
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />
                  )}

                  {/* Sparkle effect for sparkle filter */}
                  {selectedFilter.id === 'sparkle' && (
                    <Animated.View
                      style={[
                        sparkleStyle,
                        { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
                      ]}
                    >
                      <View className="absolute top-10 left-10">
                        <Text style={{ fontSize: 24 }}>✨</Text>
                      </View>
                      <View className="absolute top-20 right-16">
                        <Text style={{ fontSize: 20 }}>⭐</Text>
                      </View>
                      <View className="absolute bottom-32 left-20">
                        <Text style={{ fontSize: 18 }}>💫</Text>
                      </View>
                      <View className="absolute bottom-48 right-12">
                        <Text style={{ fontSize: 22 }}>✨</Text>
                      </View>
                    </Animated.View>
                  )}

                  {/* Hearts effect */}
                  {selectedFilter.id === 'hearts' && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                      <View className="absolute top-12 left-8">
                        <Text style={{ fontSize: 20, opacity: 0.7 }}>💕</Text>
                      </View>
                      <View className="absolute top-28 right-12">
                        <Text style={{ fontSize: 16, opacity: 0.6 }}>💗</Text>
                      </View>
                      <View className="absolute bottom-40 left-16">
                        <Text style={{ fontSize: 24, opacity: 0.5 }}>💖</Text>
                      </View>
                      <View className="absolute bottom-24 right-20">
                        <Text style={{ fontSize: 18, opacity: 0.7 }}>💝</Text>
                      </View>
                    </View>
                  )}

                  {/* Text overlays */}
                  {textOverlays.map((overlay) => (
                    <View
                      key={overlay.id}
                      style={{
                        position: 'absolute',
                        left: overlay.position.x,
                        top: overlay.position.y,
                        backgroundColor: overlay.style.bg,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: overlay.style.color,
                          fontWeight: overlay.style.font === 'bold' ? 'bold' : 'normal',
                          fontSize: 18,
                          textShadowColor: overlay.style.glow ? overlay.style.color : (overlay.style.outline ? '#000' : 'transparent'),
                          textShadowRadius: overlay.style.glow ? 10 : (overlay.style.outline ? 2 : 0),
                          textShadowOffset: { width: 0, height: 0 },
                        }}
                      >
                        {overlay.text}
                      </Text>
                    </View>
                  ))}

                  {/* Sticker overlays */}
                  {stickerOverlays.map((sticker) => (
                    <View
                      key={sticker.id}
                      style={{
                        position: 'absolute',
                        left: sticker.position.x,
                        top: sticker.position.y,
                      }}
                    >
                      <Text style={{ fontSize: 50 * sticker.scale }}>{sticker.emoji}</Text>
                    </View>
                  ))}

                  {/* Play button overlay */}
                  {!isPlaying && (
                    <View className="absolute inset-0 items-center justify-center bg-black/30">
                      <View className="bg-white/20 rounded-full p-4">
                        <Play size={40} color="#fff" fill="#fff" />
                      </View>
                    </View>
                  )}
                </Pressable>

                {/* Clear video button */}
                <Pressable
                  onPress={handleClearVideo}
                  className="absolute top-3 right-3 bg-black/50 rounded-full p-2"
                >
                  <X size={20} color="#fff" />
                </Pressable>

                {/* Undo button */}
                {(textOverlays.length > 0 || stickerOverlays.length > 0) && (
                  <Pressable
                    onPress={removeLastOverlay}
                    className="absolute top-3 left-3 bg-black/50 rounded-full p-2"
                  >
                    <Undo2 size={20} color="#fff" />
                  </Pressable>
                )}

                {/* Editing tools - right side */}
                <View className="absolute right-3 top-16 gap-3">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowFilters(!showFilters);
                      setShowStickers(false);
                      setShowTextEditor(false);
                    }}
                    className={`p-3 rounded-full ${showFilters ? 'bg-terracotta' : 'bg-black/50'}`}
                  >
                    <Wand2 size={22} color="#fff" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowTextEditor(!showTextEditor);
                      setShowFilters(false);
                      setShowStickers(false);
                    }}
                    className={`p-3 rounded-full ${showTextEditor ? 'bg-terracotta' : 'bg-black/50'}`}
                  >
                    <Type size={22} color="#fff" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowStickers(!showStickers);
                      setShowFilters(false);
                      setShowTextEditor(false);
                    }}
                    className={`p-3 rounded-full ${showStickers ? 'bg-terracotta' : 'bg-black/50'}`}
                  >
                    <Smile size={22} color="#fff" />
                  </Pressable>
                </View>

                {/* Custom thumbnail option */}
                <Pressable
                  onPress={handlePickThumbnail}
                  className="absolute bottom-3 right-3 bg-black/50 rounded-xl px-3 py-2 flex-row items-center"
                >
                  <ImageIcon size={16} color="#fff" />
                  <Text className="text-white text-xs ml-1">
                    {thumbnailUri ? 'Change cover' : 'Add cover'}
                  </Text>
                </Pressable>

                {/* Filter name badge */}
                {selectedFilter.id !== 'none' && (
                  <View className="absolute bottom-3 left-3 bg-black/50 rounded-xl px-3 py-2 flex-row items-center">
                    {selectedFilter.icon && <selectedFilter.icon size={14} color="#fff" />}
                    <Text className="text-white text-xs ml-1">{selectedFilter.name}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View
                className="rounded-3xl overflow-hidden bg-gray-900 items-center justify-center"
                style={{ height: SCREEN_WIDTH * 1.2 }}
              >
                {isCountingDown ? (
                  <View className="items-center">
                    <Animated.View style={countdownStyle}>
                      <Text className="text-white text-8xl font-bold">{countdownValue}</Text>
                    </Animated.View>
                    <Text className="text-gray-400 mt-4">Get ready...</Text>
                    <Pressable
                      onPress={() => setIsCountingDown(false)}
                      className="mt-6 bg-white/10 px-6 py-3 rounded-full"
                    >
                      <Text className="text-white font-semibold">Cancel</Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <Video size={64} color="#4B5563" />
                    <Text className="text-gray-500 mt-4 text-center px-8">
                      Record or select a video up to 60 seconds
                    </Text>

                    <View className="flex-row mt-6">
                      <Pressable
                        onPress={() => {
                          if (showTimer) {
                            startCountdown();
                          } else {
                            handleRecordVideo();
                          }
                        }}
                        className="bg-terracotta rounded-2xl px-6 py-4 mr-3 flex-row items-center"
                      >
                        <Camera size={20} color="#fff" />
                        <Text className="text-white font-bold ml-2">Record</Text>
                      </Pressable>
                      <Pressable
                        onPress={handlePickVideo}
                        className="bg-white/10 rounded-2xl px-6 py-4 flex-row items-center"
                      >
                        <Upload size={20} color="#fff" />
                        <Text className="text-white font-bold ml-2">Upload</Text>
                      </Pressable>
                    </View>

                    {/* Timer toggle */}
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowTimer(!showTimer);
                      }}
                      className={`mt-4 flex-row items-center px-4 py-2 rounded-full ${showTimer ? 'bg-terracotta/30' : 'bg-white/5'}`}
                    >
                      <Timer size={16} color={showTimer ? '#D4673A' : '#9CA3AF'} />
                      <Text className={`ml-2 font-medium ${showTimer ? 'text-terracotta' : 'text-gray-500'}`}>
                        {showTimer ? `${timerSeconds}s Timer ON` : 'Timer'}
                      </Text>
                    </Pressable>

                    {showTimer && (
                      <View className="flex-row mt-3 gap-2">
                        {[3, 5, 10].map((seconds) => (
                          <Pressable
                            key={seconds}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setTimerSeconds(seconds);
                            }}
                            className={`px-4 py-2 rounded-full ${timerSeconds === seconds ? 'bg-terracotta' : 'bg-white/10'}`}
                          >
                            <Text className="text-white font-medium">{seconds}s</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </>
                )}
              </View>
            )}
          </Animated.View>

          {/* Filters Panel */}
          {showFilters && videoUri && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              className="px-5 mb-4"
            >
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
                <View className="flex-row gap-3">
                  {FILTERS.map((filter) => (
                    <Pressable
                      key={filter.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedFilter(filter);
                      }}
                      className={`items-center p-3 rounded-2xl ${
                        selectedFilter.id === filter.id ? 'bg-terracotta' : 'bg-white/10'
                      }`}
                      style={{ minWidth: 70 }}
                    >
                      {filter.icon ? (
                        <filter.icon size={24} color="#fff" />
                      ) : (
                        <View className="w-6 h-6 rounded-full bg-white/20" />
                      )}
                      <Text className="text-white text-xs mt-1">{filter.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </Animated.View>
          )}

          {/* Stickers Panel */}
          {showStickers && videoUri && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              className="px-5 mb-4"
            >
              <View className="bg-white/10 rounded-2xl p-4">
                <Text className="text-white font-semibold mb-3">Add Stickers</Text>
                <View className="flex-row flex-wrap gap-2">
                  {STICKERS.map((sticker) => (
                    <Pressable
                      key={sticker.id}
                      onPress={() => addSticker(sticker.emoji)}
                      className="bg-white/10 rounded-xl p-3"
                    >
                      <Text style={{ fontSize: 28 }}>{sticker.emoji}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Animated.View>
          )}

          {/* Text Editor Panel */}
          {showTextEditor && videoUri && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              className="px-5 mb-4"
            >
              <View className="bg-white/10 rounded-2xl p-4">
                <Text className="text-white font-semibold mb-3">Add Text</Text>
                <TextInput
                  value={currentText}
                  onChangeText={setCurrentText}
                  placeholder="Type something..."
                  placeholderTextColor="#6B7280"
                  className="bg-white/10 rounded-xl px-4 py-3 text-white mb-3"
                  maxLength={50}
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 -mx-1">
                  <View className="flex-row gap-2 px-1">
                    {TEXT_STYLES.map((style) => (
                      <Pressable
                        key={style.id}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedTextStyle(style);
                        }}
                        className={`px-4 py-2 rounded-xl ${
                          selectedTextStyle.id === style.id ? 'bg-terracotta' : 'bg-white/10'
                        }`}
                      >
                        <Text
                          style={{
                            color: style.color,
                            fontWeight: style.font === 'bold' ? 'bold' : 'normal',
                          }}
                        >
                          {style.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
                <Pressable
                  onPress={addTextOverlay}
                  disabled={!currentText.trim()}
                  className={`py-3 rounded-xl ${currentText.trim() ? 'bg-terracotta' : 'bg-white/10'}`}
                >
                  <Text className={`text-center font-bold ${currentText.trim() ? 'text-white' : 'text-white/40'}`}>
                    Add Text
                  </Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Description */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(200)}
            className="px-5 mb-6"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white font-semibold">Description</Text>
              <Pressable
                onPress={enhanceWithAi}
                disabled={!videoUri || enhanceBusy}
                className={`flex-row items-center px-3 py-1.5 rounded-full ${
                  !videoUri || enhanceBusy ? 'bg-white/10' : 'bg-terracotta'
                }`}
              >
                <Sparkles size={14} color={!videoUri || enhanceBusy ? 'rgba(255,255,255,0.45)' : '#fff'} />
                <Text className={`ml-2 text-xs font-bold ${!videoUri || enhanceBusy ? 'text-white/40' : 'text-white'}`}>
                  {enhanceBusy ? 'Enhancing…' : 'AI Enhance'}
                </Text>
              </Pressable>
            </View>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What's this clip about? Add hashtags to help others find it..."
              placeholderTextColor="#6B7280"
              multiline
              numberOfLines={4}
              maxLength={500}
              className="bg-white/10 rounded-2xl p-4 text-white text-base"
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />
            <Text className="text-gray-500 text-xs mt-1 text-right">
              {description.length}/500
            </Text>
          </Animated.View>

          {/* Music Tag */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(300)}
            className="px-5 mb-6"
          >
            <Text className="text-white font-semibold mb-2">Add Music (optional)</Text>
            <View className="bg-white/10 rounded-2xl px-4 py-3 flex-row items-center">
              <Music2 size={20} color="#9CA3AF" />
              <TextInput
                value={musicTag}
                onChangeText={setMusicTag}
                placeholder="Song name - Artist"
                placeholderTextColor="#6B7280"
                className="flex-1 ml-3 text-white text-base"
                maxLength={100}
              />
            </View>
          </Animated.View>

          {/* Upload Progress */}
          {isUploading && (
            <Animated.View
              entering={FadeIn.duration(300)}
              className="px-5 mb-6"
            >
              <View className="bg-white/10 rounded-2xl p-4">
                <Text className="text-white font-semibold mb-3">Uploading...</Text>
                <View className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-terracotta rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </View>
                <Text className="text-gray-400 text-sm mt-2">{uploadProgress}% complete</Text>
              </View>
            </Animated.View>
          )}

          {/* Guidelines */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(400)}
            className="px-5 mb-8"
          >
            <View className="bg-white/5 rounded-2xl p-4">
              <Text className="text-gray-400 text-sm font-semibold mb-2">Community Guidelines</Text>
              <Text className="text-gray-500 text-xs leading-5">
                • Keep content appropriate for all audiences{'\n'}
                • No violent, sexual, or hateful content{'\n'}
                • Respect copyright - only post original content{'\n'}
                • Be kind and respectful to others
              </Text>
            </View>
          </Animated.View>

          <View className="h-20" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
