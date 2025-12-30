import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, ChevronDown, Globe, Users } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PostCard } from '@/components/PostCard';
import { useStore, MOCK_POSTS, MOCK_COMMUNITIES } from '@/lib/store';

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const feedFilter = useStore((s) => s.feedFilter);
  const setFeedFilter = useStore((s) => s.setFeedFilter);
  const currentCommunity = useStore((s) => s.currentCommunity);

  const displayCommunity = currentCommunity ?? MOCK_COMMUNITIES[0];

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const toggleFilter = (filter: 'local' | 'global') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeedFilter(filter);
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
              </View>

              <Pressable className="flex-row items-center bg-white rounded-full px-4 py-2 shadow-sm">
                <MapPin size={16} color="#D4673A" />
                <Text className="text-warmBrown font-medium ml-2">{displayCommunity.city}</Text>
                <ChevronDown size={16} color="#8B7355" className="ml-1" />
              </Pressable>
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
                    {displayCommunity.memberCount.toLocaleString()} community members
                  </Text>
                </View>
                <View className="bg-white/20 rounded-full p-3">
                  <Users size={24} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Posts */}
          {MOCK_POSTS.map((post, index) => (
            <Animated.View
              key={post.id}
              entering={FadeInUp.duration(400).delay(300 + index * 100)}
            >
              <PostCard post={post} />
            </Animated.View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
