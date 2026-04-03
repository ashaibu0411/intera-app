import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Plus, Sparkles, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { PostCard } from '@/components/PostCard';
import { useStore, type Post } from '@/lib/store';
import { getCommunityByLocation } from '@/lib/communities';
import { getPosts, isConnectStylePost } from '@/lib/posts';
import { subscribeToPostInserts } from '@/lib/postsRealtime';

export default function CommunityUpdatesScreen() {
  const selectedLocation = useStore((s) => s.selectedLocation);
  const userPosts = useStore((s) => s.userPosts);
  const blockedUserIds = useStore((s) => s.blockedUserIds);

  const [refreshing, setRefreshing] = useState(false);
  const [dbPosts, setDbPosts] = useState<Post[]>([]);

  const locationLabel = useMemo(() => {
    const city = selectedLocation?.city?.trim();
    const country = selectedLocation?.country?.trim();
    if (city && country) return `${city}, ${country}`;
    if (city) return city;
    return 'Set your location';
  }, [selectedLocation?.city, selectedLocation?.country]);

  const fetchCommunityAndPosts = useCallback(async () => {
    const city = selectedLocation?.city?.trim();
    const country = selectedLocation?.country?.trim();

    if (!city || !country) {
      setDbPosts([]);
      return null;
    }

    const community = await getCommunityByLocation(city, country);

    try {
      const posts = await getPosts(community?.id || undefined, 50, { excludeConnect: true });
      setDbPosts(posts);
    } catch (e) {
      console.warn('[CommunityUpdates] fetch posts:', e);
      setDbPosts([]);
    }
    return community;
  }, [selectedLocation?.city, selectedLocation?.country]);

  useFocusEffect(
    useCallback(() => {
      let unsubscribe: null | (() => void) = null;
      let cancelled = false;

      (async () => {
        const community = await fetchCommunityAndPosts();
        if (cancelled) return;

        unsubscribe = subscribeToPostInserts({
          communityId: community?.id ?? null,
          onInsert: () => {
            fetchCommunityAndPosts().catch(() => null);
          },
        });
      })().catch(() => null);

      return () => {
        cancelled = true;
        unsubscribe?.();
      };
    }, [fetchCommunityAndPosts])
  );

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await fetchCommunityAndPosts();
    } finally {
      setRefreshing(false);
    }
  }, [fetchCommunityAndPosts]);

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-4 py-3 bg-cream border-b border-cream">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 items-center justify-center -ml-2"
            >
              <ArrowLeft size={22} color="#2D1F1A" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-xl font-bold text-warmBrown">Community updates</Text>
              <Text className="text-xs text-gray-500 -mt-0.5">{locationLabel}</Text>
              <Text className="text-xs text-gray-400 mt-0.5">
                News &amp; local updates — connect posts live on their own wall
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/open-connect-posts' as never);
            }}
            className="mt-3 flex-row items-center bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3 active:opacity-90"
          >
            <View className="bg-violet-100 rounded-full p-2">
              <Sparkles size={20} color="#5B21B6" />
            </View>
            <View className="flex-1 ml-3">
              <Text className="text-violet-950 font-semibold">Open to connect wall</Text>
              <Text className="text-violet-800/90 text-xs mt-0.5">
                Members only, scoped to your set city &amp; country — meant for meeting nearby
              </Text>
            </View>
            <ChevronRight size={20} color="#6D28D9" />
          </Pressable>
        </View>

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
          {(!selectedLocation?.city || !selectedLocation?.country) && (
            <View className="mx-4 mt-6 p-4 bg-white rounded-2xl border border-gray-100">
              <Text className="text-gray-900 font-semibold text-lg">Choose your community</Text>
              <Text className="text-gray-500 mt-1">
                Set your location to see posts from people near you.
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/location-select');
                }}
                className="mt-4 bg-gray-900 px-5 py-3 rounded-full self-start"
              >
                <Text className="text-white font-semibold">Set location</Text>
              </Pressable>
            </View>
          )}

          {allPosts.length > 0 ? (
            <View className="pt-2">
              {allPosts.map((post, index) => (
                <Animated.View
                  key={post.id}
                  entering={FadeInUp.duration(250).delay(index * 20)}
                >
                  <PostCard post={post} />
                </Animated.View>
              ))}
            </View>
          ) : (
            <View className="mx-4 mt-10 p-6 bg-white rounded-2xl border border-gray-100 items-center">
              <Text className="text-gray-900 font-semibold text-xl">Nothing posted yet</Text>
              <Text className="text-gray-500 text-center mt-1">
                Be the first to share a photo, video, or local update.
              </Text>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  const returnTo = encodeURIComponent('/community-updates');
                  router.push(`/create?returnTo=${returnTo}` as never);
                }}
                className="mt-4 bg-gray-900 px-6 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">Create a post</Text>
              </Pressable>
            </View>
          )}

          <View className="h-28" />
        </ScrollView>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            const returnTo = encodeURIComponent('/community-updates');
            router.push(`/create?returnTo=${returnTo}` as never);
          }}
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
    </View>
  );
}
