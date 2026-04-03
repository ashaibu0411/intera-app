import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ArrowLeft, Plus, Sparkles, ChevronRight, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { PostCard } from '@/components/PostCard';
import { useStore, type Post } from '@/lib/store';
import { getCommunityByLocation } from '@/lib/communities';
import { getPosts, isConnectStylePost } from '@/lib/posts';
import { subscribeToPostInserts } from '@/lib/postsRealtime';
import { getConnectWallAgeAttested, setConnectWallAgeAttested } from '@/lib/connectWallAgeGate';
import { OpenConnectMembershipPrompt } from '@/components/OpenConnectMembershipPrompt';

const RETURN_PATH = '/open-connect-posts';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function OpenConnectPostsScreen() {
  const params = useLocalSearchParams<{ postId?: string | string[] }>();
  const rawPostId = Array.isArray(params.postId) ? params.postId[0] : params.postId;
  const highlightPostId =
    typeof rawPostId === 'string' && UUID_RE.test(rawPostId.trim()) ? rawPostId.trim() : null;

  const selectedLocation = useStore((s) => s.selectedLocation);
  const userPosts = useStore((s) => s.userPosts);
  const blockedUserIds = useStore((s) => s.blockedUserIds);
  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);

  const [refreshing, setRefreshing] = useState(false);
  const [dbPosts, setDbPosts] = useState<Post[]>([]);
  const [ageLoading, setAgeLoading] = useState(true);
  const [ageVerified, setAgeVerified] = useState(false);
  const [connectFeedAllowed, setConnectFeedAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await getConnectWallAgeAttested();
      if (!cancelled) {
        setAgeVerified(ok);
        setAgeLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onConfirmAge = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await setConnectWallAgeAttested();
    setAgeVerified(true);
  }, []);

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
      const posts = await getPosts(community?.id || undefined, 50, { connectOnly: true });
      setDbPosts(posts);
    } catch (e) {
      console.warn('[OpenConnectPosts] fetch posts:', e);
      setDbPosts([]);
    }
    return community;
  }, [selectedLocation?.city, selectedLocation?.country]);

  useFocusEffect(
    useCallback(() => {
      if (!ageVerified || !connectFeedAllowed) return;

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
    }, [fetchCommunityAndPosts, ageVerified, connectFeedAllowed])
  );

  const allPosts = useMemo(() => {
    const connectFromLocal = userPosts.filter((p) => isConnectStylePost(p));
    const combined = [...connectFromLocal, ...dbPosts];
    const uniquePosts = combined.filter(
      (post, index, self) => index === self.findIndex((p) => p.id === post.id)
    );
    return uniquePosts
      .filter((post) => !blockedUserIds.includes(post.author.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [blockedUserIds, dbPosts, userPosts]);

  const onRefresh = useCallback(async () => {
    if (!ageVerified || !connectFeedAllowed) return;
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await fetchCommunityAndPosts();
    } finally {
      setRefreshing(false);
    }
  }, [fetchCommunityAndPosts, ageVerified, connectFeedAllowed]);

  const openComposer = useCallback(() => {
    if (!ageVerified || !connectFeedAllowed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const returnTo = encodeURIComponent(RETURN_PATH);
    router.push(`/(tabs)/create?returnTo=${returnTo}&openPost=1` as never);
  }, [ageVerified, connectFeedAllowed]);

  const openHighlightedPost = useCallback(() => {
    if (!highlightPostId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/post/${highlightPostId}` as never);
  }, [highlightPostId]);

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
              <View className="flex-row items-center">
                <Sparkles size={18} color="#6D28D9" style={{ marginRight: 6 }} />
                <Text className="text-xl font-bold text-warmBrown">Open to connect</Text>
              </View>
              <Text className="text-xs text-gray-500 -mt-0.5">{locationLabel}</Text>
              <Text className="text-xs text-violet-700/90 mt-0.5">
                For {locationLabel} — meet people in your set city &amp; country; switch location to see another area
              </Text>
            </View>
          </View>
        </View>

        {ageLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#6D28D9" />
          </View>
        ) : !ageVerified ? (
          <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="bg-violet-900 rounded-3xl p-6">
              <View className="flex-row items-center mb-3">
                <Shield size={28} color="#E9D5FF" />
                <Text className="text-white text-xl font-bold ml-3 flex-1">Before you enter</Text>
              </View>
              <Text className="text-violet-100 leading-6 text-base">
                The <Text className="font-semibold text-white">connect post wall</Text> is for adults{' '}
                <Text className="font-semibold text-white">18+</Text> who want to meet others nearby (hangouts,
                dating, networking).
              </Text>
              <Text className="text-violet-200/90 leading-6 mt-4">
                Sexual content, harassment, and hate are not allowed. We use moderation and reporting — violations
                can lead to removal or account action.
              </Text>
              <Text className="text-violet-200/80 text-sm mt-4 leading-5">
                This is a self-confirmation on your device only; we do not upload your age here. Meet in public
                first and use block/report if anything feels off.
              </Text>
            </View>

            <Pressable
              onPress={onConfirmAge}
              className="mt-6 bg-violet-700 py-4 rounded-2xl items-center active:opacity-90"
            >
              <Text className="text-white font-bold text-lg">I am 18 or older — continue</Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              className="mt-4 py-3 items-center"
            >
              <Text className="text-gray-600 font-semibold">Go back</Text>
            </Pressable>
          </ScrollView>
        ) : (
          <OpenConnectMembershipPrompt
            userId={currentUser?.id}
            isGuest={!!isGuest}
            areaLabel={locationLabel}
            onOptInChanged={setConnectFeedAllowed}
          >
            <>
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#6D28D9"
                  colors={['#6D28D9']}
                />
              }
            >
              {highlightPostId ? (
                <Pressable
                  onPress={openHighlightedPost}
                  className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex-row items-center active:opacity-90"
                >
                  <View className="flex-1">
                    <Text className="text-amber-950 font-semibold">Open the post from your notification</Text>
                    <Text className="text-amber-900/80 text-sm mt-0.5">Tap to view comments and details</Text>
                  </View>
                  <ChevronRight size={22} color="#B45309" />
                </Pressable>
              ) : null}

              {(!selectedLocation?.city || !selectedLocation?.country) && (
                <View className="mx-4 mt-6 p-4 bg-white rounded-2xl border border-gray-100">
                  <Text className="text-gray-900 font-semibold text-lg">Choose your area</Text>
                  <Text className="text-gray-500 mt-1">
                    Set your city so you only see connect posts from your community.
                  </Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      router.push('/location-select');
                    }}
                    className="mt-4 bg-violet-700 px-5 py-3 rounded-full self-start"
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
                <View className="mx-4 mt-10 p-6 bg-white rounded-2xl border border-violet-100 items-center">
                  <Text className="text-gray-900 font-semibold text-xl text-center">No connect posts yet</Text>
                  <Text className="text-gray-500 text-center mt-2 leading-5">
                    Share that you&apos;re open to hang out, a date, or networking. This wall is only for connect-style
                    posts — your neighbors&apos; general updates stay on Community updates.
                  </Text>
                  <Pressable
                    onPress={openComposer}
                    className="mt-5 bg-violet-700 px-6 py-3 rounded-full"
                  >
                    <Text className="text-white font-semibold">Post to connect wall</Text>
                  </Pressable>
                </View>
              )}

              <View className="h-28" />
            </ScrollView>

            <Pressable
              onPress={openComposer}
              className="absolute bottom-6 right-6"
              style={{
                shadowColor: '#6D28D9',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={['#7C3AED', '#5B21B6']}
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
            </>
          </OpenConnectMembershipPrompt>
        )}
      </SafeAreaView>
    </View>
  );
}
