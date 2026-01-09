import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChevronLeft, Search, MessageCircle } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore, type User } from '@/lib/store';
import { supabase, DbUser } from '@/lib/supabase';

export default function NewMessageScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<DbUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const isGuest = useStore((s) => s.isGuest);
  const currentUser = useStore((s) => s.currentUser);

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchQuery.trim()) {
        setUsers([]);
        setHasSearched(false);
        return;
      }

      setIsLoading(true);
      setHasSearched(true);

      try {
        // Search by name or username
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .or(`name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .neq('id', currentUser?.id || '')
          .limit(20);

        if (error) {
          console.error('Error searching users:', error);
          setUsers([]);
        } else {
          setUsers(data || []);
        }
      } catch (err) {
        console.error('Error searching users:', err);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, currentUser?.id]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSelectUser = (user: DbUser) => {
    if (isGuest || !currentUser) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      router.push('/signup');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Create a unique conversation ID for this user
    const conversationId = `user_${user.id}`;
    router.replace(
      `/chat/${conversationId}?name=${encodeURIComponent(user.name)}&avatar=${encodeURIComponent(user.avatar_url || '')}&recipientId=${user.id}`
    );
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="px-4 pt-4 pb-3"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={handleBack}
              className="bg-white rounded-full p-2 shadow-sm"
            >
              <ChevronLeft size={24} color="#2D1F1A" />
            </Pressable>
            <Text className="text-xl font-bold text-warmBrown">New Message</Text>
            <View className="w-10" />
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
            <Search size={20} color="#8B7355" />
            <TextInput
              placeholder="Search people..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-warmBrown text-base"
              autoFocus
            />
          </View>
        </Animated.View>

        {/* Users List */}
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {isLoading ? (
            <View className="items-center pt-12">
              <ActivityIndicator size="large" color="#C87941" />
              <Text className="text-gray-500 text-center mt-4">
                Searching users...
              </Text>
            </View>
          ) : !searchQuery.trim() ? (
            <Animated.View
              entering={FadeInUp.duration(400).delay(200)}
              className="items-center pt-12"
            >
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <Search size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-500 text-center">
                Search for users
              </Text>
              <Text className="text-gray-400 text-sm text-center mt-1">
                Enter a name or username to find people
              </Text>
            </Animated.View>
          ) : users.length === 0 && hasSearched ? (
            <Animated.View
              entering={FadeInUp.duration(400).delay(200)}
              className="items-center pt-12"
            >
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <MessageCircle size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-500 text-center">
                No users found
              </Text>
              <Text className="text-gray-400 text-sm text-center mt-1">
                Try a different search term
              </Text>
            </Animated.View>
          ) : (
            <>
              <Text className="text-sm text-gray-500 mb-3 mt-2">
                Results
              </Text>
              {users.map((user, index) => (
                <Animated.View
                  key={user.id}
                  entering={FadeInUp.duration(300).delay(100 + index * 50)}
                >
                  <Pressable
                    onPress={() => handleSelectUser(user)}
                    className="bg-white rounded-2xl p-4 mb-3 shadow-sm active:scale-98 active:opacity-90"
                  >
                    <View className="flex-row items-center">
                      <Image
                        source={{ uri: user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' }}
                        style={{ width: 52, height: 52, borderRadius: 26 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 ml-3">
                        <Text className="font-semibold text-base text-warmBrown">
                          {user.name}
                        </Text>
                        <Text className="text-gray-500 text-sm">
                          @{user.username}
                        </Text>
                        {user.bio && (
                          <Text className="text-gray-400 text-xs mt-1" numberOfLines={1}>
                            {user.bio}
                          </Text>
                        )}
                      </View>
                      <View className="bg-terracotta-100 rounded-full p-2">
                        <MessageCircle size={18} color="#C87941" />
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
