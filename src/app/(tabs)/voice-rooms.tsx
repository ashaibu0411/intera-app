import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, TextInput, ScrollView, RefreshControl, Modal, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Plus, Mic, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/lib/store';
import type { DbVoiceRoom } from '@/lib/supabase';
import { createVoiceRoom, listLiveVoiceRooms } from '@/lib/voiceRooms';

function ScopePill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="active:opacity-80">
      <View
        style={{
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: active ? 'rgba(124,58,237,0.14)' : 'rgba(17,24,39,0.06)',
          borderWidth: 1,
          borderColor: active ? 'rgba(124,58,237,0.25)' : 'rgba(17,24,39,0.08)',
        }}
      >
        <Text style={{ color: active ? '#5B21B6' : '#374151', fontWeight: '700', fontSize: 12 }}>{label}</Text>
      </View>
    </Pressable>
  );
}

export default function VoiceRoomsScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const feedFilter = useStore((s) => s.feedFilter);

  const [rooms, setRooms] = useState<DbVoiceRoom[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [creating, setCreating] = useState(false);

  const canCreate = useMemo(() => !!currentUser?.id && title.trim().length >= 3, [currentUser?.id, title]);
  const setFeedFilter = useStore((s) => s.setFeedFilter);

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
        admin_area: selectedLocation?.admin_area ?? null,
        city: selectedLocation?.city ?? '',
        neighborhood: selectedLocation?.neighborhood ?? null,
        scope: selectedLocation?.neighborhood ? 'neighborhood' : selectedLocation?.city ? 'city' : 'global',
      });

      setCreateOpen(false);
      router.push(`/voice-room/${room.id}`);
    } catch (e: any) {
      Alert.alert('Could not start room', String(e?.message ?? e ?? 'Unknown error'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F7FF' }}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Voice Rooms',
          headerStyle: { backgroundColor: '#F7F7FF' },
          headerTintColor: '#111827',
          headerTitleStyle: { fontWeight: '700' },
          headerRight: () => (
            <Pressable onPress={openCreate} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Plus size={18} color="#7C3AED" />
                <Text style={{ color: '#7C3AED', fontWeight: '800', marginLeft: 6 }}>Start</Text>
              </View>
            </Pressable>
          ),
        }}
      />

      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        {/* Hero */}
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          <LinearGradient
            colors={['#7C3AED', '#EC4899', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 16 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Sparkles size={16} color="#fff" />
                  <Text style={{ color: 'rgba(255,255,255,0.95)', fontWeight: '900', marginLeft: 8 }}>
                    Better-than-Clubhouse rooms
                  </Text>
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.92)', marginTop: 8, fontSize: 16, fontWeight: '900' }}>
                  Tap a room to join instantly
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
                  Raise your hand, become a speaker, send gifts to hosts.
                </Text>
              </View>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 16,
                  backgroundColor: 'rgba(255,255,255,0.20)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mic size={20} color="#fff" />
              </View>
            </View>
          </LinearGradient>

          {/* Filters */}
          <View style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
            <ScopePill label="Global" active={feedFilter === 'global'} onPress={() => setFeedFilter('global')} />
            <ScopePill label="City" active={feedFilter === 'city'} onPress={() => setFeedFilter('city')} />
            <ScopePill label="Neighborhood" active={feedFilter === 'neighborhood'} onPress={() => setFeedFilter('neighborhood')} />
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7C3AED" />}
          contentContainerStyle={{ paddingBottom: 28 }}
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827' }}>Live now</Text>
            <Text style={{ marginTop: 6, color: '#4B5563' }}>
              {rooms.length ? 'Jump in — you can listen first, then raise your hand.' : 'Start the first room and invite neighbors.'}
            </Text>

            {!currentUser?.id ? (
              <View style={{ marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(17,24,39,0.08)' }}>
                <Text style={{ color: '#111827', fontWeight: '900' }}>Sign in required</Text>
                <Text style={{ color: '#6B7280', marginTop: 4 }}>Create/join rooms after you sign in.</Text>
              </View>
            ) : null}

            <View style={{ marginTop: 14, gap: 12 }}>
              {rooms.length === 0 ? (
                <LinearGradient
                  colors={['#FFFFFF', '#F3E8FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 22, padding: 16, borderWidth: 1, borderColor: 'rgba(124,58,237,0.16)' }}
                >
                  <Text style={{ color: '#111827', fontWeight: '900', fontSize: 16 }}>No rooms live</Text>
                  <Text style={{ color: '#6B7280', marginTop: 6 }}>Start one — it only takes a few seconds.</Text>
                  <Pressable onPress={openCreate} className="active:opacity-80" style={{ marginTop: 12 }}>
                    <LinearGradient
                      colors={['#7C3AED', '#EC4899']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 16, paddingVertical: 12, alignItems: 'center' }}
                    >
                      <Text style={{ color: '#fff', fontWeight: '900' }}>Start a room</Text>
                    </LinearGradient>
                  </Pressable>
                </LinearGradient>
              ) : (
                rooms.map((r) => (
                  <Pressable
                    key={r.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/voice-room/${r.id}`);
                    }}
                    className="active:opacity-90"
                  >
                    <LinearGradient
                      colors={['#FFFFFF', 'rgba(59,130,246,0.10)', 'rgba(236,72,153,0.10)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 22, padding: 14, borderWidth: 1, borderColor: 'rgba(17,24,39,0.08)' }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                          <Text style={{ color: '#111827', fontWeight: '900', fontSize: 16 }} numberOfLines={2}>
                            {r.title}
                          </Text>
                          <Text style={{ color: '#6B7280', marginTop: 4 }}>
                            {r.topic ? `${r.topic} • ` : ''}
                            {r.scope === 'neighborhood'
                              ? r.neighborhood ?? 'Neighborhood'
                              : r.scope === 'city'
                                ? r.city || 'City'
                                : 'Global'}
                          </Text>
                        </View>

                        <LinearGradient
                          colors={['#22C55E', '#10B981']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }}
                        >
                          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>LIVE</Text>
                        </LinearGradient>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 14,
                              backgroundColor: 'rgba(124,58,237,0.14)',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderWidth: 1,
                              borderColor: 'rgba(124,58,237,0.18)',
                            }}
                          >
                            <Mic size={16} color="#5B21B6" />
                          </View>
                          <Text style={{ marginLeft: 10, color: '#374151', fontWeight: '800' }}>
                            Tap to join
                          </Text>
                        </View>

                        <Text style={{ color: '#6B7280', fontWeight: '700' }}>
                          {r.creator_id === currentUser?.id ? 'Hosted by you' : 'Hosted live'}
                        </Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                ))
              )}
            </View>
          </View>
        </ScrollView>

        {/* Floating start button */}
        {currentUser?.id ? (
          <Pressable
            onPress={openCreate}
            className="active:opacity-90"
            style={{ position: 'absolute', right: 18, bottom: 18 }}
          >
            <LinearGradient
              colors={['#7C3AED', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 58,
                height: 58,
                borderRadius: 22,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 8 },
              }}
            >
              <Plus size={22} color="#fff" />
            </LinearGradient>
          </Pressable>
        ) : null}

        <Modal visible={createOpen} transparent animationType="fade" onRequestClose={() => setCreateOpen(false)}>
          <View className="flex-1 bg-black/40 items-center justify-center px-5">
            <View style={{ width: '100%' }}>
              <LinearGradient
                colors={['#FFFFFF', '#F3E8FF', '#ECFEFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 28, padding: 16, borderWidth: 1, borderColor: 'rgba(17,24,39,0.10)' }}
              >
                <Text style={{ color: '#111827', fontSize: 18, fontWeight: '900' }}>Start a room</Text>
                <Text style={{ color: '#6B7280', marginTop: 6 }}>Pick a clear title — people join faster.</Text>

                <Text style={{ color: '#374151', marginTop: 14, fontSize: 12, fontWeight: '800' }}>Title</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Neighborhood updates + Q&A"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    marginTop: 8,
                    backgroundColor: 'rgba(17,24,39,0.04)',
                    borderWidth: 1,
                    borderColor: 'rgba(17,24,39,0.10)',
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: '#111827',
                    fontWeight: '700',
                  }}
                />

                <Text style={{ color: '#374151', marginTop: 12, fontSize: 12, fontWeight: '800' }}>Topic (optional)</Text>
                <TextInput
                  value={topic}
                  onChangeText={setTopic}
                  placeholder="e.g. Safety, Business, Faith"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    marginTop: 8,
                    backgroundColor: 'rgba(17,24,39,0.04)',
                    borderWidth: 1,
                    borderColor: 'rgba(17,24,39,0.10)',
                    borderRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: '#111827',
                    fontWeight: '700',
                  }}
                />

                <View style={{ flexDirection: 'row', marginTop: 14, gap: 10 }}>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCreateOpen(false);
                    }}
                    className="active:opacity-80"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(17,24,39,0.06)',
                      borderWidth: 1,
                      borderColor: 'rgba(17,24,39,0.08)',
                      borderRadius: 16,
                      paddingVertical: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#111827', fontWeight: '900' }}>Cancel</Text>
                  </Pressable>

                  <Pressable onPress={handleCreate} disabled={!canCreate} className="active:opacity-90" style={{ flex: 1 }}>
                    <LinearGradient
                      colors={canCreate ? ['#7C3AED', '#EC4899'] : ['rgba(17,24,39,0.25)', 'rgba(17,24,39,0.18)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 16, paddingVertical: 12, alignItems: 'center' }}
                    >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {creating ? <ActivityIndicator color="#fff" /> : null}
                      <Text style={{ color: '#fff', fontWeight: '900', marginLeft: creating ? 8 : 0 }}>
                        {creating ? 'Going live…' : 'Go live'}
                      </Text>
                    </View>
                    </LinearGradient>
                  </Pressable>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

