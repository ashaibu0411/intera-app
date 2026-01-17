import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, RefreshControl, Modal } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Plus, Mic } from 'lucide-react-native';
import { useStore } from '@/lib/store';
import type { DbVoiceRoom } from '@/lib/supabase';
import { createVoiceRoom, listLiveVoiceRooms } from '@/lib/voiceRooms';

export default function VoiceRoomsScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);

  const [rooms, setRooms] = useState<DbVoiceRoom[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');

  const canCreate = useMemo(() => !!currentUser?.id && title.trim().length >= 3, [currentUser?.id, title]);

  const loadRooms = useCallback(async () => {
    const data = await listLiveVoiceRooms(50);
    setRooms(data);
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
    setTitle('');
    setTopic('');
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!currentUser?.id) return;
    if (!canCreate) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const room = await createVoiceRoom({
      creatorId: currentUser.id,
      title: title.trim(),
      topic: topic.trim() ? topic.trim() : undefined,
      country: selectedLocation?.country ?? '',
      admin_area: selectedLocation?.admin_area ?? null,
      city: selectedLocation?.city ?? '',
      neighborhood: selectedLocation?.neighborhood ?? null,
      scope: selectedLocation?.neighborhood ? 'neighborhood' : selectedLocation?.city ? 'city' : 'global',
    });

    setCreateOpen(false);
    router.push(`/voice-room/${room.id}`);
  };

  return (
    <View className="flex-1 bg-[#0A0A0F]">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Voice Rooms',
          headerStyle: { backgroundColor: '#0A0A0F' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
          headerRight: () => (
            <Pressable onPress={openCreate} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <Plus size={20} color="#FFFFFF" />
            </Pressable>
          ),
        }}
      />

      <SafeAreaView edges={['bottom']} className="flex-1">
        <ScrollView
          className="flex-1"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" />}
          contentContainerStyle={{ paddingBottom: 28 }}
        >
          <View className="px-5 pt-6">
            <Text className="text-white text-2xl font-extrabold">Live now</Text>
            <Text className="text-gray-400 mt-2">Clubhouse-style voice rooms with gifting for hosts.</Text>

            {!currentUser?.id ? (
              <View className="mt-5 bg-white/5 border border-white/10 rounded-2xl p-4">
                <Text className="text-white font-semibold">Sign in required</Text>
                <Text className="text-gray-400 mt-1">Create/join rooms after you sign in.</Text>
              </View>
            ) : null}

            <View className="mt-5" style={{ gap: 12 }}>
              {rooms.length === 0 ? (
                <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <Text className="text-white font-semibold">No rooms live</Text>
                  <Text className="text-gray-400 mt-1">Start one and invite neighbors in.</Text>
                  <Pressable onPress={openCreate} className="mt-4 bg-white rounded-2xl py-3 items-center">
                    <Text className="text-gray-900 font-semibold">Start a room</Text>
                  </Pressable>
                </View>
              ) : (
                rooms.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/voice-room/${r.id}`);
                    }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="text-white text-lg font-semibold">{r.title}</Text>
                        <Text className="text-gray-400 mt-1">
                          {r.topic ? `${r.topic} • ` : ''}
                          {r.scope === 'neighborhood'
                            ? r.neighborhood ?? 'Neighborhood'
                            : r.scope === 'city'
                              ? r.city || 'City'
                              : 'Global'}
                        </Text>
                      </View>
                      <View className="w-10 h-10 rounded-full bg-white/10 items-center justify-center">
                        <Mic size={18} color="#FFFFFF" />
                      </View>
                    </View>
                    <View className="mt-3">
                      <Text className="text-emerald-400 font-semibold">LIVE</Text>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
          <View className="flex-1 bg-black/60 items-center justify-center px-5">
            <View className="w-full bg-[#0F0F16] border border-white/10 rounded-3xl p-5">
              <Text className="text-white text-xl font-extrabold">Start a room</Text>
              <Text className="text-gray-400 mt-1">Give it a clear title. You can add a topic.</Text>

              <Text className="text-gray-400 mt-4 text-sm">Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Neighborhood updates + Q&A"
                placeholderTextColor="#6B7280"
                className="mt-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white"
              />

              <Text className="text-gray-400 mt-4 text-sm">Topic (optional)</Text>
              <TextInput
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. Safety, Business, Faith"
                placeholderTextColor="#6B7280"
                className="mt-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white"
              />

              <View className="flex-row mt-5" style={{ gap: 10 }}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCreateOpen(false);
                  }}
                  className="flex-1 bg-white/10 rounded-2xl py-3 items-center"
                >
                  <Text className="text-white font-semibold">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleCreate}
                  disabled={!canCreate}
                  className={`flex-1 rounded-2xl py-3 items-center ${canCreate ? 'bg-white' : 'bg-white/20'}`}
                >
                  <Text className={`font-semibold ${canCreate ? 'text-gray-900' : 'text-white/60'}`}>Go live</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
