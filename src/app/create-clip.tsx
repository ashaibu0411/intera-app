import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
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
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { Video as ExpoVideo, ResizeMode } from 'expo-av';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { createClip, uploadClipVideo, uploadClipThumbnail } from '@/lib/clips-api';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CreateClipScreen() {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [musicTag, setMusicTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<ExpoVideo>(null);

  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);

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
      videoMaxDuration: 60, // Max 60 seconds
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      let uri = asset.uri;

      // iOS can return ph:// URIs; prefer a stable file:// localUri when possible.
      if (asset.assetId) {
        try {
          const info = await MediaLibrary.getAssetInfoAsync(asset.assetId);
          uri = info.localUri || info.uri || uri;
        } catch {
          // ignore
        }
      }

      // Best-effort: ensure we have a file:// URI for playback + upload.
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
      // Auto-generate thumbnail from first frame (in real app, use video-thumbnails library)
      setThumbnailUri(null);
    }
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

      // Best-effort: ensure we have a file:// URI for playback + upload.
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

  const canSubmit = videoUri && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || !currentUser || isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Step 1: Upload video (simulated progress)
      setUploadProgress(10);
      const videoPath = await uploadClipVideo(currentUser.id, videoUri!);

      if (!videoPath) {
        throw new Error(
          "Upload failed. Please make sure your Supabase Storage bucket 'clips' exists and your Storage policies allow uploads, then try again."
        );
      }

      setUploadProgress(60);

      // Step 2: Upload thumbnail if provided
      let thumbnailUrl: string | null = null;
      if (thumbnailUri) {
        thumbnailUrl = await uploadClipThumbnail(currentUser.id, thumbnailUri);
        setUploadProgress(80);
      }

      // Step 3: Create clip record
      const clip = await createClip({
        user_id: currentUser.id,
        video_url: videoPath,
        thumbnail_url: thumbnailUrl || undefined,
        description: description.trim(),
        music_tag: musicTag.trim() || undefined,
      });

      setUploadProgress(100);

      if (clip) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success!', 'Your clip has been posted.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        throw new Error("Clip was uploaded but couldn't be saved. Please ensure the `clips` table exists in Supabase and RLS allows inserts.");
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
            className="px-5 mb-6"
          >
            {videoUri ? (
              <View className="relative">
                <Pressable
                  onPress={togglePlayPause}
                  className="rounded-3xl overflow-hidden bg-gray-900"
                  style={{ height: SCREEN_WIDTH * 1.2 }}
                >
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
              </View>
            ) : (
              <View
                className="rounded-3xl overflow-hidden bg-gray-900 items-center justify-center"
                style={{ height: SCREEN_WIDTH * 1.2 }}
              >
                <Video size={64} color="#4B5563" />
                <Text className="text-gray-500 mt-4 text-center px-8">
                  Record or select a video up to 60 seconds
                </Text>

                <View className="flex-row mt-6">
                  <Pressable
                    onPress={handleRecordVideo}
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
              </View>
            )}
          </Animated.View>

          {/* Description */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(200)}
            className="px-5 mb-6"
          >
            <Text className="text-white font-semibold mb-2">Description</Text>
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
