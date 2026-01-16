import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChevronLeft, MapPin, Star, CheckCircle, ShieldCheck, Phone, MessageCircle, Navigation, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/lib/store';
import { getBusiness, getBusinessReviews, getBusinessTrustCounts, removeBusinessConfirmation, setBusinessConfirmation, upsertBusinessReview } from '@/lib/marketplace-api';

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const businessId = id || '';

  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);

  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [trust, setTrust] = useState<{ reviews: number; avgRating: number; workedForMe: number } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [savingReview, setSavingReview] = useState(false);

  const canInteract = !!currentUser?.id && !isGuest;

  const load = async () => {
    if (!businessId) return;
    const b = await getBusiness(businessId);
    const [r, t] = await Promise.all([
      getBusinessReviews(businessId, 50),
      getBusinessTrustCounts(businessId),
    ]);
    setBusiness(b);
    setReviews(r as any);
    setTrust(t);
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const displayLocation = useMemo(() => business?.location || '', [business]);

  const handleWorkedForMe = async () => {
    if (!canInteract || !currentUser?.id) {
      router.push('/signup');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await setBusinessConfirmation(businessId, currentUser.id);
      const t = await getBusinessTrustCounts(businessId);
      setTrust(t);
    } catch {
      // If already confirmed, allow toggle off
      try {
        await removeBusinessConfirmation(businessId, currentUser.id);
        const t = await getBusinessTrustCounts(businessId);
        setTrust(t);
      } catch {}
    }
  };

  const handleSaveReview = async () => {
    if (!canInteract || !currentUser?.id) {
      router.push('/signup');
      return;
    }
    setSavingReview(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await upsertBusinessReview(businessId, currentUser.id, rating, reviewText.trim() || null);
      await load();
      setShowReview(false);
      setReviewText('');
      setRating(5);
    } catch (e) {
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

  if (!business) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-6">
        <Text className="text-warmBrown font-semibold text-lg text-center">Business not found</Text>
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
          <View className="flex-row items-center">
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
              <Text className="text-xl font-bold text-warmBrown" numberOfLines={1}>{business.name}</Text>
              <View className="flex-row items-center mt-0.5">
                <MapPin size={14} color="#D4673A" />
                <Text className="text-sm text-gray-500 ml-1" numberOfLines={1}>{displayLocation}</Text>
              </View>
            </View>
            <Pressable
              onPress={() => setShowReview(true)}
              className="bg-forest-600 rounded-full p-2.5"
            >
              <Plus size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mx-5 mt-2 bg-white rounded-2xl overflow-hidden shadow-sm">
            <Image source={{ uri: business.image }} style={{ width: '100%', height: 180 }} contentFit="cover" />
            <View className="p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-warmBrown font-bold text-lg">{business.name}</Text>
                {business.is_verified && (
                  <View className="flex-row items-center bg-forest-50 rounded-full px-3 py-1">
                    <ShieldCheck size={14} color="#1B4D3E" />
                    <Text className="text-forest-700 font-semibold ml-1 text-xs">Verified</Text>
                  </View>
                )}
              </View>
              <Text className="text-gray-600 mt-2">{business.description}</Text>

              <View className="flex-row items-center mt-3">
                <Star size={16} color="#C9A227" fill="#C9A227" />
                <Text className="text-warmBrown font-semibold ml-2">
                  {(trust?.avgRating ?? business.rating ?? 0).toFixed(1)}
                </Text>
                <Text className="text-gray-400 ml-2">
                  ({trust?.reviews ?? business.reviews ?? 0} reviews)
                </Text>
              </View>

              <View className="flex-row items-center mt-3 gap-2">
                <Pressable
                  onPress={handleWorkedForMe}
                  className="flex-1 bg-terracotta-500 rounded-full py-3 items-center flex-row justify-center"
                >
                  <CheckCircle size={16} color="#fff" />
                  <Text className="text-white font-semibold ml-2">
                    Worked for me ({trust?.workedForMe ?? 0})
                  </Text>
                </Pressable>
              </View>

              <View className="flex-row items-center mt-3 pt-3 border-t border-gray-100">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert('Call', business.phone ? business.phone : 'No phone number');
                  }}
                  className="flex-1 flex-row items-center"
                >
                  <Phone size={16} color="#1B4D3E" />
                  <Text className="text-forest-700 font-semibold ml-2">Call</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (!canInteract) router.push('/signup');
                    else router.push({ pathname: '/messages', params: { businessId: business.id, businessName: business.name } } as any);
                  }}
                  className="flex-1 flex-row items-center"
                >
                  <MessageCircle size={16} color="#C9A227" />
                  <Text className="text-gold-700 font-semibold ml-2">Message</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert('Directions', business.address || 'No address');
                  }}
                  className="flex-1 flex-row items-center"
                >
                  <Navigation size={16} color="#D4673A" />
                  <Text className="text-terracotta-600 font-semibold ml-2">Directions</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View className="mx-5 mt-4 mb-10">
            <Text className="text-warmBrown font-bold text-lg mb-2">Reviews</Text>
            {reviews.length === 0 ? (
              <View className="bg-white rounded-2xl p-6 items-center">
                <Star size={26} color="#C9A227" />
                <Text className="text-warmBrown font-semibold mt-3">No reviews yet</Text>
                <Text className="text-gray-500 text-center mt-1">Be the first to leave a review.</Text>
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
              <Pressable onPress={handleSaveReview} className="bg-forest-600 rounded-full px-4 py-2">
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
                  placeholder="Share what you liked (or what to improve)…"
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

