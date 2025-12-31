import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { PostCard } from '@/components/PostCard';
import { NewsCard } from '@/components/NewsCard';
import { LocationChangeModal } from '@/components/LocationChangeModal';
import { useStore, MOCK_POSTS, MOCK_COMMUNITIES, type Post, type NewsArticle } from '@/lib/store';
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

  const displayCommunity = currentCommunity ?? MOCK_COMMUNITIES[0];

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
      const news = await getLocalNews(city, 4);
      setLocalNews(news);
    } catch (error) {
      console.log('[Home] Error fetching news:', error);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [selectedLocation, displayCommunity.city]);

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
        name: `${detectedLocation.city} Africans`,
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

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <LinearGradient
          colors={['#FAF7F2', '#FAF7F2']}
          style={{ paddingBottom: 12 }}
        >
          <Animated.View
            entering={FadeInDown.duration(400).delay(100)}
            className="px-5 pt-2"
          >
            {/* Logo and Community */}
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-3xl font-bold text-terracotta-500">Afro</Text>
                <Text className="text-3xl font-bold text-forest-700 -mt-2">Connect</Text>
                <Text className="text-xs text-gray-500 mt-1 italic">
                  Connecting Africans Globally, Building Communities
                </Text>
              </View>

              <View className="flex-row items-center">
                <Pressable
                  onPress={() => navigateTo('/messages')}
                  className="bg-white rounded-full p-2.5 shadow-sm mr-2"
                >
                  <MessageCircle size={20} color="#1B4D3E" />
                </Pressable>
                <Pressable
                  onPress={() => navigateTo('/location-select')}
                  className="flex-row items-center bg-white rounded-full px-4 py-2 shadow-sm"
                >
                  <MapPin size={16} color="#D4673A" />
                  <Text className="text-warmBrown font-medium ml-2">{displayCommunity.city}</Text>
                  <ChevronDown size={16} color="#8B7355" className="ml-1" />
                </Pressable>
              </View>
            </View>

            {/* Filter Tabs */}
            <View className="flex-row mt-4 bg-white rounded-full p-1 shadow-sm">
              <Pressable
                onPress={() => toggleFilter('local')}
                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-full ${
                  feedFilter === 'local' ? 'bg-terracotta-500' : ''
                }`}
              >
                <Users size={16} color={feedFilter === 'local' ? '#FFFFFF' : '#8B7355'} />
                <Text
                  className={`ml-2 font-medium ${
                    feedFilter === 'local' ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  Local
                </Text>
              </Pressable>

              <Pressable
                onPress={() => toggleFilter('global')}
                className={`flex-1 flex-row items-center justify-center py-2.5 rounded-full ${
                  feedFilter === 'global' ? 'bg-forest-700' : ''
                }`}
              >
                <Globe size={16} color={feedFilter === 'global' ? '#FFFFFF' : '#8B7355'} />
                <Text
                  className={`ml-2 font-medium ${
                    feedFilter === 'global' ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  Global
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </LinearGradient>

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
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
        >
          {/* Guest Sign Up Banner */}
          {(isGuest || !currentUser) && (
            <Animated.View
              entering={FadeInUp.duration(500).delay(150)}
              className="mx-4 mb-4"
            >
              <Pressable onPress={() => navigateTo('/signup')}>
                <LinearGradient
                  colors={['#C9A227', '#A6841F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 16 }}
                >
                  <View className="flex-row items-center">
                    <View className="bg-white/20 rounded-full p-2.5">
                      <UserPlus size={22} color="#FFFFFF" />
                    </View>
                    <View className="flex-1 ml-3">
                      <Text className="text-white font-bold text-base">
                        Join AfroConnect
                      </Text>
                      <Text className="text-white/80 text-sm">
                        Sign up to post, comment, and connect with the community
                      </Text>
                    </View>
                    <ChevronRight size={20} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </Pressable>
            </Animated.View>
          )}

          {/* Welcome Card */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(200)}
            className="mx-4 mb-4"
          >
            <LinearGradient
              colors={['#D4673A', '#B85430']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 20 }}
            >
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text className="text-white text-lg font-bold">
                    Welcome to {displayCommunity.city}
                  </Text>
                  <Text className="text-white/80 mt-1">
                    {memberCount.toLocaleString()} community members
                  </Text>
                </View>
                <View className="bg-white/20 rounded-full p-3">
                  <Users size={24} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Quick Access Cards - Row 1 */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(250)}
            className="flex-row mx-4 mb-3"
          >
            {/* Marketplace Card */}
            <Pressable
              onPress={() => navigateTo('/marketplace')}
              className="flex-1 mr-2"
            >
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="bg-terracotta-50 rounded-full p-2.5 self-start mb-2">
                  <ShoppingBag size={22} color="#D4673A" />
                </View>
                <Text className="text-warmBrown font-bold">Marketplace</Text>
                <Text className="text-gray-500 text-xs mt-0.5">Buy & Sell</Text>
              </View>
            </Pressable>

            {/* Business Directory Card */}
            <Pressable
              onPress={() => navigateTo('/business-directory')}
              className="flex-1 ml-2"
            >
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="bg-forest-50 rounded-full p-2.5 self-start mb-2">
                  <Briefcase size={22} color="#1B4D3E" />
                </View>
                <Text className="text-warmBrown font-bold">Businesses</Text>
                <Text className="text-gray-500 text-xs mt-0.5">African-owned</Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* Quick Access Cards - Row 2 */}
          <Animated.View
            entering={FadeInUp.duration(500).delay(280)}
            className="flex-row mx-4 mb-4"
          >
            {/* Student Hub Card */}
            <Pressable
              onPress={() => navigateTo('/student-hub')}
              className="flex-1 mr-2"
            >
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="bg-gold-50 rounded-full p-2.5 self-start mb-2">
                  <GraduationCap size={22} color="#C9A227" />
                </View>
                <Text className="text-warmBrown font-bold">Student Hub</Text>
                <Text className="text-gray-500 text-xs mt-0.5">Groups & Mentors</Text>
              </View>
            </Pressable>

            {/* Faith & Community Card */}
            <Pressable
              onPress={() => navigateTo('/faith-community')}
              className="flex-1 ml-2"
            >
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <View className="bg-terracotta-50 rounded-full p-2.5 self-start mb-2">
                  <Heart size={22} color="#D4673A" />
                </View>
                <Text className="text-warmBrown font-bold">Faith Centers</Text>
                <Text className="text-gray-500 text-xs mt-0.5">Services & Events</Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* Local News Section - Only show in local feed */}
          {feedFilter === 'local' && localNews.length > 0 && (
            <Animated.View
              entering={FadeInUp.duration(500).delay(310)}
              className="mb-4"
            >
              <View className="flex-row items-center justify-between px-4 mb-3">
                <View className="flex-row items-center">
                  <View className="bg-terracotta-50 rounded-full p-2 mr-2">
                    <Newspaper size={18} color="#D4673A" />
                  </View>
                  <Text className="text-warmBrown font-bold text-lg">Local News</Text>
                </View>
                <Text className="text-gray-400 text-xs">{displayCommunity.city}</Text>
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

          {/* Posts */}
          {allPosts.length > 0 ? (
            allPosts.map((post, index) => (
              <Animated.View
                key={post.id}
                entering={FadeInUp.duration(400).delay(350 + index * 100)}
              >
                <PostCard post={post} />
              </Animated.View>
            ))
          ) : (
            <View className="mx-4 py-12 items-center">
              <View className="bg-gray-100 rounded-full p-4 mb-4">
                <Users size={32} color="#9CA3AF" />
              </View>
              <Text className="text-warmBrown font-semibold text-lg text-center">
                No posts yet in your area
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                Be the first to share something with your community!
              </Text>
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
    </View>
  );
}
