import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  ChevronDown,
  Users,
  ChevronRight,
  UserPlus,
  MessageCircle,
  Bell,
  Search,
  Plus,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

// Components
import { LocationChangeModal } from '@/components/LocationChangeModal';
import { StoryAvatar } from '@/components/StoryAvatar';

// Store & Utils
import { useStore, type Post, type UserStory } from '@/lib/store';
import { getCommunityByLocation, subscribeToCommunityUpdates, getOrCreateCommunity, joinCommunity } from '@/lib/communities';
import { DbCommunity } from '@/lib/supabase';
import { getPosts, isConnectStylePost } from '@/lib/posts';
import { subscribeToPostInserts } from '@/lib/postsRealtime';
import { detectCurrentLocation, isLocationDifferent, type DetectedLocation } from '@/lib/locationDetection';
import { getCurrentUser } from '@/lib/auth';
import { useUnreadMessages } from '@/lib/useUnreadMessages';
import { useUnreadNotifications } from '@/lib/useUnreadNotifications';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [realCommunity, setRealCommunity] = useState<DbCommunity | null>(null);
  const [dbPosts, setDbPosts] = useState<Post[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation | null>(null);
  const [currentUser, setCurrentUser] = useState<{id: string; avatar?: string} | null>(null);
  const [showStickyActions, setShowStickyActions] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const selectedLocation = useStore((s) => s.selectedLocation);
  const userPosts = useStore((s) => s.userPosts);
  const isGuest = useStore((s) => s.isGuest);
  const userStories = useStore((s) => s.userStories);
  const blockedUserIds = useStore((s) => s.blockedUserIds);

  const { unreadCount, refetch: refetchUnread } = useUnreadMessages();
  const { unreadCount: notificationsUnreadCount, refetch: refetchNotifications } = useUnreadNotifications();

  const otherStories = useMemo(() => {
    return userStories
      .filter((story: UserStory) => story.userId !== currentUser?.id && story.stories.length > 0)
      .slice(0, 8);
  }, [currentUser?.id, userStories]);

  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);

  // Refetch unread counts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchUnread();
      refetchNotifications();
    }, [refetchUnread, refetchNotifications])
  );

  const displayCommunity = useMemo(() => {
    if (selectedLocation) {
      return {
        city: selectedLocation.city,
        country: selectedLocation.country,
        state: selectedLocation.state,
        neighborhood: selectedLocation.neighborhood,
      };
    }
    return {
      city: 'Community',
      country: '',
      state: '',
      neighborhood: null,
    };
  }, [selectedLocation]);

  const messageOpener = useMemo(() => {
    return `Hey! I’m new in ${displayCommunity.city}—what should I know first?`;
  }, [displayCommunity.city]);

  const messageNearbyRoute = useMemo(() => {
    return `/search?category=online&intent=message&prefill=${encodeURIComponent(messageOpener)}`;
  }, [messageOpener]);

  const askForHelpRoute = useMemo(() => {
    const placeholder = `I’m new in ${displayCommunity.city}. Looking for...`;
    return `/create?returnTo=${encodeURIComponent('/community')}&promptType=request&placeholder=${encodeURIComponent(placeholder)}`;
  }, [displayCommunity.city]);

  const memberCount = realCommunity?.member_count ?? 0;

  const fetchCommunity = async () => {
    try {
      const community = await getCommunityByLocation(
        displayCommunity.city,
        displayCommunity.country
      );
      setRealCommunity(community);
      return community;
    } catch (error) {
      return null;
    }
  };

  const fetchDbPosts = async (communityId?: string | null) => {
    try {
      const posts = await getPosts(communityId || undefined, 50, { excludeConnect: true });
      setDbPosts(posts);
    } catch (error) {
      setDbPosts([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      let unsubscribe: null | (() => void) = null;
      let unsubscribePosts: null | (() => void) = null;
      let cancelled = false;

      (async () => {
        const community = await fetchCommunity();
        if (cancelled) return;
        await fetchDbPosts(community?.id ?? null);
        if (cancelled) return;
        if (community?.id) {
          unsubscribe = subscribeToCommunityUpdates(community.id, (c: DbCommunity) => setRealCommunity(c));
        }

        unsubscribePosts = subscribeToPostInserts({
          communityId: community?.id ?? null,
          onInsert: () => {
            fetchDbPosts(community?.id ?? null).catch(() => null);
          },
        });
      })().catch(() => null);

      return () => {
        cancelled = true;
        unsubscribe?.();
        unsubscribePosts?.();
      };
    }, [displayCommunity.city, displayCommunity.country])
  );

  useEffect(() => {
    const checkLocationChange = async () => {
      const detected = await detectCurrentLocation();
      if (detected && isLocationDifferent(detected, selectedLocation)) {
        setDetectedLocation(detected);
        setShowLocationModal(true);
      }
    };
    const timeout = setTimeout(checkLocationChange, 3000);
    return () => clearTimeout(timeout);
  }, [displayCommunity.city, selectedLocation]);

  const handleConfirmLocationSwitch = async () => {
    if (!detectedLocation) return;
    const community = await getOrCreateCommunity(
      detectedLocation.city,
      detectedLocation.state || null,
      detectedLocation.country
    );
    if (community && currentUser?.id) {
      await joinCommunity(currentUser.id, community.id);
      useStore.getState().setSelectedLocation({
        country: detectedLocation.country,
        state: detectedLocation.state,
        city: detectedLocation.city,
      });
    }
    setShowLocationModal(false);
    setDetectedLocation(null);
  };

  const handleKeepCurrentLocation = () => {
    setShowLocationModal(false);
    setDetectedLocation(null);
  };

  const handleDismissLocationDetection = () => {
    setShowLocationModal(false);
    setDetectedLocation(null);
  };

  const allPosts = useMemo(() => {
    const combined = [...userPosts, ...dbPosts];
    const uniquePosts = combined.filter(
      (post, index, self) => index === self.findIndex((p) => p.id === post.id)
    );
    return uniquePosts
      .filter((post) => !blockedUserIds.includes(post.author.id))
      .filter((post) => !isConnectStylePost(post))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [blockedUserIds, dbPosts, userPosts]);

  const postsLast24hCount = useMemo(() => {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    return allPosts.filter((p) => new Date(p.createdAt).getTime() >= since).length;
  }, [allPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const community = await fetchCommunity();
    await fetchDbPosts(community?.id ?? null);
    setRefreshing(false);
  };

  const navigateTo = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as never);
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Clean Header */}
        <View className="px-4 py-2 bg-cream border-b border-cream">
          <View className="flex-row items-center justify-between">
            {/* Logo & Location */}
            <Pressable
              onPress={() => navigateTo('/location-select')}
              className="flex-row items-center"
            >
              <Image
                source={{ uri: '/icon.png' }}
                style={{ width: 32, height: 32, borderRadius: 8 }}
                contentFit="cover"
              />
              <View className="ml-2">
                <View className="flex-row items-center">
                  <Text className="text-xl font-bold text-warmBrown">
                    {displayCommunity.city}
                  </Text>
                  <ChevronDown size={18} color="#374151" />
                </View>
                <Text className="text-xs text-gray-500 -mt-0.5">Your people are here.</Text>
              </View>
            </Pressable>

            {/* Actions */}
            <View className="flex-row items-center gap-1">
              <Pressable
                onPress={() => navigateTo('/app-search')}
                className="w-10 h-10 items-center justify-center"
              >
                <Search size={24} color="#2D1F1A" />
              </Pressable>
              <Pressable
                onPress={() => navigateTo('/notifications')}
                className="w-10 h-10 items-center justify-center relative"
              >
                <Bell size={24} color="#2D1F1A" />
                {notificationsUnreadCount > 0 && (
                  <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-terracotta-500 rounded-full border-2 border-white items-center justify-center px-1">
                    <Text className="text-white text-[10px] font-bold leading-none">
                      {notificationsUnreadCount > 99 ? '99+' : notificationsUnreadCount.toString()}
                    </Text>
                  </View>
                )}
              </Pressable>
              <Pressable
                onPress={() => navigateTo('/messages')}
                className="w-10 h-10 items-center justify-center relative"
              >
                <MessageCircle size={24} color="#2D1F1A" />
                {unreadCount > 0 && (
                  <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white items-center justify-center px-1">
                    <Text className="text-white text-[10px] font-bold leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount.toString()}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* Community Presence Feed */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const y = e.nativeEvent.contentOffset.y;
            // After the user scrolls past the intro area, keep the 3 core actions in reach.
            setShowStickyActions(y > 220);
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#D4673A"
              colors={['#D4673A']}
            />
          }
        >
          {/* Stories Row */}
          <View className="bg-white border-b border-gray-100 py-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12 }}
            >
              {currentUser && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const myStories = userStories.find((s: UserStory) => s.userId === currentUser.id);
                    if (myStories && myStories.stories.length > 0) {
                      router.push({
                        pathname: '/stories',
                        params: { userId: currentUser.id },
                      });
                    } else {
                      router.push('/stories');
                    }
                  }}
                  className="items-center mr-4"
                >
                  <View className="relative">
                    <StoryAvatar
                      userId={currentUser.id}
                      avatarUrl={currentUser.avatar}
                      size={64}
                      isCurrentUser={true}
                    />
                  </View>
                  <Text className="text-sm mt-1 text-gray-600">Your story</Text>
                </Pressable>
              )}

              {otherStories.map((userStory: UserStory) => (
                  <Pressable
                    key={userStory.userId}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({
                        pathname: '/stories',
                        params: { userId: userStory.userId },
                      });
                    }}
                    className="items-center mr-4"
                  >
                    <StoryAvatar
                      userId={userStory.userId}
                      avatarUrl={userStory.userAvatar}
                      size={64}
                      showRing={true}
                    />
                    <Text
                      className={`text-sm mt-1 ${userStory.hasUnseenStories ? 'text-gray-900' : 'text-gray-400'}`}
                      numberOfLines={1}
                      style={{ maxWidth: 64 }}
                    >
                      {userStory.userName.split(' ')[0]}
                    </Text>
                  </Pressable>
                ))}

              {otherStories.length === 0 && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (!currentUser) {
                      router.push('/signup');
                      return;
                    }
                    router.push('/stories');
                  }}
                  className="mr-4"
                >
                  <View className="h-[82px] w-[150px] rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 justify-center">
                    <View className="flex-row items-center">
                      <View className="w-9 h-9 rounded-xl bg-white border border-gray-200 items-center justify-center">
                        <Plus size={18} color="#D4673A" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-warmBrown font-bold text-sm">
                          {currentUser ? 'Post a status' : 'Sign in'}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={2}>
                          {currentUser ? 'Be the first to share today.' : 'Post and watch community updates.'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              )}
            </ScrollView>
          </View>

          {/* Community Assistant shortcut */}
          <View className="px-4 pt-4">
            <Pressable
              onPress={() => navigateTo('/community-assistant')}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16 }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="bg-white/20 rounded-full p-3">
                      <Sparkles size={20} color="#FFFFFF" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-white font-bold text-base">Ask Intera</Text>
                      <Text className="text-white/85 text-xs mt-0.5">
                        Get community-backed answers in seconds
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={22} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Community updates entry point */}
          <View className="px-4 pt-4">
            <Pressable
              onPress={() => navigateTo('/community-updates')}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <LinearGradient
                colors={['#111827', '#1F2937']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 16 }}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-white font-bold text-base">See what the community is posting</Text>
                    <Text className="text-white/80 text-xs mt-0.5">
                      Photos, videos, questions, and updates.
                    </Text>
                  </View>
                  <ChevronRight size={22} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Guest Sign Up Banner */}
          {(isGuest || !currentUser) && (
            <Pressable
              onPress={() => navigateTo('/signup')}
              className="mx-4 mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-amber-500 items-center justify-center">
                  <UserPlus size={20} color="#fff" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-900 font-semibold">Join the community</Text>
                  <Text className="text-gray-500 text-base">{memberCount.toLocaleString()} members in {displayCommunity.city}</Text>
                </View>
                <ChevronRight size={20} color="#D97706" />
              </View>
            </Pressable>
          )}

          {/* Trending today (keeps hub lightweight) */}
          <View className="px-4 mt-6">
            <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <Pressable
                onPress={() => navigateTo('/community-updates')}
                className="flex-row items-center justify-between"
              >
                <View className="flex-1 pr-3">
                  <Text className="text-warmBrown font-bold text-lg">Trending today</Text>
                  <Text className="text-gray-500 mt-1">
                    {postsLast24hCount > 0
                      ? `${postsLast24hCount} post${postsLast24hCount === 1 ? '' : 's'} in the last 24 hours`
                      : 'No posts in the last 24 hours yet'}
                  </Text>
                </View>
                <ChevronRight size={20} color="#D4673A" />
              </Pressable>

              <View className="flex-row gap-2 mt-4">
                <Pressable
                  onPress={() => navigateTo('/community-updates')}
                  className="flex-1 bg-gray-900 rounded-full py-2.5 items-center"
                >
                  <Text className="text-white font-semibold">Open updates</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    navigateTo(`/create?returnTo=${encodeURIComponent('/community-updates')}`);
                  }}
                  className="flex-1 bg-gray-100 rounded-full py-2.5 items-center"
                >
                  <Text className="text-gray-800 font-semibold">Create post</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View className="h-24" />
        </ScrollView>

        {/* Floating Create Button */}
        <Pressable
          onPress={() => navigateTo(`/create?returnTo=${encodeURIComponent('/community')}`)}
          className="absolute bottom-6 right-6"
          style={{
            shadowColor: '#D4673A',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <LinearGradient
            colors={['#D4673A', '#B85530']}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Plus size={28} color="#fff" strokeWidth={2.5} />
          </LinearGradient>
        </Pressable>

        {/* Sticky Core Actions */}
        {showStickyActions && (
          <View className="absolute left-0 right-0" style={{ top: 64 }}>
            <View className="mx-4 bg-white rounded-2xl border border-gray-100 shadow-sm px-3 py-2">
              <View className="flex-row items-center gap-2">
                <Pressable
                  onPress={() => navigateTo(messageNearbyRoute)}
                  className="flex-1 bg-gray-900 rounded-full py-2.5 items-center"
                >
                  <Text className="text-white font-semibold">Message</Text>
                </Pressable>
                <Pressable
                  onPress={() => navigateTo(askForHelpRoute)}
                  className="flex-1 bg-gray-100 rounded-full py-2.5 items-center"
                >
                  <Text className="text-gray-800 font-semibold">Ask</Text>
                </Pressable>
                <Pressable
                  onPress={() => navigateTo('/events')}
                  className="flex-1 bg-gray-100 rounded-full py-2.5 items-center"
                >
                  <Text className="text-gray-800 font-semibold">Plans</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>

      {/* Modals */}
      <LocationChangeModal
        visible={showLocationModal}
        detectedCity={detectedLocation?.city ?? ''}
        detectedCountry={detectedLocation?.country ?? ''}
        currentCity={displayCommunity.city}
        currentCountry={displayCommunity.country}
        onConfirm={handleConfirmLocationSwitch}
        onKeepCurrent={handleKeepCurrentLocation}
        onDismiss={handleDismissLocationDetection}
      />
    </View>
  );
}
