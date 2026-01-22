import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChevronLeft, Calendar, Clock, MapPin, Users, Globe } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { getEvent, getFaithEvent, getEventRsvpCounts, removeEventRsvp, setEventRsvp, updateEvent } from '@/lib/marketplace-api';
import { parseEventMetadata } from '@/lib/eventMetadata';
import { useStore } from '@/lib/store';
import * as ImagePicker from 'expo-image-picker';
import { uploadImages } from '@/lib/posts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiSummarizeCard, type AiSummaryResult } from '@/lib/aiSummarizeCard';
import { FormattedAiText } from '@/components/FormattedAiText';

type DisplayEvent = {
  id?: string;
  creatorId?: string;
  title: string;
  description: string;
  dateLabel: string;
  timeLabel: string;
  location: string;
  address: string;
  image?: string;
  category?: string;
  hostName?: string;
  scope?: 'city' | 'nearby' | 'global';
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<DisplayEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [goingCount, setGoingCount] = useState(0);
  const [interestedCount, setInterestedCount] = useState(0);
  const [myRsvp, setMyRsvp] = useState<'interested' | 'going' | null>(null);
  const [isUpdatingRsvp, setIsUpdatingRsvp] = useState(false);
  const [isUpdatingFlyer, setIsUpdatingFlyer] = useState(false);
  const [aiSummary, setAiSummary] = useState<AiSummaryResult | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);

  const isFaithEvent = useMemo(() => !!id && id.startsWith('faith_'), [id]);
  const rawId = useMemo(() => (id ? (isFaithEvent ? id.replace(/^faith_/, '') : id) : ''), [id, isFaithEvent]);

  useEffect(() => {
    const load = async () => {
      if (!rawId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        if (isFaithEvent) {
          const fe = await getFaithEvent(rawId);
          const meta = parseEventMetadata(fe.description || '');
          setEvent({
            title: fe.title,
            description: meta.cleanDescription || fe.description,
            dateLabel: new Date(fe.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            timeLabel: fe.time,
            location: fe.location,
            address: fe.address,
            image: meta.flyerUrl || fe.organization_logo || undefined,
            category: `Faith • ${fe.faith_type}`,
            hostName: fe.organization_name,
            scope: meta.reach,
          });
          // Faith event "going" is stored on the row already
          setGoingCount(fe.attendees_count || 0);
          setInterestedCount(0);
          setMyRsvp(null);
        } else {
          const e = await getEvent(rawId);
          setEvent({
            id: e.id,
            creatorId: e.creator_id,
            title: e.title,
            description: e.description,
            dateLabel: new Date(e.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            }),
            timeLabel: e.end_time ? `${e.time} - ${e.end_time}` : e.time,
            location: e.location,
            address: e.address,
            image: e.image || undefined,
            category: e.category,
            hostName: (e.creator as any)?.name || 'Community Member',
            scope: e.scope,
          });

          // RSVP counts (requires the updated select policy for public events)
          try {
            const counts = await getEventRsvpCounts(rawId);
            setGoingCount(counts.going);
            setInterestedCount(counts.interested);
          } catch {
            setGoingCount(0);
            setInterestedCount(0);
          }
        }
      } catch (err) {
        setEvent(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [rawId, isFaithEvent]);

  // Load cached AI summary (per-event)
  useEffect(() => {
    if (!rawId) return;
    const cacheKey = `ai_summary:event:${rawId}`;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (!raw) return;
        const parsed = JSON.parse(raw) as AiSummaryResult;
        if (parsed?.bullets?.length) setAiSummary(parsed);
      } catch {
        // ignore cache parse errors
      }
    })();
  }, [rawId]);

  const generateSummary = async () => {
    if (!event || !rawId || aiSummaryLoading) return;
    setAiSummaryLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await aiSummarizeCard({
        kind: 'event',
        title: event.title,
        description: event.description,
        locationLabel: event.location || event.address,
        category: event.category,
      });
      setAiSummary(res);
      await AsyncStorage.setItem(`ai_summary:event:${rawId}`, JSON.stringify(res));
    } catch (e) {
      console.log('[Event] AI summary error:', e);
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const isOwner = !!currentUser?.id && !isFaithEvent && !!event?.creatorId && currentUser.id === event.creatorId;

  const handleChangeFlyer = async () => {
    if (!isOwner || !event?.id || isUpdatingFlyer) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsUpdatingFlyer(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsEditing: true,
        aspect: [4, 5],
      });
      if (result.canceled || !result.assets?.length) return;

      const uri = result.assets[0]?.uri;
      if (!uri) return;

      const uploaded = await uploadImages([uri], currentUser!.id);
      const flyerUrl = uploaded[0];
      if (!flyerUrl) throw new Error('Flyer upload failed');

      const updated = await updateEvent(event.id, { image: flyerUrl });
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              image: updated.image || undefined,
            }
          : prev
      );
    } finally {
      setIsUpdatingFlyer(false);
    }
  };

  const scopeLabel =
    event?.scope === 'global' ? 'Global'
    : event?.scope === 'nearby' ? 'Nearby cities'
    : 'This city';

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="bg-white rounded-full p-2 mr-3 shadow-sm"
            >
              <ChevronLeft size={24} color="#2D1F1A" />
            </Pressable>
            <Text className="text-xl font-bold text-warmBrown flex-1" numberOfLines={1}>
              Event
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#D4673A" />
            <Text className="text-gray-500 mt-3">Loading event…</Text>
          </View>
        ) : !event ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-warmBrown font-bold text-xl text-center">This event couldn’t be found</Text>
            <Text className="text-gray-500 text-center mt-2">
              It may be a sample event, or it was removed.
            </Text>
            <Pressable
              onPress={() => router.replace('/')}
              className="mt-5 bg-terracotta-500 px-6 py-3 rounded-full"
            >
              <Text className="text-white font-semibold">Go to Home</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Image */}
            {event.image ? (
              <View className="mx-4 mt-3 bg-white rounded-2xl overflow-hidden shadow-sm">
                <Image source={{ uri: event.image }} style={{ width: '100%', height: 220 }} contentFit="cover" />
              </View>
            ) : null}

            {/* Flyer action (owner only, general events) */}
            {isOwner && (
              <View className="mx-4 mt-3">
                <Pressable
                  onPress={handleChangeFlyer}
                  disabled={isUpdatingFlyer}
                  className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center justify-between"
                >
                  <View>
                    <Text className="text-warmBrown font-semibold">
                      {event.image ? 'Change flyer' : 'Add flyer'}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-0.5">
                      {isUpdatingFlyer ? 'Uploading…' : 'Flyer is what shows on the event card'}
                    </Text>
                  </View>
                  <Text className="text-terracotta-500 font-semibold">
                    {isUpdatingFlyer ? 'Working…' : 'Select'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Title + badges */}
            <View className="px-5 mt-4">
              {event.category ? (
                <View className="self-start bg-gray-100 rounded-full px-3 py-1 mb-3">
                  <Text className="text-gray-700 text-xs font-semibold">{event.category}</Text>
                </View>
              ) : null}
              <Text className="text-2xl font-bold text-warmBrown">{event.title}</Text>
              {event.hostName ? (
                <Text className="text-gray-500 mt-1">Hosted by {event.hostName}</Text>
              ) : null}
              <View className="flex-row items-center mt-2">
                <Globe size={14} color="#8B7355" />
                <Text className="text-gray-500 ml-2">{scopeLabel}</Text>
              </View>
            </View>

            {/* Details */}
            <View className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-start">
                <Calendar size={18} color="#D4673A" />
                <Text className="text-warmBrown font-semibold ml-3 flex-1">{event.dateLabel}</Text>
              </View>
              <View className="flex-row items-start mt-3">
                <Clock size={18} color="#D4673A" />
                <Text className="text-gray-600 ml-3 flex-1">{event.timeLabel}</Text>
              </View>
              <View className="flex-row items-start mt-3">
                <MapPin size={18} color="#D4673A" />
                <Text className="text-gray-600 ml-3 flex-1">{event.address || event.location}</Text>
              </View>
              <View className="flex-row items-center mt-3">
                <Users size={18} color="#D4673A" />
                <Text className="text-gray-600 ml-3">
                  {goingCount} {goingCount === 1 ? 'person' : 'people'} going
                  {interestedCount > 0 ? ` · ${interestedCount} interested` : ''}
                </Text>
              </View>
            </View>

            {/* RSVP (general events only) */}
            {!isFaithEvent && (
              <View className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-warmBrown font-semibold mb-3">RSVP</Text>
                {isGuest || !currentUser?.id ? (
                  <Pressable
                    onPress={() => router.push('/signup')}
                    className="bg-terracotta-500 rounded-full py-3 items-center"
                  >
                    <Text className="text-white font-semibold">Sign in to RSVP</Text>
                  </Pressable>
                ) : (
                  <View className="flex-row" style={{ gap: 12 }}>
                    <Pressable
                      disabled={isUpdatingRsvp}
                      onPress={async () => {
                        if (!currentUser?.id) return;
                        setIsUpdatingRsvp(true);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        try {
                          if (myRsvp === 'interested') {
                            await removeEventRsvp(rawId, currentUser.id);
                            setMyRsvp(null);
                          } else {
                            await setEventRsvp(rawId, currentUser.id, 'interested');
                            setMyRsvp('interested');
                          }
                          const counts = await getEventRsvpCounts(rawId);
                          setGoingCount(counts.going);
                          setInterestedCount(counts.interested);
                        } finally {
                          setIsUpdatingRsvp(false);
                        }
                      }}
                      className={`flex-1 rounded-full py-3 items-center ${myRsvp === 'interested' ? 'bg-gold-500' : 'bg-gray-100'}`}
                    >
                      <Text className={`font-semibold ${myRsvp === 'interested' ? 'text-white' : 'text-gray-700'}`}>
                        Interested
                      </Text>
                    </Pressable>
                    <Pressable
                      disabled={isUpdatingRsvp}
                      onPress={async () => {
                        if (!currentUser?.id) return;
                        setIsUpdatingRsvp(true);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        try {
                          if (myRsvp === 'going') {
                            await removeEventRsvp(rawId, currentUser.id);
                            setMyRsvp(null);
                          } else {
                            await setEventRsvp(rawId, currentUser.id, 'going');
                            setMyRsvp('going');
                          }
                          const counts = await getEventRsvpCounts(rawId);
                          setGoingCount(counts.going);
                          setInterestedCount(counts.interested);
                        } finally {
                          setIsUpdatingRsvp(false);
                        }
                      }}
                      className={`flex-1 rounded-full py-3 items-center ${myRsvp === 'going' ? 'bg-forest-700' : 'bg-terracotta-500'}`}
                    >
                      <Text className="text-white font-semibold">
                        {myRsvp === 'going' ? 'Going!' : 'Going'}
                      </Text>
                    </Pressable>
                  </View>
                )}
                <Text className="text-gray-400 text-xs mt-3">
                  Note: RSVP counts require the updated `event_rsvps` select policy for public events.
                </Text>
              </View>
            )}

            {/* AI Summary */}
            <View className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between">
                <Text className="text-warmBrown font-bold">AI Summary</Text>
                <Pressable onPress={generateSummary} disabled={aiSummaryLoading}>
                  <Text className={`font-semibold ${aiSummaryLoading ? 'text-gray-400' : 'text-terracotta-500'}`}>
                    {aiSummary?.bullets?.length ? 'Refresh' : aiSummaryLoading ? 'Working…' : 'Generate'}
                  </Text>
                </Pressable>
              </View>

              {aiSummary?.bullets?.length ? (
                <View className="mt-3">
                  <FormattedAiText
                    content={aiSummary.bullets.slice(0, 5).map((b) => `- ${b}`).join('\n')}
                    variant="light"
                    hideSourcesSection={false}
                  />
                  {aiSummary.caution ? (
                    <View className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <Text className="text-amber-800 text-sm">{aiSummary.caution}</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <Text className="text-gray-500 mt-2 text-sm">
                  Tap “Generate” for a quick summary of this event.
                </Text>
              )}
            </View>

            {/* Description */}
            <View className="px-5 mt-4">
              <Text className="text-lg font-semibold text-warmBrown mb-2">About</Text>
              <Text className="text-gray-700 leading-6">{event.description}</Text>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

