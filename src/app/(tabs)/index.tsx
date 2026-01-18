import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  MapPin,
  Search,
} from 'lucide-react-native';
import { useStore } from '@/lib/store';
import { getIncidents, getUtilityReports } from '@/lib/marketplace-api';
import type { DbIncident, DbUtilityReport } from '@/lib/supabase';
import { PhotoTile } from '@/components/PhotoTile';

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

  const go = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as any);
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-4 pt-2 pb-3">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => go('/location-select')}
              className="flex-row items-center bg-white rounded-2xl border border-gray-100 px-4 py-3 flex-1"
            >
              <View className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100">
                <Image
                  // eslint-disable-next-line @typescript-eslint/no-require-imports
                  source={require('../../../assets/icon.png')}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-warmBrown">Home</Text>
                <View className="flex-row items-center mt-0.5">
                  <MapPin size={12} color="#8B7355" />
                  <Text className="text-sm text-gray-500 ml-1">{cityLabel}</Text>
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() => go('/app-search')}
              className="ml-3 w-12 h-12 rounded-2xl bg-white border border-gray-100 items-center justify-center"
            >
              <Search size={20} color="#8B7355" />
            </Pressable>
          </View>
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

          {/* Start browsing (photo tiles like your reference) */}
          <View className="px-4 mt-3">
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              <PhotoTile
                title="For Sale & Free"
                subtitle="Marketplace"
                imageUri="https://images.unsplash.com/photo-1520975916090-3105956dac38?w=1200&h=800&fit=crop"
                onPress={() => go('/marketplace')}
                size="lg"
              />
              <PhotoTile
                title="Hire a Pro"
                subtitle="Trusted helpers"
                imageUri="https://images.unsplash.com/photo-1581579185169-7a5b2a36b1aa?w=1200&h=800&fit=crop"
                onPress={() => go('/trusted-providers')}
                size="lg"
              />
              <PhotoTile
                title="Voice Rooms"
                subtitle="Live chats"
                imageUri="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=800&fit=crop"
                onPress={() => go('/voice-rooms')}
              />
              <PhotoTile
                title="Student Hub"
                subtitle="Guides & tools"
                imageUri="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&h=800&fit=crop"
                onPress={() => go('/student-hub')}
              />
              <PhotoTile
                title="Community"
                subtitle="Feed"
                imageUri="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&h=800&fit=crop"
                onPress={() => go('/community')}
              />
              <PhotoTile
                title="Events"
                subtitle="Near you"
                imageUri="https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=1200&h=800&fit=crop"
                onPress={() => go('/events')}
              />
              <PhotoTile
                title="Utilities"
                subtitle="Status"
                imageUri="https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1200&h=800&fit=crop"
                onPress={() => go('/utility-status')}
                badgeText={String(utilityIssueCount)}
                badgeTone={utilityIssueCount > 0 ? 'warning' : 'info'}
              />
              <PhotoTile
                title="Alerts"
                subtitle="Safety"
                imageUri="https://images.unsplash.com/photo-1457732815361-daa98277e9c8?w=1200&h=800&fit=crop"
                onPress={() => go('/safety-alerts')}
                badgeText={String(incidentCount)}
                badgeTone={incidentCount > 0 ? 'danger' : 'info'}
              />
            </View>
          </View>

          <View className="px-4">
            <Text className="text-2xl font-bold text-gray-900 mt-4">Explore</Text>
            <Text className="text-gray-500 mt-1">More things you can do.</Text>
          </View>

          <View className="px-4 mt-4">
            <View className="flex-row flex-wrap" style={{ gap: 12 }}>
              <PhotoTile
                title="Businesses"
                subtitle="Directory"
                imageUri="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=1200&h=800&fit=crop"
                onPress={() => go('/business-directory')}
              />
              <PhotoTile
                title="Faith"
                subtitle="Community"
                imageUri="https://images.unsplash.com/photo-1520975958225-b74b16f7f2f6?w=1200&h=800&fit=crop"
                onPress={() => go('/faith-community')}
              />
              <PhotoTile
                title="Housing"
                subtitle="Board"
                imageUri="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=800&fit=crop"
                onPress={() => go('/housing-board')}
              />
              <PhotoTile
                title="Helpers"
                subtitle="Serve & connect"
                imageUri="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&h=800&fit=crop"
                onPress={() => go('/serve-connect')}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
