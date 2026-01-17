import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  AlertTriangle,
  ChevronRight,
  CloudLightning,
  Heart,
  Home,
  MapPin,
  ShoppingBag,
  Store,
  UserCheck,
  Users,
} from 'lucide-react-native';
import { useStore } from '@/lib/store';
import { getIncidents, getUtilityReports } from '@/lib/marketplace-api';
import type { DbIncident, DbUtilityReport } from '@/lib/supabase';

type HubTile = {
  title: string;
  route: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  colors: readonly [string, string];
};

export default function HomeHubScreen() {
  const selectedLocation = useStore((s) => s.selectedLocation);
  const feedFilter = useStore((s) => s.feedFilter);
  const [incidentCount, setIncidentCount] = useState(0);
  const [utilityIssueCount, setUtilityIssueCount] = useState(0);

  const cityLabel = useMemo(() => {
    const city = selectedLocation?.city;
    const country = selectedLocation?.country;
    if (!city && !country) return 'Choose location';
    if (!city) return country || 'Choose location';
    return city;
  }, [selectedLocation?.city, selectedLocation?.country]);

  const scopeLabel = useMemo(() => {
    const city = selectedLocation?.city;
    const neighborhood = selectedLocation?.neighborhood?.trim();
    if (feedFilter === 'global') return 'Worldwide';
    if (feedFilter === 'neighborhood') return neighborhood ? `${neighborhood}, ${city || ''}`.trim().replace(/,$/, '') : city || 'Your area';
    return city || 'Your city';
  }, [feedFilter, selectedLocation?.city, selectedLocation?.neighborhood]);

  const matchesFeedScope = useMemo(() => {
    const selCountry = (selectedLocation?.country || '').toLowerCase();
    const selCity = (selectedLocation?.city || '').toLowerCase();
    const selNeighborhood = (selectedLocation?.neighborhood || '').trim().toLowerCase();

    return (item: { country: string; city: string; neighborhood?: string | null; scope: 'neighborhood' | 'city' | 'global' }) => {
      if (feedFilter === 'global') return true;

      const itemCountry = (item.country || '').toLowerCase();
      const itemCity = (item.city || '').toLowerCase();
      const itemNeighborhood = (item.neighborhood || '').trim().toLowerCase();

      if (selCountry && itemCountry && selCountry !== itemCountry) return false;
      if (selCity && itemCity && selCity !== itemCity) return false;

      // City mode: show city-scoped items (and neighborhood items in that city)
      if (feedFilter === 'city') {
        return item.scope === 'city' || item.scope === 'neighborhood';
      }

      // Neighborhood mode: show neighborhood-scoped items for that neighborhood, plus city-scoped items
      if (feedFilter === 'neighborhood') {
        if (item.scope === 'city') return true;
        if (!selNeighborhood) return true; // if user hasn't set neighborhood, fall back to city behavior
        return item.scope === 'neighborhood' && itemNeighborhood === selNeighborhood;
      }

      return true;
    };
  }, [feedFilter, selectedLocation?.country, selectedLocation?.city, selectedLocation?.neighborhood]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [incidents, reports] = await Promise.all([
          getIncidents(50).catch(() => [] as DbIncident[]),
          getUtilityReports(100).catch(() => [] as DbUtilityReport[]),
        ]);

        if (cancelled) return;

        const activeIncidents = (incidents || [])
          .filter((i) => i.status === 'active')
          .filter((i) => matchesFeedScope({ country: i.country, city: i.city, neighborhood: i.neighborhood, scope: i.scope }));

        const utilityIssues = (reports || [])
          .filter((r) => r.state !== 'restored')
          .filter((r) => matchesFeedScope({ country: r.country, city: r.city, neighborhood: r.neighborhood, scope: r.scope }));

        setIncidentCount(activeIncidents.length);
        setUtilityIssueCount(utilityIssues.length);
      } catch {
        // best-effort; keep counts at 0
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [matchesFeedScope]);

  const tiles: HubTile[] = useMemo(
    () => [
      {
        title: 'Community',
        route: '/community',
        icon: Users,
        colors: ['#1B4D3E', '#062A1E'] as const,
      },
      {
        title: 'Marketplace',
        route: '/marketplace',
        icon: ShoppingBag,
        colors: ['#D4673A', '#B85430'] as const,
      },
      {
        title: 'Businesses',
        route: '/business-directory',
        icon: Store,
        colors: ['#0EA5E9', '#2563EB'] as const,
      },
      {
        title: 'Faith',
        route: '/faith-community',
        icon: Heart,
        colors: ['#8B5CF6', '#EC4899'] as const,
      },
      {
        title: 'Helpers',
        route: '/serve-connect',
        icon: UserCheck,
        colors: ['#0F766E', '#115E59'] as const,
      },
      {
        title: 'Housing',
        route: '/housing-board',
        icon: Home,
        colors: ['#EC4899', '#B91C1C'] as const,
      },
    ],
    []
  );

  const go = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as any);
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-4 pt-2 pb-3">
          <Pressable
            onPress={() => go('/location-select')}
            className="flex-row items-center justify-between bg-white rounded-2xl border border-gray-100 px-4 py-3"
          >
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100">
                <Image
                  source={{ uri: '/image-1768608072.png' }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              </View>
              <View className="ml-3">
                <Text className="text-base font-bold text-warmBrown">Home</Text>
                <View className="flex-row items-center mt-0.5">
                  <MapPin size={12} color="#8B7355" />
                  <Text className="text-sm text-gray-500 ml-1">{cityLabel}</Text>
                </View>
              </View>
            </View>
            <ChevronRight size={20} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* Hub */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {/* What's happening strip */}
          <View className="px-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-gray-500">What’s happening</Text>
                <Text className="text-lg font-bold text-gray-900">{scopeLabel}</Text>
              </View>
              <Pressable onPress={() => go('/community')} className="active:opacity-70">
                <Text className="text-terracotta-500 font-semibold">Open feed</Text>
              </Pressable>
            </View>
          </View>

          {/* 4 compact tiles (2x2) */}
          <View className="px-4 mt-3">
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              <Pressable
                onPress={() => go('/safety-alerts')}
                className="bg-white rounded-2xl border border-gray-100 px-4 py-3"
                style={{ width: '48%' }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: '#FEE2E2' }}>
                      <AlertTriangle size={18} color="#DC2626" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-gray-900 font-semibold">Safety</Text>
                      <Text className="text-gray-500 text-xs mt-0.5">Alerts</Text>
                    </View>
                  </View>
                  {incidentCount > 0 ? (
                    <View className="bg-red-600 px-2 py-1 rounded-full">
                      <Text className="text-white text-xs font-bold">{incidentCount}</Text>
                    </View>
                  ) : (
                    <Text className="text-gray-400 text-xs">0</Text>
                  )}
                </View>
              </Pressable>

              <Pressable
                onPress={() => go('/utility-status')}
                className="bg-white rounded-2xl border border-gray-100 px-4 py-3"
                style={{ width: '48%' }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: '#FEF3C7' }}>
                      <CloudLightning size={18} color="#D97706" />
                    </View>
                    <View className="ml-3">
                      <Text className="text-gray-900 font-semibold">Utilities</Text>
                      <Text className="text-gray-500 text-xs mt-0.5">Status</Text>
                    </View>
                  </View>
                  {utilityIssueCount > 0 ? (
                    <View className="bg-amber-600 px-2 py-1 rounded-full">
                      <Text className="text-white text-xs font-bold">{utilityIssueCount}</Text>
                    </View>
                  ) : (
                    <Text className="text-gray-400 text-xs">0</Text>
                  )}
                </View>
              </Pressable>

              <Pressable
                onPress={() => go('/events')}
                className="bg-white rounded-2xl border border-gray-100 px-4 py-3"
                style={{ width: '48%' }}
              >
                <View className="flex-row items-center">
                  <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: '#DBEAFE' }}>
                    <ChevronRight size={18} color="#2563EB" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-gray-900 font-semibold">Events</Text>
                    <Text className="text-gray-500 text-xs mt-0.5">Plans</Text>
                  </View>
                </View>
              </Pressable>

              <Pressable
                onPress={() => go('/community')}
                className="bg-white rounded-2xl border border-gray-100 px-4 py-3"
                style={{ width: '48%' }}
              >
                <View className="flex-row items-center">
                  <View className="w-9 h-9 rounded-xl items-center justify-center" style={{ backgroundColor: '#DCFCE7' }}>
                    <Users size={18} color="#166534" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-gray-900 font-semibold">Feed</Text>
                    <Text className="text-gray-500 text-xs mt-0.5">Community</Text>
                  </View>
                </View>
              </Pressable>
            </View>
          </View>

          <View className="px-4">
            <Text className="text-2xl font-bold text-gray-900 mt-4">Explore</Text>
            <Text className="text-gray-500 mt-1">6 quick tiles — no scrolling maze.</Text>
          </View>

          <View className="px-4 mt-4">
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              {tiles.map((t) => {
                const Icon = t.icon;
                return (
                  <Pressable
                    key={t.title}
                    onPress={() => go(t.route)}
                    className="rounded-2xl overflow-hidden border border-gray-100"
                    style={{ width: '48%', minHeight: 110 }}
                  >
                    <LinearGradient
                      colors={t.colors as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ flex: 1, padding: 14, justifyContent: 'space-between' }}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="w-10 h-10 rounded-2xl bg-white/20 items-center justify-center">
                          <Icon size={20} color="#FFFFFF" />
                        </View>
                      </View>
                      <View>
                        <Text className="text-white font-bold text-lg">{t.title}</Text>
                        <Text className="text-white/80 text-xs mt-0.5">Tap to open</Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
