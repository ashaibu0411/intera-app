import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  MapPin,
  ChevronDown,
  Globe,
  Users,
  ChevronRight,
  UserPlus,
  MessageCircle,
  Bell,
  Search,
  Plus,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

// Components
import { PostCard } from '@/components/PostCard';
import { LocationChangeModal } from '@/components/LocationChangeModal';
import { DailyRewardsBanner } from '@/components/DailyRewardsBanner';
import { DailyRewardsModal } from '@/components/DailyRewardsModal';
import { StoryAvatar } from '@/components/StoryAvatar';
import { ArrivalModeBanner } from '@/components/ArrivalModeBanner';
import { CommunityPresence } from '@/components/CommunityPresence';
import { LocalPulse } from '@/components/LocalPulse';
import { MemoryLayer } from '@/components/MemoryLayer';
import { ActiveConversations } from '@/components/ActiveConversations';
import { QuickPostPrompts } from '@/components/QuickPostPrompts';
import { WeatherSignal } from '@/components/WeatherSignal';

// Store & Utils
import { useStore, MOCK_POSTS, MOCK_COMMUNITIES, type Post, type UserStory, getCommunityMemberCount } from '@/lib/store';
import { getCommunityByLocation, subscribeToCommunityUpdates, getOrCreateCommunity, joinCommunity } from '@/lib/communities';
import { DbCommunity } from '@/lib/supabase';
import { getPosts } from '@/lib/posts';
import { detectCurrentLocation, isLocationDifferent, type DetectedLocation } from '@/lib/locationDetection';
import { getCurrentUser } from '@/lib/auth';
import { useUnreadMessages } from '@/lib/useUnreadMessages';

// Global posts for worldwide feed
const GLOBAL_MOCK_POSTS = [
  {
    id: 'global_1',
    author: {
      id: 'g1',
      name: 'Fatou Diop',
      username: 'fatoudiop',
      avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
      bio: 'Fashion designer from Dakar',
      location: 'London, UK',
      interests: ['Fashion', 'Art'],
      joinedDate: '2024-01-10',
    },
    content: 'Just launched my new African-inspired fashion collection in London! So grateful for the support from the diaspora community here.',
    images: ['https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=600&fit=crop'],
    likes: 89,
    comments: 34,
    createdAt: '2024-12-30T08:00:00Z',
    isLiked: false,
    location: 'London, UK',
  },
  {
    id: 'global_2',
    author: {
      id: 'g2',
      name: 'Kofi Mensah',
      username: 'kofimensah',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
      bio: 'Tech entrepreneur in Accra',
      location: 'Accra, Ghana',
      interests: ['Tech', 'Startups'],
      joinedDate: '2024-02-15',
    },
    content: 'Exciting news! Our fintech startup just secured funding to expand across West Africa. The future of African tech is bright!',
    images: [],
    likes: 156,
    comments: 42,
    createdAt: '2024-12-29T14:00:00Z',
    isLiked: true,
    location: 'Accra, Ghana',
  },
  {
    id: 'global_3',
    author: {
      id: 'g3',
      name: 'Amina Hassan',
      username: 'aminahassan',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
      bio: 'Chef and food blogger',
      location: 'Toronto, Canada',
      interests: ['Food', 'Culture'],
      joinedDate: '2024-03-20',
    },
    content: 'Hosting a Somali cooking class this weekend in Toronto! Teaching how to make authentic sambusa and bariis. DM if interested!',
    images: ['https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&h=600&fit=crop'],
    likes: 67,
    comments: 28,
    createdAt: '2024-12-28T16:00:00Z',
    isLiked: false,
    location: 'Toronto, Canada',
  },
];

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [realCommunity, setRealCommunity] = useState<DbCommunity | null>(null);
  const [dbPosts, setDbPosts] = useState<Post[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation | null>(null);
  const [showDailyRewards, setShowDailyRewards] = useState(false);
  const [currentUser, setCurrentUser] = useState<{id: string; avatar?: string} | null>(null);

  const selectedLocation = useStore((s) => s.selectedLocation);
  const userPosts = useStore((s) => s.userPosts);
  const isGuest = useStore((s) => s.isGuest);
  const userStories = useStore((s) => s.userStories);
  const feedFilter = useStore((s) => s.feedFilter);
  const setFeedFilter = useStore((s) => s.setFeedFilter);
  const blockedUserIds = useStore((s) => s.blockedUserIds);
  const hasSeenStory = useStore((s) => s.hasSeenStory);

  const { unreadCount, refetch: refetchUnread } = useUnreadMessages();

  // Redirect first-time users to the story screen
  useEffect(() => {
    if (!hasSeenStory) {
      router.replace('/story');
    }
  }, [hasSeenStory]);

  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
  }, []);

  // Refetch unread count when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetchUnread();
    }, [refetchUnread])
  );

  const displayCommunity = useMemo(() => {
    if (selectedLocation) {
      return {
        city: selectedLocation.city,
        country: selectedLocation.country,
        state: selectedLocation.state,
      };
    }
    return MOCK_COMMUNITIES[0];
  }, [selectedLocation]);

  const communityMemberCount = useMemo(() => {
    return getCommunityMemberCount(displayCommunity.city);
  }, [displayCommunity.city]);

  const memberCount = realCommunity?.member_count || communityMemberCount;

  const fetchCommunity = async () => {
    try {
      const community = await getCommunityByLocation(
        displayCommunity.city,
        displayCommunity.country
      );
      setRealCommunity(community);
    } catch (error) {
      console.log('Using mock community data');
    }
  };

  const fetchDbPosts = async () => {
    try {
      const posts = await getPosts();
      setDbPosts(posts);
    } catch (error) {
      console.log('Using mock posts');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCommunity();
      fetchDbPosts();

      const unsubscribe = subscribeToCommunityUpdates(
        displayCommunity.city,
        (community: DbCommunity) => setRealCommunity(community)
      );
      return () => unsubscribe();
    }, [displayCommunity.city])
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
    const combined = [...userPosts, ...dbPosts, ...MOCK_POSTS];
    const uniquePosts = combined.filter(
      (post, index, self) => index === self.findIndex((p) => p.id === post.id)
    );

    const nonBlockedPosts = uniquePosts.filter(
      (post) => !blockedUserIds.includes(post.author.id)
    );

    if (feedFilter === 'local') {
      const userCity = selectedLocation?.city || displayCommunity.city;
      const localPosts = nonBlockedPosts.filter(post => {
        const isDbPost = dbPosts.some(dbPost => dbPost.id === post.id);
        if (isDbPost) return true;
        const isUserPost = userPosts.some(userPost => userPost.id === post.id);
        if (isUserPost) return true;
        if (!post.location) return true;
        return post.location.toLowerCase().includes(userCity.toLowerCase());
      });
      return localPosts.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      const filteredGlobalPosts = GLOBAL_MOCK_POSTS.filter(
        (post) => !blockedUserIds.includes(post.author.id)
      );
      return [...nonBlockedPosts, ...filteredGlobalPosts].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  }, [userPosts, dbPosts, feedFilter, selectedLocation, displayCommunity.city, blockedUserIds]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([fetchDbPosts(), fetchCommunity()]);
    setRefreshing(false);
  };

  const handleToggleFilter = (filter: 'local' | 'global') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeedFilter(filter);
  };

  const navigateTo = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as never);
  };

  const LOGO_IMAGE = require('../../../assets/icon.png');

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Clean Header */}
        <View className="px-4 py-2 bg-white border-b border-gray-100">
          <View className="flex-row items-center justify-between">
            {/* Logo & Location */}
            <Pressable
              onPress={() => navigateTo('/location-select')}
              className="flex-row items-center"
            >
              <Image
                source={LOGO_IMAGE}
                style={{ width: 32, height: 32, borderRadius: 8 }}
                contentFit="cover"
              />
              <View className="ml-2">
                <View className="flex-row items-center">
                  <Text className="text-lg font-bold text-gray-900">
                    {displayCommunity.city}
                  </Text>
                  <ChevronDown size={18} color="#374151" />
                </View>
              </View>
            </Pressable>

            {/* Actions */}
            <View className="flex-row items-center gap-1">
              <Pressable
                onPress={() => navigateTo('/app-search')}
                className="w-10 h-10 items-center justify-center"
              >
                <Search size={24} color="#374151" />
              </Pressable>
              <Pressable
                onPress={() => navigateTo('/notifications')}
                className="w-10 h-10 items-center justify-center"
              >
                <Bell size={24} color="#374151" />
              </Pressable>
              <Pressable
                onPress={() => navigateTo('/messages')}
                className="w-10 h-10 items-center justify-center"
              >
                <MessageCircle size={24} color="#374151" />
                {unreadCount > 0 && (
                  <View className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* Community Presence Feed */}
        <ScrollView
          showsVerticalScrollIndicator={false}
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
                  <Text className="text-xs mt-1 text-gray-600">Your story</Text>
                </Pressable>
              )}

              {userStories
                .filter((story: UserStory) => story.userId !== currentUser?.id && story.stories.length > 0)
                .slice(0, 8)
                .map((userStory: UserStory) => (
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
                      className={`text-xs mt-1 ${userStory.hasUnseenStories ? 'text-gray-900' : 'text-gray-400'}`}
                      numberOfLines={1}
                      style={{ maxWidth: 64 }}
                    >
                      {userStory.userName.split(' ')[0]}
                    </Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>

          {/* Weather Signal - Contextual community weather */}
          <WeatherSignal city={displayCommunity.city} country={displayCommunity.country} />

          {/* Feed Filter Toggle */}
          <View className="flex-row px-4 py-3 gap-2 bg-white border-b border-gray-100">
            <Pressable
              onPress={() => handleToggleFilter('local')}
              className={`flex-row items-center px-4 py-2 rounded-full ${
                feedFilter === 'local' ? 'bg-gray-900' : 'bg-gray-100'
              }`}
            >
              <Users size={16} color={feedFilter === 'local' ? '#fff' : '#6B7280'} />
              <Text className={`ml-2 font-medium text-sm ${
                feedFilter === 'local' ? 'text-white' : 'text-gray-600'
              }`}>
                Local
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleToggleFilter('global')}
              className={`flex-row items-center px-4 py-2 rounded-full ${
                feedFilter === 'global' ? 'bg-gray-900' : 'bg-gray-100'
              }`}
            >
              <Globe size={16} color={feedFilter === 'global' ? '#fff' : '#6B7280'} />
              <Text className={`ml-2 font-medium text-sm ${
                feedFilter === 'global' ? 'text-white' : 'text-gray-600'
              }`}>
                Global
              </Text>
            </Pressable>
          </View>

          {/* === SECTION 1: COMMUNITY PRESENCE === */}
          <CommunityPresence city={displayCommunity.city} memberCount={memberCount} isGlobal={feedFilter === 'global'} />

          {/* === SECTION 2: LOCAL PULSE (What's Happening) === */}
          <LocalPulse city={displayCommunity.city} isGlobal={feedFilter === 'global'} />

          {/* === SECTION 3: QUICK POST PROMPTS === */}
          <View className="mt-4 px-4">
            <Text className="text-sm font-semibold text-gray-500 mb-2">Start a conversation</Text>
          </View>
          <QuickPostPrompts />

          {/* === SECTION 4: ACTIVE CONVERSATIONS === */}
          <ActiveConversations city={displayCommunity.city} isGlobal={feedFilter === 'global'} />

          {/* === SECTION 5: MEMORY LAYER - Only show on local feed */}
          {feedFilter === 'local' && <MemoryLayer city={displayCommunity.city} />}

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
                  <Text className="text-gray-500 text-sm">{memberCount.toLocaleString()} members in {displayCommunity.city}</Text>
                </View>
                <ChevronRight size={20} color="#D97706" />
              </View>
            </Pressable>
          )}

          {/* Daily Rewards */}
          <DailyRewardsBanner onPress={() => setShowDailyRewards(true)} />

          {/* Arrival Mode Banner */}
          <ArrivalModeBanner />

          {/* === SECTION 6: RECENT POSTS === */}
          <View className="mt-6 px-4 mb-2">
            <Text className="text-base font-bold text-gray-900">Recent Posts</Text>
            <Text className="text-xs text-gray-500">From your community</Text>
          </View>

          <View>
            {allPosts.length > 0 ? (
              allPosts.slice(0, 10).map((post, index) => (
                <Animated.View
                  key={post.id}
                  entering={FadeInUp.duration(300).delay(index * 30)}
                >
                  <PostCard post={post} />
                </Animated.View>
              ))
            ) : (
              <View className="mx-4 py-16 items-center">
                <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                  <Users size={28} color="#9CA3AF" />
                </View>
                <Text className="text-gray-900 font-semibold text-lg">No posts yet</Text>
                <Text className="text-gray-500 text-center mt-1 px-8">
                  Be the first to share something with your community
                </Text>
                <Pressable
                  onPress={() => navigateTo('/(tabs)/create')}
                  className="mt-4 bg-gray-900 px-6 py-3 rounded-full"
                >
                  <Text className="text-white font-semibold">Create Post</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View className="h-24" />
        </ScrollView>

        {/* Floating Create Button */}
        <Pressable
          onPress={() => navigateTo('/(tabs)/create')}
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

      <DailyRewardsModal
        visible={showDailyRewards}
        onClose={() => setShowDailyRewards(false)}
      />
    </View>
  );
}
