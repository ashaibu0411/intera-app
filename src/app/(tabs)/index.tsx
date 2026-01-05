import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  MapPin,
  ChevronDown,
  Globe,
  Users,
  GraduationCap,
  ChevronRight,
  ShoppingBag,
  Heart,
  UserPlus,
  MessageCircle,
  Briefcase,
  Newspaper,
  Shield,
  Vote,
  PiggyBank,
  Mic,
  BookOpen,
  AlertTriangle,
  HeartHandshake,
  Trophy,
  Calendar,
  DollarSign,
  FileText,
  Utensils,
  Film,
  Clapperboard,
  SplitSquareVertical,
  Radio,
  Gem,
  Sparkles,
  Bell,
  Search,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn, useSharedValue, useAnimatedStyle, withSpring, interpolate, Extrapolation } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { PostCard } from '@/components/PostCard';
import { NewsCard } from '@/components/NewsCard';
import { LocationChangeModal } from '@/components/LocationChangeModal';
import { DailyRewardsBanner } from '@/components/DailyRewardsBanner';
import { DailyRewardsModal } from '@/components/DailyRewardsModal';
import { useStore, MOCK_POSTS, MOCK_COMMUNITIES, type Post, type NewsArticle, getCommunityMemberCount } from '@/lib/store';
import { getCommunityByLocation, subscribeToCommunityUpdates, getOrCreateCommunity, joinCommunity } from '@/lib/communities';
import { DbCommunity } from '@/lib/supabase';
import { getPosts } from '@/lib/posts';
import { getLocalNews } from '@/lib/news';
import { detectCurrentLocation, isLocationDifferent, type DetectedLocation } from '@/lib/locationDetection';
import { getCurrentUser } from '@/lib/auth';

// Additional mock posts for global feed from different locations
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
  const [localNews, setLocalNews] = useState<NewsArticle[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<DetectedLocation | null>(null);
  const [showDailyRewards, setShowDailyRewards] = useState(false);

  const feedFilter = useStore((s) => s.feedFilter);
  const setFeedFilter = useStore((s) => s.setFeedFilter);
  const currentCommunity = useStore((s) => s.currentCommunity);
  const isGuest = useStore((s) => s.isGuest);
  const currentUser = useStore((s) => s.currentUser);
  const userPosts = useStore((s) => s.userPosts);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const locationDetectionDismissed = useStore((s) => s.locationDetectionDismissed);
  const lastDetectedCity = useStore((s) => s.lastDetectedCity);
  const setSelectedLocation = useStore((s) => s.setSelectedLocation);
  const setCurrentCommunity = useStore((s) => s.setCurrentCommunity);
  const setLocationDetectionDismissed = useStore((s) => s.setLocationDetectionDismissed);
  const setLastDetectedCity = useStore((s) => s.setLastDetectedCity);
  const joinCommunityStore = useStore((s) => s.joinCommunity);

  const displayCommunity = currentCommunity ?? MOCK_COMMUNITIES[0];
  const communityMemberCount = getCommunityMemberCount(displayCommunity.city);

  // Fetch posts from database
  const fetchDbPosts = async () => {
    try {
      console.log('[Home] Fetching posts from database...');
      const posts = await getPosts();
      console.log('[Home] Fetched posts:', posts?.length || 0);
      if (posts && posts.length > 0) {
        // Convert database posts to app format
        const formattedPosts: Post[] = posts.map((p: any) => ({
          id: p.id,
          author: {
            id: p.author?.id || p.author_id,
            name: p.author?.name || 'Unknown',
            username: p.author?.username || 'unknown',
            avatar: p.author?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face',
            bio: p.author?.bio || '',
            location: p.author?.location || '',
            interests: p.author?.interests || [],
            joinedDate: p.author?.created_at || new Date().toISOString(),
          },
          content: p.content,
          images: p.images || [],
          likes: p.likes?.[0]?.count || 0,
          comments: p.comments?.[0]?.count || 0,
          createdAt: p.created_at,
          isLiked: false,
          location: p.location || '',
        }));
        console.log('[Home] Formatted posts:', formattedPosts.length);
        setDbPosts(formattedPosts);
      }
    } catch (error) {
      console.log('[Home] Error fetching posts from database:', error);
    }
  };

  useEffect(() => {
    fetchDbPosts();
  }, []);

  // Fetch local news
  const fetchNews = async () => {
    try {
      const city = selectedLocation?.city || displayCommunity.city;
      const state = selectedLocation?.state || displayCommunity.state;
      const country = selectedLocation?.country || displayCommunity.country;
      const news = await getLocalNews(city, 4, state, country);
      setLocalNews(news);
    } catch (error) {
      console.log('[Home] Error fetching news:', error);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [selectedLocation, displayCommunity.city]);

  // Join community when user switches cities (increment member count)
  useEffect(() => {
    const city = selectedLocation?.city || displayCommunity.city;
    if (city) {
      joinCommunityStore(city);
    }
  }, [selectedLocation?.city, displayCommunity.city]);

  // Refresh posts when screen comes into focus (e.g., after creating a post)
  useFocusEffect(
    useCallback(() => {
      fetchDbPosts();
    }, [])
  );

  // Fetch real community data from Supabase
  const fetchCommunity = async () => {
    const city = selectedLocation?.city || displayCommunity.city;
    const country = selectedLocation?.country || displayCommunity.country;

    const community = await getCommunityByLocation(city, country);
    if (community) {
      setRealCommunity(community);
    }
  };

  useEffect(() => {
    fetchCommunity();
  }, [selectedLocation, displayCommunity.city, displayCommunity.country]);

  // Detect user's current location and show modal if it changed
  useEffect(() => {
    const checkLocation = async () => {
      // Skip if user dismissed the detection permanently
      if (locationDetectionDismissed) return;

      // Only check if user has a selected location
      if (!selectedLocation) return;

      try {
        const detected = await detectCurrentLocation();
        if (!detected) return;

        console.log('[Home] Detected location:', detected.city, detected.country);

        // Check if detected city is different from current AND from last detected
        const isDifferent = isLocationDifferent(detected, selectedLocation);
        const isSameAsLastDetected = lastDetectedCity?.toLowerCase() === detected.city.toLowerCase();

        if (isDifferent && !isSameAsLastDetected) {
          setDetectedLocation(detected);
          setShowLocationModal(true);
        }
      } catch (error) {
        console.log('[Home] Location detection error:', error);
      }
    };

    // Check location after a short delay to avoid blocking initial render
    const timer = setTimeout(checkLocation, 2000);
    return () => clearTimeout(timer);
  }, [selectedLocation, locationDetectionDismissed, lastDetectedCity]);

  // Handle confirming location switch
  const handleConfirmLocationSwitch = async () => {
    if (!detectedLocation) return;

    setShowLocationModal(false);
    setLastDetectedCity(detectedLocation.city);

    // Update the selected location
    setSelectedLocation({
      country: detectedLocation.country,
      state: detectedLocation.state,
      city: detectedLocation.city,
    });

    // Get or create community for new location
    const dbCommunity = await getOrCreateCommunity(
      detectedLocation.city,
      detectedLocation.state || null,
      detectedLocation.country
    );

    if (dbCommunity) {
      // Join the community if user is logged in
      const user = await getCurrentUser();
      if (user) {
        await joinCommunity(user.id, dbCommunity.id);
      }

      setCurrentCommunity({
        id: dbCommunity.id,
        name: dbCommunity.name,
        city: dbCommunity.city,
        state: dbCommunity.state ?? undefined,
        country: dbCommunity.country,
        memberCount: dbCommunity.member_count,
        image: dbCommunity.image_url || 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=400&h=300&fit=crop',
      });
    } else {
      // Fallback to custom community
      setCurrentCommunity({
        id: 'custom',
        name: `${detectedLocation.city} Expats`,
        city: detectedLocation.city,
        state: detectedLocation.state,
        country: detectedLocation.country,
        memberCount: 1,
        image: 'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?w=400&h=300&fit=crop',
      });
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Handle keeping current location
  const handleKeepCurrentLocation = () => {
    setShowLocationModal(false);
    if (detectedLocation) {
      setLastDetectedCity(detectedLocation.city);
    }
  };

  // Handle dismissing location detection permanently
  const handleDismissLocationDetection = () => {
    setShowLocationModal(false);
    setLocationDetectionDismissed(true);
  };

  // Subscribe to real-time community updates
  useEffect(() => {
    if (!realCommunity?.id) return;

    const unsubscribe = subscribeToCommunityUpdates(realCommunity.id, (updated) => {
      setRealCommunity(updated);
    });

    return () => {
      unsubscribe();
    };
  }, [realCommunity?.id]);

  // Get the member count - use real data if available, otherwise mock
  const memberCount = realCommunity?.member_count ?? displayCommunity.memberCount;

  // Combine user posts with database posts and mock posts, filter based on local/global
  const allPosts = useMemo(() => {
    // Combine all sources, avoiding duplicates by ID
    const postMap = new Map<string, Post>();

    // Add user posts first (highest priority)
    userPosts.forEach(post => postMap.set(post.id, post));

    // Add database posts (from other users)
    dbPosts.forEach(post => {
      if (!postMap.has(post.id)) {
        postMap.set(post.id, post);
      }
    });

    // Add mock posts
    MOCK_POSTS.forEach(post => {
      if (!postMap.has(post.id)) {
        postMap.set(post.id, post);
      }
    });

    const combined = Array.from(postMap.values());

    if (feedFilter === 'local') {
      // Local: Show all database posts + posts matching user's city
      const userCity = selectedLocation?.city || displayCommunity.city;

      // Filter posts that match the local city OR are from the database (community posts)
      const localPosts = combined.filter(post => {
        // Always show posts from database (they're from the community)
        const isDbPost = dbPosts.some(dbPost => dbPost.id === post.id);
        if (isDbPost) return true;

        // Show user's own posts
        const isUserPost = userPosts.some(userPost => userPost.id === post.id);
        if (isUserPost) return true;

        // For mock posts, filter by location
        if (!post.location) return true;
        return post.location.toLowerCase().includes(userCity.toLowerCase());
      });

      return localPosts.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else {
      // Global: Show all posts including from other locations
      return [...combined, ...GLOBAL_MOCK_POSTS].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
  }, [userPosts, dbPosts, feedFilter, selectedLocation, displayCommunity.city]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([
      fetchDbPosts(),
      fetchCommunity(),
      fetchNews(),
    ]);
    setRefreshing(false);
  };

  const toggleFilter = (filter: 'local' | 'global') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeedFilter(filter);
  };

  const navigateTo = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as any);
  };

  // Quick access features - top 6 most important
  const quickFeatures = [
    { route: '/marketplace', icon: ShoppingBag, label: 'Market', colors: ['#D4673A', '#C05A2E'] as const },
    { route: '/job-board', icon: Briefcase, label: 'Jobs', colors: ['#1B4D3E', '#153D31'] as const },
    { route: '/advanced-events', icon: Calendar, label: 'Events', colors: ['#6366F1', '#4F46E5'] as const },
    { route: '/voice-rooms', icon: Mic, label: 'Voice', colors: ['#EC4899', '#DB2777'] as const },
    { route: '/remittance', icon: DollarSign, label: 'Send $', colors: ['#059669', '#047857'] as const },
    { route: '/african-food', icon: Utensils, label: 'Food', colors: ['#DC2626', '#B91C1C'] as const },
  ];

  // All features for the "More" section
  const allFeatures = [
    { route: '/business-directory', icon: Briefcase, label: 'Businesses', desc: 'Local listings', colors: ['#1B4D3E', '#0D3329'] as const },
    { route: '/student-hub', icon: GraduationCap, label: 'Students', desc: 'Groups & Mentors', colors: ['#C9A227', '#A6841F'] as const },
    { route: '/faith-community', icon: Heart, label: 'Faith', desc: 'Services', colors: ['#7C3AED', '#6D28D9'] as const },
    { route: '/trust-score', icon: Shield, label: 'Trust', desc: 'Reputation', colors: ['#10B981', '#059669'] as const },
    { route: '/village-council', icon: Vote, label: 'Council', desc: 'Community', colors: ['#8B5CF6', '#7C3AED'] as const },
    { route: '/susu-circles', icon: PiggyBank, label: 'Savings', desc: 'Susu circles', colors: ['#F59E0B', '#D97706'] as const },
    { route: '/creator-battles', icon: Trophy, label: 'Battles', desc: 'Compete', colors: ['#7C3AED', '#DB2777'] as const },
    { route: '/stories', icon: Film, label: 'Stories', desc: '24hr posts', colors: ['#EC4899', '#F97316'] as const },
    { route: '/clips', icon: Clapperboard, label: 'Clips', desc: 'Highlights', colors: ['#3B82F6', '#8B5CF6'] as const },
    { route: '/duets', icon: SplitSquareVertical, label: 'Duets', desc: 'Collabs', colors: ['#10B981', '#3B82F6'] as const },
    { route: '/heritage-hub', icon: BookOpen, label: 'Heritage', desc: 'Culture', colors: ['#D4673A', '#B85430'] as const },
    { route: '/safety-network', icon: AlertTriangle, label: 'Safety', desc: 'Emergency', colors: ['#EF4444', '#DC2626'] as const },
    { route: '/support-circles', icon: HeartHandshake, label: 'Support', desc: 'Help', colors: ['#14B8A6', '#0D9488'] as const },
    { route: '/gamification', icon: Trophy, label: 'Rewards', desc: 'Earn gems', colors: ['#F97316', '#EA580C'] as const },
    { route: '/immigration-help', icon: FileText, label: 'Visa', desc: 'Immigration', colors: ['#0284C7', '#0369A1'] as const },
    { route: '/sports-betting', icon: Gem, label: 'Sports', desc: 'Predictions', colors: ['#F59E0B', '#D97706'] as const },
    { route: '/live-radio', icon: Radio, label: 'Radio', desc: 'Live audio', colors: ['#7C3AED', '#6D28D9'] as const },
  ];

  const [showAllFeatures, setShowAllFeatures] = useState(false);

  return (
    <View className="flex-1 bg-[#F8F5F0]">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Modern Header */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          className="px-5 pt-3 pb-4"
        >
          {/* Top Row - Logo and Actions */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-terracotta-500 items-center justify-center mr-3">
                <Text className="text-white font-bold text-lg">A</Text>
              </View>
              <View>
                <Text className="text-xl font-bold text-warmBrown">AfroConnect</Text>
                <Pressable
                  onPress={() => navigateTo('/location-select')}
                  className="flex-row items-center"
                >
                  <MapPin size={12} color="#D4673A" />
                  <Text className="text-terracotta-500 text-xs font-medium ml-1">
                    {displayCommunity.city}
                  </Text>
                  <ChevronDown size={12} color="#D4673A" />
                </Pressable>
              </View>
            </View>

            <View className="flex-row items-center space-x-2">
              <Pressable
                onPress={() => navigateTo('/notifications')}
                className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
              >
                <Bell size={20} color="#1B4D3E" />
              </Pressable>
              <Pressable
                onPress={() => navigateTo('/messages')}
                className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm ml-2"
              >
                <MessageCircle size={20} color="#1B4D3E" />
              </Pressable>
            </View>
          </View>

          {/* Filter Tabs - Pill Style */}
          <View className="flex-row bg-white/80 rounded-2xl p-1.5 shadow-sm">
            <Pressable
              onPress={() => toggleFilter('local')}
              className="flex-1"
            >
              <LinearGradient
                colors={feedFilter === 'local' ? ['#D4673A', '#C05A2E'] : ['transparent', 'transparent']}
                style={{ borderRadius: 14, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
              >
                <Users size={16} color={feedFilter === 'local' ? '#FFFFFF' : '#8B7355'} />
                <Text
                  className={`ml-2 font-semibold text-sm ${
                    feedFilter === 'local' ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  My Community
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => toggleFilter('global')}
              className="flex-1"
            >
              <LinearGradient
                colors={feedFilter === 'global' ? ['#1B4D3E', '#153D31'] : ['transparent', 'transparent']}
                style={{ borderRadius: 14, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
              >
                <Globe size={16} color={feedFilter === 'global' ? '#FFFFFF' : '#8B7355'} />
                <Text
                  className={`ml-2 font-semibold text-sm ${
                    feedFilter === 'global' ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  Worldwide
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>

        {/* Feed */}
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
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {/* Guest Sign Up Banner */}
          {(isGuest || !currentUser) && (
            <Animated.View
              entering={FadeInUp.duration(500).delay(100)}
              className="mx-4 mb-4"
            >
              <Pressable onPress={() => navigateTo('/signup')}>
                <LinearGradient
                  colors={['#1B4D3E', '#153D31']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 20, padding: 16, overflow: 'hidden' }}
                >
                  <View className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5" style={{ transform: [{ translateX: 40 }, { translateY: -40 }] }} />
                  <View className="flex-row items-center">
                    <View className="bg-white/15 rounded-2xl p-3">
                      <UserPlus size={24} color="#FFFFFF" />
                    </View>
                    <View className="flex-1 ml-4">
                      <Text className="text-white font-bold text-base">
                        Join the Community
                      </Text>
                      <Text className="text-white/70 text-sm mt-0.5">
                        Connect with {communityMemberCount.toLocaleString()}+ members
                      </Text>
                    </View>
                    <View className="bg-white/15 rounded-full p-2">
                      <ChevronRight size={20} color="#FFFFFF" />
                    </View>
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* Community Stats Card */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(150)}
            className="mx-4 mb-5"
          >
            <LinearGradient
              colors={['#D4673A', '#B85430']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, padding: 20, overflow: 'hidden' }}
            >
              {/* Decorative circles */}
              <View className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
              <View className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-black/10" />

              <View className="flex-row items-center justify-between relative">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Sparkles size={16} color="#FFD700" />
                    <Text className="text-white/80 text-xs font-medium ml-1.5 uppercase tracking-wider">
                      Welcome to
                    </Text>
                  </View>
                  <Text className="text-white text-2xl font-bold">
                    {displayCommunity.city}
                  </Text>
                  <View className="flex-row items-center mt-3">
                    <View className="flex-row items-center bg-white/20 rounded-full px-3 py-1.5">
                      <Users size={14} color="#FFFFFF" />
                      <Text className="text-white font-semibold text-sm ml-1.5">
                        {memberCount.toLocaleString()}
                      </Text>
                    </View>
                    <Text className="text-white/70 text-sm ml-2">members</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => navigateTo('/location-select')}
                  className="bg-white/20 rounded-2xl p-4"
                >
                  <MapPin size={28} color="#FFFFFF" />
                </Pressable>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Daily Rewards Banner */}
          <DailyRewardsBanner onPress={() => setShowDailyRewards(true)} />

          {/* Quick Access Grid */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(200)}
            className="mx-4 mb-5"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-warmBrown font-bold text-lg">Quick Access</Text>
              <Pressable
                onPress={() => setShowAllFeatures(!showAllFeatures)}
                className="flex-row items-center"
              >
                <Text className="text-terracotta-500 text-sm font-medium">
                  {showAllFeatures ? 'Show Less' : 'See All'}
                </Text>
                <ChevronRight size={16} color="#D4673A" />
              </Pressable>
            </View>

            {/* Quick Access Icons */}
            <View className="flex-row flex-wrap justify-between">
              {quickFeatures.map((feature, index) => (
                <Pressable
                  key={feature.route}
                  onPress={() => navigateTo(feature.route)}
                  className="items-center mb-4"
                  style={{ width: '16%' }}
                >
                  <LinearGradient
                    colors={feature.colors}
                    style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}
                  >
                    <feature.icon size={24} color="white" />
                  </LinearGradient>
                  <Text className="text-warmBrown text-xs font-medium text-center">{feature.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Expanded Features Grid */}
            {showAllFeatures && (
              <Animated.View
                entering={FadeIn.duration(300)}
                className="mt-2"
              >
                <View className="bg-white rounded-2xl p-4 shadow-sm">
                  <View className="flex-row flex-wrap">
                    {allFeatures.map((feature, index) => (
                      <Pressable
                        key={feature.route}
                        onPress={() => navigateTo(feature.route)}
                        className="flex-row items-center p-3 mb-2 bg-gray-50 rounded-xl"
                        style={{ width: '48%', marginRight: index % 2 === 0 ? '4%' : 0 }}
                      >
                        <LinearGradient
                          colors={feature.colors}
                          style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                        >
                          <feature.icon size={18} color="white" />
                        </LinearGradient>
                        <View className="ml-2 flex-1">
                          <Text className="text-warmBrown text-sm font-semibold">{feature.label}</Text>
                          <Text className="text-gray-400 text-xs">{feature.desc}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </Animated.View>
            )}
          </Animated.View>

          {/* Local News Section */}
          {feedFilter === 'local' && localNews.length > 0 && (
            <Animated.View
              entering={FadeInUp.duration(500).delay(250)}
              className="mb-5"
            >
              <View className="flex-row items-center justify-between px-4 mb-3">
                <View className="flex-row items-center">
                  <LinearGradient
                    colors={['#D4673A', '#C05A2E']}
                    style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}
                  >
                    <Newspaper size={16} color="white" />
                  </LinearGradient>
                  <Text className="text-warmBrown font-bold text-lg">Local News</Text>
                </View>
                <View className="bg-terracotta-50 px-2.5 py-1 rounded-full">
                  <Text className="text-terracotta-500 text-xs font-medium">{displayCommunity.city}</Text>
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                style={{ flexGrow: 0 }}
              >
                {localNews.map((article) => (
                  <NewsCard key={article.id} article={article} variant="compact" />
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Posts Section Header */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(300)}
            className="px-4 mb-3"
          >
            <View className="flex-row items-center">
              <View className="w-1 h-5 bg-terracotta-500 rounded-full mr-2" />
              <Text className="text-warmBrown font-bold text-lg">
                {feedFilter === 'local' ? 'Community Posts' : 'Global Feed'}
              </Text>
            </View>
          </Animated.View>

          {/* Posts */}
          {allPosts.length > 0 ? (
            allPosts.map((post, index) => (
              <Animated.View
                key={post.id}
                entering={FadeInUp.duration(400).delay(350 + index * 50)}
              >
                <PostCard post={post} />
              </Animated.View>
            ))
          ) : (
            <View className="mx-4 py-16 items-center bg-white rounded-2xl shadow-sm">
              <LinearGradient
                colors={['#F3F4F6', '#E5E7EB']}
                style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}
              >
                <Users size={32} color="#9CA3AF" />
              </LinearGradient>
              <Text className="text-warmBrown font-semibold text-lg text-center">
                No posts yet
              </Text>
              <Text className="text-gray-400 text-center mt-2 px-8">
                Be the first to share something with your community!
              </Text>
              <Pressable
                onPress={() => navigateTo('/create-post')}
                className="mt-4"
              >
                <LinearGradient
                  colors={['#D4673A', '#C05A2E']}
                  style={{ borderRadius: 20, paddingHorizontal: 24, paddingVertical: 12 }}
                >
                  <Text className="text-white font-semibold">Create Post</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Location Change Modal */}
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

      {/* Daily Rewards Modal */}
      <DailyRewardsModal
        visible={showDailyRewards}
        onClose={() => setShowDailyRewards(false)}
      />
    </View>
  );
}
