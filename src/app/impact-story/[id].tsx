import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ExternalLink, Mail, Phone, Heart, Award, HandCoins } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { getImpactStoryById, type ImpactNeed, type ImpactStory } from '@/lib/impactStories';

function niceNeed(n: ImpactNeed) {
  if (n === 'donations') return 'Donations';
  if (n === 'grants') return 'Grants';
  return 'Sponsorships';
}

function safeOpenUrl(url: string) {
  const u = url.trim();
  if (!u) return;
  const hasProto = u.startsWith('http://') || u.startsWith('https://');
  const finalUrl = hasProto ? u : `https://${u}`;
  Linking.openURL(finalUrl).catch(() => {
    Alert.alert('Could not open link', 'Please check the URL and try again.');
  });
}

export default function ImpactStoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [item, setItem] = useState<ImpactStory | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const data = await getImpactStoryById(String(id));
      setItem(data);
    } catch (e) {
      setErrorMsg(String((e as any)?.message || e));
    } finally {
      setBusy(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const location = useMemo(() => {
    if (!item) return '';
    return [item.city, item.admin_area, item.country].filter(Boolean).join(', ');
  }, [item]);

  return (
    <View className="flex-1 bg-cream">
      <Stack.Screen
        options={{
          title: 'Impact Story',
          headerStyle: { backgroundColor: '#FDF7F2' },
          headerShadowVisible: false,
          headerLeft: () => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="p-2 -ml-2"
            >
              <ChevronLeft size={26} color="#1F2937" />
            </Pressable>
          ),
        }}
      />

      {busy ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="text-gray-500 mt-2">Loading…</Text>
        </View>
      ) : errorMsg ? (
        <View className="flex-1 p-5">
          <View className="bg-red-50 border border-red-100 rounded-2xl p-4">
            <Text className="text-red-700 font-semibold">Couldn’t load this story</Text>
            <Text className="text-red-700 mt-1 text-sm">{errorMsg}</Text>
          </View>
        </View>
      ) : !item ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">Not found</Text>
        </View>
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Cover */}
          {item.video_url ? (
            <HeaderVideo uri={item.video_url} />
          ) : item.cover_image_url ? (
            <Image source={{ uri: item.cover_image_url }} style={{ width: '100%', height: 220 }} contentFit="cover" />
          ) : (
            <View className="w-full h-[220px] bg-forest-900 items-center justify-center">
              <Heart size={28} color="#C9A227" />
              <Text className="text-white font-semibold mt-2">Impact Story</Text>
            </View>
          )}

          {/* Header */}
          <View className="px-5 -mt-6">
            <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-warmBrown font-bold text-lg flex-1 pr-3">{item.org_name}</Text>
                <View className={`px-2.5 py-1 rounded-full ${item.org_type === 'school' ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
                  <Text className={`${item.org_type === 'school' ? 'text-emerald-700' : 'text-indigo-700'} text-xs font-semibold`}>
                    {item.org_type === 'school' ? 'School' : 'Nonprofit'}
                  </Text>
                </View>
              </View>
              {location ? <Text className="text-gray-500 mt-1">{location}</Text> : null}

              {item.needs?.length ? (
                <View className="flex-row flex-wrap mt-3">
                  {item.needs.map((n) => (
                    <View key={n} className="mr-2 mb-2 px-2.5 py-1 rounded-full bg-gray-50 border border-gray-100">
                      <Text className="text-gray-700 text-xs font-semibold">{niceNeed(n)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          {/* CTAs */}
          <View className="px-5 mt-4">
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <Text className="text-warmBrown font-bold">Ways to support</Text>
              <Text className="text-gray-500 text-sm mt-1">
                Donations, grants, and sponsorships go through external links/contact.
              </Text>

              <View className="mt-3">
                {item.donation_url ? (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      safeOpenUrl(item.donation_url!);
                    }}
                    className="bg-terracotta-500 rounded-xl px-4 py-3 flex-row items-center justify-between"
                  >
                    <View className="flex-row items-center">
                      <HandCoins size={18} color="#fff" />
                      <Text className="text-white font-semibold ml-2">Donate</Text>
                    </View>
                    <ExternalLink size={18} color="#fff" />
                  </Pressable>
                ) : null}

                {item.grant_url ? (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      safeOpenUrl(item.grant_url!);
                    }}
                    className={`bg-white rounded-xl px-4 py-3 flex-row items-center justify-between border border-gray-200 ${item.donation_url ? 'mt-2' : ''}`}
                  >
                    <View className="flex-row items-center">
                      <Award size={18} color="#111827" />
                      <Text className="text-gray-900 font-semibold ml-2">Grant info</Text>
                    </View>
                    <ExternalLink size={18} color="#111827" />
                  </Pressable>
                ) : null}

                {item.sponsorship_email ? (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Linking.openURL(`mailto:${item.sponsorship_email}`).catch(() => {
                        Alert.alert('Could not open email', 'Please try again.');
                      });
                    }}
                    className={`bg-white rounded-xl px-4 py-3 flex-row items-center justify-between border border-gray-200 ${(item.donation_url || item.grant_url) ? 'mt-2' : ''}`}
                  >
                    <View className="flex-row items-center">
                      <Mail size={18} color="#111827" />
                      <Text className="text-gray-900 font-semibold ml-2">Email for sponsorship</Text>
                    </View>
                    <ExternalLink size={18} color="#111827" />
                  </Pressable>
                ) : null}

                {item.sponsorship_phone ? (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Linking.openURL(`tel:${item.sponsorship_phone}`).catch(() => {
                        Alert.alert('Could not start call', 'Please try again.');
                      });
                    }}
                    className={`bg-white rounded-xl px-4 py-3 flex-row items-center justify-between border border-gray-200 ${(item.donation_url || item.grant_url || item.sponsorship_email) ? 'mt-2' : ''}`}
                  >
                    <View className="flex-row items-center">
                      <Phone size={18} color="#111827" />
                      <Text className="text-gray-900 font-semibold ml-2">Call for sponsorship</Text>
                    </View>
                    <ExternalLink size={18} color="#111827" />
                  </Pressable>
                ) : null}

                {!item.donation_url && !item.grant_url && !item.sponsorship_email && !item.sponsorship_phone ? (
                  <View className="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-3">
                    <Text className="text-gray-600">
                      No links/contact provided yet.
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Mission + Story */}
          <View className="px-5 mt-4">
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <Text className="text-warmBrown font-bold">Mission</Text>
              <Text className="text-gray-700 leading-7 mt-2">{item.mission}</Text>
            </View>
          </View>

          <View className="px-5 mt-4">
            <View className="bg-white rounded-2xl p-4 border border-gray-100">
              <Text className="text-warmBrown font-bold">Story</Text>
              <Text className="text-gray-700 leading-7 mt-2">{item.story}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function HeaderVideo({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });
  return (
    <View style={{ width: '100%', height: 220, backgroundColor: '#000' }}>
      <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="cover" nativeControls={false} />
    </View>
  );
}

