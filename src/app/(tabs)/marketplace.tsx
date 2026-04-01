import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ShoppingBag,
  Search,
  Plus,
  MapPin,
  Eye,
  MessageCircle,
  ChevronRight,
  X,
  Heart,
  Bookmark,
  Trash2,
  CheckCircle,
  Gem,
  Store,
  Shield,
  Package,
  Flag,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import {
  useStore,
  MARKETPLACE_CATEGORIES,
  type MarketplaceListing,
} from '@/lib/store';
import { getBusinessInventoryUpdates, getMarketplaceListings, deleteMarketplaceListing as deleteMarketplaceListingApi } from '@/lib/marketplace-api';
import { getOrCreateConversation } from '@/lib/messages';
import { purchaseMarketplaceListing, priceToGems, calculateFeeBreakdown } from '@/lib/marketplacePayments';
import { getGemBalance } from '@/lib/giftService';
import { aiTrustSafety, type AiTrustSafetyResult } from '@/lib/aiTrustSafety';
import { subscribeToInventoryUpdates } from '@/lib/inventoryRealtime';
import { REPORT_REASONS, type ViolationType } from '@/lib/contentModeration';
import { reportListing } from '@/lib/reports';

interface DbListing {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  category: string;
  condition: 'new' | 'used' | 'refurbished';
  location: string | null;
  is_store_based: boolean;
  store_name: string | null;
  views: number;
  created_at: string;
  seller?: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    location: string | null;
  };
}

export default function MarketplaceTabScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [dbListings, setDbListings] = useState<DbListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Purchase flow state
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [gemBalance, setGemBalance] = useState(0);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [buyerPaysFee, setBuyerPaysFee] = useState(false);

  const isGuest = useStore((s) => s.isGuest);
  const currentUser = useStore((s) => s.currentUser);
  const userListings = useStore((s) => s.userListings);
  const deleteMarketplaceListing = useStore((s) => s.deleteMarketplaceListing);
  const markListingAsSold = useStore((s) => s.markListingAsSold);
  const savedListingIds = useStore((s) => s.savedListingIds);
  const toggleSaveListing = useStore((s) => s.toggleSaveListing);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [listingToModify, setListingToModify] = useState<MarketplaceListing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [safetyBusy, setSafetyBusy] = useState(false);
  const [safetyResult, setSafetyResult] = useState<AiTrustSafetyResult | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<ViolationType | null>(null);

  const selectedLocation = useStore((s) => s.selectedLocation);
  const city = useMemo(() => String(selectedLocation?.city || ''), [selectedLocation?.city]);
  const neighborhood = useMemo(() => (selectedLocation?.neighborhood ? String(selectedLocation.neighborhood) : null), [selectedLocation?.neighborhood]);

  const [restocks, setRestocks] = useState<any[]>([]);
  const [restocksLoading, setRestocksLoading] = useState(false);

  const loadRestocks = useCallback(async () => {
    if (!city) {
      setRestocks([]);
      return;
    }
    setRestocksLoading(true);
    try {
      const data = await getBusinessInventoryUpdates({ city, neighborhood: null, limit: 12 });
      setRestocks(data as any);
    } catch (e) {
      console.log('[Marketplace] restocks load failed:', e);
      setRestocks([]);
    } finally {
      setRestocksLoading(false);
    }
  }, [city]);

  const handleOpenDeleteModal = () => {
    if (!selectedListing) return;
    setListingToModify(selectedListing);
    setSelectedListing(null);
    setTimeout(() => {
      setShowDeleteModal(true);
    }, 100);
  };

  const handleOpenSoldModal = () => {
    if (!selectedListing) return;
    setListingToModify(selectedListing);
    setSelectedListing(null);
    setTimeout(() => {
      setShowSoldModal(true);
    }, 100);
  };

  const handleConfirmDelete = async () => {
    if (!listingToModify) return;
    setIsDeleting(true);
    try {
      const isDbListing = listingToModify.id.includes('-') && listingToModify.id.length > 20;
      if (isDbListing) {
        await deleteMarketplaceListingApi(listingToModify.id);
        setDbListings(prev => prev.filter(l => l.id !== listingToModify.id));
      }
      deleteMarketplaceListing(listingToModify.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowDeleteModal(false);
      setListingToModify(null);
    } catch (error) {
      console.error('Error deleting listing:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to delete listing. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmSold = () => {
    if (!listingToModify) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markListingAsSold(listingToModify.id);
    setShowSoldModal(false);
    setListingToModify(null);
  };

  const fetchListings = async () => {
    try {
      const data = await getMarketplaceListings();
      setDbListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    loadRestocks();
  }, [loadRestocks]);

  // Realtime refresh for restocks
  useEffect(() => {
    if (!city) return;
    const unsub = subscribeToInventoryUpdates({
      city,
      onInsert: () => {
        loadRestocks().catch(() => null);
      },
    });
    return unsub;
  }, [city, loadRestocks]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchListings();
  };

  const supabaseListings: MarketplaceListing[] = dbListings.map((listing) => ({
    id: listing.id,
    seller: {
      id: listing.seller?.id || listing.seller_id,
      name: listing.seller?.name || 'Unknown',
      username: listing.seller?.username || 'unknown',
      avatar: listing.seller?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
      bio: '',
      location: listing.seller?.location || '',
      interests: [],
      joinedDate: '',
    },
    title: listing.title,
    description: listing.description,
    price: listing.price.toString(),
    currency: listing.currency,
    images: listing.images,
    category: listing.category,
    condition: listing.condition,
    location: listing.location || '',
    isStoreBased: listing.is_store_based,
    storeName: listing.store_name || undefined,
    createdAt: listing.created_at,
    views: listing.views,
  }));

  // Use only real data from database - no mock data
  const allListings = [...userListings, ...supabaseListings];

  const filteredListings = allListings.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || listing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCategorySelect = (category: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  const handleListingPress = (listing: MarketplaceListing) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedListing(listing);
  };

  const handleContactSeller = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isGuest || !currentUser) {
      router.push('/signup');
      return;
    }
    if (!selectedListing) return;

    try {
      // Create or get existing conversation with seller
      const conversationId = await getOrCreateConversation(currentUser.id, selectedListing.seller.id);
      setSelectedListing(null);
      // Navigate to the conversation
      router.push({
        pathname: '/chat/[id]',
        params: {
          id: conversationId,
          name: selectedListing.seller.name,
          avatar: selectedListing.seller.avatar,
          recipientId: selectedListing.seller.id,
        },
      } as any);
    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Could not start conversation. Please try again.');
    }
  };

  const runSafetyCheck = async () => {
    if (!selectedListing || safetyBusy) return;
    setSafetyBusy(true);
    setSafetyResult(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const payload = [
        `Title: ${selectedListing.title}`,
        `Price: ${selectedListing.price} ${selectedListing.currency}`,
        `Category: ${selectedListing.category}`,
        `Condition: ${selectedListing.condition}`,
        `Description: ${selectedListing.description}`,
        `Seller: ${selectedListing.seller?.name} (@${selectedListing.seller?.username})`,
      ].join('\n');
      const res = await aiTrustSafety({ kind: 'marketplace_listing', text: payload });
      setSafetyResult(res);
      setShowSafetyModal(true);
    } catch (e) {
      console.log('[Marketplace] safety check failed:', e);
      Alert.alert('Safety check failed', 'Please try again in a moment.');
    } finally {
      setSafetyBusy(false);
    }
  };

  const handleBuyNow = async () => {
    if (!selectedListing) return;
    if (isGuest || !currentUser) {
      router.push('/signup');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const balance = await getGemBalance(currentUser.id);
    setGemBalance(balance);
    setPurchaseSuccess(false);
    setBuyerPaysFee(false);
    setShowPurchaseModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedListing || !currentUser) return;
    const gemPrice = priceToGems(parseFloat(selectedListing.price));
    const feeBreakdown = calculateFeeBreakdown(gemPrice, buyerPaysFee);

    if (gemBalance < feeBreakdown.totalBuyerPays) {
      Alert.alert(
        'Insufficient Gems',
        'You need more gems to purchase this item.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Get Gems', onPress: () => {
            setShowPurchaseModal(false);
            setSelectedListing(null);
            router.push('/gem-store');
          }}
        ]
      );
      return;
    }

    setIsPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await purchaseMarketplaceListing(
      currentUser.id,
      currentUser.name ?? 'User',
      selectedListing.seller.id,
      selectedListing.seller.name,
      selectedListing.id,
      selectedListing.title,
      gemPrice,
      buyerPaysFee
    );

    setIsPurchasing(false);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPurchaseSuccess(true);
      setGemBalance(result.newBuyerBalance ?? gemBalance - feeBreakdown.totalBuyerPays);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Purchase Failed', result.error ?? 'Something went wrong. Please try again.');
    }
  };

  const handleCreateListing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isGuest || !currentUser) {
      router.push('/signup');
    } else {
      router.push('/create-listing');
    }
  };

  const isOwnListing = (listing: MarketplaceListing) => {
    return currentUser && listing.seller.id === currentUser.id;
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <View className="bg-forest-100 rounded-full p-2.5 mr-3">
                <ShoppingBag size={24} color="#1B4D3E" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-warmBrown">Marketplace</Text>
                <Text className="text-sm text-gray-500">Buy & Sell in Your Community</Text>
              </View>
            </View>

            <Pressable
              onPress={handleCreateListing}
              className="bg-forest-600 rounded-full p-2.5"
            >
              <Plus size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
            <Search size={20} color="#8B7355" />
            <TextInput
              placeholder="Search products, crafts, services..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-warmBrown text-base"
            />
          </View>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            style={{ flexGrow: 0 }}
          >
            <Pressable
              onPress={() => handleCategorySelect(null)}
              className={`px-4 py-2 rounded-full mr-2 ${
                !selectedCategory ? 'bg-forest-600' : 'bg-white'
              }`}
            >
              <Text className={`font-medium ${!selectedCategory ? 'text-white' : 'text-gray-600'}`}>
                All
              </Text>
            </Pressable>
            {MARKETPLACE_CATEGORIES.slice(0, 6).map((category) => (
              <Pressable
                key={category}
                onPress={() => handleCategorySelect(category)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedCategory === category ? 'bg-forest-600' : 'bg-white'
                }`}
              >
                <Text className={`font-medium ${selectedCategory === category ? 'text-white' : 'text-gray-600'}`}>
                  {category.split(' ')[0]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Listings Grid */}
        <ScrollView
          className="flex-1 px-5 pt-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#1B4D3E" />
          }
        >
          {isLoading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#1B4D3E" />
              <Text className="text-gray-500 mt-4">Loading listings...</Text>
            </View>
          ) : (
            <>
              {/* Just restocked near you */}
              {city ? (
                <Animated.View entering={FadeInUp.duration(350).delay(50)} className="mb-4">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <MapPin size={16} color="#D4673A" />
                      <Text className="text-warmBrown font-bold ml-2">Just restocked in {city}</Text>
                    </View>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/business-directory' as any);
                      }}
                      className="flex-row items-center"
                    >
                      <Store size={14} color="#1B4D3E" />
                      <Text className="text-forest-700 font-semibold ml-2">Local stores</Text>
                    </Pressable>
                  </View>

                  {restocksLoading ? (
                    <View className="bg-white rounded-2xl p-4 items-center">
                      <ActivityIndicator color="#1B4D3E" />
                      <Text className="text-gray-500 mt-2">Loading updates…</Text>
                    </View>
                  ) : restocks.length === 0 ? (
                    <View className="bg-white rounded-2xl p-4">
                      <Text className="text-gray-600">No restock updates yet.</Text>
                      <Text className="text-gray-400 text-sm mt-1">
                        When businesses update inventory, you’ll see it here in real time.
                      </Text>
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                      {restocks.map((u: any, idx: number) => {
                        const b = u.business;
                        const item = u.item;
                        const bizImg =
                          b?.logo || b?.image || 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300';
                        const itemImg = item?.image || bizImg;
                        return (
                          <Animated.View
                            key={u.id || `${idx}`}
                            entering={FadeInUp.duration(250).delay(80 + idx * 30)}
                            className="mr-3"
                          >
                            <Pressable
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.push(`/business/${String(u.business_id)}` as any);
                              }}
                              className="bg-white rounded-2xl overflow-hidden shadow-sm"
                              style={{ width: 220 }}
                            >
                              <Image source={{ uri: itemImg }} style={{ width: 220, height: 120 }} contentFit="cover" />
                              <View className="p-3">
                                <Text className="text-warmBrown font-bold" numberOfLines={1}>
                                  {item?.name || u.title || 'Update'}
                                </Text>
                                <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={1}>
                                  {b?.name || 'Business'}
                                </Text>
                                {u.message ? (
                                  <Text className="text-gray-600 text-sm mt-2" numberOfLines={2}>
                                    {String(u.message)}
                                  </Text>
                                ) : null}
                              </View>
                            </Pressable>
                          </Animated.View>
                        );
                      })}
                    </ScrollView>
                  )}

                  {/* Quick CTAs */}
                  <View className="flex-row mt-3">
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/my-orders' as any);
                      }}
                      className="flex-1 bg-white rounded-2xl p-4 mr-2 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center">
                        <Package size={18} color="#1B4D3E" />
                        <Text className="text-warmBrown font-bold ml-2">My orders</Text>
                      </View>
                      <ChevronRight size={18} color="#9CA3AF" />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push('/business-directory' as any);
                      }}
                      className="flex-1 bg-white rounded-2xl p-4 ml-2 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center">
                        <Store size={18} color="#1B4D3E" />
                        <Text className="text-warmBrown font-bold ml-2">Stores</Text>
                      </View>
                      <ChevronRight size={18} color="#9CA3AF" />
                    </Pressable>
                  </View>
                </Animated.View>
              ) : null}

              {/* Featured Banner */}
              <Animated.View entering={FadeInUp.duration(400).delay(100)} className="mb-4">
                <LinearGradient
                  colors={['#1B4D3E', '#153D31']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 16 }}
                >
                  <View className="flex-row items-center">
                    <View className="flex-1">
                      <Text className="text-white font-bold text-base">Sell Your Products</Text>
                      <Text className="text-white/70 text-sm mt-1">
                        List items in minutes. Reach communities worldwide.
                      </Text>
                    </View>
                    <Pressable
                      onPress={handleCreateListing}
                      className="bg-white/20 rounded-full px-4 py-2"
                    >
                      <Text className="text-white font-medium">Start Selling</Text>
                    </Pressable>
                  </View>
                </LinearGradient>
              </Animated.View>

              {/* Listings */}
              <View className="flex-row flex-wrap justify-between">
                {filteredListings.map((listing, index) => (
                  <Animated.View
                    key={listing.id}
                    entering={FadeInUp.duration(300).delay(150 + index * 50)}
                    style={{ width: '48%' }}
                    className="mb-4"
                  >
                    <Pressable
                      onPress={() => handleListingPress(listing)}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm"
                    >
                      <View className="relative">
                        <Image
                          source={{ uri: listing.images[0] }}
                          style={{ width: '100%', height: 140 }}
                          contentFit="cover"
                        />
                        {listing.isSold && (
                          <View className="absolute inset-0 bg-black/40 items-center justify-center">
                            <View className="bg-green-500 rounded-full px-3 py-1">
                              <Text className="text-white font-bold text-sm">SOLD</Text>
                            </View>
                          </View>
                        )}
                        {listing.isStoreBased && !listing.isSold && (
                          <View className="absolute top-2 left-2 bg-forest-700 rounded-full px-2 py-1 flex-row items-center">
                            <Store size={10} color="#FFFFFF" />
                            <Text className="text-white text-xs ml-1">Store</Text>
                          </View>
                        )}
                        <Pressable className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5">
                          <Heart size={16} color="#D4673A" />
                        </Pressable>
                      </View>
                      <View className="p-3">
                        <Text className="text-warmBrown font-semibold" numberOfLines={1}>
                          {listing.title}
                        </Text>
                        <Text className="text-forest-600 font-bold mt-1">${listing.price}</Text>
                        <View className="flex-row items-center mt-2">
                          <MapPin size={12} color="#9CA3AF" />
                          <Text className="text-gray-400 text-xs ml-1" numberOfLines={1}>
                            {listing.location}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>

              <View className="h-24" />
            </>
          )}
        </ScrollView>

        {/* Listing Detail Modal */}
        <Modal
          visible={!!selectedListing}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedListing(null)}
        >
          {selectedListing && (
            <View className="flex-1 bg-cream">
              <SafeAreaView edges={['top']} className="flex-1">
                <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                  <Pressable onPress={() => setSelectedListing(null)} className="bg-gray-100 rounded-full p-2">
                    <X size={24} color="#2D1F1A" />
                  </Pressable>
                  <View className="flex-row items-center gap-2">
                    {!isOwnListing(selectedListing) && (
                      <>
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowReportModal(true);
                          }}
                          className="bg-gray-100 rounded-full p-2"
                        >
                          <Flag size={24} color="#9CA3AF" />
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            toggleSaveListing(selectedListing.id);
                          }}
                          className="bg-gray-100 rounded-full p-2"
                        >
                          <Bookmark size={24} color={savedListingIds.includes(selectedListing.id) ? '#D4673A' : '#9CA3AF'} fill={savedListingIds.includes(selectedListing.id) ? '#D4673A' : 'transparent'} />
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="bg-gray-100" style={{ minHeight: 280 }}>
                    <Image
                      source={{ uri: selectedListing.images[0] }}
                      style={{ width: '100%', height: 320 }}
                      contentFit="contain"
                    />
                  </View>

                  <View className="p-5">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-2xl font-bold text-warmBrown">{selectedListing.title}</Text>
                        <Text className="text-3xl font-bold text-forest-600 mt-2">${selectedListing.price}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mt-3">
                      <MapPin size={16} color="#8B7355" />
                      <Text className="text-gray-600 ml-2">{selectedListing.location}</Text>
                    </View>

                    <View className="flex-row items-center mt-2">
                      <Eye size={16} color="#8B7355" />
                      <Text className="text-gray-500 ml-2">{selectedListing.views} views</Text>
                      <Text className="text-gray-400 mx-2">•</Text>
                      <Text className="text-gray-500">
                        Posted {formatDistanceToNow(new Date(selectedListing.createdAt), { addSuffix: true })}
                      </Text>
                    </View>

                    <View className="mt-6">
                      <Text className="text-lg font-semibold text-warmBrown mb-2">Description</Text>
                      <Text className="text-gray-600 leading-6">{selectedListing.description}</Text>
                    </View>

                    <View className="flex-row mt-6">
                      <View className="flex-1 mr-2">
                        <Text className="text-sm text-gray-500 mb-1">Category</Text>
                        <View className="bg-gray-100 rounded-full px-3 py-1.5 self-start">
                          <Text className="text-warmBrown font-medium">{selectedListing.category}</Text>
                        </View>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm text-gray-500 mb-1">Condition</Text>
                        <View className="bg-gray-100 rounded-full px-3 py-1.5 self-start">
                          <Text className="text-warmBrown font-medium capitalize">{selectedListing.condition}</Text>
                        </View>
                      </View>
                    </View>

                    <View className="mt-6 bg-white rounded-2xl p-4">
                      <Text className="text-lg font-semibold text-warmBrown mb-3">Seller</Text>
                      <View className="flex-row items-center">
                        <Image
                          source={{ uri: selectedListing.seller.avatar }}
                          style={{ width: 50, height: 50, borderRadius: 25 }}
                          contentFit="cover"
                        />
                        <View className="flex-1 ml-3">
                          <Text className="text-warmBrown font-semibold">{selectedListing.seller.name}</Text>
                          <Text className="text-gray-500 text-sm">{selectedListing.seller.location}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </ScrollView>

                <View className="px-5 py-4 border-t border-gray-100 bg-white">
                  {isOwnListing(selectedListing) ? (
                    <View>
                      {selectedListing.isSold && (
                        <View className="flex-row items-center justify-center py-3 mb-3 bg-green-100 rounded-xl">
                          <CheckCircle size={20} color="#16a34a" />
                          <Text className="text-green-600 font-bold ml-2">Item Sold</Text>
                        </View>
                      )}
                      <View className="flex-row">
                        {!selectedListing.isSold && (
                          <Pressable
                            onPress={handleOpenSoldModal}
                            className="flex-1 flex-row items-center justify-center py-4 rounded-2xl bg-green-50 mr-2"
                          >
                            <CheckCircle size={20} color="#16a34a" />
                            <Text className="text-green-600 font-bold text-base ml-2">Mark Sold</Text>
                          </Pressable>
                        )}
                        <Pressable
                          onPress={handleOpenDeleteModal}
                          className={`flex-1 flex-row items-center justify-center py-4 rounded-2xl bg-red-50 ${!selectedListing.isSold ? 'mr-2' : ''}`}
                        >
                          <Trash2 size={20} color="#EF4444" />
                          <Text className="text-red-500 font-bold text-base ml-2">Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : selectedListing.isSold ? (
                    <View className="flex-row items-center justify-center py-4 bg-gray-100 rounded-2xl">
                      <CheckCircle size={20} color="#16a34a" />
                      <Text className="text-green-600 font-bold text-lg ml-2">Item Sold</Text>
                    </View>
                  ) : (
                    <View>
                      <View className="flex-row items-center justify-center mb-3 bg-purple-50 rounded-xl py-2">
                        <Gem size={18} color="#8B5CF6" />
                        <Text className="text-purple-600 font-bold ml-2">
                          {priceToGems(parseFloat(selectedListing.price)).toLocaleString()} Gems
                        </Text>
                      </View>
                      <Pressable
                        onPress={runSafetyCheck}
                        disabled={safetyBusy}
                        className={`flex-row items-center justify-center mb-3 rounded-xl py-3 ${safetyBusy ? 'bg-gray-100' : 'bg-amber-50'}`}
                      >
                        <Shield size={18} color={safetyBusy ? '#9CA3AF' : '#D97706'} />
                        <Text className={`font-bold ml-2 ${safetyBusy ? 'text-gray-400' : 'text-amber-700'}`}>
                          {safetyBusy ? 'Checking…' : 'AI Safety Check'}
                        </Text>
                      </Pressable>
                      <View className="flex-row">
                        <Pressable onPress={handleBuyNow} className="flex-1 mr-2">
                          <LinearGradient
                            colors={['#8B5CF6', '#A855F7']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              borderRadius: 16,
                              paddingVertical: 16,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Gem size={20} color="#FFFFFF" />
                            <Text className="text-white font-bold text-base ml-2">Buy Now</Text>
                          </LinearGradient>
                        </Pressable>
                        <Pressable onPress={handleContactSeller} className="flex-1 ml-2">
                          <View className="bg-forest-100 rounded-2xl py-4 flex-row items-center justify-center">
                            <MessageCircle size={20} color="#1B4D3E" />
                            <Text className="text-forest-700 font-bold text-base ml-2">Message</Text>
                          </View>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              </SafeAreaView>
            </View>
          )}
        </Modal>

        {/* AI Safety Result Modal */}
        <Modal visible={showSafetyModal} transparent animationType="slide" onRequestClose={() => setShowSafetyModal(false)}>
          <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowSafetyModal(false)}>
            <Pressable className="bg-white rounded-t-3xl px-5 pt-5 pb-8" onPress={(e) => e.stopPropagation()}>
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-warmBrown">Safety Check</Text>
                <Pressable onPress={() => setShowSafetyModal(false)} className="p-2">
                  <X size={20} color="#6B7280" />
                </Pressable>
              </View>

              {safetyResult ? (
                <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                  <View className="mt-3 bg-gray-50 rounded-2xl p-4">
                    <Text className="text-gray-500 text-xs font-bold">RISK</Text>
                    <Text className="text-warmBrown font-bold text-xl mt-1">
                      {safetyResult.risk.toUpperCase()} ({safetyResult.score}/100)
                    </Text>
                    <Text className="text-gray-600 mt-2">{safetyResult.recommendation}</Text>
                  </View>

                  {safetyResult.red_flags?.length ? (
                    <View className="mt-3">
                      <Text className="text-warmBrown font-bold mb-2">Red flags</Text>
                      {safetyResult.red_flags.map((x, i) => (
                        <Text key={i} className="text-gray-700">• {x}</Text>
                      ))}
                    </View>
                  ) : null}

                  {safetyResult.safe_signals?.length ? (
                    <View className="mt-3">
                      <Text className="text-warmBrown font-bold mb-2">Good signs</Text>
                      {safetyResult.safe_signals.map((x, i) => (
                        <Text key={i} className="text-gray-700">• {x}</Text>
                      ))}
                    </View>
                  ) : null}

                  {safetyResult.suggested_questions?.length ? (
                    <View className="mt-3">
                      <Text className="text-warmBrown font-bold mb-2">Questions to ask</Text>
                      {safetyResult.suggested_questions.map((x, i) => (
                        <Text key={i} className="text-gray-700">• {x}</Text>
                      ))}
                    </View>
                  ) : null}
                </ScrollView>
              ) : (
                <View className="py-8 items-center">
                  <ActivityIndicator />
                  <Text className="text-gray-500 mt-2">Working…</Text>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Report Listing Modal */}
        <Modal visible={showReportModal} transparent animationType="slide" onRequestClose={() => setShowReportModal(false)}>
          <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowReportModal(false)}>
            <Pressable className="bg-white rounded-t-3xl px-5 pt-5 pb-8" onPress={(e) => e.stopPropagation()}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-bold text-warmBrown">Report Listing</Text>
                <Pressable onPress={() => setShowReportModal(false)} className="p-2">
                  <X size={20} color="#6B7280" />
                </Pressable>
              </View>
              <Text className="text-gray-500 text-sm mb-4">Why are you reporting this listing?</Text>
              <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                {REPORT_REASONS.map((r) => (
                  <Pressable
                    key={r.value}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setReportReason(r.value);
                    }}
                    className={`flex-row items-center p-4 rounded-xl mb-2 ${
                      reportReason === r.value ? 'bg-terracotta-50 border border-terracotta-200' : 'bg-gray-50'
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                        reportReason === r.value ? 'border-terracotta-500 bg-terracotta-500' : 'border-gray-300'
                      }`}
                    >
                      {reportReason === r.value && <View className="w-2 h-2 rounded-full bg-white" />}
                    </View>
                    <View className="flex-1">
                      <Text className={reportReason === r.value ? 'text-terracotta-700 font-medium' : 'text-gray-700'}>
                        {r.label}
                      </Text>
                      <Text className="text-gray-500 text-xs mt-0.5">{r.description}</Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                onPress={async () => {
                  if (reportReason && selectedListing && currentUser) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    await reportListing(
                      currentUser.id,
                      selectedListing.seller.id,
                      selectedListing.seller.name,
                      selectedListing.id,
                      reportReason
                    );
                    setShowReportModal(false);
                    setReportReason(null);
                    setSelectedListing(null);
                    Alert.alert('Report Submitted', 'Thank you. Our team will review this listing.');
                  }
                }}
                disabled={!reportReason}
                className={`py-4 rounded-2xl mt-4 ${reportReason ? 'bg-terracotta-500' : 'bg-gray-200'}`}
              >
                <Text className={`text-center font-bold text-base ${reportReason ? 'text-white' : 'text-gray-400'}`}>
                  Submit Report
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Delete Modal */}
        <Modal visible={showDeleteModal} animationType="fade" transparent>
          <Pressable className="flex-1 bg-black/50 justify-center items-center px-6" onPress={() => { setShowDeleteModal(false); setListingToModify(null); }}>
            <Pressable className="bg-white rounded-3xl w-full max-w-sm p-6" onPress={(e) => e.stopPropagation()}>
              <View className="items-center mb-4">
                <View className="bg-red-100 rounded-full p-4 mb-4">
                  <Trash2 size={32} color="#EF4444" />
                </View>
                <Text className="text-xl font-bold text-warmBrown text-center">Delete Listing?</Text>
                <Text className="text-gray-500 text-center mt-2">This action cannot be undone.</Text>
              </View>
              <View className="flex-row mt-4">
                <Pressable onPress={() => { setShowDeleteModal(false); setListingToModify(null); }} disabled={isDeleting} className="flex-1 py-4 rounded-xl bg-gray-100 mr-2">
                  <Text className="text-warmBrown font-semibold text-center">Cancel</Text>
                </Pressable>
                <Pressable onPress={handleConfirmDelete} disabled={isDeleting} className="flex-1 py-4 rounded-xl bg-red-500 ml-2">
                  {isDeleting ? <ActivityIndicator color="white" size="small" /> : <Text className="text-white font-semibold text-center">Delete</Text>}
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Sold Modal */}
        <Modal visible={showSoldModal} animationType="fade" transparent>
          <Pressable className="flex-1 bg-black/50 justify-center items-center px-6" onPress={() => { setShowSoldModal(false); setListingToModify(null); }}>
            <Pressable className="bg-white rounded-3xl w-full max-w-sm p-6" onPress={(e) => e.stopPropagation()}>
              <View className="items-center mb-4">
                <View className="bg-green-100 rounded-full p-4 mb-4">
                  <CheckCircle size={32} color="#16a34a" />
                </View>
                <Text className="text-xl font-bold text-warmBrown text-center">Mark as Sold?</Text>
                <Text className="text-gray-500 text-center mt-2">This will mark your item as sold.</Text>
              </View>
              <View className="flex-row mt-4">
                <Pressable onPress={() => { setShowSoldModal(false); setListingToModify(null); }} className="flex-1 py-4 rounded-xl bg-gray-100 mr-2">
                  <Text className="text-warmBrown font-semibold text-center">Cancel</Text>
                </Pressable>
                <Pressable onPress={handleConfirmSold} className="flex-1 py-4 rounded-xl bg-green-500 ml-2">
                  <Text className="text-white font-semibold text-center">Mark Sold</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Purchase Modal */}
        <Modal visible={showPurchaseModal} animationType="fade" transparent>
          <Pressable className="flex-1 bg-black/50 justify-center items-center px-6" onPress={() => { if (!isPurchasing) setShowPurchaseModal(false); }}>
            <Pressable className="bg-white rounded-3xl w-full max-w-sm p-6" onPress={(e) => e.stopPropagation()}>
              {purchaseSuccess ? (
                <View className="items-center">
                  <View className="bg-green-100 rounded-full p-4 mb-4">
                    <CheckCircle size={40} color="#16a34a" />
                  </View>
                  <Text className="text-2xl font-bold text-warmBrown text-center">Purchase Complete!</Text>
                  <Text className="text-gray-500 text-center mt-2">The seller has been notified.</Text>
                  <Pressable onPress={() => { setShowPurchaseModal(false); setSelectedListing(null); }} className="w-full mt-6 py-4 rounded-xl bg-forest-600">
                    <Text className="text-white font-semibold text-center text-lg">Done</Text>
                  </Pressable>
                </View>
              ) : selectedListing ? (
                <View>
                  <View className="items-center mb-4">
                    <View className="bg-purple-100 rounded-full p-4 mb-4">
                      <Gem size={32} color="#8B5CF6" />
                    </View>
                    <Text className="text-xl font-bold text-warmBrown text-center">Confirm Purchase</Text>
                  </View>
                  <View className="bg-gray-50 rounded-xl p-4 mb-4">
                    <Text className="text-warmBrown font-semibold" numberOfLines={2}>{selectedListing.title}</Text>
                    <Text className="text-gray-500 text-sm mt-1">Sold by {selectedListing.seller.name}</Text>
                  </View>
                  {(() => {
                    const gemPrice = priceToGems(parseFloat(selectedListing.price));
                    const feeBreakdown = calculateFeeBreakdown(gemPrice, buyerPaysFee);
                    const hasEnough = gemBalance >= feeBreakdown.totalBuyerPays;
                    return (
                      <>
                        <View className="border-t border-gray-100 pt-4 mb-4">
                          <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-500">Price</Text>
                            <View className="flex-row items-center">
                              <Gem size={14} color="#8B5CF6" />
                              <Text className="text-warmBrown font-semibold ml-1">{feeBreakdown.itemPrice.toLocaleString()}</Text>
                            </View>
                          </View>
                          <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-500">Your Balance</Text>
                            <View className="flex-row items-center">
                              <Gem size={14} color="#8B5CF6" />
                              <Text className={`font-semibold ml-1 ${hasEnough ? 'text-green-600' : 'text-red-500'}`}>{gemBalance.toLocaleString()}</Text>
                            </View>
                          </View>
                        </View>
                        {!hasEnough ? (
                          <Pressable onPress={() => { setShowPurchaseModal(false); setSelectedListing(null); router.push('/gem-store'); }} className="w-full py-4 rounded-xl bg-purple-500">
                            <Text className="text-white font-semibold text-center text-lg">Get More Gems</Text>
                          </Pressable>
                        ) : (
                          <View className="flex-row">
                            <Pressable onPress={() => setShowPurchaseModal(false)} disabled={isPurchasing} className="flex-1 py-4 rounded-xl bg-gray-100 mr-2">
                              <Text className="text-warmBrown font-semibold text-center">Cancel</Text>
                            </Pressable>
                            <Pressable onPress={handleConfirmPurchase} disabled={isPurchasing} className="flex-1 py-4 rounded-xl bg-purple-500 ml-2">
                              {isPurchasing ? <ActivityIndicator color="white" size="small" /> : <Text className="text-white font-semibold text-center">Confirm</Text>}
                            </Pressable>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </View>
              ) : null}
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
