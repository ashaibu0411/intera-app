import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, Text, Pressable, Dimensions, FlatList, ViewToken, ActivityIndicator, Alert, Modal, Share, Platform, TextInput, Linking } from 'react-native';
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
  Trash2,
  Gift,
  Store,
  Link as LinkIcon,
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
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import * as DropdownMenu from 'zeego/dropdown-menu';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { reportBlockedUser } from '@/lib/reports';
import type { ViolationType } from '@/lib/contentModeration';
import { moderateText } from '@/lib/contentModeration';
import { aiModerateContent } from '@/lib/aiModerateContent';
import { getClips, getFollowingClips, resolveClipVideoUrl, deleteClip } from '@/lib/clips-api';
import { aiClipCaptionsFromVideoUrl, type AiClipCaptionsResult } from '@/lib/aiClipCaptions';
import { translateForUi } from '@/lib/aiUiTranslate';
import { getGemBalance, sendGift } from '@/lib/giftService';

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
  // The raw `clips.video_url` value from DB (object path or full storage URL).
  // We keep it so we can re-resolve a signed URL on retry.
  rawVideoUrl?: string;
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

const CLIP_GIFTS = [
  { id: 'rose', name: 'Rose', value: 10 },
  { id: 'coffee', name: 'Coffee', value: 25 },
  { id: 'fire', name: 'Fire', value: 99 },
  { id: 'crown', name: 'Crown', value: 250 },
] as const;

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
  onGift: () => void;
  onDelete?: () => void;
  isOwnClip?: boolean;
  currentUserId?: string;
  itemHeight: number;
  itemWidth: number;
}

class ClipsErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset: () => void },
  { error: unknown | null }
> {
  state: { error: unknown | null } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    console.error('[Clips] Render crashed:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={{ flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 }}>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18, textAlign: 'center' }}>Clips crashed</Text>
        <Text style={{ color: 'rgba(255,255,255,0.75)', marginTop: 10, textAlign: 'center' }}>
          This is usually caused by a native module mismatch, an invalid video URL, or a misconfigured Supabase env.
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.65)', marginTop: 10 }} numberOfLines={6}>
          {String((this.state.error as any)?.message ?? this.state.error)}
        </Text>
        <Pressable
          onPress={() => {
            this.setState({ error: null });
            this.props.onReset();
          }}
          style={{ marginTop: 16 }}
          className="active:opacity-90"
        >
          <View style={{ backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ color: '#000', fontWeight: '900' }}>Try again</Text>
          </View>
        </Pressable>
      </View>
    );
  }
}

function ClipItem({ clip, isActive, isMuted, onToggleMute, onBlockUser, onReportUser, onComment, onShare, onGift, onDelete, isOwnClip, currentUserId, itemHeight, itemWidth }: ClipItemProps) {
  const insets = useSafeAreaInsets();
  const [liked, setLiked] = useState(clip.isLiked);
  const [saved, setSaved] = useState(clip.isSaved);
  const [likeCount, setLikeCount] = useState(clip.likes);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [playUrl, setPlayUrl] = useState<string | undefined>(clip.videoUrl);
  const hasRetriedWithFreshUrl = useRef(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [duration, setDuration] = useState(clip.duration || 0);
  const [isFollowing, setIsFollowing] = useState(clip.user.isFollowing || false);
  const videoRef = useRef<ExpoVideo>(null);
  const hasProbedRef = useRef(false);
  const [captions, setCaptions] = useState<AiClipCaptionsResult | null>(null);
  const [captionsLoading, setCaptionsLoading] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const translatorPrefs = useStore((s) => s.translator);
  const [descTranslation, setDescTranslation] = useState<string | null>(null);
  const [descTranslated, setDescTranslated] = useState(false);
  const [descBusy, setDescBusy] = useState(false);

  const heartScale = useSharedValue(1);
  const doubleTapHeart = useSharedValue(0);
  const progressWidth = useSharedValue(0);
  const playPauseOpacity = useSharedValue(0);

  // Keep local playback URL in sync if feed refreshes/reorders.
  useEffect(() => {
    setPlayUrl(clip.videoUrl);
    hasRetriedWithFreshUrl.current = false;
  }, [clip.videoUrl, clip.id]);

  // Load captions when clip becomes active
  useEffect(() => {
    if (!isActive) return;
    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('clip_captions')
          .select('language, transcript, segments')
          .eq('clip_id', clip.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!mounted) return;
        if (!error && data?.transcript) {
          setCaptions({
            language: data.language ?? null,
            text: data.transcript,
            segments: Array.isArray(data.segments) ? data.segments : [],
            translation: null,
          });
          return;
        }
      } catch {
        // ignore
      }

      try {
        const raw = await AsyncStorage.getItem(`clip_caption:${clip.id}`);
        if (!mounted) return;
        if (raw) setCaptions(JSON.parse(raw));
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isActive, clip.id]);

  const currentCaptionText = useMemo(() => {
    if (!captionsEnabled) return '';
    if (!captions?.segments?.length) return '';
    const t = playbackPosition;
    const seg = captions.segments.find((s: any) => t >= Number(s?.start ?? 0) && t < Number(s?.end ?? 0));
    return String(seg?.text ?? '').trim();
  }, [captions, playbackPosition, captionsEnabled]);

  const generateCaptions = useCallback(async () => {
    if (!playUrl || captionsLoading) return;
    setCaptionsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await aiClipCaptionsFromVideoUrl({ videoUrl: playUrl, targetLang: 'en' });
      setCaptions(res);
      setCaptionsEnabled(true);
      AsyncStorage.setItem(`clip_caption:${clip.id}`, JSON.stringify(res)).catch(() => {});

      if (currentUserId) {
        const language = (res.language || 'und').trim() || 'und';
        await supabase.from('clip_captions').upsert(
          {
            clip_id: clip.id,
            language,
            transcript: res.text,
            segments: res.segments,
            created_by: currentUserId,
          },
          { onConflict: 'clip_id,language' }
        );
      }
    } catch (e: any) {
      console.log('[Clips] Caption generation failed:', e?.message ?? e);
      Alert.alert('Could not generate captions', 'Please try again in a moment.');
    } finally {
      setCaptionsLoading(false);
    }
  }, [playUrl, captionsLoading, clip.id, currentUserId]);

  const targetLang = translatorPrefs?.targetLangCode || 'en';

  const firstUrl = useMemo(() => {
    const text = String(clip.description || '');
    const m = text.match(/https?:\/\/[^\s)]+/i);
    return m?.[0] ?? '';
  }, [clip.description]);

  const toggleTranslateDesc = async () => {
    if (descBusy) return;
    if (descTranslation) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDescTranslated((v) => !v);
      return;
    }
    const text = String(clip.description || '').trim();
    if (!text) return;
    setDescBusy(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await translateForUi({
        text,
        to: targetLang,
        scope: `clip:${clip.id}:desc`,
        context: 'Translate this short clip description. Keep hashtags/emojis.',
      });
      setDescTranslation(res.translation);
      setDescTranslated(true);
    } catch (e) {
      console.log('[Clips] translate desc failed:', e);
    } finally {
      setDescBusy(false);
    }
  };

  // Auto-play/pause based on visibility.
  // IMPORTANT: don't call loadAsync repeatedly — it can break scrolling/perf.
  useEffect(() => {
    if (!playUrl) return;
    if (isActive) {
      // reset state when becoming active
      setIsLoading(true);
      setVideoFailed(false);
      setVideoError(null);
      hasProbedRef.current = false;
      hasRetriedWithFreshUrl.current = false;
      videoRef.current?.playAsync().catch(() => null);
    } else {
      videoRef.current?.pauseAsync().catch(() => null);
    }
  }, [isActive, playUrl]);

  const probeVideoUrlOnce = useCallback(async (url: string) => {
    if (!url) return;
    if (hasProbedRef.current) return;
    hasProbedRef.current = true;
    try {
      const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-1' } });
      const ct = res.headers.get('content-type');
      const info = `HTTP ${res.status}${ct ? ` • ${ct}` : ''}`;
      setVideoError((prev) => (prev ? `${prev}\n${info}` : info));
    } catch (e: any) {
      const info = `Probe failed: ${String(e?.message ?? e)}`;
      setVideoError((prev) => (prev ? `${prev}\n${info}` : info));
    }
  }, []);

  const refreshToSignedUrl = useCallback(async () => {
    // Only do this once per clip activation to avoid loops.
    if (hasRetriedWithFreshUrl.current) return false;
    hasRetriedWithFreshUrl.current = true;

    const raw = String(clip.rawVideoUrl || clip.videoUrl || '').trim();
    if (!raw) return false;

    try {
      const next = await resolveClipVideoUrl(raw, { expiresInSeconds: 60 * 60 });
      if (next && next !== playUrl) {
        setPlayUrl(next);
        setReloadNonce((n) => n + 1);
        return true;
      }
    } catch (e: any) {
      setVideoError((prev) => (prev ? `${prev}\nRe-resolve failed: ${String(e?.message ?? e)}` : `Re-resolve failed: ${String(e?.message ?? e)}`));
    }
    return false;
  }, [clip.rawVideoUrl, clip.videoUrl, playUrl]);

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
      setVideoFailed(false);
      setVideoError(null);

      if (status.durationMillis) {
        setDuration(status.durationMillis / 1000);
      }

      if (status.positionMillis && status.durationMillis) {
        const progress = (status.positionMillis / status.durationMillis) * 100;
        progressWidth.value = withTiming(progress, { duration: 100 });
        setPlaybackPosition(status.positionMillis / 1000);
      }
    } else if (status.error) {
      // Video failed to load - fall back to thumbnail display
      // This commonly happens with incompatible video URLs or server config issues
      setVideoFailed(true);
      setIsLoading(false);
      setVideoError(String(status.error));
      if (clip.videoUrl) void probeVideoUrlOnce(clip.videoUrl);
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
      if (event.translationX < -70) {
        runOnJS(onComment)();
      }
      if (event.translationX > 70) {
        runOnJS(() => router.push(`/profile/${clip.user.id}`))();
      }
    });

  return (
    <GestureDetector gesture={panGesture}>
      <Pressable
        onPress={handleTap}
        style={{ height: itemHeight, width: itemWidth }}
        className="relative"
      >
        {/* Video or Thumbnail Background */}
        {playUrl && !videoFailed ? (
          <>
            <ExpoVideo
              ref={videoRef}
              key={`${clip.id}:${reloadNonce}`}
              source={{
                uri: playUrl,
                headers: {
                  'Accept': 'video/*',
                },
              }}
              style={{ position: 'absolute', width: '100%', height: '100%' }}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay={isActive}
              isMuted={isMuted}
              volume={1.0}
              onError={(e) => {
                // Some failures don't populate status.error reliably, so capture the event too.
                setVideoFailed(true);
                setIsLoading(false);
                const errorStr = typeof e === 'string' ? e : JSON.stringify(e);
                // Check for common iOS AVFoundation errors
                if (errorStr.includes('-11850') || errorStr.includes('AVFoundation')) {
                  setVideoError('Video format not supported on this device. The video may need to be re-encoded.');
                } else {
                  setVideoError(errorStr);
                }
                if (playUrl) void probeVideoUrlOnce(playUrl);
                // Best-effort: if this was a 403/public URL, try to re-resolve via signed URL.
                void refreshToSignedUrl();
              }}
              onPlaybackStatusUpdate={onPlaybackStatusUpdate}
              useNativeControls={false}
              progressUpdateIntervalMillis={100}
            />
            {/* Thumbnail while loading or if video failed */}
            {(isLoading || videoFailed) && (
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

        {/* Playback error overlay + retry */}
        {videoFailed ? (
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', width: '100%' }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>Video unavailable</Text>
              <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>
                {videoError || 'This video could not be played.'}
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setVideoFailed(false);
                  setVideoError(null);
                  setIsLoading(true);
                  setReloadNonce((n) => n + 1);
                }}
                className="active:opacity-90"
                style={{ marginTop: 12, alignSelf: 'flex-start' }}
              >
                <View style={{ backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }}>
                  <Text style={{ color: '#000', fontWeight: '900' }}>Retry</Text>
                </View>
              </Pressable>
            </View>
          </View>
        ) : null}

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

          {/* Gift */}
          <Pressable onPress={onGift} className="items-center">
            <Gift size={30} color="#C9A227" strokeWidth={2.5} />
          </Pressable>

          {/* More - Enhanced */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              <Pressable className="items-center">
                <MoreHorizontal size={28} color="#fff" strokeWidth={2.5} />
              </Pressable>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content>
              <DropdownMenu.Item
                key="captions"
                onSelect={() => {
                  if (captions?.segments?.length) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCaptionsEnabled((v) => !v);
                  } else {
                    void generateCaptions();
                  }
                }}
              >
                <DropdownMenu.ItemIcon ios={{ name: 'text.bubble' }}>
                  <Sparkles size={18} color="#1B4D3E" />
                </DropdownMenu.ItemIcon>
                <DropdownMenu.ItemTitle>
                  {captions?.segments?.length ? (captionsEnabled ? 'Hide Captions' : 'Show Captions') : 'Generate Captions (AI)'}
                </DropdownMenu.ItemTitle>
              </DropdownMenu.Item>
              {isOwnClip && onDelete && (
                <DropdownMenu.Item key="delete" onSelect={onDelete} destructive>
                  <DropdownMenu.ItemIcon ios={{ name: 'trash' }}>
                    <Trash2 size={18} color="#EF4444" />
                  </DropdownMenu.ItemIcon>
                  <DropdownMenu.ItemTitle>Delete Clip</DropdownMenu.ItemTitle>
                </DropdownMenu.Item>
              )}
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

          {/* Captions */}
          {captionsLoading ? (
            <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Generating captions…</Text>
            </View>
          ) : currentCaptionText ? (
            <View style={{ backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>{currentCaptionText}</Text>
              {captions?.translation?.text ? (
                <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>{captions.translation.text}</Text>
              ) : null}
            </View>
          ) : null}

          {/* Description - Enhanced */}
          <Pressable onPress={() => void toggleTranslateDesc()} className="active:opacity-90">
            <Text className="text-white/80 text-xs font-bold mb-1" style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
              {descTranslation ? (descTranslated ? 'Showing translation • Tap for original' : 'Showing original • Tap for translation') : descBusy ? 'Translating…' : `Tap to translate (${targetLang})`}
            </Text>
            <Text className="text-white text-sm leading-5 mb-3" numberOfLines={3} style={{ textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
              {descTranslated && descTranslation ? descTranslation : clip.description}
            </Text>
          </Pressable>

          {/* Business-friendly link */}
          {firstUrl ? (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Linking.openURL(firstUrl).catch(() => null);
              }}
              className="flex-row items-center self-start bg-black/35 rounded-full px-3 py-2"
              style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', marginBottom: 10 }}
            >
              <LinkIcon size={14} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', marginLeft: 8 }}>Visit link</Text>
            </Pressable>
          ) : null}

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
  const [comments, setComments] = useState<{ id: string; user: { name: string; avatar: string; username: string }; text: string; likes: number; timeAgo: string }[]>([]);

  const handleSendComment = () => {
    if (commentText.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const text = commentText.trim();

      // Moderation gate (local + AI). Clips comments are local-only right now.
      (async () => {
        try {
          const local = moderateText(text);
          if (local.action === 'blocked') {
            Alert.alert('Cannot post this comment', local.message || 'This comment violates our community guidelines.');
            return;
          }
          const ai = await aiModerateContent({ text, context: 'comment' });
          if (ai.action === 'block') {
            Alert.alert('Cannot post this comment', ai.reasons?.[0] || 'This comment violates our community guidelines.');
            return;
          }
          if (ai.action === 'warn') {
            const tips = (ai.redaction_tips || []).slice(0, 3);
            Alert.alert(
              'Quick safety check',
              [ai.reasons?.[0] || 'Consider editing before posting.', tips.length ? `\n\nTips:\n- ${tips.join('\n- ')}` : '']
                .filter(Boolean)
                .join('')
            );
          }

          setComments([
            {
              id: Date.now().toString(),
              user: { name: 'You', avatar: '', username: 'you' },
              text,
              likes: 0,
              timeAgo: 'just now',
            },
            ...comments,
          ]);
          setCommentText('');
        } catch (e) {
          console.log('[Clips] Moderation skipped:', e);
          setComments([
            {
              id: Date.now().toString(),
              user: { name: 'You', avatar: '', username: 'you' },
              text,
              likes: 0,
              timeAgo: 'just now',
            },
            ...comments,
          ]);
          setCommentText('');
        }
      })();
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

function GiftsModal({
  visible,
  clip,
  onClose,
}: {
  visible: boolean;
  clip: Clip | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const currentUser = useStore((s) => s.currentUser);
  const [balance, setBalance] = useState<number | null>(null);
  const [busyGiftId, setBusyGiftId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!visible) return;
      if (!currentUser?.id) {
        if (mounted) setBalance(null);
        return;
      }
      const b = await getGemBalance(currentUser.id);
      if (mounted) setBalance(b);
    })();
    return () => {
      mounted = false;
    };
  }, [visible, currentUser?.id]);

  const canGift = !!currentUser?.id && !!clip?.user?.id && currentUser?.id !== clip?.user?.id;

  const handleSendGift = async (giftId: string, giftName: string, giftValue: number) => {
    if (!clip?.user?.id || !clip?.user?.name) return;
    if (!currentUser?.id || !currentUser?.name) {
      router.push('/signup');
      return;
    }
    if (currentUser.id === clip.user.id) {
      Alert.alert('Not allowed', "You can't gift yourself.");
      return;
    }
    setBusyGiftId(giftId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await sendGift({
        senderId: currentUser.id,
        senderName: currentUser.name,
        recipientId: clip.user.id,
        recipientName: clip.user.name,
        giftId,
        giftName,
        giftValue,
      });
      if (!res.success) {
        if (res.error === 'Insufficient gems') {
          Alert.alert('Not enough gems', 'Top up gems to send this gift.', [
            { text: 'Not now', style: 'cancel' },
            { text: 'Get gems', onPress: () => router.push('/gem-store') },
          ]);
          return;
        }
        Alert.alert('Gift failed', res.error || 'Please try again.');
        return;
      }
      if (typeof res.newBalance === 'number') setBalance(res.newBalance);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Gift sent', `You sent ${giftName} to ${clip.user.name}.`);
      onClose();
    } finally {
      setBusyGiftId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60">
        <Pressable className="flex-1" onPress={onClose} />
        <Animated.View entering={SlideInUp.duration(300)} className="bg-white rounded-t-3xl">
          <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
            <Text className="text-lg font-bold text-warmBrown">Send a gift</Text>
            <Pressable onPress={onClose} className="p-1" hitSlop={8}>
              <X size={22} color="#6B7280" />
            </Pressable>
          </View>

          <View className="px-5 pt-4 pb-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-600">
                To <Text className="font-semibold text-warmBrown">@{clip?.user?.username}</Text>
              </Text>
              <Pressable onPress={() => router.push('/gem-store')} className="flex-row items-center">
                <Text className="text-terracotta-500 font-semibold">Get gems</Text>
              </Pressable>
            </View>
            <Text className="text-gray-500 text-xs mt-1">
              Balance: {typeof balance === 'number' ? `${balance.toLocaleString()} gems` : currentUser?.id ? 'Loading…' : 'Sign in to gift'}
            </Text>
          </View>

          <View className="px-5 pb-4">
            <View className="flex-row flex-wrap gap-3">
              {CLIP_GIFTS.map((g) => {
                const disabled = !canGift || !!busyGiftId;
                const isBusy = busyGiftId === g.id;
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => handleSendGift(g.id, g.name, g.value)}
                    disabled={disabled}
                    className={`rounded-2xl px-4 py-3 border ${disabled ? 'opacity-50' : 'opacity-100'}`}
                    style={{ borderColor: '#E5E7EB' }}
                  >
                    <View className="flex-row items-center">
                      <Gift size={16} color="#C9A227" />
                      <Text className="ml-2 font-bold text-warmBrown">{g.name}</Text>
                    </View>
                    <Text className="text-gray-500 text-xs mt-1">{g.value} gems</Text>
                    {isBusy ? <Text className="text-gray-500 text-xs mt-1">Sending…</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={{ height: insets.bottom + 10 }} />
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
  const [loading, setLoading] = useState(true);
  const [feedClips, setFeedClips] = useState<Clip[]>([]);
  const [renderNonce, setRenderNonce] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [showGiftsModal, setShowGiftsModal] = useState(false);
  const [giftClip, setGiftClip] = useState<Clip | null>(null);
  const [reportStep, setReportStep] = useState<'reason' | 'confirm' | 'done'>('reason');
  const [selectedReason, setSelectedReason] = useState<ViolationType | 'other' | null>(null);
  const [showBlockConfirmModal, setShowBlockConfirmModal] = useState(false);
  const [selectedClipUser, setSelectedClipUser] = useState<{ id: string; name: string; avatar: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const isGuest = useStore((s) => s.isGuest);
  const currentUser = useStore((s) => s.currentUser);
  const blockUser = useStore((s) => s.blockUser);
  const blockedUserIds = useStore((s) => s.blockedUserIds);

  // Function to load clips
  const loadClips = useCallback(async () => {
    try {
      setLoading(true);
      const db =
        activeTab === 'following' && currentUser?.id
          ? await getFollowingClips(currentUser.id, 50, 0)
          : await getClips(50, 0);

      const mappedPromises = (db ?? [])
        // Skip bad local-only URIs that won't load after upload
        .filter((c) => !String(c.video_url || '').startsWith('file://') && !String(c.video_url || '').startsWith('ph://'))
        .map(async (c) => {
          let resolved = '';
          let validUrl = false;
          try {
            resolved = await resolveClipVideoUrl(c.video_url, { expiresInSeconds: 60 * 60 });
            // Check if the URL contains 'Object not found' indicator or is empty
            validUrl = !!resolved && !resolved.includes('undefined') && resolved.length > 10;

            // Verify the video actually exists by doing a HEAD request
            if (validUrl && resolved) {
              try {
                const checkRes = await fetch(resolved, { method: 'HEAD' });
                validUrl = checkRes.ok;
                if (!checkRes.ok) {
                  console.log('[clips] Video not accessible:', c.video_url, 'status:', checkRes.status);
                }
              } catch (fetchErr) {
                console.log('[clips] Could not verify video URL:', c.video_url);
                // Still try to use it - might work on device
                validUrl = true;
              }
            }
          } catch {
            resolved = String(c.video_url || '');
            validUrl = false;
          }

          return {
            id: c.id,
            user: {
              id: c.user_id,
              name: c.user?.name ?? 'Someone',
              username: c.user?.username ?? 'user',
              avatar:
                c.user?.avatar_url ??
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
              isVerified: false,
              isFollowing: false,
            },
            rawVideoUrl: String(c.video_url || ''),
            videoUrl: validUrl ? resolved : undefined,
            thumbnail:
              c.thumbnail_url ??
              'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=1400&fit=crop',
            description: c.description,
            music: c.music_tag ? `Original Audio • ${c.music_tag}` : 'Original Audio',
            likes: c.likes_count ?? 0,
            comments: c.comments_count ?? 0,
            shares: c.shares_count ?? 0,
            views: c.views_count ?? 0,
            isLiked: false,
            isSaved: false,
            createdAt: c.created_at,
            _validVideo: validUrl,
          };
        });

      const mapped = (await Promise.all(mappedPromises)) as Clip[];

      // Filter to only show clips with valid videos, or fall back to showing thumbnail-only
      const validClips = mapped.filter((c) => (c as any)._validVideo || c.thumbnail);

      setFeedClips(validClips);
    } catch (e: any) {
      setFeedClips([]);
      console.log('[clips] Error loading clips:', e?.message);
    } finally {
      setLoading(false);
    }
  }, [activeTab, currentUser?.id]);

  // Load clips on mount
  useEffect(() => {
    loadClips();
  }, [loadClips]);

  // Refresh clips when screen comes into focus (e.g., after posting a new clip)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we've already loaded once and this is a return visit
      if (feedClips.length > 0) {
        console.log('[clips] Screen focused, refreshing clips...');
        loadClips();
      }
    }, [loadClips, feedClips.length])
  );

  // Filter out clips from blocked users
  const filteredClips = useMemo(() => {
    return feedClips.filter((clip) => !blockedUserIds.includes(clip.user.id));
  }, [blockedUserIds, feedClips]);

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

  const handleDeleteClip = async (clip: Clip) => {
    if (!currentUser?.id) return;

    Alert.alert(
      'Delete Clip',
      'Are you sure you want to delete this clip? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              const success = await deleteClip(clip.id, currentUser.id);
              if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                // Remove from local state
                setFeedClips((prev: Clip[]) => prev.filter((c: Clip) => c.id !== clip.id));
              } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Error', 'Failed to delete clip. Please try again.');
              }
            } catch (error) {
              console.error('Error deleting clip:', error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', 'An error occurred. Please try again.');
            }
          },
        },
      ]
    );
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
    setActiveIndex(0);
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
      <ClipsErrorBoundary
        key={renderNonce}
        onReset={() => {
          setRenderNonce((n) => n + 1);
          setActiveIndex(0);
        }}
      >
        {loading ? (
          <View style={{ position: 'absolute', top: insets.top + 70, left: 0, right: 0, alignItems: 'center', zIndex: 50 }}>
            <View style={{ backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>Loading clips…</Text>
            </View>
          </View>
        ) : null}

        {/* Header - Enhanced */}
        <View
          className="absolute z-10 left-0 right-0 flex-row items-center justify-between px-4"
          style={{ top: insets.top + 8 }}
        >
          {/* Business shortcut */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/marketplace');
            }}
            className="bg-black/35 rounded-full w-10 h-10 items-center justify-center"
            style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}
          >
            <Store size={18} color="#fff" />
          </Pressable>

          {/* Tab Switcher - Enhanced */}
          <Animated.View entering={FadeIn.duration(400)} className="flex-row items-center bg-black/30 rounded-full px-1 py-1 backdrop-blur-sm">
            <Pressable
              onPress={() => handleTabChange('following')}
              disabled={isGuest || !currentUser?.id}
              className={`px-5 py-2 rounded-full ${activeTab === 'following' ? 'bg-white' : ''}`}
            >
              <Text
                className={`font-semibold text-sm ${
                  activeTab === 'following' ? 'text-black' : 'text-white'
                } ${isGuest || !currentUser?.id ? 'opacity-60' : ''}`}
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
        {filteredClips.length === 0 && !loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 }}>
            <View style={{ alignItems: 'center', maxWidth: 420 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: 28, padding: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
                <Video size={42} color="#fff" />
              </View>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20, marginTop: 14, textAlign: 'center' }}>
                {activeTab === 'following' ? 'No clips from people you follow yet' : 'No clips yet'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.75)', marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                Post a quick vertical video for your community. Businesses can also post promos and link to their site in the caption.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Pressable
                  onPress={handleCreateClip}
                  className="active:opacity-90"
                >
                  <View style={{ backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12 }}>
                    <Text style={{ color: '#000', fontWeight: '900' }}>Create a clip</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => router.push('/marketplace')}
                  className="active:opacity-90"
                >
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
                    <Text style={{ color: '#fff', fontWeight: '900' }}>Business tools</Text>
                  </View>
                </Pressable>
                {activeTab === 'following' && (isGuest || !currentUser?.id) ? (
                  <Pressable
                    onPress={() => router.push('/signup')}
                    className="active:opacity-90"
                  >
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
                      <Text style={{ color: '#fff', fontWeight: '900' }}>Sign in</Text>
                    </View>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>
        ) : (
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
                onGift={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setGiftClip(item);
                  setShowGiftsModal(true);
                }}
                onDelete={() => handleDeleteClip(item)}
                isOwnClip={item.user.id === currentUser?.id}
                currentUserId={currentUser?.id}
                itemHeight={pagerHeight}
                itemWidth={SCREEN_WIDTH}
              />
            )}
            pagingEnabled
            scrollEnabled={!(showCommentsModal || showReportModal || showBlockConfirmModal || showGiftsModal)}
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
        )}
      </ClipsErrorBoundary>

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

      {/* Gifts Modal */}
      <GiftsModal
        visible={showGiftsModal}
        clip={giftClip}
        onClose={() => {
          setShowGiftsModal(false);
          setGiftClip(null);
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
