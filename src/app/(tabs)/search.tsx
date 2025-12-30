import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Search as SearchIcon, X, Users, Calendar, Briefcase, Hash } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MOCK_USERS, MOCK_POSTS, MOCK_COMMUNITIES } from '@/lib/store';

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

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');

  const handleCategoryChange = (category: SearchCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(category);
  };

  const clearSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuery('');
  };

  const filteredUsers = MOCK_USERS.filter(
    (user) =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.username.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPosts = MOCK_POSTS.filter((post) =>
    post.content.toLowerCase().includes(query.toLowerCase())
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
              placeholder="Search people, posts, events..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              className="flex-1 ml-3 text-warmBrown text-base"
            />
            {query.length > 0 && (
              <Pressable onPress={clearSearch}>
                <X size={20} color="#8B7355" />
              </Pressable>
            )}
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
          {/* Results */}
          {query.length > 0 ? (
            <View className="px-5 pb-6">
              {/* People Results */}
              {(activeCategory === 'all' || activeCategory === 'people') && filteredUsers.length > 0 && (
                <Animated.View entering={FadeInUp.duration(400)}>
                  <Text className="text-lg font-semibold text-warmBrown mb-3 mt-2">People</Text>
                  {filteredUsers.map((user, index) => (
                    <Animated.View
                      key={user.id}
                      entering={FadeInUp.duration(300).delay(index * 50)}
                    >
                      <Pressable className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm">
                        <Image
                          source={{ uri: user.avatar }}
                          style={{ width: 50, height: 50, borderRadius: 25 }}
                          contentFit="cover"
                        />
                        <View className="flex-1 ml-3">
                          <Text className="text-warmBrown font-semibold">{user.name}</Text>
                          <Text className="text-gray-500 text-sm">@{user.username}</Text>
                          <Text className="text-gray-400 text-sm mt-0.5">{user.location}</Text>
                        </View>
                      </Pressable>
                    </Animated.View>
                  ))}
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

              <Animated.View entering={FadeInUp.duration(400).delay(200)}>
                <Text className="text-lg font-semibold text-warmBrown mb-3 mt-4">
                  Popular People
                </Text>
                {MOCK_USERS.map((user, index) => (
                  <Animated.View
                    key={user.id}
                    entering={FadeInUp.duration(300).delay(200 + index * 100)}
                  >
                    <Pressable className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm">
                      <Image
                        source={{ uri: user.avatar }}
                        style={{ width: 50, height: 50, borderRadius: 25 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 ml-3">
                        <Text className="text-warmBrown font-semibold">{user.name}</Text>
                        <Text className="text-gray-500 text-sm">{user.bio}</Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </Animated.View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
