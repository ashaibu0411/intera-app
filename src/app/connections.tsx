import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ArrowLeft, MapPin, MessageCircle, UserMinus } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore, MOCK_USERS, type User } from '@/lib/store';

function ConnectionCard({ user, onRemove, onMessage }: { user: User; onRemove: () => void; onMessage: () => void }) {
  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-center">
        <Image
          source={{ uri: user.avatar }}
          style={{ width: 56, height: 56, borderRadius: 28 }}
          contentFit="cover"
        />
        <View className="flex-1 ml-3">
          <Text className="text-warmBrown font-semibold text-base">{user.name}</Text>
          <Text className="text-gray-400 text-sm">@{user.username}</Text>
          <View className="flex-row items-center mt-1">
            <MapPin size={12} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs ml-1">{user.location}</Text>
          </View>
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
          className="flex-row items-center justify-center bg-gray-100 rounded-xl px-4 py-3"
        >
          <UserMinus size={18} color="#6B7280" />
        </Pressable>
      </View>
    </View>
  );
}

export default function ConnectionsScreen() {
  const connections = useStore((s) => s.connections);
  const removeConnection = useStore((s) => s.removeConnection);

  // If no connections yet, show mock users as suggestions
  const displayConnections = connections.length > 0 ? connections : [];

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
            <Text className="text-terracotta-600 font-medium text-sm">{displayConnections.length}</Text>
          </View>
        </Animated.View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
          {displayConnections.length === 0 ? (
            <Animated.View
              entering={FadeInUp.duration(400).delay(100)}
              className="items-center justify-center py-16"
            >
              <Text className="text-6xl mb-4">👥</Text>
              <Text className="text-lg font-semibold text-warmBrown mb-2">No connections yet</Text>
              <Text className="text-gray-500 text-center px-8 mb-6">
                Connect with people in your community to grow your network
              </Text>

              {/* Suggested connections */}
              <Text className="text-base font-semibold text-warmBrown mb-4 self-start">
                Suggested for you
              </Text>
              {MOCK_USERS.map((user, index) => (
                <SuggestedUserCard key={user.id} user={user} index={index} />
              ))}
            </Animated.View>
          ) : (
            displayConnections.map((user, index) => (
              <Animated.View
                key={user.id}
                entering={FadeInUp.duration(300).delay(index * 50)}
              >
                <ConnectionCard
                  user={user}
                  onRemove={() => removeConnection(user.id)}
                  onMessage={() => router.push(`/chat/${user.id}`)}
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

function SuggestedUserCard({ user, index }: { user: User; index: number }) {
  const addConnection = useStore((s) => s.addConnection);

  return (
    <Animated.View
      entering={FadeInUp.duration(300).delay(200 + index * 50)}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm w-full"
    >
      <View className="flex-row items-center">
        <Image
          source={{ uri: user.avatar }}
          style={{ width: 48, height: 48, borderRadius: 24 }}
          contentFit="cover"
        />
        <View className="flex-1 ml-3">
          <Text className="text-warmBrown font-semibold">{user.name}</Text>
          <Text className="text-gray-400 text-sm">@{user.username}</Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            addConnection(user);
          }}
          className="bg-terracotta-500 rounded-xl px-4 py-2"
        >
          <Text className="text-white font-medium">Connect</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}
