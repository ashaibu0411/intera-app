import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, RefreshControl, Modal, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Plus, Mic, Users, MapPin, Globe, Building2, Home, Sparkles, ArrowUpRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useStore } from '@/lib/store';
import type { DbVoiceRoom } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { createVoiceRoom, listLiveVoiceRoomsWithCounts } from '@/lib/voiceRooms';

type RoomWithCounts = DbVoiceRoom & { participant_count: number; host_name?: string };

const LIVE_COLORS = {
  bg: '#050A0E',
  card: 'rgba(255,255,255,0.06)',
  card2: 'rgba(255,255,255,0.10)',
  border: 'rgba(255,255,255,0.10)',
  text: '#EAF2F0',
  subtext: 'rgba(234,242,240,0.72)',
  muted: 'rgba(234,242,240,0.50)',
  emerald: '#12B981',
  teal: '#2DD4BF',
  gold: '#E6B35A',
} as const;

function ScopePill({ label, icon: Icon, active, onPress }: { label: string; icon: React.ElementType; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      {active ? (
        <LinearGradient
          colors={['#0EA5E9', '#12B981'] as const}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 }}
        >
          <View className="flex-row items-center">
            <Icon size={14} color="#06120F" />
            <Text className="ml-2 font-extrabold text-[13px]" style={{ color: '#06120F' }}>
              {label}
            </Text>
          </View>
        </LinearGradient>
      ) : (
        <View
          className="flex-row items-center px-4 py-2.5 rounded-full"
          style={{ backgroundColor: LIVE_COLORS.card, borderWidth: 1, borderColor: LIVE_COLORS.border }}
        >
          <Icon size={14} color={LIVE_COLORS.subtext} />
          <Text className="ml-2 font-semibold text-[13px]" style={{ color: LIVE_COLORS.subtext }}>
            {label}
          </Text>
        </View>
      )}
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
      <LinearGradient
        colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.04)'] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 22, padding: 1 }}
      >
        <View style={{ backgroundColor: 'rgba(5,10,14,0.75)', borderRadius: 21, padding: 16 }}>
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-extrabold text-[17px] leading-6" style={{ color: LIVE_COLORS.text }} numberOfLines={2}>
                {room.title}
              </Text>
              {room.topic ? (
                <Text className="text-[13px] mt-1" style={{ color: LIVE_COLORS.subtext }} numberOfLines={1}>
                  {room.topic}
                </Text>
              ) : (
                <Text className="text-[13px] mt-1" style={{ color: LIVE_COLORS.muted }} numberOfLines={1}>
                  Live conversation
                </Text>
              )}
            </View>

            <View className="items-end">
              <View
                className="rounded-full px-3 py-1.5"
                style={{ backgroundColor: 'rgba(18,185,129,0.18)', borderWidth: 1, borderColor: 'rgba(18,185,129,0.35)' }}
              >
                <Text className="text-[11px] font-extrabold" style={{ color: LIVE_COLORS.emerald }}>
                  LIVE
                </Text>
              </View>
              <View className="flex-row items-center mt-2">
                <Users size={14} color={LIVE_COLORS.gold} />
                <Text className="ml-1 font-extrabold text-[12px]" style={{ color: LIVE_COLORS.gold }}>
                  {room.participant_count}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center mt-4">
            <View className="flex-row items-center flex-1">
              <LinearGradient
                colors={['rgba(45,212,191,0.25)', 'rgba(14,165,233,0.20)'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
              >
                <Mic size={16} color={LIVE_COLORS.text} />
              </LinearGradient>
              <View className="ml-3">
                <Text className="font-bold text-[13px]" style={{ color: LIVE_COLORS.text }}>
                  {isOwner ? 'You' : room.host_name ?? 'Host'}
                </Text>
                <Text className="text-[11px] font-semibold" style={{ color: LIVE_COLORS.muted }}>
                  Host
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <View
                className="flex-row items-center rounded-full px-3 py-1.5"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: LIVE_COLORS.border }}
              >
                <ScopeIcon size={12} color={LIVE_COLORS.subtext} />
                <Text className="ml-1 text-[11px] font-semibold" style={{ color: LIVE_COLORS.subtext }} numberOfLines={1}>
                  {scopeLabel.length > 14 ? scopeLabel.substring(0, 12) + '…' : scopeLabel}
                </Text>
              </View>
              <View className="w-2" />
              <View
                className="rounded-full p-2"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: LIVE_COLORS.border }}
              >
                <ArrowUpRight size={14} color={LIVE_COLORS.text} />
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function VoiceRoomsScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const feedFilter = useStore((s) => s.feedFilter);
  const setFeedFilter = useStore((s) => s.setFeedFilter);

  const [authUserId, setAuthUserId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!cancelled) setAuthUserId(data?.user?.id ?? null);
      } catch {
        if (!cancelled) setAuthUserId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const effectiveUserId = authUserId ?? currentUser?.id ?? null;

  const [rooms, setRooms] = useState<RoomWithCounts[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [creating, setCreating] = useState(false);

  const canCreate = useMemo(() => !!effectiveUserId && title.trim().length >= 3, [effectiveUserId, title]);

  const filteredRooms = useMemo(() => {
    const city = (selectedLocation?.city || '').trim();
    const neighborhood = (selectedLocation?.neighborhood || '').trim();

    if (feedFilter === 'neighborhood') {
      if (!city || !neighborhood) return [];
      return rooms.filter((r) =>
        r.scope === 'neighborhood' &&
        String(r.city || '').trim().toLowerCase() === city.toLowerCase() &&
        String(r.neighborhood || '').trim().toLowerCase() === neighborhood.toLowerCase()
      );
    }

    if (feedFilter === 'city') {
      if (!city) return [];
      // City view includes both city-wide and neighborhood rooms inside the city.
      return rooms.filter((r) =>
        (r.scope === 'city' || r.scope === 'neighborhood') &&
        String(r.city || '').trim().toLowerCase() === city.toLowerCase()
      );
    }

    // Global shows everything
    return rooms;
  }, [feedFilter, rooms, selectedLocation?.city, selectedLocation?.neighborhood]);

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
    if (!effectiveUserId) {
      Alert.alert('Sign in required', 'Please sign in to start a room.');
      return;
    }
    setTitle('');
    setTopic('');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!effectiveUserId) {
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

      const scope = feedFilter === 'neighborhood' ? 'neighborhood' : feedFilter === 'city' ? 'city' : 'global';
      const city = (selectedLocation?.city || '').trim();
      const neighborhood = (selectedLocation?.neighborhood || '').trim();

      if (scope === 'neighborhood' && (!city || !neighborhood)) {
        Alert.alert('Choose your neighborhood', 'Select a city and neighborhood first to start a neighborhood room.');
        return;
      }
      if (scope === 'city' && !city) {
        Alert.alert('Choose your city', 'Select a city first to start a city room.');
        return;
      }

      const room = await createVoiceRoom({
        creatorId: effectiveUserId,
        title: title.trim(),
        topic: topic.trim() ? topic.trim() : undefined,
        country: selectedLocation?.country ?? '',
        city: scope === 'global' ? '' : city,
        neighborhood: scope === 'neighborhood' ? neighborhood : null,
        scope,
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
    <View className="flex-1" style={{ backgroundColor: LIVE_COLORS.bg }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Intera Live',
          headerStyle: { backgroundColor: LIVE_COLORS.bg },
          headerTintColor: LIVE_COLORS.text,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable onPress={openCreate} className="flex-row items-center px-3 py-1.5">
              <Sparkles size={18} color={LIVE_COLORS.gold} />
              <Text className="font-extrabold ml-1.5" style={{ color: LIVE_COLORS.gold }}>
                Go live
              </Text>
            </Pressable>
          ),
        }}
      />

      <SafeAreaView edges={['bottom']} className="flex-1">
        {/* Hero Banner */}
        <Animated.View entering={FadeInDown.duration(400)} className="px-4 pt-2">
          <LinearGradient
            colors={['#0B1020', '#062A1E', '#0B2B2A'] as const}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 20, padding: 16 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-white/80 font-extrabold text-xs tracking-widest">INTERA LIVE</Text>
                <Text className="text-white font-extrabold text-[20px] mt-1" numberOfLines={2}>
                  Rooms happening in {cityName}
                </Text>
                <Text className="text-white/70 text-sm mt-2">
                  Listen in, raise your hand, react, and join the stage.
                </Text>
              </View>
              <LinearGradient
                colors={['rgba(230,179,90,0.28)', 'rgba(18,185,129,0.18)'] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 20,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.14)',
                }}
              >
                <Mic size={26} color="#FFFFFF" />
              </LinearGradient>
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={LIVE_COLORS.emerald} />}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-4 pt-4">
            <Text className="font-extrabold text-[22px]" style={{ color: LIVE_COLORS.text }}>
              Live now
            </Text>
            <Text className="mt-1 text-[13px]" style={{ color: LIVE_COLORS.subtext }}>
              {filteredRooms.length > 0 ? `${filteredRooms.length} room${filteredRooms.length > 1 ? 's' : ''} active` : 'No rooms live right now'}
            </Text>

            {!effectiveUserId && (
              <View className="rounded-2xl p-4 mt-4" style={{ backgroundColor: LIVE_COLORS.card, borderWidth: 1, borderColor: LIVE_COLORS.border }}>
                <Text className="font-bold" style={{ color: LIVE_COLORS.text }}>
                  Sign in to join or host
                </Text>
                <Text className="text-sm mt-1" style={{ color: LIVE_COLORS.subtext }}>
                  Create an account to go live and connect in real time.
                </Text>
              </View>
            )}

            {loading ? (
              <View className="py-12 items-center">
                <ActivityIndicator color={LIVE_COLORS.emerald} />
                <Text className="mt-3" style={{ color: LIVE_COLORS.subtext }}>
                  Loading rooms…
                </Text>
              </View>
            ) : filteredRooms.length === 0 ? (
              <View className="rounded-3xl p-6 mt-4 items-center" style={{ backgroundColor: LIVE_COLORS.card, borderWidth: 1, borderColor: LIVE_COLORS.border }}>
                <LinearGradient
                  colors={['rgba(45,212,191,0.22)', 'rgba(14,165,233,0.18)'] as const}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 26,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.14)',
                  }}
                >
                  <Mic size={30} color="#FFFFFF" />
                </LinearGradient>
                <Text className="font-extrabold text-lg mt-4" style={{ color: LIVE_COLORS.text }}>
                  No rooms live
                </Text>
                <Text className="text-center mt-2" style={{ color: LIVE_COLORS.subtext }}>
                  Be the first to start something that brings people together.
                </Text>
                {effectiveUserId && (
                  <Pressable onPress={openCreate} className="mt-5 active:opacity-90">
                    <LinearGradient
                      colors={['#E6B35A', '#12B981'] as const}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 16, paddingHorizontal: 22, paddingVertical: 12 }}
                    >
                      <View className="flex-row items-center">
                        <Sparkles size={16} color="#06120F" />
                        <Text className="font-extrabold ml-2" style={{ color: '#06120F' }}>
                          Start Intera Live
                        </Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                )}
              </View>
            ) : (
              <View className="mt-4 gap-3">
                {filteredRooms.map((room, index) => (
                  <Animated.View key={room.id} entering={FadeInUp.duration(300).delay(150 + index * 50)}>
                    <RoomCard room={room} isOwner={room.creator_id === effectiveUserId} />
                  </Animated.View>
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Floating Create Button */}
        {effectiveUserId && (
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
              colors={['#E6B35A', '#12B981'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={24} color="#06120F" />
            </LinearGradient>
          </Pressable>
        )}

        {/* Create Room Modal */}
        <Modal visible={createOpen} transparent animationType="slide" onRequestClose={() => setCreateOpen(false)}>
          <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setCreateOpen(false)}>
            <Pressable onPress={(e) => e.stopPropagation()} className="w-full">
              <View className="rounded-t-3xl p-5" style={{ backgroundColor: '#081018', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.10)' }}>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="font-extrabold text-[20px]" style={{ color: LIVE_COLORS.text }}>
                      Start Intera Live
                    </Text>
                    <Text className="mt-1" style={{ color: LIVE_COLORS.subtext }}>
                      Create a room for your community in seconds.
                    </Text>
                  </View>
                  <View className="rounded-2xl px-3 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: LIVE_COLORS.border }}>
                    <Text className="text-[12px] font-extrabold" style={{ color: LIVE_COLORS.gold }}>
                      {feedFilter === 'neighborhood' ? 'Neighborhood' : feedFilter === 'city' ? 'City' : 'Global'}
                    </Text>
                  </View>
                </View>

                <Text className="font-bold text-sm mt-5" style={{ color: LIVE_COLORS.text }}>
                  Room title
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Community Q&A, Business Tips"
                  placeholderTextColor="rgba(234,242,240,0.40)"
                  className="mt-2 rounded-2xl px-4 py-3 font-semibold"
                  style={{ color: LIVE_COLORS.text, backgroundColor: LIVE_COLORS.card, borderWidth: 1, borderColor: LIVE_COLORS.border }}
                />

                <Text className="font-bold text-sm mt-4" style={{ color: LIVE_COLORS.text }}>
                  Topic (optional)
                </Text>
                <TextInput
                  value={topic}
                  onChangeText={setTopic}
                  placeholder="e.g. Safety, Faith, Business"
                  placeholderTextColor="rgba(234,242,240,0.40)"
                  className="mt-2 rounded-2xl px-4 py-3 font-semibold"
                  style={{ color: LIVE_COLORS.text, backgroundColor: LIVE_COLORS.card, borderWidth: 1, borderColor: LIVE_COLORS.border }}
                />

                <View className="rounded-2xl p-3 mt-4" style={{ backgroundColor: LIVE_COLORS.card2, borderWidth: 1, borderColor: LIVE_COLORS.border }}>
                  <View className="flex-row items-center">
                    <MapPin size={14} color={LIVE_COLORS.teal} />
                    <Text className="font-semibold ml-2" style={{ color: LIVE_COLORS.subtext }}>
                      Visible to: {feedFilter === 'neighborhood' ? 'Neighborhood' : feedFilter === 'city' ? 'City' : 'Global'}
                    </Text>
                  </View>
                </View>

                <View className="flex-row mt-5 gap-3">
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCreateOpen(false);
                    }}
                    className="flex-1 rounded-2xl py-3.5 items-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: LIVE_COLORS.border }}
                  >
                    <Text className="font-semibold" style={{ color: LIVE_COLORS.subtext }}>
                      Cancel
                    </Text>
                  </Pressable>

                  <Pressable onPress={handleCreate} disabled={!canCreate || creating} className="flex-1">
                    <LinearGradient
                      colors={canCreate ? (['#E6B35A', '#12B981'] as const) : (['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.10)'] as const)}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 16, paddingVertical: 14, alignItems: 'center' }}
                    >
                      <View className="flex-row items-center">
                        {creating && <ActivityIndicator color={canCreate ? '#06120F' : '#EAF2F0'} size="small" />}
                        <Text className={`font-extrabold ${creating ? 'ml-2' : ''}`} style={{ color: canCreate ? '#06120F' : LIVE_COLORS.muted }}>
                          {creating ? 'Going live…' : 'Go live'}
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
