import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Zap, Droplets, Wifi, TrafficCone, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { createUtilityReport } from '@/lib/marketplace-api';
import { sendRemotePushAlert } from '@/lib/pushAlerts';

type Utility = 'power' | 'water' | 'internet' | 'road';
type State = 'outage' | 'restored' | 'degraded';

const UTILITIES: Array<{ key: Utility; label: string; icon: any; color: string }> = [
  { key: 'power', label: 'Power', icon: Zap, color: '#D4673A' },
  { key: 'water', label: 'Water', icon: Droplets, color: '#3B82F6' },
  { key: 'internet', label: 'Internet', icon: Wifi, color: '#1B4D3E' },
  { key: 'road', label: 'Road', icon: TrafficCone, color: '#F59E0B' },
];

const STATES: Array<{ key: State; label: string }> = [
  { key: 'outage', label: 'Outage' },
  { key: 'degraded', label: 'Degraded' },
  { key: 'restored', label: 'Restored' },
];

export default function CreateUtilityReportScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const feedFilter = useStore((s) => s.feedFilter);

  const [utility, setUtility] = useState<Utility>('power');
  const [state, setState] = useState<State>('outage');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const base = useMemo(() => {
    const city = selectedLocation?.city || 'Denver';
    const country = selectedLocation?.country || 'Unknown';
    const adminArea = selectedLocation?.state || null;
    const neighborhood = selectedLocation?.neighborhood?.trim() || null;
    const locationLabel = neighborhood ? `${city}, ${adminArea || country} · ${neighborhood}` : `${city}, ${adminArea || country}`;
    const scope = feedFilter === 'global' ? 'global' : feedFilter === 'neighborhood' ? 'neighborhood' : 'city';
    return { city, country, adminArea, neighborhood, locationLabel, scope };
  }, [selectedLocation, feedFilter]);

  const canSubmit = !!currentUser?.id && !!utility && !!state;

  const handleSubmit = async () => {
    if (!canSubmit || !currentUser?.id || isSubmitting) return;
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createUtilityReport(currentUser.id, {
        utility,
        state,
        note: note.trim() || null,
        country: base.country,
        admin_area: base.adminArea,
        city: base.city,
        neighborhood: base.neighborhood,
        location_label: base.locationLabel,
        scope: base.scope as any,
      });

      // True remote push alert (best-effort; non-blocking)
      sendRemotePushAlert({
        title: `Utility update: ${utility.toUpperCase()} (${state})`,
        body: note.trim() || `Reported in ${base.locationLabel}`,
        scope: base.scope as any,
        city: base.city,
        neighborhood: base.neighborhood,
        excludeUserId: currentUser.id,
        data: { type: 'utility', screen: '/utility-status' },
      }).catch(() => {});
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-6">
        <Text className="text-warmBrown text-lg text-center">Please sign in to report utility status.</Text>
        <Pressable onPress={() => router.push('/signup')} className="mt-4">
          <Text className="text-terracotta-500 font-semibold">Sign In</Text>
        </Pressable>
      </View>
    );
  }

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
            <Text className="text-lg font-bold text-warmBrown">Report Utility Status</Text>
            <View className="w-10" />
          </View>
          <Text className="text-gray-500 mt-2">For {base.locationLabel}</Text>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-3">Utility</Text>
            <View className="flex-row flex-wrap gap-2">
              {UTILITIES.map((u) => {
                const active = utility === u.key;
                const Icon = u.icon;
                return (
                  <Pressable
                    key={u.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setUtility(u.key);
                    }}
                    className={`px-3 py-2 rounded-xl flex-row items-center ${active ? 'bg-forest-600' : 'bg-gray-100'}`}
                  >
                    <Icon size={16} color={active ? '#fff' : u.color} />
                    <Text className={`ml-2 font-semibold ${active ? 'text-white' : 'text-warmBrown'}`}>
                      {u.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-3">Status</Text>
            <View className="flex-row gap-2">
              {STATES.map((s) => {
                const active = state === s.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setState(s.key);
                    }}
                    className={`flex-1 px-3 py-3 rounded-xl items-center ${active ? 'bg-terracotta-500' : 'bg-gray-100'}`}
                  >
                    <Text className={`font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-2">Note (optional)</Text>
            <TextInput
              placeholder="e.g. Light has been off since 3pm"
              placeholderTextColor="#9CA3AF"
              value={note}
              onChangeText={setNote}
              multiline
              className="text-warmBrown"
              style={{ minHeight: 80, textAlignVertical: 'top' }}
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={`mt-4 rounded-2xl py-4 items-center ${canSubmit && !isSubmitting ? 'bg-forest-700' : 'bg-gray-300'}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center">
                <Check size={18} color="#fff" />
                <Text className="text-white font-bold ml-2">Submit Report</Text>
              </View>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

