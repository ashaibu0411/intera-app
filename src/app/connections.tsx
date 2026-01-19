import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowLeft, MapPin, MessageCircle, UserMinus, Users } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useStore } from '@/lib/store';
import { getConnectedUsers, removeConnection } from '@/lib/connections-api';
import { DbUser } from '@/lib/supabase';

function ConnectionCard({
  user,
  onRemove,
  onMessage,
  isRemoving
}: {
  user: DbUser;
  onRemove: () => void;
  onMessage: () => void;
  isRemoving?: boolean;
}) {
  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-center">
        <Pressable onPress={() => router.push(`/profile/${user.id}`)}>
          <Image
            source={{ uri: user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' }}
            style={{ width: 56, height: 56, borderRadius: 28 }}
            contentFit="cover"
          />
        </Pressable>
        <View className="flex-1 ml-3">
          <Text className="text-warmBrown font-semibold text-base">{user.name}</Text>
          <Text className="text-gray-400 text-sm">@{user.username}</Text>
          {user.location && (
            <View className="flex-row items-center mt-1">
              <MapPin size={12} color="#9CA3AF" />
              <Text className="text-gray-400 text-xs ml-1">{user.location}</Text>
            </View>
          )}
        </View>
      </View>

      {user.bio && (
        <Text className="text-gray-600 text-sm mt-3 leading-5" numberOfLines={2}>
          {user.bio}
        </Text>
      )}

      {user.interests && user.interests.length > 0 && (
        <View className="flex-row flex-wrap mt-3">
          {user.interests.slice(0, 3).map((interest) => (
            <View
              key={interest}
              className="bg-forest-50 rounded-full px-2.5 py-1 mr-2 mb-1"
            >
              <Text className="text-forest-700 text-xs">{interest}</Text>
            </View>
          ))}
        </View>
      )}

      <View className="flex-row mt-4 space-x-3">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onMessage();
          }}
          className="flex-1 flex-row items-center justify-center bg-terracotta-500 rounded-xl py-3"
        >
          <MessageCircle size={18} color="#FFFFFF" />
          <Text className="text-white font-medium ml-2">Message</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onRemove();
          }}
          disabled={isRemoving}
          className="flex-row items-center justify-center bg-gray-100 rounded-xl px-4 py-3"
        >
          {isRemoving ? (
            <ActivityIndicator size="small" color="#6B7280" />
          ) : (
            <UserMinus size={18} color="#6B7280" />
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function ConnectionsScreen() {
  const [connections, setConnections] = useState<DbUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  const currentUser = useStore((s) => s.currentUser);

  const loadConnections = useCallback(async () => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('[connections] Loading connected users...');
      const connectedUsers = await getConnectedUsers(currentUser.id);
      console.log('[connections] Loaded', connectedUsers.length, 'connections');
      setConnections(connectedUsers);
    } catch (error) {
      console.error('[connections] Error loading connections:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  useFocusEffect(
    useCallback(() => {
      if (currentUser?.id) {
        loadConnections();
      }
    }, [loadConnections, currentUser?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadConnections();
    setRefreshing(false);
  };

  const handleRemove = async (userId: string) => {
    if (!currentUser?.id) return;

    setRemovingUserId(userId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await removeConnection(currentUser.id, userId);

    if (result.success) {
      setConnections((prev) => prev.filter((c) => c.id !== userId));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    setRemovingUserId(null);
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center px-5 pt-4 pb-4"
        >
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
          <Text className="text-xl font-bold text-warmBrown">Connections</Text>
          <View className="ml-2 bg-terracotta-100 rounded-full px-2 py-0.5">
            <Text className="text-terracotta-600 font-medium text-sm">{connections.length}</Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-5"
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
          {isLoading ? (
            <View className="py-16 items-center">
              <ActivityIndicator size="large" color="#D4673A" />
              <Text className="text-gray-500 mt-4">Loading connections...</Text>
            </View>
          ) : connections.length === 0 ? (
            <Animated.View
              entering={FadeInUp.duration(400).delay(100)}
              className="items-center justify-center py-16"
            >
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <Users size={48} color="#9CA3AF" />
              </View>
              <Text className="text-lg font-semibold text-warmBrown mb-2">No connections yet</Text>
              <Text className="text-gray-500 text-center px-8 mb-6">
                Connect with people in your community to grow your network
              </Text>
              <Pressable
                onPress={() => router.push('/(tabs)/connect')}
                className="bg-terracotta-500 rounded-xl px-6 py-3"
              >
                <Text className="text-white font-medium">Find People</Text>
              </Pressable>
            </Animated.View>
          ) : (
            connections.map((user, index) => (
              <Animated.View
                key={user.id}
                entering={FadeInUp.duration(300).delay(index * 50)}
              >
                <ConnectionCard
                  user={user}
                  onRemove={() => handleRemove(user.id)}
                  onMessage={() => router.push(`/chat/${user.id}`)}
                  isRemoving={removingUserId === user.id}
                />
              </Animated.View>
            ))
          )}
          <View className="h-8" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
