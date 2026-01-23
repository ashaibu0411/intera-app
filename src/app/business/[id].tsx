import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator, Alert, FlatList, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { ChevronLeft, MapPin, Star, CheckCircle, ShieldCheck, Phone, MessageCircle, Navigation, Plus, Package, ShoppingBag, CheckCircle2, Sparkles, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/lib/store';
import { getBusiness, getBusinessReviews, getBusinessTrustCounts, removeBusinessConfirmation, setBusinessConfirmation, upsertBusinessReview, getBusinessInventory } from '@/lib/marketplace-api';
import { getOrCreateTrustScore, DbUserTrustScore } from '@/lib/trust-api';
import { TrustScoreBadge } from '@/components/TrustScoreBadge';
import { ReviewHistoryBadge } from '@/components/ReviewHistoryBadge';
import { getOrCreateConversation } from '@/lib/messages';
import Animated, { FadeInUp } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiSummarizeCard, type AiSummaryResult } from '@/lib/aiSummarizeCard';
import { FormattedAiText } from '@/components/FormattedAiText';
import { aiBusinessBooster, type AiBusinessBoosterResult } from '@/lib/aiBusinessBooster';
import { hasEntitlement, isRevenueCatEnabled } from '@/lib/revenuecatClient';
import { getBusinessBookingSettings, getBusinessHours, type DbBusinessBookingSettings } from '@/lib/booking-api';
import { getBusinessStatus, type BusinessStatusInfo } from '@/lib/business-status';
import { BusinessStatusBadge } from '@/components/BusinessStatusBadge';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  in_stock: boolean;
  quantity?: number;
}

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
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [ownerTrustScore, setOwnerTrustScore] = useState<DbUserTrustScore | null>(null);
  const [aiSummary, setAiSummary] = useState<AiSummaryResult | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [bookingSettings, setBookingSettings] = useState<DbBusinessBookingSettings | null>(null);
  const [businessStatus, setBusinessStatus] = useState<BusinessStatusInfo | null>(null);
  const [businessProActive, setBusinessProActive] = useState(false);
  const [checkingBusinessPro, setCheckingBusinessPro] = useState(false);
  const [showBooster, setShowBooster] = useState(false);
  const [boosterLoading, setBoosterLoading] = useState(false);
  const [boosterResult, setBoosterResult] = useState<AiBusinessBoosterResult | null>(null);

  const canInteract = !!currentUser?.id && !isGuest;
  const isOwner = !!currentUser?.id && !!business?.owner_id && currentUser.id === business.owner_id;

  const load = async () => {
    if (!businessId) return;
    const b = await getBusiness(businessId);
    const [r, t, inv, hours, settings] = await Promise.all([
      getBusinessReviews(businessId, 50),
      getBusinessTrustCounts(businessId),
      getBusinessInventory(businessId),
      getBusinessHours(businessId),
      getBusinessBookingSettings(businessId),
    ]);
    setBusiness(b);
    setReviews(r as any);
    setTrust(t);
    setInventory((inv || []) as InventoryItem[]);
    setLoadingInventory(false);

    // Calculate and set business status
    const status = getBusinessStatus(hours, settings);
    setBusinessStatus(status);

    // Fetch owner's trust score if business has an owner
    if (b?.owner_id) {
      const trustScore = await getOrCreateTrustScore(b.owner_id);
      setOwnerTrustScore(trustScore);
    }
  };

  useEffect(() => {
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  // Load booking settings + Business Pro status (owner-only)
  useEffect(() => {
    if (!businessId) return;
    if (!isOwner) return;
    let mounted = true;
    (async () => {
      setCheckingBusinessPro(true);
      try {
        const settings = await getBusinessBookingSettings(businessId);
        if (!mounted) return;
        setBookingSettings(settings);

        let entitled = false;
        if (isRevenueCatEnabled()) {
          const rc = await hasEntitlement('business_pro');
          entitled = rc.ok && rc.data;
        }
        setBusinessProActive(entitled || !!settings?.has_business_pro);
      } catch (e) {
        console.log('[BusinessBooster] Pro check failed:', e);
        if (mounted) setBusinessProActive(false);
      } finally {
        if (mounted) setCheckingBusinessPro(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [businessId, isOwner]);

  const openBooster = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!businessProActive) {
      router.push('/business-pro-paywall');
      return;
    }
    setShowBooster(true);
  };

  const generateBooster = async () => {
    if (!business || boosterLoading) return;
    setBoosterLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await aiBusinessBooster({
        business: {
          name: business.name,
          description: business.description,
          category: business.category || business.type || undefined,
          locationLabel: displayLocation || undefined,
          phone: business.phone || undefined,
          website: business.website || business.url || undefined,
        },
        goal: 'more_messages',
        voice: 'community',
      });
      setBoosterResult(res);
    } catch (e) {
      console.log('[BusinessBooster] Generate failed:', e);
      Alert.alert('AI Booster failed', 'Please try again in a moment.');
    } finally {
      setBoosterLoading(false);
    }
  };

  const shareBooster = async () => {
    if (!boosterResult || !business) return;
    try {
      await Share.share({
        message: [
          boosterResult.tagline,
          '',
          boosterResult.instagram_captions?.[0] || '',
          '',
          boosterResult.hashtags?.length ? boosterResult.hashtags.join(' ') : '',
        ]
          .filter(Boolean)
          .join('\n'),
      });
    } catch {
      // ignore
    }
  };

  // Load cached AI summary
  useEffect(() => {
    if (!businessId) return;
    const cacheKey = `ai_summary:business:${businessId}`;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (!raw) return;
        const parsed = JSON.parse(raw) as AiSummaryResult;
        if (parsed?.bullets?.length) setAiSummary(parsed);
      } catch {
        // ignore
      }
    })();
  }, [businessId]);

  const generateSummary = async () => {
    if (!business || !businessId || aiSummaryLoading) return;
    setAiSummaryLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const res = await aiSummarizeCard({
        kind: 'business',
        title: business.name,
        description: business.description,
        locationLabel: displayLocation,
        category: business.category || business.type || undefined,
      });
      setAiSummary(res);
      await AsyncStorage.setItem(`ai_summary:business:${businessId}`, JSON.stringify(res));
    } catch (e) {
      console.log('[Business] AI summary error:', e);
    } finally {
      setAiSummaryLoading(false);
    }
  };

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

  const handleMessageBusiness = async () => {
    if (!canInteract || !currentUser?.id) {
      router.push('/signup');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ownerId = business?.owner_id;
    if (!ownerId) {
      Alert.alert('Unable to message', 'This business has no registered owner.');
      return;
    }
    try {
      const conversationId = await getOrCreateConversation(currentUser.id, ownerId);
      router.push({
        pathname: '/conversation/[id]',
        params: {
          id: conversationId,
          otherUserName: business?.name || 'Business',
          otherUserAvatar: business?.logo || business?.image,
        },
      } as any);
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Could not start conversation. Please try again.');
    }
  };

  const handleContactAboutItem = async (item: InventoryItem) => {
    if (!canInteract || !currentUser?.id) {
      router.push('/signup');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedItem(null);
    const ownerId = business?.owner_id;
    if (!ownerId) {
      Alert.alert('Unable to message', 'This business has no registered owner.');
      return;
    }
    try {
      const conversationId = await getOrCreateConversation(currentUser.id, ownerId);
      router.push({
        pathname: '/conversation/[id]',
        params: {
          id: conversationId,
          otherUserName: business?.name || 'Business',
          otherUserAvatar: business?.logo || business?.image,
          initialMessage: `Hi! I'm interested in "${item.name}" ($${item.price.toFixed(2)}). Is it still available?`,
        },
      } as any);
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Could not start conversation. Please try again.');
    }
  };

  const inStockItems = inventory.filter(item => item.in_stock);
  const outOfStockItems = inventory.filter(item => !item.in_stock);

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
              <View className="flex-row items-center justify-between flex-wrap gap-2">
                <Text className="text-warmBrown font-bold text-lg">{business.name}</Text>
                <View className="flex-row items-center gap-2">
                  {businessStatus && (
                    <BusinessStatusBadge status={businessStatus} size="md" />
                  )}
                  {business.is_verified && (
                    <View className="flex-row items-center bg-forest-50 rounded-full px-3 py-1">
                      <ShieldCheck size={14} color="#1B4D3E" />
                      <Text className="text-forest-700 font-semibold ml-1 text-xs">Verified</Text>
                    </View>
                  )}
                </View>
              </View>
              <Text className="text-gray-600 mt-2">{business.description}</Text>

              {/* AI Summary */}
              <View className="mt-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
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
                    Tap “Generate” for a quick overview of this business.
                  </Text>
                )}
              </View>

              {/* Business Booster (Pro) - owner only */}
              {isOwner ? (
                <View className="mt-4 bg-white rounded-2xl p-4 border border-gray-100">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1 pr-3">
                      <View className={`rounded-full p-2 ${businessProActive ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                        {businessProActive ? <Sparkles size={18} color="#10B981" /> : <Lock size={18} color="#6B7280" />}
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-warmBrown font-bold">AI Business Booster</Text>
                        <Text className="text-gray-500 text-sm" numberOfLines={2}>
                          {businessProActive ? 'Generate promo captions, flyer copy, and hashtags' : 'Unlock with Business Pro'}
                        </Text>
                      </View>
                    </View>
                    <Pressable onPress={openBooster} disabled={checkingBusinessPro}>
                      <Text className={`font-semibold ${checkingBusinessPro ? 'text-gray-400' : 'text-terracotta-500'}`}>
                        {businessProActive ? 'Open' : 'Upgrade'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}

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
                  onPress={handleMessageBusiness}
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

          {/* Owner Trust Score */}
          {ownerTrustScore && (
            <View className="mx-5 mt-4">
              <TrustScoreBadge
                score={ownerTrustScore.overall_score}
                verificationLevel={ownerTrustScore.verification_level}
                reviewCount={trust?.reviews ?? 0}
                avgRating={trust?.avgRating ?? 0}
                confirmationCount={trust?.workedForMe ?? 0}
                userId={business?.owner_id}
              />
            </View>
          )}

          {/* Review History Warning (if suspicious) */}
          {business?.owner_id && (
            <View className="mx-5 mt-3">
              <ReviewHistoryBadge userId={business.owner_id} />
            </View>
          )}

          {/* Inventory Section */}
          <View className="mx-5 mt-4">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Package size={20} color="#2D1F1A" />
                <Text className="text-warmBrown font-bold text-lg ml-2">What's In Store</Text>
              </View>
              {inventory.length > 0 && (
                <Text className="text-gray-500 text-sm">{inStockItems.length} in stock</Text>
              )}
            </View>

            {loadingInventory ? (
              <View className="bg-white rounded-2xl p-6 items-center">
                <ActivityIndicator color="#1B4D3E" />
                <Text className="text-gray-500 mt-2">Loading inventory...</Text>
              </View>
            ) : inventory.length === 0 ? (
              <View className="bg-white rounded-2xl p-6 items-center">
                <ShoppingBag size={32} color="#9CA3AF" />
                <Text className="text-warmBrown font-semibold mt-3">No items listed</Text>
                <Text className="text-gray-500 text-center mt-1">This business hasn't added their inventory yet.</Text>
              </View>
            ) : (
              <View>
                {/* In Stock Items */}
                {inStockItems.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flexGrow: 0 }}
                    className="mb-3"
                  >
                    {inStockItems.map((item, index) => (
                      <Animated.View
                        key={item.id}
                        entering={FadeInUp.duration(300).delay(index * 50)}
                      >
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedItem(item);
                          }}
                          className="bg-white rounded-2xl mr-3 overflow-hidden shadow-sm"
                          style={{ width: 160 }}
                        >
                          <Image
                            source={{ uri: item.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300' }}
                            style={{ width: 160, height: 120 }}
                            contentFit="cover"
                          />
                          <View className="p-3">
                            <Text className="text-warmBrown font-semibold" numberOfLines={1}>{item.name}</Text>
                            <Text className="text-forest-600 font-bold mt-1">${item.price.toFixed(2)}</Text>
                            <View className="flex-row items-center mt-2">
                              <CheckCircle2 size={12} color="#10B981" />
                              <Text className="text-emerald-600 text-xs ml-1">In Stock</Text>
                              {item.quantity && (
                                <Text className="text-gray-400 text-xs ml-1">({item.quantity})</Text>
                              )}
                            </View>
                          </View>
                        </Pressable>
                      </Animated.View>
                    ))}
                  </ScrollView>
                )}

                {/* Out of Stock Items */}
                {outOfStockItems.length > 0 && (
                  <View>
                    <Text className="text-gray-500 text-sm mb-2">Out of Stock</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ flexGrow: 0 }}
                    >
                      {outOfStockItems.map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedItem(item);
                          }}
                          className="bg-white rounded-2xl mr-3 overflow-hidden shadow-sm opacity-60"
                          style={{ width: 140 }}
                        >
                          <Image
                            source={{ uri: item.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300' }}
                            style={{ width: 140, height: 100 }}
                            contentFit="cover"
                          />
                          <View className="p-2">
                            <Text className="text-warmBrown font-medium text-sm" numberOfLines={1}>{item.name}</Text>
                            <Text className="text-gray-400 text-xs mt-1">Out of stock</Text>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            )}
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

        {/* AI Business Booster Modal */}
        <Modal visible={showBooster} transparent animationType="slide" onRequestClose={() => setShowBooster(false)}>
          <View className="flex-1 bg-black/50">
            <Pressable className="flex-1" onPress={() => setShowBooster(false)} />
            <View className="bg-cream rounded-t-3xl max-h-[82%]">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">AI Business Booster</Text>
                <Pressable onPress={() => setShowBooster(false)} className="bg-white rounded-full p-2 shadow-sm">
                  <ChevronLeft size={22} color="#2D1F1A" />
                </Pressable>
              </View>

              <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
                <View className="bg-white rounded-2xl p-4 border border-gray-100">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-warmBrown font-bold">Promo Pack</Text>
                    <Pressable onPress={generateBooster} disabled={boosterLoading}>
                      <Text className={`font-semibold ${boosterLoading ? 'text-gray-400' : 'text-forest-700'}`}>
                        {boosterResult ? 'Regenerate' : boosterLoading ? 'Working…' : 'Generate'}
                      </Text>
                    </Pressable>
                  </View>
                  <Text className="text-gray-500 text-sm mt-1">
                    Built from your business profile. No fake claims added.
                  </Text>
                </View>

                {boosterResult ? (
                  <View className="mt-4">
                    <View className="bg-white rounded-2xl p-4 border border-gray-100">
                      <Text className="text-gray-500 text-xs font-semibold">TAGLINE</Text>
                      <Text className="text-warmBrown font-bold text-lg mt-1">{boosterResult.tagline}</Text>
                      <Text className="text-gray-500 text-xs font-semibold mt-4">SHORT BIO</Text>
                      <Text className="text-gray-700 mt-1">{boosterResult.short_bio}</Text>
                    </View>

                    <View className="bg-white rounded-2xl p-4 border border-gray-100 mt-3">
                      <Text className="text-gray-500 text-xs font-semibold">INSTAGRAM CAPTIONS</Text>
                      {boosterResult.instagram_captions?.slice(0, 3).map((c, i) => (
                        <Text key={i} className="text-gray-700 mt-2">• {c}</Text>
                      ))}
                    </View>

                    <View className="bg-white rounded-2xl p-4 border border-gray-100 mt-3">
                      <Text className="text-gray-500 text-xs font-semibold">FLYER</Text>
                      <Text className="text-warmBrown font-bold text-base mt-1">{boosterResult.flyer?.headline}</Text>
                      {boosterResult.flyer?.bullets?.slice(0, 6).map((b, i) => (
                        <Text key={i} className="text-gray-700 mt-1">• {b}</Text>
                      ))}
                    </View>

                    <View className="bg-white rounded-2xl p-4 border border-gray-100 mt-3">
                      <Text className="text-gray-500 text-xs font-semibold">HASHTAGS</Text>
                      <Text className="text-gray-700 mt-2">
                        {(boosterResult.hashtags || []).slice(0, 20).join(' ')}
                      </Text>
                    </View>

                    {boosterResult.safety_note ? (
                      <View className="bg-amber-50 rounded-2xl p-4 border border-amber-200 mt-3">
                        <Text className="text-amber-800">{boosterResult.safety_note}</Text>
                      </View>
                    ) : null}

                    <Pressable onPress={shareBooster} className="mt-4 bg-terracotta-500 rounded-2xl py-4 items-center">
                      <Text className="text-white font-bold">Share Promo</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View className="mt-4 items-center">
                    {boosterLoading ? <ActivityIndicator color="#1B4D3E" /> : null}
                    <Text className="text-gray-500 mt-2">Tap “Generate” to create your promo pack.</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Item Detail Modal */}
        <Modal visible={!!selectedItem} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl max-h-[80%]">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Pressable
                  onPress={() => setSelectedItem(null)}
                  className="bg-white rounded-full p-2 shadow-sm"
                >
                  <ChevronLeft size={22} color="#2D1F1A" />
                </Pressable>
                <Text className="text-lg font-bold text-warmBrown">Item Details</Text>
                <View style={{ width: 40 }} />
              </View>

              {selectedItem && (
                <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
                  <Image
                    source={{ uri: selectedItem.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400' }}
                    style={{ width: '100%', height: 220, borderRadius: 16 }}
                    contentFit="cover"
                  />

                  <View className="mt-4">
                    <View className="flex-row items-start justify-between">
                      <Text className="text-warmBrown font-bold text-xl flex-1">{selectedItem.name}</Text>
                      <Text className="text-forest-600 font-bold text-xl">${selectedItem.price.toFixed(2)}</Text>
                    </View>

                    {selectedItem.category && (
                      <Text className="text-gray-500 mt-1">{selectedItem.category}</Text>
                    )}

                    <View className="flex-row items-center mt-3">
                      {selectedItem.in_stock ? (
                        <>
                          <CheckCircle2 size={16} color="#10B981" />
                          <Text className="text-emerald-600 font-medium ml-2">In Stock</Text>
                          {selectedItem.quantity && (
                            <Text className="text-gray-500 ml-2">({selectedItem.quantity} available)</Text>
                          )}
                        </>
                      ) : (
                        <>
                          <Package size={16} color="#9CA3AF" />
                          <Text className="text-gray-500 font-medium ml-2">Out of Stock</Text>
                        </>
                      )}
                    </View>

                    {selectedItem.description && (
                      <View className="mt-4 bg-white rounded-xl p-4">
                        <Text className="text-warmBrown font-semibold mb-2">Description</Text>
                        <Text className="text-gray-600 leading-6">{selectedItem.description}</Text>
                      </View>
                    )}

                    <View className="mt-4 bg-white rounded-xl p-4">
                      <Text className="text-warmBrown font-semibold mb-2">Sold by</Text>
                      <View className="flex-row items-center">
                        <Image
                          source={{ uri: business?.logo || business?.image }}
                          style={{ width: 40, height: 40, borderRadius: 20 }}
                          contentFit="cover"
                        />
                        <View className="ml-3 flex-1">
                          <Text className="text-warmBrown font-medium">{business?.name}</Text>
                          <Text className="text-gray-500 text-sm">{business?.location}</Text>
                        </View>
                      </View>
                    </View>

                    {selectedItem.in_stock && (
                      <Pressable
                        onPress={() => handleContactAboutItem(selectedItem)}
                        className="mt-4 bg-forest-600 rounded-xl py-4 flex-row items-center justify-center"
                      >
                        <MessageCircle size={20} color="#fff" />
                        <Text className="text-white font-semibold ml-2">Contact About This Item</Text>
                      </Pressable>
                    )}

                    {!selectedItem.in_stock && (
                      <View className="mt-4 bg-gray-100 rounded-xl py-4 items-center">
                        <Text className="text-gray-500 font-medium">Currently Unavailable</Text>
                        <Text className="text-gray-400 text-sm mt-1">Check back later or message the seller</Text>
                        <Pressable
                          onPress={handleMessageBusiness}
                          className="mt-3 bg-white rounded-full px-4 py-2 flex-row items-center"
                        >
                          <MessageCircle size={16} color="#1B4D3E" />
                          <Text className="text-forest-700 font-medium ml-2">Ask About Availability</Text>
                        </Pressable>
                      </View>
                    )}

                    <View className="h-8" />
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

