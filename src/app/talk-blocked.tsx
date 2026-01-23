import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, ShieldOff, Unlock, UserX } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useStore } from '@/lib/store';
import { getProfilesByIds, listMyBlockedUserIds, reportUser, unblockUser, type BasicProfile } from '@/lib/talkNow';

export default function TalkBlockedScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const [loading, setLoading] = useState(true);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<BasicProfile[]>([]);

  const load = async () => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const ids = await listMyBlockedUserIds(currentUser.id);
      setBlockedIds(ids);
      const ps = await getProfilesByIds(ids);
      setProfiles(ps);
    } catch (e: any) {
      Alert.alert('Could not load blocks', String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const profilesById = useMemo(() => {
    const m = new Map<string, BasicProfile>();
    for (const p of profiles) m.set(p.id, p);
    return m;
  }, [profiles]);

  const list = useMemo(() => {
    // keep stable order matching ids
    return blockedIds.map((id) => profilesById.get(id)).filter(Boolean) as BasicProfile[];
  }, [blockedIds, profilesById]);

  const doUnblock = async (blockedId: string) => {
    if (!currentUser?.id) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await unblockUser({ blockerId: currentUser.id, blockedId });
      await load();
    } catch (e: any) {
      Alert.alert('Could not unblock', String(e?.message ?? e));
    }
  };

  const doReport = async (reportedId: string, reason: string) => {
    if (!currentUser?.id) return;
    try {
      await reportUser({ reporterId: currentUser.id, reportedId, reason });
      Alert.alert('Reported', 'Thanks — our team will review this report.');
    } catch (e: any) {
      Alert.alert('Could not report', String(e?.message ?? e));
    }
  };

  return (
    <View className="flex-1 bg-[#F5F3FF]">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-5 pb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="w-10 h-10 rounded-full bg-white items-center justify-center shadow-sm"
            >
              <ArrowLeft size={20} color="#374151" />
            </Pressable>
            <View className="flex-row items-center">
              <ShieldOff size={22} color="#7C3AED" />
              <Text className="text-xl font-bold text-gray-900 ml-2">Blocked users</Text>
            </View>
            <View className="w-10" />
          </View>

          <Animated.View entering={FadeInDown.duration(300)}>
            <LinearGradient
              colors={['#7C3AED', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 20, padding: 16 }}
            >
              <Text className="text-white font-bold">Talk Now safety</Text>
              <Text className="text-white/80 text-sm mt-1">
                You won’t see blocked users in Talk Now discovery, and they can’t start sessions with you.
              </Text>
            </LinearGradient>
          </Animated.View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="px-5 pb-8">
            {loading ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color="#7C3AED" />
                <Text className="text-gray-500 mt-3">Loading blocked users…</Text>
              </View>
            ) : list.length === 0 ? (
              <View className="bg-white rounded-3xl p-8 items-center">
                <View className="w-20 h-20 rounded-full bg-violet-100 items-center justify-center mb-4">
                  <UserX size={36} color="#7C3AED" />
                </View>
                <Text className="text-gray-900 font-bold text-lg text-center">No blocked users</Text>
                <Text className="text-gray-500 text-center mt-2">
                  You can block someone from the Talk Now connect screen.
                </Text>
              </View>
            ) : (
              list.map((p) => (
                <View key={p.id} className="bg-white rounded-3xl p-4 shadow-sm mb-3">
                  <View className="flex-row items-center">
                    <Image
                      source={{ uri: p.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' }}
                      style={{ width: 52, height: 52, borderRadius: 26 }}
                      contentFit="cover"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-gray-900 font-bold">{p.name || 'User'}</Text>
                      <Text className="text-gray-500 text-sm">@{p.username || 'user'}</Text>
                    </View>
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => {
                          Alert.alert('Report user', 'Why are you reporting this user?', [
                            { text: 'Spam', onPress: () => doReport(p.id, 'spam') },
                            { text: 'Harassment', onPress: () => doReport(p.id, 'harassment') },
                            { text: 'Inappropriate', onPress: () => doReport(p.id, 'inappropriate') },
                            { text: 'Other', onPress: () => doReport(p.id, 'other') },
                            { text: 'Cancel', style: 'cancel' },
                          ]);
                        }}
                        className="bg-gray-100 rounded-2xl px-3 py-2"
                      >
                        <Text className="text-gray-700 font-bold">Report</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          Alert.alert('Unblock user?', 'They will appear again in Talk Now discovery.', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Unblock', onPress: () => doUnblock(p.id) },
                          ]);
                        }}
                        className="bg-gray-100 rounded-2xl px-3 py-2 flex-row items-center"
                      >
                        <Unlock size={16} color="#374151" />
                        <Text className="text-gray-700 font-bold ml-2">Unblock</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

