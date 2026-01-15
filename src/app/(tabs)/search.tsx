import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Search as SearchIcon, X, Users, Calendar, Briefcase, Hash, UserCircle, Circle, MessageCircle } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MOCK_POSTS, MOCK_COMMUNITIES, useStore } from '@/lib/store';
import { supabase, DbUser } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';

type SearchCategory = 'all' | 'people' | 'online' | 'posts' | 'events' | 'businesses';

interface CategoryItem {
  id: SearchCategory;
  label: string;
  IconComponent: typeof Hash;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'All', IconComponent: Hash },
  { id: 'people', label: 'People', IconComponent: Users },
  { id: 'online', label: 'Online', IconComponent: Circle },
  { id: 'posts', label: 'Posts', IconComponent: Hash },
  { id: 'events', label: 'Events', IconComponent: Calendar },
  { id: 'businesses', label: 'Businesses', IconComponent: Briefcase },
];

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face';

export default function SearchScreen() {
  const router = useRouter();
  const { category, intent, prefill } = useLocalSearchParams<{
    category?: SearchCategory;
    intent?: 'message';
    prefill?: string;
  }>();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [searchResults, setSearchResults] = useState<DbUser[]>([]);
  const [recentUsers, setRecentUsers] = useState<DbUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<DbUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoadingOnline, setIsLoadingOnline] = useState(false);
  const [selectedOpener, setSelectedOpener] = useState('');

  const isGuest = useStore((s) => s.isGuest);
  const currentUser = useStore((s) => s.currentUser);

  const decodedPrefill = useMemo(() => (prefill ? decodeURIComponent(prefill) : ''), [prefill]);
  const openers = useMemo(
    () => [
      decodedPrefill || "Hey! I’m new here—what should I know first?",
      "What’s the best way to meet people in the community?",
      "Any plans happening this week I should join?",
    ],
    [decodedPrefill]
  );

  // Load recent/popular users on mount
  useEffect(() => {
    loadRecentUsers();
    loadOnlineUsers();
  }, []);

  // Allow deep links like "/(tabs)/search?category=online"
  useEffect(() => {
    if (category && CATEGORIES.some((c) => c.id === category)) {
      setActiveCategory(category);
    }
  }, [category]);

  useEffect(() => {
    if (intent === 'message') {
      setSelectedOpener(decodedPrefill || openers[0] || '');
    }
  }, [decodedPrefill, intent, openers]);

  // Reload online users when switching to online tab
  useEffect(() => {
    if (activeCategory === 'online') {
      loadOnlineUsers();
    }
  }, [activeCategory]);

  const loadOnlineUsers = async () => {
    setIsLoadingOnline(true);
    try {
      // Get users who are online and have show_online_status enabled (or null/undefined which defaults to true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_online', true)
        .order('last_seen', { ascending: false })
        .limit(50);

      if (error) {
        console.log('[Online Users] Error:', JSON.stringify(error));
        return;
      }

      // Filter to only show users who want to be visible (show_online_status is true or not set)
      const visibleOnlineUsers = (data || []).filter(
        (user: DbUser) => user.show_online_status !== false
      );
      setOnlineUsers(visibleOnlineUsers);
      console.log(`[Online Users] Found ${visibleOnlineUsers.length} online users`);
    } catch (err) {
      console.log('[Online Users] Error:', err);
    } finally {
      setIsLoadingOnline(false);
    }
  };

  const loadRecentUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.log('[People Search] Error:', JSON.stringify(error));
        return;
      }

      if (data) {
        setRecentUsers(data);
      }
    } catch (err) {
      console.log('[People Search] Error:', err);
    }
  };

  // Search users in real-time as they type
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length >= 1) {
        searchUsers(query.trim());
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(searchTimeout);
  }, [query, activeCategory]);

  const searchUsers = async (searchQuery: string) => {
    setIsSearching(true);
    setHasSearched(true);

    try {
      let queryBuilder = supabase
        .from('profiles')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`);

      // If searching in online category, filter by online status
      if (activeCategory === 'online') {
        queryBuilder = queryBuilder.eq('is_online', true);
      }

      const { data, error } = await queryBuilder.limit(20);

      if (error) {
        console.log('[People Search] Error:', JSON.stringify(error));
        setSearchResults([]);
        return;
      }

      // Filter for online visibility if in online category
      let results = data || [];
      if (activeCategory === 'online') {
        results = results.filter((user: DbUser) => user.show_online_status !== false);
      }

      console.log(`[People Search] Found ${results.length} users matching "${searchQuery}"`);
      setSearchResults(results);
    } catch (err) {
      console.log('[People Search] Error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategoryChange = (category: SearchCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(category);
  };

  const clearSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleUserPress = (user: DbUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (intent === 'message') {
      handleMessageUser(user);
      return;
    }
    router.push(`/profile/${user.id}` as any);
  };

  const handleMessageUser = (user: DbUser) => {
    if (isGuest || !currentUser?.id) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/signup' as any);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const avatarUrl = user.avatar_url || DEFAULT_AVATAR;
    const message = selectedOpener || '';
    const route = `/chat/user_${user.id}?name=${encodeURIComponent(user.name)}&avatar=${encodeURIComponent(
      avatarUrl
    )}&recipientId=${user.id}${message ? `&prefill=${encodeURIComponent(message)}` : ''}`;
    router.push(route as any);
  };

  const filteredPosts = MOCK_POSTS.filter((post) =>
    post.content.toLowerCase().includes(query.toLowerCase())
  );

  const renderUserCard = (user: DbUser, index: number, showOnlineStatus: boolean = true) => {
    const isOnline = user.is_online && user.show_online_status !== false;

    return (
      <Animated.View
        key={user.id}
        entering={FadeInUp.duration(300).delay(index * 50)}
      >
        <Pressable
          className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm"
          onPress={() => handleUserPress(user)}
        >
          <View className="relative">
            {user.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={{ width: 50, height: 50, borderRadius: 25 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-[50px] h-[50px] rounded-full bg-terracotta-100 items-center justify-center">
                <UserCircle size={30} color="#C45C26" />
              </View>
            )}
            {/* Online indicator */}
            {showOnlineStatus && isOnline && (
              <View className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
            )}
          </View>
          <View className="flex-1 ml-3">
            <View className="flex-row items-center">
              <Text className="text-warmBrown font-semibold">{user.name}</Text>
              {showOnlineStatus && isOnline && (
                <View className="ml-2 px-2 py-0.5 bg-green-100 rounded-full">
                  <Text className="text-green-700 text-xs font-medium">Online</Text>
                </View>
              )}
            </View>
            <Text className="text-gray-500 text-sm">@{user.username}</Text>
            {user.location && (
              <Text className="text-gray-400 text-sm mt-0.5">{user.location}</Text>
            )}
          </View>

          {intent === 'message' && (
            <Pressable
              onPress={() => handleMessageUser(user)}
              className="bg-terracotta-500 rounded-full px-3 py-2 flex-row items-center"
              hitSlop={8}
            >
              <MessageCircle size={16} color="#FFFFFF" />
              <Text className="text-white text-xs font-semibold ml-1.5">Message</Text>
            </Pressable>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Search Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-3">
          <Text className="text-2xl font-bold text-warmBrown mb-4">Discover</Text>

          {/* Search Input */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
            <SearchIcon size={20} color="#8B7355" />
            <TextInput
              placeholder="Search people by name or username..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              className="flex-1 ml-3 text-warmBrown text-base"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isSearching ? (
              <ActivityIndicator size="small" color="#C45C26" />
            ) : query.length > 0 ? (
              <Pressable onPress={clearSearch}>
                <X size={20} color="#8B7355" />
              </Pressable>
            ) : null}
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            style={{ flexGrow: 0 }}
          >
            {CATEGORIES.map((category, index) => (
              <Animated.View
                key={category.id}
                entering={FadeInRight.duration(300).delay(index * 50)}
              >
                <Pressable
                  onPress={() => handleCategoryChange(category.id)}
                  className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
                    activeCategory === category.id
                      ? 'bg-terracotta-500'
                      : 'bg-white'
                  }`}
                >
                  <category.IconComponent
                    size={16}
                    color={activeCategory === category.id ? '#FFFFFF' : '#8B7355'}
                  />
                  <Text
                    className={`ml-2 font-medium ${
                      activeCategory === category.id ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {category.label}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Search Results */}
          {query.length > 0 ? (
            <View className="px-5 pb-6">
              {/* Online Users Results */}
              {activeCategory === 'online' && (
                <Animated.View entering={FadeInUp.duration(400)}>
                  <View className="flex-row items-center mb-3 mt-2">
                    <View className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2" />
                    <Text className="text-lg font-semibold text-warmBrown">Online Now</Text>
                  </View>

                  {isSearching ? (
                    <View className="items-center py-8">
                      <ActivityIndicator size="large" color="#C45C26" />
                      <Text className="text-gray-500 mt-3">Searching online users...</Text>
                    </View>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user, index) => renderUserCard(user, index, true))
                  ) : hasSearched ? (
                    <View className="items-center py-8 bg-white rounded-2xl">
                      <Circle size={48} color="#9CA3AF" />
                      <Text className="text-gray-500 mt-3 text-center">
                        No online users found for "{query}"
                      </Text>
                      <Text className="text-gray-400 text-sm mt-1 text-center px-4">
                        Try a different search or check back later
                      </Text>
                    </View>
                  ) : null}
                </Animated.View>
              )}

              {/* People Results */}
              {(activeCategory === 'all' || activeCategory === 'people') && (
                <Animated.View entering={FadeInUp.duration(400)}>
                  <Text className="text-lg font-semibold text-warmBrown mb-3 mt-2">People</Text>

                  {isSearching ? (
                    <View className="items-center py-8">
                      <ActivityIndicator size="large" color="#C45C26" />
                      <Text className="text-gray-500 mt-3">Searching...</Text>
                    </View>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user, index) => renderUserCard(user, index))
                  ) : hasSearched ? (
                    <View className="items-center py-8 bg-white rounded-2xl">
                      <UserCircle size={48} color="#9CA3AF" />
                      <Text className="text-gray-500 mt-3 text-center">
                        No users found for "{query}"
                      </Text>
                      <Text className="text-gray-400 text-sm mt-1 text-center px-4">
                        Try searching with a different name or username
                      </Text>
                    </View>
                  ) : null}
                </Animated.View>
              )}

              {/* Posts Results */}
              {(activeCategory === 'all' || activeCategory === 'posts') && filteredPosts.length > 0 && (
                <Animated.View entering={FadeInUp.duration(400).delay(100)}>
                  <Text className="text-lg font-semibold text-warmBrown mb-3 mt-4">Posts</Text>
                  {filteredPosts.map((post, index) => (
                    <Animated.View
                      key={post.id}
                      entering={FadeInUp.duration(300).delay(index * 50)}
                    >
                      <Pressable className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
                        <View className="flex-row items-center mb-2">
                          <Image
                            source={{ uri: post.author.avatar }}
                            style={{ width: 32, height: 32, borderRadius: 16 }}
                            contentFit="cover"
                          />
                          <Text className="text-warmBrown font-medium ml-2">{post.author.name}</Text>
                        </View>
                        <Text className="text-gray-600" numberOfLines={3}>
                          {post.content}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  ))}
                </Animated.View>
              )}
            </View>
          ) : (
            /* Suggested Content - Show online users when on online tab */
            <View className="px-5 pb-6">
              {/* Online Users Section - show when on Online tab */}
              {activeCategory === 'online' && (
                <Animated.View entering={FadeInUp.duration(400)}>
                  {intent === 'message' && (
                    <View className="bg-white rounded-2xl p-4 shadow-sm mb-3">
                      <Text className="text-warmBrown font-semibold text-base">Say hello</Text>
                      <Text className="text-gray-500 text-sm mt-0.5">
                        Pick an opener—then tap “Message” on anyone online.
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ flexGrow: 0 }}
                        className="mt-3"
                      >
                        <View className="flex-row gap-2">
                          {openers.map((line) => {
                            const isSelected = selectedOpener === line;
                            return (
                              <Pressable
                                key={line}
                                onPress={() => {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setSelectedOpener(line);
                                }}
                                className={`px-3 py-2 rounded-full border ${
                                  isSelected ? 'bg-terracotta-500 border-terracotta-500' : 'bg-gray-50 border-gray-100'
                                }`}
                              >
                                <Text className={`text-xs ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                                  {line}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </View>
                  )}

                  <View className="flex-row items-center mb-3 mt-2">
                    <View className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2" />
                    <Text className="text-lg font-semibold text-warmBrown">Online Now</Text>
                    <Text className="text-gray-400 text-sm ml-2">({onlineUsers.length})</Text>
                  </View>

                  {isLoadingOnline ? (
                    <View className="items-center py-8">
                      <ActivityIndicator size="large" color="#10B981" />
                      <Text className="text-gray-500 mt-3">Loading online users...</Text>
                    </View>
                  ) : onlineUsers.length > 0 ? (
                    onlineUsers.map((user, index) => renderUserCard(user, index, true))
                  ) : (
                    <View className="items-center py-8 bg-white rounded-2xl">
                      <Circle size={48} color="#9CA3AF" />
                      <Text className="text-gray-500 mt-3 text-center">No one is online right now</Text>
                      <Text className="text-gray-400 text-sm mt-1 text-center px-4">
                        Check back later to see who's online
                      </Text>
                    </View>
                  )}
                </Animated.View>
              )}

              {/* Communities - show when NOT on online tab */}
              {activeCategory !== 'online' && (
                <Animated.View entering={FadeInUp.duration(400)}>
                  <Text className="text-lg font-semibold text-warmBrown mb-3 mt-2">
                    Suggested Communities
                  </Text>
                  {MOCK_COMMUNITIES.map((community, index) => (
                    <Animated.View
                      key={community.id}
                      entering={FadeInUp.duration(300).delay(index * 100)}
                    >
                      <Pressable className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm">
                        <Image
                          source={{ uri: community.image }}
                          style={{ width: 60, height: 60, borderRadius: 12 }}
                          contentFit="cover"
                        />
                        <View className="flex-1 ml-3">
                          <Text className="text-warmBrown font-semibold">{community.name}</Text>
                          <Text className="text-gray-500 text-sm">
                            {community.city}, {community.country}
                          </Text>
                          <Text className="text-terracotta-500 text-sm mt-1">
                            {community.memberCount.toLocaleString()} members
                          </Text>
                        </View>
                      </Pressable>
                    </Animated.View>
                  ))}
                </Animated.View>
              )}

              {/* Recent Users from Database - show when NOT on online tab */}
              {activeCategory !== 'online' && (
                <Animated.View entering={FadeInUp.duration(400).delay(200)}>
                  <Text className="text-lg font-semibold text-warmBrown mb-3 mt-4">
                    New Members
                  </Text>
                  {recentUsers.length > 0 ? (
                    recentUsers.map((user, index) => renderUserCard(user, index))
                  ) : (
                    <View className="items-center py-6 bg-white rounded-2xl">
                      <Text className="text-gray-500">Loading members...</Text>
                    </View>
                  )}
                </Animated.View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
