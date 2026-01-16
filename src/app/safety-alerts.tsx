import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AlertTriangle, ChevronLeft, MapPin, Plus, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { getIncidents, updateIncidentStatus } from '@/lib/marketplace-api';

export default function SafetyAlertsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [incidents, setIncidents] = useState<any[]>([]);

  const selectedLocation = useStore((s) => s.selectedLocation);
  const feedFilter = useStore((s) => s.feedFilter);
  const currentUser = useStore((s) => s.currentUser);

  const city = selectedLocation?.city || 'Denver';
  const neighborhood = selectedLocation?.neighborhood?.trim();
  const mode = feedFilter; // 'neighborhood' | 'city' | 'global'

  const locationLabel = useMemo(() => {
    if (mode === 'global') return 'Worldwide';
    if (mode === 'neighborhood') return neighborhood ? `${neighborhood}, ${city}` : city;
    return city;
  }, [mode, neighborhood, city]);

  const load = async () => {
    const data = await getIncidents(60);
    setIncidents(data as any);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (mode === 'global') return incidents;
    const cityLower = city.toLowerCase();
    const neighborhoodLower = (neighborhood || '').toLowerCase();
    return incidents.filter((i) => {
      const blob = `${i.location_label || ''} ${i.city || ''} ${i.neighborhood || ''}`.toLowerCase();
      const cityMatch = blob.includes(cityLower);
      if (mode === 'city') return cityMatch;
      if (!neighborhoodLower) return cityMatch;
      return blob.includes(neighborhoodLower) || cityMatch;
    });
  }, [incidents, mode, city, neighborhood]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const handleResolve = async (id: string) => {
    if (!currentUser?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = await updateIncidentStatus(id, 'resolved');
    setIncidents((prev) => prev.map((x) => (x.id === id ? updated : x)));
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
              <Text className="text-xl font-bold text-warmBrown">Safety Alerts</Text>
              <View className="flex-row items-center mt-0.5">
                <MapPin size={14} color="#D4673A" />
                <Text className="text-sm text-gray-500 ml-1">{locationLabel}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/create-emergency');
              }}
              className="bg-red-500 rounded-full p-2.5"
            >
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#D4673A" />
            <Text className="text-gray-500 mt-3">Loading alerts…</Text>
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
                  <AlertTriangle size={32} color="#D4673A" />
                  <Text className="text-warmBrown font-semibold text-lg mt-3">No alerts right now</Text>
                  <Text className="text-gray-500 text-center mt-1">
                    If something is happening, report it so neighbors can respond.
                  </Text>
                  <Pressable
                    onPress={() => router.push('/create-emergency')}
                    className="mt-4 bg-red-500 px-5 py-3 rounded-full"
                  >
                    <Text className="text-white font-semibold">Report an alert</Text>
                  </Pressable>
                </View>
              ) : (
                filtered.map((i) => {
                  const isOwner = currentUser?.id && i.creator_id === currentUser.id;
                  const resolved = i.status === 'resolved';
                  return (
                    <View key={i.id} className="bg-white rounded-2xl p-4 mt-3 shadow-sm">
                      <View className="flex-row items-start">
                        <View className={`w-10 h-10 rounded-xl items-center justify-center ${resolved ? 'bg-green-100' : 'bg-red-100'}`}>
                          {resolved ? <CheckCircle size={18} color="#16A34A" /> : <AlertTriangle size={18} color="#EF4444" />}
                        </View>
                        <View className="flex-1 ml-3">
                          <View className="flex-row items-center">
                            <Text className="text-warmBrown font-bold flex-1" numberOfLines={2}>{i.title}</Text>
                            <View className={`px-2 py-0.5 rounded-full ${resolved ? 'bg-green-100' : 'bg-red-100'}`}>
                              <Text className={`${resolved ? 'text-green-700' : 'text-red-700'} text-xs font-semibold`}>
                                {resolved ? 'Resolved' : 'Active'}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>{i.description}</Text>
                          <Text className="text-gray-400 text-xs mt-2">{i.location_label}</Text>
                          {isOwner && !resolved && (
                            <Pressable
                              onPress={() => handleResolve(i.id)}
                              className="mt-3 bg-forest-600 px-4 py-2 rounded-full self-start"
                            >
                              <Text className="text-white font-semibold">Mark resolved</Text>
                            </Pressable>
                          )}
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

