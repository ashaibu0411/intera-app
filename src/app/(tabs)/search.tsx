import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Search as SearchIcon, X, Users, Calendar, Briefcase, Hash, UserCircle } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MOCK_POSTS, MOCK_COMMUNITIES } from '@/lib/store';
import { supabase, DbUser } from '@/lib/supabase';
import { useRouter } from 'expo-router';

type SearchCategory = 'all' | 'people' | 'posts' | 'events' | 'businesses';

interface CategoryItem {
  id: SearchCategory;
  label: string;
  IconComponent: typeof Hash;
}

const CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'All', IconComponent: Hash },
  { id: 'people', label: 'People', IconComponent: Users },
  { id: 'posts', label: 'Posts', IconComponent: Hash },
  { id: 'events', label: 'Events', IconComponent: Calendar },
  { id: 'businesses', label: 'Businesses', IconComponent: Briefcase },
];

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [searchResults, setSearchResults] = useState<DbUser[]>([]);
  const [recentUsers, setRecentUsers] = useState<DbUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load recent/popular users on mount
  useEffect(() => {
    loadRecentUsers();
  }, []);

  const loadRecentUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.log('Error loading recent users:', error);
        return;
      }

      if (data) {
        setRecentUsers(data);
      }
    } catch (err) {
      console.log('Error loading recent users:', err);
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
  }, [query]);

  const searchUsers = async (searchQuery: string) => {
    setIsSearching(true);
    setHasSearched(true);

    try {
      // Search by name or username using ilike for case-insensitive partial match
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
        .limit(20);

      if (error) {
        console.log('Search error:', error);
        setSearchResults([]);
        return;
      }

      console.log(`Found ${data?.length || 0} users matching "${searchQuery}"`);
      setSearchResults(data || []);
    } catch (err) {
      console.log('Search error:', err);
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
    // Navigate to user profile if you have a profile screen
    // router.push(`/profile/${user.id}`);
  };

  const filteredPosts = MOCK_POSTS.filter((post) =>
    post.content.toLowerCase().includes(query.toLowerCase())
  );

  const renderUserCard = (user: DbUser, index: number) => (
    <Animated.View
      key={user.id}
      entering={FadeInUp.duration(300).delay(index * 50)}
    >
      <Pressable
        className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm"
        onPress={() => handleUserPress(user)}
      >
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
        <View className="flex-1 ml-3">
          <Text className="text-warmBrown font-semibold">{user.name}</Text>
          <Text className="text-gray-500 text-sm">@{user.username}</Text>
          {user.location && (
            <Text className="text-gray-400 text-sm mt-0.5">{user.location}</Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );

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
            /* Suggested Content */
            <View className="px-5 pb-6">
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

              {/* Recent Users from Database */}
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
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
