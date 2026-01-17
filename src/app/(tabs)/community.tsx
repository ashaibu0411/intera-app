import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
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
  Heart,
  Store,
  UserCheck,
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
import { useStore as useAppStore } from '@/lib/store';

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
  const [showStickyActions, setShowStickyActions] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const selectedLocation = useStore((s) => s.selectedLocation);
  const userPosts = useStore((s) => s.userPosts);
  const isGuest = useStore((s) => s.isGuest);
  const userStories = useStore((s) => s.userStories);
  const feedFilter = useStore((s) => s.feedFilter);
  const setFeedFilter = useStore((s) => s.setFeedFilter);
  const blockedUserIds = useStore((s) => s.blockedUserIds);

  const { unreadCount, refetch: refetchUnread } = useUnreadMessages();
  const notificationsUnreadCount = useAppStore((s) => (s.notifications ?? []).filter((n) => !n.read).length);

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
        neighborhood: selectedLocation.neighborhood,
      };
    }
    return MOCK_COMMUNITIES[0];
  }, [selectedLocation]);

  const messageOpener = useMemo(() => {
    return `Hey! I’m new in ${displayCommunity.city}—what should I know first?`;
  }, [displayCommunity.city]);

  const messageNearbyRoute = useMemo(() => {
    return `/search?category=online&intent=message&prefill=${encodeURIComponent(messageOpener)}`;
  }, [messageOpener]);

  const askForHelpRoute = useMemo(() => {
    const placeholder = `I’m new in ${displayCommunity.city}. Looking for...`;
    return `/create?promptType=request&placeholder=${encodeURIComponent(placeholder)}`;
  }, [displayCommunity.city]);

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
      return community;
    } catch (error) {
      console.log('Using mock community data');
      return null;
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

      let unsubscribe: null | (() => void) = null;
      fetchCommunity().then((community) => {
        if (community?.id) {
          unsubscribe = subscribeToCommunityUpdates(community.id, (c: DbCommunity) => setRealCommunity(c));
        }
      });

      return () => {
        unsubscribe?.();
      };
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

    if (feedFilter === 'neighborhood' || feedFilter === 'city') {
      const userCity = selectedLocation?.city || displayCommunity.city;
      const userNeighborhood = selectedLocation?.neighborhood?.trim();

      const localPosts = nonBlockedPosts.filter((post) => {
        const isDbPost = dbPosts.some(dbPost => dbPost.id === post.id);
        if (isDbPost) return true;
        const isUserPost = userPosts.some(userPost => userPost.id === post.id);
        if (isUserPost) return true;
        if (!post.location) return true;

        const locLower = post.location.toLowerCase();
        const cityMatch = locLower.includes(userCity.toLowerCase());
        if (feedFilter === 'city') return cityMatch;

        // Neighborhood view includes both neighborhood + city content (never empty)
        if (!userNeighborhood) return cityMatch;
        const neighLower = userNeighborhood.toLowerCase();
        const neighMatch = locLower.includes(neighLower);
        return neighMatch || cityMatch;
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

  const handleToggleFilter = (filter: 'neighborhood' | 'city' | 'global') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeedFilter(filter);
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
                source={{ uri: '/image-1768608072.png' }}
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
                      className={`text-sm mt-1 ${userStory.hasUnseenStories ? 'text-gray-900' : 'text-gray-400'}`}
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
          <View className="flex-row px-4 py-3 gap-2 bg-cream">
            <Pressable
              onPress={() => handleToggleFilter('neighborhood')}
              className={`flex-row items-center px-4 py-2 rounded-full ${
                feedFilter === 'neighborhood' ? 'bg-warmBrown' : 'bg-white'
              }`}
            >
              <MapPin size={16} color={feedFilter === 'neighborhood' ? '#fff' : '#6B7280'} />
              <Text className={`ml-2 font-medium text-base ${
                feedFilter === 'neighborhood' ? 'text-white' : 'text-gray-600'
              }`}>
                Neighborhood
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleToggleFilter('city')}
              className={`flex-row items-center px-4 py-2 rounded-full ${
                feedFilter === 'city' ? 'bg-warmBrown' : 'bg-white'
              }`}
            >
              <Users size={16} color={feedFilter === 'city' ? '#fff' : '#6B7280'} />
              <Text className={`ml-2 font-medium text-base ${
                feedFilter === 'city' ? 'text-white' : 'text-gray-600'
              }`}>
                City
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleToggleFilter('global')}
              className={`flex-row items-center px-4 py-2 rounded-full ${
                feedFilter === 'global' ? 'bg-warmBrown' : 'bg-white'
              }`}
            >
              <Globe size={16} color={feedFilter === 'global' ? '#fff' : '#6B7280'} />
              <Text className={`ml-2 font-medium text-base ${
                feedFilter === 'global' ? 'text-white' : 'text-gray-600'
              }`}>
                Global
              </Text>
            </Pressable>
          </View>

          <View className="px-4 pb-3 bg-cream">
            <Text className="text-xs text-gray-500">
              Neighborhood: hyper-local • City: near you • Global: diaspora highlights
            </Text>
          </View>

          {/* Welcome Home - Core Actions */}
          <View className="mx-4 mt-4">
            <LinearGradient
              colors={['#1B4D3E', '#153D31']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, overflow: 'hidden' }}
            >
              <View className="p-5">
                <Text className="text-white text-2xl font-bold">Welcome home.</Text>
                <Text className="text-white/85 text-base mt-1">
                  Meet neighbors. Get help. Build community.
                </Text>

                <Pressable
                  onPress={() => navigateTo(messageNearbyRoute)}
                  className="mt-4"
                >
                  <View className="bg-white/15 border border-white/20 rounded-2xl px-4 py-4">
                    <Text className="text-white text-base font-semibold">Message someone nearby</Text>
                    <Text className="text-white/70 text-sm mt-0.5">
                      We’ll show people active right now.
                    </Text>
                  </View>
                </Pressable>

                <View className="flex-row gap-3 mt-3">
                  <Pressable onPress={() => navigateTo(askForHelpRoute)} className="flex-1">
                    <View className="bg-white rounded-2xl px-4 py-3">
                      <Text className="text-forest-900 font-semibold">Ask for help</Text>
                      <Text className="text-gray-500 text-xs mt-0.5">Your community shows up.</Text>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => navigateTo('/events')} className="flex-1">
                    <View className="bg-white rounded-2xl px-4 py-3">
                      <Text className="text-forest-900 font-semibold">Join a plan</Text>
                      <Text className="text-gray-500 text-xs mt-0.5">Food, rides, events.</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Quick links (makes key areas less “hidden”) */}
          <View className="mx-4 mt-3">
            <View className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
              <Text className="text-xs text-gray-500 mb-2">QUICK LINKS</Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => navigateTo('/faith-community')}
                  className="flex-1 bg-amber-50 rounded-xl px-3 py-3 flex-row items-center"
                >
                  <View className="w-9 h-9 rounded-full bg-amber-500 items-center justify-center">
                    <Heart size={18} color="#fff" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-900 font-semibold" numberOfLines={1}>Faith</Text>
                    <Text className="text-gray-600 text-xs" numberOfLines={1}>Communities & events</Text>
                  </View>
                  <ChevronRight size={18} color="#D97706" />
                </Pressable>

                <Pressable
                  onPress={() => navigateTo('/business-directory')}
                  className="flex-1 bg-emerald-50 rounded-xl px-3 py-3 flex-row items-center"
                >
                  <View className="w-9 h-9 rounded-full bg-emerald-600 items-center justify-center">
                    <Store size={18} color="#fff" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-900 font-semibold" numberOfLines={1}>Businesses</Text>
                    <Text className="text-gray-600 text-xs" numberOfLines={1}>Directory & bookings</Text>
                  </View>
                  <ChevronRight size={18} color="#059669" />
                </Pressable>
              </View>

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => navigateTo('/trusted-providers')}
                  className="flex-1 bg-forest-50 rounded-xl px-3 py-3 flex-row items-center"
                >
                  <View className="w-9 h-9 rounded-full bg-forest-700 items-center justify-center">
                    <UserCheck size={18} color="#fff" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-900 font-semibold" numberOfLines={1}>Trusted helpers</Text>
                    <Text className="text-gray-600 text-xs" numberOfLines={1}>Cooks, house helps, plumbers</Text>
                  </View>
                  <ChevronRight size={18} color="#1B4D3E" />
                </Pressable>
              </View>
            </View>
          </View>

          {/* === SECTION 1: COMMUNITY PRESENCE === */}
          <CommunityPresence city={displayCommunity.city} memberCount={memberCount} isGlobal={feedFilter === 'global'} />

          {/* === SECTION 2: LOCAL PULSE (What's Happening) === */}
          <LocalPulse city={displayCommunity.city} isGlobal={feedFilter === 'global'} />

          {/* === SECTION 3: ASK FOR HELP / START HERE === */}
          <View className="mt-5 px-4">
            <Text className="text-lg font-bold text-gray-900">What do you need?</Text>
            <Text className="text-sm text-gray-500 mt-0.5">Ask clearly—your people will respond.</Text>
            <Text className="text-xs text-gray-400 mt-1">Tip: add your neighborhood + timing (today/this week).</Text>
          </View>
          <QuickPostPrompts />

          {/* === SECTION 4: COMMUNITY TALK === */}
          <ActiveConversations city={displayCommunity.city} isGlobal={feedFilter === 'global'} />

          {/* === SECTION 5: COMMUNITY MOMENTS - only on neighborhood/city feeds */}
          {(feedFilter === 'neighborhood' || feedFilter === 'city') && <MemoryLayer city={displayCommunity.city} />}

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

          {/* Daily Rewards */}
          <DailyRewardsBanner onPress={() => setShowDailyRewards(true)} />

          {/* Arrival Mode Banner */}
          <ArrivalModeBanner />

          {/* === SECTION 6: RECENT POSTS === */}
          <View className="mt-6 px-4 mb-2">
            <Text className="text-lg font-bold text-gray-900">Community updates</Text>
            <Text className="text-sm text-gray-500">From neighbors in {displayCommunity.city}</Text>
          </View>

          <View className="px-4 mb-3">
            <Text className="text-xs text-gray-400 text-center">
              Respect is the vibe. We’re neighbors here.
            </Text>
          </View>

          <View>
            {allPosts.length > 0 ? (
              allPosts.slice(0, 8).map((post, index) => (
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
                <Text className="text-gray-900 font-semibold text-xl">Start the energy.</Text>
                <Text className="text-gray-500 text-center mt-1 px-8 text-base">
                  Introduce yourself, ask a question, or invite people out—{displayCommunity.city} will answer.
                </Text>
                <Pressable
                  onPress={() => navigateTo('/create')}
                  className="mt-4 bg-gray-900 px-6 py-3 rounded-full"
                >
                  <Text className="text-white font-semibold">Post to {displayCommunity.city}</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View className="h-24" />
        </ScrollView>

        {/* Floating Create Button */}
        <Pressable
          onPress={() => navigateTo('/create')}
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

      <DailyRewardsModal
        visible={showDailyRewards}
        onClose={() => setShowDailyRewards(false)}
      />
    </View>
  );
}
