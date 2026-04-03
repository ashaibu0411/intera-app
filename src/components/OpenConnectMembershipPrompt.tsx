/**
 * Server-side membership for Open to connect (lobby + connect wall + notifications).
 * Shown after local age attestation when profile.open_connect_opt_in is false.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Users, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { fetchOpenConnectOptIn, setOpenConnectOptIn } from '@/lib/openConnectMembership';

type Props = {
  userId: string | undefined;
  isGuest: boolean;
  areaLabel: string;
  /** Fires when membership is known or changes (for gating data fetches). */
  onOptInChanged?: (optedIn: boolean) => void;
  children: React.ReactNode;
};

export function OpenConnectMembershipPrompt({
  userId,
  isGuest,
  areaLabel,
  onOptInChanged,
  children,
}: Props) {
  const [loading, setLoading] = useState(!!userId && !isGuest);
  const [optIn, setOptIn] = useState(false);

  const reload = useCallback(() => {
    if (!userId || isGuest) {
      setLoading(false);
      setOptIn(false);
      onOptInChanged?.(false);
      return;
    }
    setLoading(true);
    fetchOpenConnectOptIn(userId)
      .then((v) => {
        setOptIn(v);
        setLoading(false);
        onOptInChanged?.(v);
      })
      .catch(() => {
        setOptIn(false);
        setLoading(false);
        onOptInChanged?.(false);
      });
  }, [userId, isGuest, onOptInChanged]);

  useEffect(() => {
    reload();
  }, [reload]);

  const onJoin = useCallback(async () => {
    if (!userId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const r = await setOpenConnectOptIn(userId, true);
    if (r.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOptIn(true);
      onOptInChanged?.(true);
    } else {
      Alert.alert('Could not join', r.error || 'Try again or update the app database migration.');
    }
  }, [userId, onOptInChanged]);

  if (isGuest || !userId) {
    return (
      <ScrollView className="flex-1 px-5 pt-4" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="bg-white rounded-2xl border border-gray-200 p-5">
          <Users size={28} color="#1B4D3E" />
          <Text className="text-warmBrown font-bold text-lg mt-3">Sign in to join</Text>
          <Text className="text-gray-600 mt-2 leading-6">
            Open to connect is optional. Sign in to join the community for your area and see who&apos;s open nearby.
          </Text>
          <Pressable
            onPress={() => router.push('/signup' as any)}
            className="mt-5 bg-forest-600 py-3 rounded-xl items-center"
          >
            <Text className="text-white font-semibold">Sign up or log in</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color="#6D28D9" />
      </View>
    );
  }

  if (!optIn) {
    return (
      <ScrollView className="flex-1 px-5 pt-2" contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="bg-violet-50 border border-violet-200 rounded-3xl p-5">
          <View className="flex-row items-center">
            <View className="bg-violet-200 rounded-full p-2.5">
              <Sparkles size={24} color="#5B21B6" />
            </View>
            <Text className="text-violet-950 font-bold text-lg ml-3 flex-1">Join Open to connect</Text>
          </View>
          <Text className="text-violet-900 mt-3 leading-6">
            This is separate from the rest of Intera. Intera is built so you connect with people{' '}
            <Text className="font-semibold">in the city &amp; country you&apos;ve set</Text> — your neighborhood on the
            ground. Only members see the <Text className="font-semibold">lobby</Text>,{' '}
            <Text className="font-semibold">connect post wall</Text>, and <Text className="font-semibold">alerts</Text>{' '}
            for that place.
          </Text>
          <Text className="text-violet-800/90 mt-3 leading-6">
            <Text className="font-semibold">Selected area now:</Text> {areaLabel}. The lobby and wall always match this
            location. If you <Text className="font-semibold">change city or country</Text> in the app, you&apos;ll see
            that area&apos;s Open to connect scene instead — that&apos;s OK for travel or planning, but the community is
            meant for meeting people <Text className="font-semibold">where you actually are</Text> (or where you choose
            to set). Non-members never see this feed.
          </Text>
        </View>

        <Pressable
          onPress={onJoin}
          className="mt-6 bg-violet-700 py-4 rounded-2xl items-center active:opacity-90"
        >
          <Text className="text-white font-bold text-lg">Join for my area</Text>
        </Pressable>

        <Text className="text-gray-500 text-sm text-center mt-4 px-2">
          You can leave anytime in Settings → Open to connect community.
        </Text>
      </ScrollView>
    );
  }

  return <>{children}</>;
}
