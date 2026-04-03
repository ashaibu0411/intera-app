import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, KeyboardAvoidingView, Platform, Modal, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  X,
  ImagePlus,
  Video,
  MapPin,
  Send,
  FileText,
  ShoppingBag,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Lock,
  Globe,
  DollarSign,
  Tag,
  Check,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useStore, MOCK_COMMUNITIES, MARKETPLACE_CATEGORIES, EVENT_CATEGORIES } from '@/lib/store';
import { router, useLocalSearchParams } from 'expo-router';
import { createPost as createDbPost, uploadImages, uploadVideo } from '@/lib/posts';
import { createMarketplaceListing } from '@/lib/marketplace-api';
import { createEvent } from '@/lib/marketplace-api';
import { sendRemotePushAlert } from '@/lib/pushAlerts';
import { aiPostCopilot } from '@/lib/aiPostCopilot';
import { aiModerateContent } from '@/lib/aiModerateContent';
import { moderateText } from '@/lib/contentModeration';
import {
  POST_INTENT_CHIPS,
  STARTER_PROMPTS_FOR_POSTS,
  CONNECT_ICEBREAKERS,
  getPostingAudienceLabel,
  applyIntentPrefix,
  type PostIntentId,
} from '@/lib/socialConnectHelpers';
import { fetchOpenConnectOptIn, setOpenConnectOptIn } from '@/lib/openConnectMembership';

type CreateMode = 'select' | 'post' | 'sell' | 'event';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function normParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default function CreateScreen() {
  const params = useLocalSearchParams<{
    returnTo?: string | string[];
    openPost?: string | string[];
    preIntent?: string | string[];
    icebreakerId?: string | string[];
  }>();
  const returnTo = normParam(params.returnTo);
  const openPost = normParam(params.openPost);
  const preIntent = normParam(params.preIntent);
  const icebreakerId = normParam(params.icebreakerId);
  const [mode, setMode] = useState<CreateMode>('select');
  const [postAsBusinessId, setPostAsBusinessId] = useState<string | null>(null);
  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);
  const currentCommunity = useStore((s) => s.currentCommunity);
  const userBusinesses = useStore((s) => s.userBusinesses);

  useEffect(() => {
    if (openPost === '1') setMode('post');
  }, [openPost]);

  const displayCommunity = currentCommunity ?? MOCK_COMMUNITIES[0];

  const exitTo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const target = typeof returnTo === 'string' && returnTo.trim().length > 0 ? returnTo : '/community';
    router.replace(target as any);
  };

  // Check if user is logged in
  if (!currentUser || isGuest) {
    return (
      <View className="flex-1 bg-cream">
        <SafeAreaView edges={['top']} className="flex-1 justify-center items-center px-6">
          <Animated.View entering={FadeIn.duration(400)} className="items-center">
            <Pressable
              onPress={exitTo}
              className="self-start mb-6 bg-white rounded-full p-2 shadow-sm"
              style={{ position: 'absolute', top: -6, left: -6 }}
            >
              <ChevronLeft size={22} color="#2D1F1A" />
            </Pressable>
            <View className="bg-terracotta-100 rounded-full p-6 mb-6">
              <FileText size={48} color="#D4673A" />
            </View>
            <Text className="text-2xl font-bold text-warmBrown text-center mb-2">
              Sign In to Create
            </Text>
            <Text className="text-gray-500 text-center mb-8">
              Join Intera to post updates, sell items, and create events for your community.
            </Text>
            <Pressable onPress={() => router.push('/signup')}>
              <LinearGradient
                colors={['#D4673A', '#B85430']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32 }}
              >
                <Text className="text-white font-bold text-lg">Sign Up or Log In</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode('select');
  };

  if (mode === 'select') {
    return (
      <CreateSelectScreen
        onSelect={setMode}
        onClose={exitTo}
        user={currentUser}
        businesses={userBusinesses}
        postAsBusinessId={postAsBusinessId}
        setPostAsBusinessId={setPostAsBusinessId}
      />
    );
  }

  if (mode === 'post') {
    const business =
      postAsBusinessId ? userBusinesses.find((b) => b.id === postAsBusinessId) : null;
    return (
      <CreatePostForm
        user={currentUser}
        community={displayCommunity}
        onBack={handleBack}
        business={business || null}
        returnTo={returnTo}
        preIntentFromDeepLink={preIntent}
        icebreakerIdFromParams={icebreakerId}
        fromOpenConnectFlow={openPost === '1'}
      />
    );
  }

  if (mode === 'sell') {
    return (
      <CreateListingForm
        user={currentUser}
        community={displayCommunity}
        onBack={handleBack}
        returnTo={returnTo}
      />
    );
  }

  if (mode === 'event') {
    return (
      <CreateEventForm
        user={currentUser}
        community={displayCommunity}
        onBack={handleBack}
        returnTo={returnTo}
      />
    );
  }

  return null;
}

// Selection Screen
function CreateSelectScreen({
  onSelect,
  onClose,
  user,
  businesses,
  postAsBusinessId,
  setPostAsBusinessId,
}: {
  onSelect: (mode: CreateMode) => void;
  onClose: () => void;
  user: any;
  businesses: any[];
  postAsBusinessId: string | null;
  setPostAsBusinessId: (id: string | null) => void;
}) {
  const options = [
    {
      id: 'post',
      icon: FileText,
      title: 'Create Post',
      description: 'Share updates, ask questions, or connect with your community',
      colors: ['#D4673A', '#B85430'],
    },
    {
      id: 'sell',
      icon: ShoppingBag,
      title: 'Sell an Item',
      description: 'List products, crafts, or services in the marketplace',
      colors: ['#1B4D3E', '#153D31'],
    },
    {
      id: 'event',
      icon: Calendar,
      title: 'Create Event',
      description: 'Host gatherings, meetups, or celebrations',
      colors: ['#C9A227', '#A6841F'],
    },
  ];

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-4">
          <View className="flex-row items-center">
            <Pressable
              onPress={onClose}
              className="bg-white rounded-full p-2 shadow-sm mr-3"
            >
              <ChevronLeft size={22} color="#2D1F1A" />
            </Pressable>
            <View>
              <Text className="text-2xl font-bold text-warmBrown">Create</Text>
              <Text className="text-gray-500 mt-1">What would you like to share today?</Text>
            </View>
          </View>
        </Animated.View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {/* User Info */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="flex-row items-center mb-6">
            <Image
              source={{ uri: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face' }}
              style={{ width: 50, height: 50, borderRadius: 25 }}
              contentFit="cover"
            />
            <View className="ml-3">
              <Text className="text-warmBrown font-semibold text-lg">{user.name}</Text>
              <Text className="text-gray-500 text-sm">
                {postAsBusinessId
                  ? `Posting as ${businesses.find((b) => b.id === postAsBusinessId)?.name || 'your business'}`
                  : 'Posting as yourself'}
              </Text>
            </View>
          </Animated.View>

          {/* Post identity */}
          {Array.isArray(businesses) && businesses.length > 0 && (
            <Animated.View entering={FadeInUp.duration(400).delay(140)} className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
              <Text className="text-warmBrown font-semibold">Post identity</Text>
              <Text className="text-gray-500 text-sm mt-1">
                If you’re making a business announcement, you can post under your business name.
              </Text>
              <View className="flex-row mt-3">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPostAsBusinessId(null);
                  }}
                  className={`flex-1 rounded-xl py-3 items-center mr-2 ${postAsBusinessId ? 'bg-gray-100' : 'bg-forest-600'}`}
                >
                  <Text className={`${postAsBusinessId ? 'text-gray-700' : 'text-white'} font-semibold`}>Personal</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPostAsBusinessId(businesses[0]?.id || null);
                  }}
                  className={`flex-1 rounded-xl py-3 items-center ml-2 ${postAsBusinessId ? 'bg-forest-600' : 'bg-gray-100'}`}
                >
                  <Text className={`${postAsBusinessId ? 'text-white' : 'text-gray-700'} font-semibold`}>Business</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}

          {/* Options */}
          {options.map((option, index) => (
            <Animated.View
              key={option.id}
              entering={FadeInUp.duration(400).delay(200 + index * 100)}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onSelect(option.id as CreateMode);
                }}
                className="mb-4"
              >
                <LinearGradient
                  colors={option.colors as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 20, padding: 20 }}
                >
                  <View className="flex-row items-center">
                    <View className="bg-white/20 rounded-full p-4">
                      <option.icon size={28} color="#FFFFFF" />
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="text-white font-bold text-lg">{option.title}</Text>
                      <Text className="text-white/80 text-sm mt-1">{option.description}</Text>
                    </View>
                    <ChevronRight size={24} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Post Form
function CreatePostForm({
  user,
  community,
  onBack,
  business,
  returnTo,
  preIntentFromDeepLink,
  icebreakerIdFromParams,
  fromOpenConnectFlow,
}: {
  user: any;
  community: any;
  onBack: () => void;
  business: any | null;
  returnTo?: string;
  preIntentFromDeepLink?: string;
  icebreakerIdFromParams?: string;
  fromOpenConnectFlow?: boolean;
}) {
  const [content, setContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [sendPushToArea, setSendPushToArea] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNotes, setAiNotes] = useState<string[]>([]);
  const [postIntent, setPostIntent] = useState<PostIntentId | null>(null);
  const buttonScale = useSharedValue(1);
  const addPost = useStore((s) => s.addPost);
  const feedFilter = useStore((s) => s.feedFilter);
  const selectedLocation = useStore((s) => s.selectedLocation);

  const audienceLabel = useMemo(
    () =>
      getPostingAudienceLabel(
        feedFilter as 'global' | 'city' | 'neighborhood',
        selectedLocation,
        community?.city || 'your area'
      ),
    [feedFilter, selectedLocation, community?.city]
  );

  useEffect(() => {
    if (
      preIntentFromDeepLink &&
      POST_INTENT_CHIPS.some((c) => c.id === preIntentFromDeepLink)
    ) {
      setPostIntent(preIntentFromDeepLink as PostIntentId);
    }
  }, [preIntentFromDeepLink]);

  useEffect(() => {
    if (!icebreakerIdFromParams) return;
    const line = CONNECT_ICEBREAKERS.find((b) => b.id === icebreakerIdFromParams);
    if (line) {
      setPostIntent('nearby');
      setContent(line.text);
    }
  }, [icebreakerIdFromParams]);

  const runCopilot = async (mode: 'rewrite' | 'shorten' | 'expand') => {
    if (!content.trim() || aiBusy) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAiBusy(true);
    setAiNotes([]);
    try {
      const state = useStore.getState();
      const selectedLocation = state.selectedLocation;
      const cityLabel = [selectedLocation?.city, selectedLocation?.country].filter(Boolean).join(', ');
      const res = await aiPostCopilot({
        text: content.trim(),
        mode,
        profile: {
          cityLabel: cityLabel || undefined,
          isNewArrival: !!state.currentUser?.isNewArrival,
          arrivalCity: state.currentUser?.arrivalCity,
        },
      });
      if (res?.text) setContent(res.text);
      if (Array.isArray(res?.safety_notes) && res.safety_notes.length) setAiNotes(res.safety_notes.slice(0, 3));
    } catch (e: any) {
      console.log('[CreatePost] AI copilot error:', e);
      setAiNotes(['AI assist failed — try again in a moment.']);
    } finally {
      setAiBusy(false);
    }
  };

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...newImages].slice(0, 4));
    }
  };

  const handlePickVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      let uri = asset.uri;

      // iOS can return ph:// URIs which Video (expo-av) can't play.
      // Prefer localUri when available via MediaLibrary.
      if (asset.assetId) {
        try {
          const info = await MediaLibrary.getAssetInfoAsync(asset.assetId);
          uri = info.localUri || info.uri || uri;
        } catch (e) {
          // ignore, fall back to asset.uri
        }
      }

      // Ensure we have a stable file:// URI for playback + uploads (best-effort)
      if (uri && !uri.startsWith('file://')) {
        try {
          const ext = uri.split('.').pop()?.toLowerCase() || 'mp4';
          const dest = `${FileSystem.cacheDirectory}picked_${Date.now()}.${ext}`;
          await FileSystem.copyAsync({ from: uri, to: dest });
          uri = dest;
        } catch (e) {
          // ignore, some URIs can't be copied
        }
      }

      setSelectedVideo(uri);
      // Clear images if video is selected (can't have both)
      setSelectedImages([]);
    }
  };

  const removeImage = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVideo(null);
  };

  const handlePost = async () => {
    // Allow posting if there's content, video, or images
    if (!content.trim() && !selectedVideo && selectedImages.length === 0) return;

    const bodyText = applyIntentPrefix(postIntent, content.trim());
    const formattedContent =
      business?.name ? `🏪 ${business.name}\n\n${bodyText}` : bodyText;
    const markConnectPost = postIntent === 'nearby' || !!fromOpenConnectFlow;

    if (markConnectPost) {
      let opted = await fetchOpenConnectOptIn(user.id);
      if (!opted) {
        const join = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Join Open to connect',
            'Connect posts are only shown to people in your area who joined Open to connect. Join to post to this community.',
            [
              { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Join & post', onPress: () => resolve(true) },
            ]
          );
        });
        if (!join) return;
        const jr = await setOpenConnectOptIn(user.id, true);
        if (!jr.ok) {
          Alert.alert('Could not join', jr.error || 'Try again from Settings.');
          return;
        }
      }
    }

    // Moderation gate (local fast filter + AI check) - only if there's text content
    if (formattedContent.trim()) {
      try {
        const local = moderateText(formattedContent);
        if (local.action === 'blocked') {
          Alert.alert('Cannot post this', local.message || 'This content violates our community guidelines.');
          return;
        }
        const ai = await aiModerateContent({ text: formattedContent, context: 'post' });
        if (ai.action === 'block') {
          Alert.alert('Cannot post this', ai.reasons?.[0] || 'This content violates our community guidelines.');
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
      } catch (e) {
        // If moderation is down, don't block posting.
        console.log('[CreatePost] Moderation skipped:', e);
      }
    }

    let postId = `post_${Date.now()}`;
    let savedToDb = false;

    const storeState = useStore.getState();
    const selectedLocation = storeState.selectedLocation;
    const feedFilter = storeState.feedFilter;
    const city = selectedLocation?.city || community.city;
    const country = selectedLocation?.country || 'Unknown';
    const adminArea = selectedLocation?.state || null;
    const neighborhood = selectedLocation?.neighborhood?.trim() || null;
    const postLocationLabel = neighborhood
      ? `${city}, ${adminArea || country} · ${neighborhood}`
      : `${city}, ${adminArea || country}`;
    const scope =
      feedFilter === 'global' ? 'global' : feedFilter === 'neighborhood' && neighborhood ? 'neighborhood' : 'city';

    // Upload images to cloud storage first
    let uploadedImageUrls: string[] = [];
    if (selectedImages.length > 0) {
      try {
        uploadedImageUrls = (await uploadImages(selectedImages, user.id)).filter((u) =>
          typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://'))
        );
      } catch (uploadError) {
        console.log('[CreatePost] Image upload failed:', uploadError);
        uploadedImageUrls = [];
      }
    }

    // Upload video (optional)
    let uploadedVideoUrl: string | null = null;
    if (selectedVideo) {
      try {
        const url = await uploadVideo(selectedVideo, user.id);
        uploadedVideoUrl = url && (url.startsWith('http://') || url.startsWith('https://')) ? url : null;
      } catch (uploadError) {
        console.log('Video upload failed:', uploadError);
        uploadedVideoUrl = null;
      }
    }

    // If user selected media, require successful upload so the community can actually view it.
    if (selectedImages.length > 0 && uploadedImageUrls.length === 0) {
      Alert.alert('Upload failed', 'Your photos could not be uploaded. Please try again.');
      return;
    }
    if (selectedVideo && !uploadedVideoUrl) {
      Alert.alert('Upload failed', 'Your video could not be uploaded. Please try again.');
      return;
    }

    // Try to save to database first (so other users can see it)
    try {
      const communityIdForDb =
        typeof community?.id === 'string' && community.id !== 'custom' ? community.id : undefined;
      const markConnectPost =
        postIntent === 'nearby' || !!fromOpenConnectFlow;

      const connectNotifyAudience =
        feedFilter === 'global'
          ? 'global'
          : feedFilter === 'neighborhood' && neighborhood
            ? 'neighborhood'
            : 'city';

      const dbPost = await createDbPost(
        user.id,
        formattedContent,
        uploadedImageUrls,
        postLocationLabel,
        communityIdForDb,
        uploadedVideoUrl,
        markConnectPost
          ? {
              connectPost: true,
              notifyAudience: connectNotifyAudience,
              pushCity: city || null,
              pushNeighborhood: neighborhood || null,
              pushCountry: country || null,
            }
          : undefined
      );
      if (dbPost?.id) {
        postId = dbPost.id;
        savedToDb = true;
      }
    } catch (dbError) {
      console.log('Database save failed, will save locally:', dbError);
    }

    // Only save to local store if database save failed
    // This prevents duplicates when database save succeeds
    if (!savedToDb) {
      const newPost = {
        id: postId,
        author: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
          bio: user.bio || '',
          location: user.location || community.city,
          interests: user.interests || [],
          joinedDate: user.joinedDate || new Date().toISOString(),
        },
        content: formattedContent,
        images: uploadedImageUrls.length > 0 ? uploadedImageUrls : selectedImages,
        video: selectedVideo ?? undefined,
        likes: 0,
        comments: 0,
        createdAt: new Date().toISOString(),
        isLiked: false,
        location: postLocationLabel,
        connectPost: markConnectPost || undefined,
      };

      addPost(newPost);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Optional true remote push to neighborhood/city (best for urgent posts)
    // Always send city-wide for business/faith/association posts (public org announcements)
    const shouldAutoNotifyNeighborhood = scope === 'neighborhood';
    const isFromOrganization = !!business;
    if (sendPushToArea || shouldAutoNotifyNeighborhood || (isFromOrganization && city)) {
      sendRemotePushAlert({
        title: isFromOrganization ? `${business?.name ?? user.name} posted` : `${user.name} posted`,
        body: formattedContent.length > 100 ? formattedContent.substring(0, 100) + '...' : formattedContent,
        scope: isFromOrganization && city ? 'city' : (scope as any),
        city: city || undefined,
        neighborhood: isFromOrganization ? null : neighborhood,
        excludeUserId: user.id,
        data: { type: 'post', postId },
      }).catch(() => {});
    }

    const target =
      typeof returnTo === 'string' && returnTo.trim().length > 0 ? returnTo : '/community';
    router.replace(target as any);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const canPost = content.trim().length > 0 || selectedVideo !== null || selectedImages.length > 0;

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100"
        >
          <Pressable onPress={onBack} className="p-2 -ml-2">
            <X size={24} color="#2D1F1A" />
          </Pressable>

          <Text className="text-lg font-bold text-warmBrown">New Post</Text>

          <AnimatedPressable
            style={buttonAnimatedStyle}
            onPress={handlePost}
            onPressIn={() => { buttonScale.value = withSpring(0.95); }}
            onPressOut={() => { buttonScale.value = withSpring(1); }}
            disabled={!canPost}
          >
            <LinearGradient
              colors={canPost ? ['#D4673A', '#B85430'] : ['#D1D5DB', '#9CA3AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}
            >
              <Send size={16} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">Post</Text>
            </LinearGradient>
          </AnimatedPressable>
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
            {/* User Info */}
            <View className="flex-row items-center px-5 py-4">
              <Image
                source={{ uri: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face' }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
                contentFit="cover"
              />
              <View className="ml-3">
                <Text className="text-warmBrown font-semibold">{user.name}</Text>
                <View className="flex-row items-center mt-0.5">
                  <MapPin size={12} color="#8B7355" />
                  <Text className="text-sm text-gray-500 ml-1">{community.city}</Text>
                </View>
              </View>
            </View>

            <View className="px-5 pb-3">
              <Text className="text-xs text-gray-500 uppercase tracking-wide">Posting to</Text>
              <Text className="text-warmBrown font-semibold mt-1">{audienceLabel}</Text>
            </View>

            <View className="px-5 pb-3">
              <Text className="text-xs text-gray-500 uppercase tracking-wide mb-2">What kind of post?</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPostIntent(null);
                  }}
                  className={`px-4 py-2 rounded-full border ${postIntent === null ? 'bg-forest-600 border-forest-600' : 'bg-white border-gray-200'}`}
                >
                  <Text className={postIntent === null ? 'text-white font-semibold' : 'text-gray-600'}>None</Text>
                </Pressable>
                {POST_INTENT_CHIPS.map((chip) => (
                  <Pressable
                    key={chip.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setPostIntent(chip.id);
                    }}
                    className={`px-4 py-2 rounded-full border ${
                      postIntent === chip.id ? 'bg-forest-600 border-forest-600' : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text className={postIntent === chip.id ? 'text-white font-semibold' : 'text-gray-600'}>
                      {chip.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View className="px-5 pb-3">
              <Text className="text-xs text-gray-500 uppercase tracking-wide mb-2">Starter ideas (tap to add)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
                {STARTER_PROMPTS_FOR_POSTS.map((prompt, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setContent((prev) => (prev.trim() ? `${prev.trim()}\n\n${prompt}` : prompt));
                    }}
                    className="max-w-[280px] bg-amber-50 border border-amber-200 rounded-2xl px-3 py-2"
                  >
                    <Text className="text-amber-900 text-sm leading-5">{prompt}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View className="px-5 pb-2">
              <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-warmBrown font-semibold">Send push notification</Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      Turn on only for urgent neighborhood/city updates.
                    </Text>
                  </View>
                  <Switch
                    value={sendPushToArea}
                    onValueChange={setSendPushToArea}
                    trackColor={{ false: '#D1D5DB', true: '#EF4444' }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            </View>

            {/* Text Input */}
            <View className="px-5">
              <TextInput
                placeholder="What's happening in your community?"
                placeholderTextColor="#9CA3AF"
                multiline
                value={content}
                onChangeText={setContent}
                className="text-warmBrown text-lg leading-7 min-h-[150px]"
                style={{ textAlignVertical: 'top' }}
                autoFocus
              />
            </View>

            {/* AI Post Copilot */}
            <View className="px-5 pt-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-gray-500 text-sm">AI Assist</Text>
                {aiBusy ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="#10B981" />
                    <Text className="text-gray-500 text-sm ml-2">Rewriting…</Text>
                  </View>
                ) : null}
              </View>
              <View className="flex-row mt-2">
                <Pressable
                  onPress={() => runCopilot('rewrite')}
                  disabled={!content.trim() || aiBusy}
                  className={`px-4 py-2 rounded-full mr-2 ${!content.trim() || aiBusy ? 'bg-gray-100' : 'bg-emerald-50'}`}
                >
                  <Text className={`${!content.trim() || aiBusy ? 'text-gray-400' : 'text-emerald-700'} font-semibold`}>
                    Polish
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => runCopilot('shorten')}
                  disabled={!content.trim() || aiBusy}
                  className={`px-4 py-2 rounded-full mr-2 ${!content.trim() || aiBusy ? 'bg-gray-100' : 'bg-emerald-50'}`}
                >
                  <Text className={`${!content.trim() || aiBusy ? 'text-gray-400' : 'text-emerald-700'} font-semibold`}>
                    Shorten
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => runCopilot('expand')}
                  disabled={!content.trim() || aiBusy}
                  className={`px-4 py-2 rounded-full ${!content.trim() || aiBusy ? 'bg-gray-100' : 'bg-emerald-50'}`}
                >
                  <Text className={`${!content.trim() || aiBusy ? 'text-gray-400' : 'text-emerald-700'} font-semibold`}>
                    Expand
                  </Text>
                </Pressable>
              </View>
              {aiNotes.length ? (
                <View className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-3">
                  <Text className="text-amber-900 font-semibold text-xs">NOTES</Text>
                  {aiNotes.map((n, i) => (
                    <Text key={i} className="text-amber-800 mt-1">
                      • {n}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Selected Images */}
            {selectedImages.length > 0 && (
              <View className="px-5 pb-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                  {selectedImages.map((uri, index) => (
                    <View key={index} className="mr-3 relative">
                      <Image source={{ uri }} style={{ width: 120, height: 120, borderRadius: 12 }} contentFit="cover" />
                      <Pressable onPress={() => removeImage(index)} className="absolute -top-2 -right-2 bg-warmBrown rounded-full p-1.5">
                        <X size={14} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Selected Video */}
            {selectedVideo && (
              <View className="px-5 pb-4">
                <View className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ height: 200 }}>
                  <View className="flex-1 items-center justify-center">
                    <View className="bg-white/20 rounded-full p-4">
                      <Video size={32} color="#FFFFFF" />
                    </View>
                    <Text className="text-white/80 mt-2 text-sm">Video selected</Text>
                  </View>
                  <Pressable onPress={removeVideo} className="absolute top-2 right-2 bg-warmBrown rounded-full p-1.5">
                    <X size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Bottom Actions */}
          <View className="px-5 py-4 border-t border-gray-100 bg-white">
            <View className="flex-row items-center">
              <Pressable
                onPress={handlePickImage}
                disabled={!!selectedVideo}
                className={`flex-row items-center rounded-full px-4 py-2.5 ${selectedVideo ? 'bg-gray-100' : 'bg-terracotta-50'}`}
              >
                <ImagePlus size={20} color={selectedVideo ? '#9CA3AF' : '#D4673A'} />
                <Text className={`font-medium ml-2 ${selectedVideo ? 'text-gray-400' : 'text-terracotta-500'}`}>Photo</Text>
              </Pressable>
              <Pressable
                onPress={handlePickVideo}
                disabled={selectedImages.length > 0}
                className={`flex-row items-center rounded-full px-4 py-2.5 ml-2 ${selectedImages.length > 0 ? 'bg-gray-100' : 'bg-forest-50'}`}
              >
                <Video size={20} color={selectedImages.length > 0 ? '#9CA3AF' : '#1B4D3E'} />
                <Text className={`font-medium ml-2 ${selectedImages.length > 0 ? 'text-gray-400' : 'text-forest-700'}`}>Video</Text>
              </Pressable>
              <View className="flex-1" />
              <Text className="text-gray-400 text-sm">{content.length}/500</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// Sell Item Form
function CreateListingForm({
  user,
  community,
  onBack,
  returnTo,
}: {
  user: any;
  community: any;
  onBack: () => void;
  returnTo?: string;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<'new' | 'used' | 'refurbished'>('new');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const addMarketplaceListing = useStore((s) => s.addMarketplaceListing);

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 6,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...newImages].slice(0, 6));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !price || !category || selectedImages.length === 0) return;

    setSubmitting(true);
    try {
      // Upload images first
      const uploadedUrls = (await uploadImages(selectedImages, user.id)).filter(
        (u) => typeof u === 'string' && (u.startsWith('http://') || u.startsWith('https://'))
      );

      if (uploadedUrls.length === 0) {
        Alert.alert('Upload failed', 'Your photos could not be uploaded. Please try again.');
        return;
      }

      const city = useStore.getState().selectedLocation?.city || community?.city || '';
      const listing = await createMarketplaceListing(user.id, {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price) || 0,
        currency: 'USD',
        images: uploadedUrls,
        category,
        condition,
        location: city || community?.city,
        isStoreBased: false,
        storeName: undefined,
      });

      // Also add to local store for immediate UI update
      addMarketplaceListing({
        id: listing.id,
        seller: {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
          bio: user.bio || '',
          location: user.location || community.city,
          interests: user.interests || [],
          joinedDate: user.joinedDate || new Date().toISOString(),
        },
        title: listing.title,
        description: listing.description,
        price: String(listing.price),
        currency: 'USD',
        images: listing.images || uploadedUrls,
        category: listing.category,
        condition: listing.condition,
        location: listing.location || community.city,
        isStoreBased: false,
        storeName: undefined,
        createdAt: listing.created_at || new Date().toISOString(),
        views: 0,
      });

      // Notify all app users in same city
      if (city) {
        sendRemotePushAlert({
          title: 'New item for sale',
          body: `${user.name} listed "${title.trim()}" for $${price}`,
          scope: 'city',
          city,
          neighborhood: null,
          excludeUserId: user.id,
          type: 'new_listing',
          actorId: user.id,
          data: { type: 'new_listing', listingId: listing.id },
        }).catch(() => {});
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigate to marketplace so user sees their listing
      router.replace('/marketplace' as any);
    } catch (e: any) {
      Alert.alert('Could not list item', String(e?.message ?? e ?? 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = title.trim().length > 0 && price.length > 0 && category.length > 0 && selectedImages.length > 0;

  return (
    <View className="flex-1 bg-cream">
      {/* Full-screen loading overlay when submitting */}
      {submitting && (
        <View
          className="absolute inset-0 z-50 bg-black/40 items-center justify-center"
          pointerEvents="box-only"
        >
          <View className="bg-white rounded-2xl px-8 py-6 items-center">
            <ActivityIndicator size="large" color="#1B4D3E" />
            <Text className="text-warmBrown font-semibold mt-3">Listing your item...</Text>
          </View>
        </View>
      )}
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
          <Pressable onPress={onBack} className="p-2 -ml-2">
            <X size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="text-lg font-bold text-warmBrown">Sell an Item</Text>
          <Pressable onPress={handleSubmit} disabled={!canSubmit || submitting}>
            <LinearGradient
              colors={canSubmit && !submitting ? ['#1B4D3E', '#153D31'] : ['#D1D5DB', '#9CA3AF']}
              style={{ borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold">List Item</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {/* Images */}
            <View className="py-4">
              <Text className="text-warmBrown font-semibold mb-3">Photos</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                <Pressable onPress={handlePickImage} className="w-24 h-24 bg-gray-100 rounded-xl items-center justify-center mr-3 border-2 border-dashed border-gray-300">
                  <ImagePlus size={28} color="#9CA3AF" />
                  <Text className="text-gray-400 text-xs mt-1">Add</Text>
                </Pressable>
                {selectedImages.map((uri, index) => (
                  <View key={index} className="mr-3 relative bg-gray-100 rounded-xl">
                    <Image source={{ uri }} style={{ width: 96, height: 96, borderRadius: 12 }} contentFit="contain" />
                    <Pressable onPress={() => setSelectedImages((prev) => prev.filter((_, i) => i !== index))} className="absolute -top-2 -right-2 bg-warmBrown rounded-full p-1">
                      <X size={12} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Title */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Title</Text>
              <TextInput
                placeholder="What are you selling?"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                className="bg-white rounded-xl px-4 py-3.5 text-warmBrown"
              />
            </View>

            {/* Price */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Price</Text>
              <View className="flex-row items-center bg-white rounded-xl px-4">
                <DollarSign size={20} color="#8B7355" />
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                  className="flex-1 py-3.5 ml-2 text-warmBrown"
                />
              </View>
            </View>

            {/* Category */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Category</Text>
              <Pressable onPress={() => setShowCategoryModal(true)} className="bg-white rounded-xl px-4 py-3.5 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Tag size={20} color="#8B7355" />
                  <Text className={`ml-2 ${category ? 'text-warmBrown' : 'text-gray-400'}`}>
                    {category || 'Select category'}
                  </Text>
                </View>
                <ChevronRight size={20} color="#8B7355" />
              </Pressable>
            </View>

            {/* Condition */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Condition</Text>
              <View className="flex-row">
                {(['new', 'used', 'refurbished'] as const).map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCondition(c); }}
                    className={`flex-1 py-3 rounded-xl mr-2 last:mr-0 ${condition === c ? 'bg-forest-600' : 'bg-white'}`}
                  >
                    <Text className={`text-center font-medium capitalize ${condition === c ? 'text-white' : 'text-warmBrown'}`}>{c}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Description</Text>
              <TextInput
                placeholder="Describe your item..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={description}
                onChangeText={setDescription}
                className="bg-white rounded-xl px-4 py-3.5 text-warmBrown min-h-[100px]"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Category Modal */}
        <Modal visible={showCategoryModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl max-h-[70%]">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">Select Category</Text>
                <Pressable onPress={() => setShowCategoryModal(false)}>
                  <X size={24} color="#2D1F1A" />
                </Pressable>
              </View>
              <ScrollView className="px-5 py-2">
                {MARKETPLACE_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => { setCategory(cat); setShowCategoryModal(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    className="flex-row items-center py-4 border-b border-gray-100"
                  >
                    <Text className="flex-1 text-warmBrown">{cat}</Text>
                    {category === cat && <Check size={20} color="#1B4D3E" />}
                  </Pressable>
                ))}
                <View className="h-8" />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

// Event Form
function CreateEventForm({
  user,
  community,
  onBack,
  returnTo,
}: {
  user: any;
  community: any;
  onBack: () => void;
  returnTo?: string;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [reach, setReach] = useState<'city' | 'nearby' | 'global'>('city');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setEventImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !date || !time || !address.trim()) return;

    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (eventImage && !eventImage.startsWith('http')) {
        const urls = await uploadImages([eventImage], user.id);
        imageUrl = urls.find((u) => typeof u === 'string' && u.startsWith('http')) ?? undefined;
      }

      const city = useStore.getState().selectedLocation?.city || community?.city || '';

      const event = await createEvent(user.id, {
        title: title.trim(),
        description: description.trim(),
        date: date.trim(),
        time: time.trim(),
        location: city || address,
        address: address.trim(),
        image: imageUrl,
        category: category || 'General',
        isPublic,
        scope: reach,
      });

      // Notify all app users in same city
      if (city) {
        sendRemotePushAlert({
          title: 'New event',
          body: `${user.name} created "${title.trim()}"${address ? ` at ${address.slice(0, 50)}` : ''}`,
          scope: 'city',
          city,
          neighborhood: null,
          excludeUserId: user.id,
          type: 'new_event',
          actorId: user.id,
          data: { type: 'new_event', eventId: event.id },
        }).catch(() => {});
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const target = typeof returnTo === 'string' && returnTo.trim().length > 0 ? returnTo : '/community';
      router.replace(target as any);
    } catch (e: any) {
      Alert.alert('Could not create event', String(e?.message ?? e));
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = title.trim().length > 0 && date.length > 0 && time.length > 0 && address.trim().length > 0;

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
          <Pressable onPress={onBack} className="p-2 -ml-2">
            <X size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="text-lg font-bold text-warmBrown">Create Event</Text>
          <Pressable onPress={handleSubmit} disabled={!canSubmit || submitting}>
            <LinearGradient
              colors={canSubmit && !submitting ? ['#C9A227', '#A6841F'] : ['#D1D5DB', '#9CA3AF']}
              style={{ borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Create</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {/* Event Image */}
            <View className="py-4">
              <Text className="text-warmBrown font-semibold mb-3">Event Flyer / Cover (optional)</Text>
              <Pressable onPress={handlePickImage}>
                {eventImage ? (
                  <View className="relative bg-gray-100 rounded-2xl" style={{ minHeight: 200 }}>
                    <Image source={{ uri: eventImage }} style={{ width: '100%', height: 240, borderRadius: 16 }} contentFit="contain" />
                    <Pressable onPress={() => setEventImage(null)} className="absolute top-2 right-2 bg-warmBrown rounded-full p-2">
                      <X size={16} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ) : (
                  <View className="w-full h-[180px] bg-gray-100 rounded-2xl items-center justify-center border-2 border-dashed border-gray-300">
                    <ImagePlus size={40} color="#9CA3AF" />
                    <Text className="text-gray-400 mt-2">Add event cover image</Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Reach */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-3">Event Reach</Text>
              <View className="bg-white rounded-xl p-4">
                <Text className="text-gray-500 text-sm mb-3">
                  Choose where this event should appear in Events.
                </Text>
                <View className="flex-row">
                  {[
                    { key: 'city', label: 'This city' },
                    { key: 'nearby', label: 'Nearby cities' },
                    { key: 'global', label: 'Global' },
                  ].map((opt) => {
                    const active = reach === (opt.key as any);
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setReach(opt.key as any); }}
                        className={`flex-1 py-3 rounded-xl ${active ? 'bg-forest-600' : 'bg-gray-100'} ${opt.key === 'city' ? 'mr-2' : opt.key === 'nearby' ? 'mx-2' : 'ml-2'}`}
                      >
                        <Text className={`text-center font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Title */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Event Title</Text>
              <TextInput
                placeholder="Give your event a name"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                className="bg-white rounded-xl px-4 py-3.5 text-warmBrown"
              />
            </View>

            {/* Date & Time */}
            <View className="flex-row mb-4">
              <View className="flex-1 mr-2">
                <Text className="text-warmBrown font-semibold mb-2">Date</Text>
                <View className="flex-row items-center bg-white rounded-xl px-4">
                  <Calendar size={20} color="#8B7355" />
                  <TextInput
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                    value={date}
                    onChangeText={setDate}
                    className="flex-1 py-3.5 ml-2 text-warmBrown"
                  />
                </View>
              </View>
              <View className="flex-1 ml-2">
                <Text className="text-warmBrown font-semibold mb-2">Time</Text>
                <View className="flex-row items-center bg-white rounded-xl px-4">
                  <Clock size={20} color="#8B7355" />
                  <TextInput
                    placeholder="HH:MM"
                    placeholderTextColor="#9CA3AF"
                    value={time}
                    onChangeText={setTime}
                    className="flex-1 py-3.5 ml-2 text-warmBrown"
                  />
                </View>
              </View>
            </View>

            {/* Address */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Location</Text>
              <View className="flex-row items-center bg-white rounded-xl px-4">
                <MapPin size={20} color="#8B7355" />
                <TextInput
                  placeholder="Event address"
                  placeholderTextColor="#9CA3AF"
                  value={address}
                  onChangeText={setAddress}
                  className="flex-1 py-3.5 ml-2 text-warmBrown"
                />
              </View>
            </View>

            {/* Category */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Category</Text>
              <Pressable onPress={() => setShowCategoryModal(true)} className="bg-white rounded-xl px-4 py-3.5 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Tag size={20} color="#8B7355" />
                  <Text className={`ml-2 ${category ? 'text-warmBrown' : 'text-gray-400'}`}>
                    {category || 'Select category'}
                  </Text>
                </View>
                <ChevronRight size={20} color="#8B7355" />
              </Pressable>
            </View>

            {/* Public/Private Toggle */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-3">Event Visibility</Text>
              <View className="bg-white rounded-xl p-4">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-forest-100 rounded-full p-2 mr-3">
                      <Globe size={20} color="#1B4D3E" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-warmBrown font-medium">Public Event</Text>
                      <Text className="text-gray-500 text-sm">Anyone can see and RSVP</Text>
                    </View>
                  </View>
                  <Switch
                    value={isPublic}
                    onValueChange={setIsPublic}
                    trackColor={{ false: '#D1D5DB', true: '#1B4D3E' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                {!isPublic && (
                  <View className="flex-row items-center bg-gold-50 rounded-xl p-3">
                    <Lock size={16} color="#C9A227" />
                    <Text className="text-gold-700 text-sm ml-2 flex-1">
                      Only people you invite can see this event
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Description</Text>
              <TextInput
                placeholder="Tell people about your event..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={description}
                onChangeText={setDescription}
                className="bg-white rounded-xl px-4 py-3.5 text-warmBrown min-h-[100px]"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            {/* RSVP Info */}
            <View className="bg-terracotta-50 rounded-xl p-4 mb-6">
              <View className="flex-row items-center">
                <Users size={20} color="#D4673A" />
                <Text className="text-terracotta-600 font-medium ml-2">RSVP Enabled</Text>
              </View>
              <Text className="text-terracotta-500 text-sm mt-1">
                Community members can RSVP to your event once it's published
              </Text>
            </View>

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Category Modal */}
        <Modal visible={showCategoryModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl max-h-[70%]">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">Event Category</Text>
                <Pressable onPress={() => setShowCategoryModal(false)}>
                  <X size={24} color="#2D1F1A" />
                </Pressable>
              </View>
              <ScrollView className="px-5 py-2">
                {EVENT_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => { setCategory(cat); setShowCategoryModal(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    className="flex-row items-center py-4 border-b border-gray-100"
                  >
                    <Text className="flex-1 text-warmBrown">{cat}</Text>
                    {category === cat && <Check size={20} color="#C9A227" />}
                  </Pressable>
                ))}
                <View className="h-8" />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
