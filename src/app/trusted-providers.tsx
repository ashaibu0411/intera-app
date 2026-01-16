import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Search, MapPin, Plus, Star, Users, Home, ChefHat, Wrench, GraduationCap, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { getServiceProviders, getServiceProviderTrustCounts } from '@/lib/marketplace-api';

const CATEGORIES: Array<{ key: string; label: string; icon: any }> = [
  { key: 'all', label: 'All', icon: Sparkles },
  { key: 'house_help', label: 'House help', icon: Home },
  { key: 'cook', label: 'Cook', icon: ChefHat },
  { key: 'nanny', label: 'Nanny', icon: Users },
  { key: 'plumber', label: 'Plumber', icon: Wrench },
  { key: 'tutor', label: 'Tutor', icon: GraduationCap },
];

export default function TrustedProvidersScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const feedFilter = useStore((s) => s.feedFilter);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [trustById, setTrustById] = useState<Record<string, { reviews: number; avgRating: number; workedForMe: number }>>({});
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');

  const city = selectedLocation?.city || 'Denver';
  const neighborhood = selectedLocation?.neighborhood?.trim();
  const mode = feedFilter; // neighborhood | city | global

  const locationLabel = useMemo(() => {
    if (mode === 'global') return 'Worldwide';
    if (mode === 'neighborhood') return neighborhood ? `${neighborhood}, ${city}` : city;
    return city;
  }, [mode, neighborhood, city]);

  const load = async () => {
    const data = await getServiceProviders(150);
    setProviders(data as any);
    const trustEntries = await Promise.all(
      (data || []).slice(0, 30).map(async (p: any) => [p.id, await getServiceProviderTrustCounts(p.id)] as const)
    );
    const next: Record<string, any> = {};
    for (const [id, t] of trustEntries) next[id] = t;
    setTrustById(next);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = useMemo(() => {
    const matchesArea = (p: any) => {
      if (mode === 'global') return true;
      const blob = `${p.location_label || ''} ${p.city || ''} ${p.neighborhood || ''}`.toLowerCase();
      const cityMatch = blob.includes(city.toLowerCase());
      if (mode === 'city') return cityMatch;
      if (!neighborhood) return cityMatch;
      return blob.includes(neighborhood.toLowerCase()) || cityMatch;
    };

    return (providers || [])
      .filter(matchesArea)
      .filter((p: any) => (cat === 'all' ? true : p.category === cat))
      .filter((p: any) => {
        if (!q.trim()) return true;
        const blob = `${p.title} ${p.bio} ${(p.skills || []).join(' ')} ${(p.user?.name || '')}`.toLowerCase();
        return blob.includes(q.trim().toLowerCase());
      });
  }, [providers, mode, city, neighborhood, cat, q]);

  const goRegister = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isGuest || !currentUser) router.push('/signup');
    else router.push('/register-provider');
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="bg-white rounded-full p-2 shadow-sm"
            >
              <ChevronLeft size={22} color="#2D1F1A" />
            </Pressable>
            <View className="flex-1 ml-3">
              <Text className="text-2xl font-bold text-warmBrown">Trusted Helpers</Text>
              <View className="flex-row items-center mt-0.5">
                <MapPin size={14} color="#D4673A" />
                <Text className="text-sm text-gray-500 ml-1">{locationLabel}</Text>
              </View>
            </View>
            <Pressable onPress={goRegister} className="bg-forest-600 rounded-full p-2.5">
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>

          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 mt-4 shadow-sm">
            <Search size={18} color="#8B7355" />
            <TextInput
              placeholder="Search cooks, house helps, plumbers…"
              placeholderTextColor="#9CA3AF"
              value={q}
              onChangeText={setQ}
              className="flex-1 ml-3 text-warmBrown"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4" style={{ flexGrow: 0 }}>
            <View className="flex-row">
              {CATEGORIES.map((c) => {
                const active = cat === c.key;
                const Icon = c.icon;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCat(c.key);
                    }}
                    className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${active ? 'bg-terracotta-500' : 'bg-white'}`}
                  >
                    <Icon size={14} color={active ? '#fff' : '#8B7355'} />
                    <Text className={`ml-2 font-semibold ${active ? 'text-white' : 'text-warmBrown'}`}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#1B4D3E" />
            <Text className="text-gray-500 mt-3">Loading…</Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-5 pt-4"
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {filtered.length === 0 ? (
              <View className="bg-white rounded-2xl p-6 items-center mt-2">
                <Users size={28} color="#1B4D3E" />
                <Text className="text-warmBrown font-semibold text-lg mt-3">No providers found</Text>
                <Text className="text-gray-500 text-center mt-1">Be the first to register your service in {locationLabel}.</Text>
                <Pressable onPress={goRegister} className="mt-4 bg-forest-600 px-5 py-3 rounded-full">
                  <Text className="text-white font-semibold">Register as a provider</Text>
                </Pressable>
              </View>
            ) : (
              filtered.map((p: any) => {
                const t = trustById[p.id] || { reviews: 0, avgRating: 0, workedForMe: 0 };
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/provider/${p.id}` as any);
                    }}
                    className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-xl bg-forest-50 items-center justify-center">
                        <Users size={18} color="#1B4D3E" />
                      </View>
                      <View className="flex-1 ml-3">
                        <Text className="text-warmBrown font-bold" numberOfLines={1}>{p.user?.name || 'Provider'}</Text>
                        <Text className="text-gray-500 text-sm" numberOfLines={1}>{p.title} • {p.location_label}</Text>
                      </View>
                      <View className="items-end">
                        <View className="flex-row items-center">
                          <Star size={14} color="#C9A227" fill="#C9A227" />
                          <Text className="text-warmBrown font-semibold ml-1">{t.avgRating ? t.avgRating.toFixed(1) : '—'}</Text>
                        </View>
                        <Text className="text-gray-400 text-xs mt-0.5">{t.workedForMe} worked</Text>
                      </View>
                    </View>
                    <Text className="text-gray-600 mt-2" numberOfLines={2}>{p.bio}</Text>
                  </Pressable>
                );
              })
            )}
            <View className="h-10" />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

