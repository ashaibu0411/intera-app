import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, RefreshControl, Modal, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Plus, Mic, Users, MapPin, Globe, Building2, Home } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useStore } from '@/lib/store';
import type { DbVoiceRoom } from '@/lib/supabase';
import { createVoiceRoom, listLiveVoiceRoomsWithCounts } from '@/lib/voiceRooms';

type RoomWithCounts = DbVoiceRoom & { participant_count: number; host_name?: string };

function ScopePill({ label, icon: Icon, active, onPress }: { label: string; icon: React.ElementType; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      <View
        className={`flex-row items-center px-4 py-2.5 rounded-full ${active ? 'bg-forest-600' : 'bg-white border border-gray-200'}`}
      >
        <Icon size={14} color={active ? '#fff' : '#1B4D3E'} />
        <Text className={`ml-2 font-semibold text-sm ${active ? 'text-white' : 'text-warmBrown'}`}>{label}</Text>
      </View>
    </Pressable>
  );
}

function RoomCard({ room, isOwner }: { room: RoomWithCounts; isOwner: boolean }) {
  const scopeIcon = room.scope === 'neighborhood' ? Home : room.scope === 'city' ? Building2 : Globe;
  const ScopeIcon = scopeIcon;
  const scopeLabel = room.scope === 'neighborhood'
    ? room.neighborhood ?? 'Neighborhood'
    : room.scope === 'city'
      ? room.city || 'City'
      : 'Global';

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/voice-room/${room.id}`);
      }}
      className="active:opacity-90"
    >
      <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-warmBrown font-bold text-lg" numberOfLines={2}>
              {room.title}
            </Text>
            {room.topic && (
              <Text className="text-gray-500 text-sm mt-1">{room.topic}</Text>
            )}
          </View>

          <View className="bg-emerald-500 rounded-full px-3 py-1.5">
            <Text className="text-white font-bold text-xs">LIVE</Text>
          </View>
        </View>

        <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
          <View className="flex-row items-center flex-1">
            <View className="w-8 h-8 rounded-full bg-forest-100 items-center justify-center">
              <Mic size={14} color="#1B4D3E" />
            </View>
            <View className="ml-2">
              <Text className="text-warmBrown font-medium text-sm">
                {isOwner ? 'You' : room.host_name ?? 'Host'}
              </Text>
              <Text className="text-gray-400 text-xs">Host</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="flex-row items-center bg-gold-50 rounded-full px-3 py-1.5 mr-2">
              <Users size={12} color="#C9A227" />
              <Text className="text-gold-700 font-semibold text-xs ml-1">{room.participant_count}</Text>
            </View>

            <View className="flex-row items-center bg-gray-100 rounded-full px-3 py-1.5">
              <ScopeIcon size={12} color="#6B7280" />
              <Text className="text-gray-600 font-medium text-xs ml-1" numberOfLines={1}>
                {scopeLabel.length > 12 ? scopeLabel.substring(0, 10) + '...' : scopeLabel}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function VoiceRoomsScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const feedFilter = useStore((s) => s.feedFilter);
  const setFeedFilter = useStore((s) => s.setFeedFilter);

  const [rooms, setRooms] = useState<RoomWithCounts[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [creating, setCreating] = useState(false);

  const canCreate = useMemo(() => !!currentUser?.id && title.trim().length >= 3, [currentUser?.id, title]);

  const loadRooms = useCallback(async () => {
    try {
      const data = await listLiveVoiceRoomsWithCounts(50);
      setRooms(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms().catch(() => null);
  }, [loadRooms]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadRooms();
    } finally {
      setRefreshing(false);
    }
  }, [loadRooms]);

  const openCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!currentUser?.id) {
      Alert.alert('Sign in required', 'Please sign in to start a room.');
      return;
    }
    setTitle('');
    setTopic('');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!currentUser?.id) {
      Alert.alert('Sign in required', 'Please sign in to start a room.');
      return;
    }
    if (!canCreate) {
      Alert.alert('Room title too short', 'Please enter a title (at least 3 characters).');
      return;
    }
    if (creating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      setCreating(true);
      const room = await createVoiceRoom({
        creatorId: currentUser.id,
        title: title.trim(),
        topic: topic.trim() ? topic.trim() : undefined,
        country: selectedLocation?.country ?? '',
        city: selectedLocation?.city ?? '',
        neighborhood: selectedLocation?.neighborhood ?? null,
        scope: selectedLocation?.neighborhood ? 'neighborhood' : selectedLocation?.city ? 'city' : 'global',
      });

      setCreateOpen(false);
      router.push(`/voice-room/${room.id}`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('Could not start room', errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const cityName = selectedLocation?.city || 'your area';

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Voice Rooms',
          headerStyle: { backgroundColor: '#FBF9F7' },
          headerTintColor: '#2D1F1A',
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable onPress={openCreate} className="flex-row items-center px-3 py-1.5">
              <Plus size={18} color="#D4673A" />
              <Text className="text-terracotta-500 font-bold ml-1.5">Start</Text>
            </Pressable>
          ),
        }}
      />

      <SafeAreaView edges={['bottom']} className="flex-1">
        {/* Hero Banner */}
        <Animated.View entering={FadeInDown.duration(400)} className="px-4 pt-2">
          <LinearGradient
            colors={['#1B4D3E', '#2D6A4F'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 16 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-white/90 font-bold text-sm">Live Audio Rooms</Text>
                <Text className="text-white font-bold text-lg mt-1">
                  Join conversations in {cityName}
                </Text>
                <Text className="text-white/80 text-sm mt-1">
                  Listen, raise your hand, and speak
                </Text>
              </View>
              <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center">
                <Mic size={24} color="#fff" />
              </View>
            </View>
          </LinearGradient>

          {/* Scope Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-3"
            contentContainerStyle={{ gap: 8 }}
            style={{ flexGrow: 0 }}
          >
            <ScopePill label="Global" icon={Globe} active={feedFilter === 'global'} onPress={() => setFeedFilter('global')} />
            <ScopePill label="City" icon={Building2} active={feedFilter === 'city'} onPress={() => setFeedFilter('city')} />
            <ScopePill label="Neighborhood" icon={Home} active={feedFilter === 'neighborhood'} onPress={() => setFeedFilter('neighborhood')} />
          </ScrollView>
        </Animated.View>

        <ScrollView
          className="flex-1"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1B4D3E" />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-4 pt-4">
            <Text className="text-warmBrown font-bold text-xl">Live Now</Text>
            <Text className="text-gray-500 mt-1">
              {rooms.length > 0 ? `${rooms.length} room${rooms.length > 1 ? 's' : ''} active` : 'No rooms live right now'}
            </Text>

            {!currentUser?.id && (
              <View className="bg-gold-50 border border-gold-200 rounded-2xl p-4 mt-4">
                <Text className="text-gold-800 font-semibold">Sign in to join or host</Text>
                <Text className="text-gold-600 text-sm mt-1">Create an account to participate in voice rooms.</Text>
              </View>
            )}

            {loading ? (
              <View className="py-12 items-center">
                <ActivityIndicator color="#1B4D3E" />
                <Text className="text-gray-500 mt-3">Loading rooms...</Text>
              </View>
            ) : rooms.length === 0 ? (
              <View className="bg-white rounded-2xl p-6 mt-4 items-center border border-gray-100">
                <View className="w-16 h-16 rounded-full bg-forest-100 items-center justify-center mb-4">
                  <Mic size={28} color="#1B4D3E" />
                </View>
                <Text className="text-warmBrown font-bold text-lg">No rooms live</Text>
                <Text className="text-gray-500 text-center mt-2">
                  Be the first to start a conversation in your community!
                </Text>
                {currentUser?.id && (
                  <Pressable onPress={openCreate} className="mt-4">
                    <LinearGradient
                      colors={['#D4673A', '#B85430'] as const}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
                    >
                      <Text className="text-white font-bold">Start a Room</Text>
                    </LinearGradient>
                  </Pressable>
                )}
              </View>
            ) : (
              <View className="mt-4 gap-3">
                {rooms.map((room, index) => (
                  <Animated.View key={room.id} entering={FadeInUp.duration(300).delay(150 + index * 50)}>
                    <RoomCard room={room} isOwner={room.creator_id === currentUser?.id} />
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Floating Create Button */}
        {currentUser?.id && (
          <Pressable
            onPress={openCreate}
            className="absolute right-4 bottom-4"
            style={{
              shadowColor: '#000',
              shadowOpacity: 0.15,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 6 },
            }}
          >
            <LinearGradient
              colors={['#D4673A', '#B85430'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={24} color="#fff" />
            </LinearGradient>
          </Pressable>
        )}

        {/* Create Room Modal */}
        <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
          <Pressable className="flex-1 bg-black/40 items-center justify-center px-5" onPress={() => setCreateOpen(false)}>
            <Pressable onPress={(e) => e.stopPropagation()} className="w-full">
              <View className="bg-cream rounded-3xl p-5">
                <Text className="text-warmBrown font-bold text-xl">Start a Room</Text>
                <Text className="text-gray-500 mt-1">Create a live audio space for your community</Text>

                <Text className="text-warmBrown font-semibold text-sm mt-5">Room Title</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Community Q&A, Business Tips"
                  placeholderTextColor="#9CA3AF"
                  className="mt-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-warmBrown font-medium"
                />

                <Text className="text-warmBrown font-semibold text-sm mt-4">Topic (optional)</Text>
                <TextInput
                  value={topic}
                  onChangeText={setTopic}
                  placeholder="e.g. Safety, Faith, Business"
                  placeholderTextColor="#9CA3AF"
                  className="mt-2 bg-white border border-gray-200 rounded-xl px-4 py-3 text-warmBrown font-medium"
                />

                <View className="bg-forest-50 border border-forest-200 rounded-xl p-3 mt-4">
                  <View className="flex-row items-center">
                    <MapPin size={14} color="#1B4D3E" />
                    <Text className="text-forest-700 font-medium ml-2">
                      Visible to: {selectedLocation?.neighborhood ? 'Neighborhood' : selectedLocation?.city ? 'City' : 'Global'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row mt-5 gap-3">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCreateOpen(false);
                    }}
                    className="flex-1 bg-gray-100 rounded-xl py-3.5 items-center"
                  >
                    <Text className="text-warmBrown font-semibold">Cancel</Text>
                  </Pressable>

                  <Pressable onPress={handleCreate} disabled={!canCreate || creating} className="flex-1">
                    <LinearGradient
                      colors={canCreate ? ['#1B4D3E', '#2D6A4F'] as const : ['#D1D5DB', '#E5E7EB'] as const}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}
                    >
                      <View className="flex-row items-center">
                        {creating && <ActivityIndicator color="#fff" size="small" />}
                        <Text className={`font-bold ${canCreate ? 'text-white' : 'text-gray-400'} ${creating ? 'ml-2' : ''}`}>
                          {creating ? 'Going live...' : 'Go Live'}
                        </Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
