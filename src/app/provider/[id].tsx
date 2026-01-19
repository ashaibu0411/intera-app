import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Star, CheckCircle, Users, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/lib/store';
import { getServiceProviders, getServiceProviderReviews, getServiceProviderTrustCounts, removeServiceProviderConfirmation, setServiceProviderConfirmation, upsertServiceProviderReview } from '@/lib/marketplace-api';
import { getOrCreateTrustScore, DbUserTrustScore } from '@/lib/trust-api';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';

export default function ProviderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const providerId = id || '';

  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);
  const canInteract = !!currentUser?.id && !isGuest;

  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [trust, setTrust] = useState<{ reviews: number; avgRating: number; workedForMe: number } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [providerTrustScore, setProviderTrustScore] = useState<DbUserTrustScore | null>(null);

  const load = async () => {
    const all = await getServiceProviders(300);
    const p = (all || []).find((x: any) => x.id === providerId) || null;
    setProvider(p);
    if (!p) return;
    const [r, t] = await Promise.all([
      getServiceProviderReviews(providerId, 50),
      getServiceProviderTrustCounts(providerId),
    ]);
    setReviews(r as any);
    setTrust(t);

    // Fetch provider's trust score
    if (p?.user_id) {
      const trustScore = await getOrCreateTrustScore(p.user_id);
      setProviderTrustScore(trustScore);
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId]);

  const locationLabel = useMemo(() => provider?.location_label || '', [provider]);

  const toggleWorkedForMe = async () => {
    if (!canInteract || !currentUser?.id) {
      router.push('/signup');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await setServiceProviderConfirmation(providerId, currentUser.id);
    } catch {
      try {
        await removeServiceProviderConfirmation(providerId, currentUser.id);
      } catch {}
    }
    const t = await getServiceProviderTrustCounts(providerId);
    setTrust(t);
  };

  const saveReview = async () => {
    if (!canInteract || !currentUser?.id) {
      router.push('/signup');
      return;
    }
    setSavingReview(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await upsertServiceProviderReview(providerId, currentUser.id, rating, reviewText.trim() || null);
      await load();
      setShowReview(false);
      setReviewText('');
      setRating(5);
    } catch {
      Alert.alert('Could not save review', 'Please try again.');
    } finally {
      setSavingReview(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator color="#1B4D3E" />
        <Text className="text-gray-500 mt-3">Loading…</Text>
      </View>
    );
  }

  if (!provider) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-6">
        <Text className="text-warmBrown font-semibold text-lg text-center">Provider not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-terracotta-500 font-semibold">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-5 pt-4 pb-3">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => router.back()} className="bg-white rounded-full p-2 shadow-sm">
              <ChevronLeft size={22} color="#2D1F1A" />
            </Pressable>
            <View className="flex-1 ml-3">
              <Text className="text-xl font-bold text-warmBrown" numberOfLines={1}>{provider.user?.name || 'Provider'}</Text>
              <View className="flex-row items-center mt-0.5">
                <MapPin size={14} color="#D4673A" />
                <Text className="text-sm text-gray-500 ml-1" numberOfLines={1}>{locationLabel}</Text>
              </View>
            </View>
            <Pressable onPress={() => setShowReview(true)} className="bg-forest-600 rounded-full p-2.5">
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mx-5 mt-2 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-bold text-lg">{provider.title}</Text>
            <Text className="text-gray-600 mt-2">{provider.bio}</Text>

            <View className="flex-row items-center mt-3">
              <Star size={16} color="#C9A227" fill="#C9A227" />
              <Text className="text-warmBrown font-semibold ml-2">{trust?.avgRating ? trust.avgRating.toFixed(1) : '—'}</Text>
              <Text className="text-gray-400 ml-2">({trust?.reviews ?? 0} reviews)</Text>
            </View>

            <Pressable onPress={toggleWorkedForMe} className="mt-3 bg-terracotta-500 rounded-full py-3 items-center flex-row justify-center">
              <CheckCircle size={16} color="#fff" />
              <Text className="text-white font-semibold ml-2">Worked for me ({trust?.workedForMe ?? 0})</Text>
            </Pressable>
          </View>

          {/* Provider Trust Score */}
          {providerTrustScore && (
            <View className="mx-5 mt-4">
              <TrustScoreBadge
                score={providerTrustScore.overall_score}
                verificationLevel={providerTrustScore.verification_level}
                reviewCount={trust?.reviews ?? 0}
                avgRating={trust?.avgRating ?? 0}
                confirmationCount={trust?.workedForMe ?? 0}
                userId={provider?.user_id}
              />
            </View>
          )}

          <View className="mx-5 mt-4 mb-10">
            <Text className="text-warmBrown font-bold text-lg mb-2">Reviews</Text>
            {reviews.length === 0 ? (
              <View className="bg-white rounded-2xl p-6 items-center">
                <Users size={26} color="#1B4D3E" />
                <Text className="text-warmBrown font-semibold mt-3">No reviews yet</Text>
                <Text className="text-gray-500 text-center mt-1">Write the first review to help the community.</Text>
                <Pressable onPress={() => setShowReview(true)} className="mt-3 bg-forest-600 px-5 py-3 rounded-full">
                  <Text className="text-white font-semibold">Write a review</Text>
                </Pressable>
              </View>
            ) : (
              reviews.map((r) => (
                <View key={r.id} className="bg-white rounded-2xl p-4 mb-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-warmBrown font-semibold">{r.reviewer?.name || 'Member'}</Text>
                    <View className="flex-row items-center">
                      <Star size={14} color="#C9A227" fill="#C9A227" />
                      <Text className="text-warmBrown font-semibold ml-1">{r.rating}</Text>
                    </View>
                  </View>
                  {r.review ? <Text className="text-gray-600 mt-2">{r.review}</Text> : null}
                </View>
              ))
            )}
          </View>
        </ScrollView>

        <Modal visible={showReview} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView className="flex-1 bg-cream">
            <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
              <Pressable onPress={() => setShowReview(false)} className="bg-white rounded-full p-2 shadow-sm">
                <ChevronLeft size={22} color="#2D1F1A" />
              </Pressable>
              <Text className="text-lg font-bold text-warmBrown">Write a review</Text>
              <Pressable onPress={saveReview} className="bg-forest-600 rounded-full px-4 py-2">
                {savingReview ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Save</Text>}
              </Pressable>
            </View>
            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
              <View className="bg-white rounded-2xl p-4 mt-2">
                <Text className="text-warmBrown font-semibold mb-2">Rating</Text>
                <View className="flex-row">
                  {[1,2,3,4,5].map((n) => (
                    <Pressable key={n} onPress={() => setRating(n)} className="mr-2">
                      <Star size={26} color={n <= rating ? '#C9A227' : '#D1D5DB'} fill={n <= rating ? '#C9A227' : 'transparent'} />
                    </Pressable>
                  ))}
                </View>
              </View>
              <View className="bg-white rounded-2xl p-4 mt-3">
                <Text className="text-warmBrown font-semibold mb-2">Comment (optional)</Text>
                <TextInput
                  value={reviewText}
                  onChangeText={setReviewText}
                  placeholder="Share your experience…"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  className="text-warmBrown"
                  style={{ minHeight: 120, textAlignVertical: 'top' }}
                />
              </View>
              <View className="h-20" />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

