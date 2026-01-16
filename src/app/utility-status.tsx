import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Plus, Zap, Droplets, Wifi, TrafficCone } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { getUtilityReports } from '@/lib/marketplace-api';

const ICONS: Record<string, any> = {
  power: Zap,
  water: Droplets,
  internet: Wifi,
  road: TrafficCone,
};

export default function UtilityStatusScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState<any[]>([]);

  const selectedLocation = useStore((s) => s.selectedLocation);
  const feedFilter = useStore((s) => s.feedFilter);

  const city = selectedLocation?.city || 'Denver';
  const neighborhood = selectedLocation?.neighborhood?.trim();
  const mode = feedFilter; // 'neighborhood' | 'city' | 'global'

  const locationLabel = useMemo(() => {
    if (mode === 'global') return 'Worldwide';
    if (mode === 'neighborhood') return neighborhood ? `${neighborhood}, ${city}` : city;
    return city;
  }, [mode, neighborhood, city]);

  const load = async () => {
    const data = await getUtilityReports(120);
    setReports(data as any);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (mode === 'global') return reports;
    const cityLower = city.toLowerCase();
    const neighborhoodLower = (neighborhood || '').toLowerCase();
    return reports.filter((r) => {
      const blob = `${r.location_label || ''} ${r.city || ''} ${r.neighborhood || ''}`.toLowerCase();
      const cityMatch = blob.includes(cityLower);
      if (mode === 'city') return cityMatch;
      if (!neighborhoodLower) return cityMatch;
      return blob.includes(neighborhoodLower) || cityMatch;
    });
  }, [reports, mode, city, neighborhood]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-5 pt-4 pb-3">
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
              <Text className="text-xl font-bold text-warmBrown">Utility Status</Text>
              <View className="flex-row items-center mt-0.5">
                <MapPin size={14} color="#D4673A" />
                <Text className="text-sm text-gray-500 ml-1">{locationLabel}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/create-utility-report');
              }}
              className="bg-terracotta-500 rounded-full p-2.5"
            >
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#D4673A" />
            <Text className="text-gray-500 mt-3">Loading reports…</Text>
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4673A" colors={['#D4673A']} />
            }
            showsVerticalScrollIndicator={false}
          >
            <View className="px-5 pb-6">
              {filtered.length === 0 ? (
                <View className="bg-white rounded-2xl p-6 mt-4 items-center">
                  <Zap size={32} color="#D4673A" />
                  <Text className="text-warmBrown font-semibold text-lg mt-3">No reports yet</Text>
                  <Text className="text-gray-500 text-center mt-1">
                    Tap “+” to report an outage or restoration in your area.
                  </Text>
                </View>
              ) : (
                filtered.map((r) => {
                  const Icon = ICONS[r.utility] || Zap;
                  const isOutage = r.state === 'outage';
                  const pillBg = isOutage ? 'bg-red-100' : r.state === 'restored' ? 'bg-green-100' : 'bg-amber-100';
                  const pillText = isOutage ? 'text-red-700' : r.state === 'restored' ? 'text-green-700' : 'text-amber-700';
                  const iconColor = isOutage ? '#EF4444' : r.state === 'restored' ? '#16A34A' : '#D97706';
                  return (
                    <View key={r.id} className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
                      <View className="flex-row items-start">
                        <View className={`w-10 h-10 rounded-xl items-center justify-center ${isOutage ? 'bg-red-100' : 'bg-forest-50'}`}>
                          <Icon size={18} color={iconColor} />
                        </View>
                        <View className="flex-1 ml-3">
                          <View className="flex-row items-center">
                            <Text className="text-warmBrown font-bold flex-1">
                              {r.utility.toUpperCase()}
                            </Text>
                            <View className={`px-2 py-0.5 rounded-full ${pillBg}`}>
                              <Text className={`${pillText} text-xs font-semibold`}>
                                {r.state}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                            {r.note || r.location_label}
                          </Text>
                          <Text className="text-gray-400 text-xs mt-2">{r.location_label}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

