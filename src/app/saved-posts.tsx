import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  MapPin,
  Bookmark,
  Calendar,
  ShoppingBag,
  Store,
  FileText,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore, MOCK_POSTS, type Post } from '@/lib/store';
import { getMarketplaceListing, getBusiness, getEvent, getFaithEvent } from '@/lib/marketplace-api';

type SavedTab = 'posts' | 'events' | 'listings' | 'businesses';

function SavedPostCard({ post, onUnsave }: { post: Post; onUnsave: () => void }) {
  const timeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/post/${post.id}`);
      }}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
    >
      <View className="flex-row items-center mb-3">
        <Image
          source={{ uri: post.author.avatar }}
          style={{ width: 36, height: 36, borderRadius: 18 }}
          contentFit="cover"
        />
        <View className="flex-1 ml-3">
          <Text className="text-warmBrown font-semibold">{post.author.name}</Text>
          <Text className="text-gray-400 text-xs">@{post.author.username}</Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onUnsave();
          }}
          className="p-2"
          hitSlop={8}
        >
          <Bookmark size={20} color="#D4673A" fill="#D4673A" />
        </Pressable>
      </View>

      <Text className="text-warmBrown text-base leading-6">{post.content}</Text>

      {post.images.length > 0 && (
        <View className="mt-3 rounded-xl overflow-hidden">
          <Image
            source={{ uri: post.images[0] }}
            style={{ width: '100%', height: 180 }}
            contentFit="cover"
          />
        </View>
      )}

      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <View className="flex-row items-center">
          <MapPin size={14} color="#9CA3AF" />
          <Text className="text-gray-400 text-xs ml-1">{post.location}</Text>
        </View>

        <View className="flex-row items-center space-x-4">
          <View className="flex-row items-center">
            <Heart size={16} color={post.isLiked ? '#EF4444' : '#9CA3AF'} fill={post.isLiked ? '#EF4444' : 'transparent'} />
            <Text className="text-gray-500 text-sm ml-1">{post.likes}</Text>
          </View>
          <View className="flex-row items-center ml-3">
            <MessageCircle size={16} color="#9CA3AF" />
            <Text className="text-gray-500 text-sm ml-1">{post.comments}</Text>
          </View>
          <Text className="text-gray-400 text-xs ml-3">{timeAgo(post.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function SavedEventCard({
  id,
  title,
  date,
  time,
  location,
  image,
  onUnsave,
}: {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image?: string | null;
  onUnsave: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/event/${id}`);
      }}
      className="bg-white rounded-2xl overflow-hidden mb-3 shadow-sm"
    >
      {image && (
        <Image source={{ uri: image }} style={{ width: '100%', height: 120 }} contentFit="cover" />
      )}
      <View className="p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-warmBrown font-semibold text-base">{title}</Text>
            <View className="flex-row items-center mt-2">
              <Calendar size={14} color="#9CA3AF" />
              <Text className="text-gray-500 text-sm ml-1">{date} at {time}</Text>
            </View>
            {location && (
              <View className="flex-row items-center mt-1">
                <MapPin size={14} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm ml-1">{location}</Text>
              </View>
            )}
          </View>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onUnsave();
            }}
            className="p-2"
            hitSlop={8}
          >
            <Bookmark size={20} color="#D4673A" fill="#D4673A" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function SavedListingCard({
  id,
  title,
  price,
  currency,
  images,
  category,
  onUnsave,
}: {
  id: string;
  title: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  onUnsave: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(tabs)/marketplace' as any);
      }}
      className="bg-white rounded-2xl overflow-hidden mb-3 shadow-sm flex-row"
    >
      <Image
        source={{ uri: images[0] || 'https://via.placeholder.com/100' }}
        style={{ width: 100, height: 100 }}
        contentFit="cover"
      />
      <View className="flex-1 p-4 justify-between">
        <View className="flex-row items-start justify-between">
          <Text className="text-warmBrown font-semibold flex-1" numberOfLines={2}>{title}</Text>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onUnsave();
            }}
            className="p-2"
            hitSlop={8}
          >
            <Bookmark size={20} color="#D4673A" fill="#D4673A" />
          </Pressable>
        </View>
        <Text className="text-terracotta-600 font-semibold">{currency} {price}</Text>
        <Text className="text-gray-400 text-xs">{category}</Text>
      </View>
    </Pressable>
  );
}

function SavedBusinessCard({
  id,
  name,
  image,
  category,
  address,
  onUnsave,
}: {
  id: string;
  name: string;
  image: string;
  category: string;
  address: string;
  onUnsave: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/business/${id}`);
      }}
      className="bg-white rounded-2xl overflow-hidden mb-3 shadow-sm flex-row"
    >
      <Image
        source={{ uri: image || 'https://via.placeholder.com/100' }}
        style={{ width: 100, height: 100 }}
        contentFit="cover"
      />
      <View className="flex-1 p-4 justify-between">
        <View className="flex-row items-start justify-between">
          <Text className="text-warmBrown font-semibold flex-1" numberOfLines={2}>{name}</Text>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onUnsave();
            }}
            className="p-2"
            hitSlop={8}
          >
            <Bookmark size={20} color="#D4673A" fill="#D4673A" />
          </Pressable>
        </View>
        <Text className="text-gray-500 text-sm">{category}</Text>
        {address && (
          <View className="flex-row items-center mt-1">
            <MapPin size={12} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs ml-1" numberOfLines={1}>{address}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const TAB_CONFIG: { key: SavedTab; label: string; icon: React.ElementType }[] = [
  { key: 'posts', label: 'Posts', icon: FileText },
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'listings', label: 'Listings', icon: ShoppingBag },
  { key: 'businesses', label: 'Businesses', icon: Store },
];

export default function SavedPostsScreen() {
  const [activeTab, setActiveTab] = useState<SavedTab>('posts');

  const savedPostIds = useStore((s) => s.savedPostIds);
  const savedEventIds = useStore((s) => s.savedEventIds);
  const savedListingIds = useStore((s) => s.savedListingIds);
  const savedBusinessIds = useStore((s) => s.savedBusinessIds);

  const toggleSavePost = useStore((s) => s.toggleSavePost);
  const toggleSaveEvent = useStore((s) => s.toggleSaveEvent);
  const toggleSaveListing = useStore((s) => s.toggleSaveListing);
  const toggleSaveBusiness = useStore((s) => s.toggleSaveBusiness);

  const [events, setEvents] = useState<Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    image?: string | null;
  }>>([]);
  const [listings, setListings] = useState<Array<{
    id: string;
    title: string;
    price: number;
    currency: string;
    images: string[];
    category: string;
  }>>([]);
  const [businesses, setBusinesses] = useState<Array<{
    id: string;
    name: string;
    image: string;
    category: string;
    address: string;
  }>>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  const savedPosts = MOCK_POSTS.filter((p) => savedPostIds.includes(p.id));

  const loadEvents = useCallback(async () => {
    if (savedEventIds.length === 0) {
      setEvents([]);
      return;
    }
    setLoadingEvents(true);
    try {
      const results = await Promise.all(
        savedEventIds.map(async (id) => {
          try {
            const e = await getEvent(id);
            if (e) {
              return {
                id: e.id,
                title: e.title,
                date: e.date,
                time: e.time,
                location: e.location,
                image: e.image,
              };
            }
          } catch {
            try {
              const f = await getFaithEvent(id);
              if (f) {
                return {
                  id: f.id,
                  title: f.title,
                  date: f.date,
                  time: f.time,
                  location: f.location,
                  image: null,
                };
              }
            } catch {}
          }
          return null;
        })
      );
      setEvents(results.filter(Boolean) as any);
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [savedEventIds]);

  const loadListings = useCallback(async () => {
    if (savedListingIds.length === 0) {
      setListings([]);
      return;
    }
    setLoadingListings(true);
    try {
      const results = await Promise.all(
        savedListingIds.map(async (id) => {
          try {
            const l = await getMarketplaceListing(id);
            if (l) {
              return {
                id: l.id,
                title: l.title,
                price: l.price,
                currency: l.currency,
                images: l.images || [],
                category: l.category,
              };
            }
          } catch {}
          return null;
        })
      );
      setListings(results.filter(Boolean) as any);
    } catch {
      setListings([]);
    } finally {
      setLoadingListings(false);
    }
  }, [savedListingIds]);

  const loadBusinesses = useCallback(async () => {
    if (savedBusinessIds.length === 0) {
      setBusinesses([]);
      return;
    }
    setLoadingBusinesses(true);
    try {
      const results = await Promise.all(
        savedBusinessIds.map(async (id) => {
          try {
            const b = await getBusiness(id);
            if (b) {
              return {
                id: b.id,
                name: b.name,
                image: b.image || b.logo || '',
                category: b.category || 'Business',
                address: b.address || '',
              };
            }
          } catch {}
          return null;
        })
      );
      setBusinesses(results.filter(Boolean) as any);
    } catch {
      setBusinesses([]);
    } finally {
      setLoadingBusinesses(false);
    }
  }, [savedBusinessIds]);

  useEffect(() => {
    if (activeTab === 'events') loadEvents();
  }, [activeTab, loadEvents]);

  useEffect(() => {
    if (activeTab === 'listings') loadListings();
  }, [activeTab, loadListings]);

  useEffect(() => {
    if (activeTab === 'businesses') loadBusinesses();
  }, [activeTab, loadBusinesses]);

  const totalSaved = savedPostIds.length + savedEventIds.length + savedListingIds.length + savedBusinessIds.length;

  const renderContent = () => {
    if (activeTab === 'posts') {
      if (savedPosts.length === 0) {
        return (
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="items-center justify-center py-20">
            <Text className="text-6xl mb-4">🔖</Text>
            <Text className="text-lg font-semibold text-warmBrown mb-2">No saved posts</Text>
            <Text className="text-gray-500 text-center px-8">
              Save posts by tapping the bookmark icon on any post
            </Text>
          </Animated.View>
        );
      }
      return savedPosts.map((post, index) => (
        <Animated.View key={post.id} entering={FadeInUp.duration(300).delay(index * 50)}>
          <SavedPostCard post={post} onUnsave={() => toggleSavePost(post.id)} />
        </Animated.View>
      ));
    }

    if (activeTab === 'events') {
      if (loadingEvents) {
        return (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#D4673A" />
          </View>
        );
      }
      if (events.length === 0) {
        return (
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="items-center justify-center py-20">
            <Calendar size={48} color="#9CA3AF" className="mb-4" />
            <Text className="text-lg font-semibold text-warmBrown mb-2">No saved events</Text>
            <Text className="text-gray-500 text-center px-8">
              Save events from the Events or Faith & Community sections
            </Text>
          </Animated.View>
        );
      }
      return events.map((e, i) => (
        <SavedEventCard
          key={e.id}
          id={e.id}
          title={e.title}
          date={e.date}
          time={e.time}
          location={e.location}
          image={e.image}
          onUnsave={() => toggleSaveEvent(e.id)}
        />
      ));
    }

    if (activeTab === 'listings') {
      if (loadingListings) {
        return (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#D4673A" />
          </View>
        );
      }
      if (listings.length === 0) {
        return (
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="items-center justify-center py-20">
            <ShoppingBag size={48} color="#9CA3AF" className="mb-4" />
            <Text className="text-lg font-semibold text-warmBrown mb-2">No saved listings</Text>
            <Text className="text-gray-500 text-center px-8">
              Save marketplace listings by tapping the bookmark icon
            </Text>
          </Animated.View>
        );
      }
      return listings.map((l) => (
        <SavedListingCard
          key={l.id}
          id={l.id}
          title={l.title}
          price={l.price}
          currency={l.currency}
          images={l.images}
          category={l.category}
          onUnsave={() => toggleSaveListing(l.id)}
        />
      ));
    }

    if (activeTab === 'businesses') {
      if (loadingBusinesses) {
        return (
          <View className="py-20 items-center">
            <ActivityIndicator size="large" color="#D4673A" />
          </View>
        );
      }
      if (businesses.length === 0) {
        return (
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="items-center justify-center py-20">
            <Store size={48} color="#9CA3AF" className="mb-4" />
            <Text className="text-lg font-semibold text-warmBrown mb-2">No saved businesses</Text>
            <Text className="text-gray-500 text-center px-8">
              Save businesses from the Business Directory
            </Text>
          </Animated.View>
        );
      }
      return businesses.map((b) => (
        <SavedBusinessCard
          key={b.id}
          id={b.id}
          name={b.name}
          image={b.image}
          category={b.category}
          address={b.address}
          onUnsave={() => toggleSaveBusiness(b.id)}
        />
      ));
    }

    return null;
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <Animated.View entering={FadeIn.duration(300)} className="flex-row items-center px-5 pt-4 pb-4">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="mr-4 p-1"
            hitSlop={8}
          >
            <ArrowLeft size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="text-xl font-bold text-warmBrown">Saved</Text>
          <View className="ml-2 bg-terracotta-100 rounded-full px-2 py-0.5">
            <Text className="text-terracotta-600 font-medium text-sm">{totalSaved}</Text>
          </View>
        </Animated.View>

        {/* Tabs */}
        <View className="flex-row px-5 pb-3 gap-2">
          {TAB_CONFIG.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const count =
              tab.key === 'posts'
                ? savedPostIds.length
                : tab.key === 'events'
                ? savedEventIds.length
                : tab.key === 'listings'
                ? savedListingIds.length
                : savedBusinessIds.length;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab.key);
                }}
                className={`flex-row items-center rounded-full px-4 py-2 ${
                  isActive ? 'bg-terracotta-500' : 'bg-gray-100'
                }`}
              >
                <Icon size={16} color={isActive ? '#fff' : '#6B7280'} />
                <Text
                  className={`ml-2 font-medium text-sm ${isActive ? 'text-white' : 'text-gray-600'}`}
                >
                  {tab.label}
                </Text>
                {count > 0 && (
                  <View className={`ml-2 rounded-full px-2 py-0.5 ${isActive ? 'bg-white/30' : 'bg-gray-200'}`}>
                    <Text className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-600'}`}>
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {renderContent()}
          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
