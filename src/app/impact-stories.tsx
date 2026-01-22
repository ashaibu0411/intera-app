import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Heart, Plus, Search } from 'lucide-react-native';
import { listImpactStories, type ImpactOrgType } from '@/lib/impactStories';
import { useStore } from '@/lib/store';

export default function ImpactStoriesScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);

  const [q, setQ] = useState('');
  const [orgType, setOrgType] = useState<ImpactOrgType | 'all'>('all');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<Array<any>>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const placeholder = useMemo(() => {
    if (orgType === 'school') return 'Search schools (name, mission, story)…';
    if (orgType === 'nonprofit') return 'Search nonprofits (name, mission, story)…';
    return 'Search impact stories…';
  }, [orgType]);

  const load = useCallback(async () => {
    setBusy(true);
    setErrorMsg(null);
    try {
      const data = await listImpactStories({ q, orgType, limit: 50 });
      setItems(data);
    } catch (e) {
      setErrorMsg(String((e as any)?.message || e));
    } finally {
      setBusy(false);
    }
  }, [q, orgType]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 250);
    return () => clearTimeout(t);
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const openCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isGuest || !currentUser) {
      router.push('/signup');
      return;
    }
    router.push('/create-impact-story');
  };

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen
        options={{
          title: 'Impact Stories',
          headerStyle: { backgroundColor: '#FDF7F2' },
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable onPress={openCreate} className="mr-1">
              <View className="flex-row items-center">
                <Plus size={18} color="#C45C26" />
                <Text className="ml-1 text-terracotta-500 font-semibold">Share</Text>
              </View>
            </Pressable>
          ),
        }}
      />

      {/* Search + filters */}
      <View className="px-5 pt-3">
        <View className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex-row items-center">
          <Search size={18} color="#9CA3AF" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            className="flex-1 ml-3 text-gray-900"
          />
        </View>

        <View className="flex-row mt-3">
          {([
            { id: 'all', label: 'All' },
            { id: 'school', label: 'Schools' },
            { id: 'nonprofit', label: 'Nonprofits' },
          ] as const).map((t) => {
            const active = orgType === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setOrgType(t.id);
                }}
                className={`mr-2 px-3 py-2 rounded-full border ${active ? 'bg-terracotta-500 border-terracotta-500' : 'bg-white border-gray-200'}`}
              >
                <Text className={`${active ? 'text-white' : 'text-gray-700'} font-semibold text-sm`}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Intro card */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row items-center">
            <View className="bg-terracotta-50 rounded-full p-2.5">
              <Heart size={18} color="#C45C26" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-warmBrown font-bold">Support real work, worldwide</Text>
              <Text className="text-gray-500 text-sm mt-0.5">
                Schools and nonprofits can share their story and how to donate, apply grants, or sponsor.
              </Text>
            </View>
          </View>
        </View>

        {busy ? (
          <View className="mt-6 items-center">
            <ActivityIndicator />
            <Text className="text-gray-500 mt-2">Loading stories…</Text>
          </View>
        ) : errorMsg ? (
          <View className="mt-6 bg-red-50 border border-red-100 rounded-2xl p-4">
            <Text className="text-red-700 font-semibold">Couldn’t load stories</Text>
            <Text className="text-red-700 mt-1 text-sm">{errorMsg}</Text>
          </View>
        ) : items.length === 0 ? (
          <View className="mt-6 bg-white border border-gray-100 rounded-2xl p-4">
            <Text className="text-warmBrown font-bold">No stories yet</Text>
            <Text className="text-gray-500 mt-1">
              Be the first to share a school or nonprofit story.
            </Text>
            <Pressable onPress={openCreate} className="mt-3 bg-terracotta-500 rounded-xl px-4 py-3">
              <Text className="text-white font-semibold text-center">Share a story</Text>
            </Pressable>
          </View>
        ) : (
          <View className="mt-4">
            {items.map((it: any) => (
              <Pressable
                key={it.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/impact-story/${it.id}`);
                }}
                className="bg-white rounded-2xl p-4 border border-gray-100 mb-3"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-warmBrown font-bold text-base" numberOfLines={1}>
                    {it.org_name}
                  </Text>
                  <View className={`px-2 py-1 rounded-full ${it.org_type === 'school' ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
                    <Text className={`${it.org_type === 'school' ? 'text-emerald-700' : 'text-indigo-700'} text-xs font-semibold`}>
                      {it.org_type === 'school' ? 'School' : 'Nonprofit'}
                    </Text>
                  </View>
                </View>

                <Text className="text-gray-500 text-sm mt-1" numberOfLines={1}>
                  {[it.city, it.country].filter(Boolean).join(', ')}
                </Text>

                <Text className="text-gray-700 mt-3 leading-6" numberOfLines={3}>
                  {it.mission}
                </Text>

                <View className="flex-row flex-wrap mt-3">
                  {(it.needs || []).slice(0, 3).map((n: string) => (
                    <View key={n} className="mr-2 mb-2 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100">
                      <Text className="text-gray-700 text-xs font-semibold">
                        {n === 'donations' ? 'Donations' : n === 'grants' ? 'Grants' : 'Sponsorships'}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="flex-row mt-2">
                  <Text className="text-terracotta-500 font-semibold text-sm">Open</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

