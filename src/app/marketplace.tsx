import React, { useState, useEffect } from 'react';
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
  ChevronLeft,
  Filter,
  Store,
  Home,
  X,
  Heart,
  Trash2,
  CheckCircle,
  Gem,
  CreditCard,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import {
  useStore,
  MOCK_MARKETPLACE,
  MARKETPLACE_CATEGORIES,
  type MarketplaceListing,
} from '@/lib/store';
import { getMarketplaceListings } from '@/lib/marketplace-api';
import { purchaseMarketplaceListing, priceToGems, gemsToPrice, GEMS_PER_DOLLAR, calculateFeeBreakdown, PLATFORM_FEE_PERCENTAGE } from '@/lib/marketplacePayments';
import { getGemBalance } from '@/lib/giftService';

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

export default function MarketplaceScreen() {
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [listingToModify, setListingToModify] = useState<MarketplaceListing | null>(null);

  // Handle opening delete modal
  const handleOpenDeleteModal = () => {
    if (!selectedListing) return;
    setListingToModify(selectedListing);
    setSelectedListing(null); // Close the detail modal first
    setTimeout(() => {
      setShowDeleteModal(true);
    }, 100);
  };

  // Handle opening sold modal
  const handleOpenSoldModal = () => {
    if (!selectedListing) return;
    setListingToModify(selectedListing);
    setSelectedListing(null); // Close the detail modal first
    setTimeout(() => {
      setShowSoldModal(true);
    }, 100);
  };

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (!listingToModify) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    deleteMarketplaceListing(listingToModify.id);
    setShowDeleteModal(false);
    setListingToModify(null);
  };

  // Handle mark as sold confirmation
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

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchListings();
  };

  // Convert DB listings to app format
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

  const allListings = [...userListings, ...supabaseListings, ...MOCK_MARKETPLACE];

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

  const handleContactSeller = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isGuest || !currentUser) {
      router.push('/signup');
    } else {
      // In a real app, this would open messaging
      setSelectedListing(null);
    }
  };

  // Handle opening purchase modal
  const handleBuyNow = async () => {
    if (!selectedListing) return;
    if (isGuest || !currentUser) {
      router.push('/signup');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Load current gem balance
    const balance = await getGemBalance(currentUser.id);
    setGemBalance(balance);
    setPurchaseSuccess(false);
    setBuyerPaysFee(false); // Reset fee option
    setShowPurchaseModal(true);
  };

  // Handle the actual purchase
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

  const handleDeleteListing = () => {
    if (!selectedListing) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    deleteMarketplaceListing(selectedListing.id);
    setShowDeleteModal(false);
    setSelectedListing(null);
  };

  const handleMarkAsSold = () => {
    if (!selectedListing) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markListingAsSold(selectedListing.id);
    setShowSoldModal(false);
    setSelectedListing(null);
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
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
              <View className="bg-terracotta-100 rounded-full p-2 mr-3">
                <ShoppingBag size={24} color="#D4673A" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-warmBrown">Marketplace</Text>
                <Text className="text-sm text-gray-500">Buy & Sell African Products</Text>
              </View>
            </View>

            <Pressable
              onPress={handleCreateListing}
              className="bg-terracotta-500 rounded-full p-2.5"
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
                !selectedCategory ? 'bg-terracotta-500' : 'bg-white'
              }`}
            >
              <Text
                className={`font-medium ${
                  !selectedCategory ? 'text-white' : 'text-gray-600'
                }`}
              >
                All
              </Text>
            </Pressable>
            {MARKETPLACE_CATEGORIES.slice(0, 6).map((category) => (
              <Pressable
                key={category}
                onPress={() => handleCategorySelect(category)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedCategory === category ? 'bg-terracotta-500' : 'bg-white'
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedCategory === category ? 'text-white' : 'text-gray-600'
                  }`}
                >
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
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#D4673A" />
          }
        >
          {isLoading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#D4673A" />
              <Text className="text-gray-500 mt-4">Loading listings...</Text>
            </View>
          ) : (
            <>
              {/* Featured Banner */}
              <Animated.View
                entering={FadeInUp.duration(400).delay(100)}
                className="mb-4"
              >
                <LinearGradient
                  colors={['#1B4D3E', '#153D31']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 16, padding: 16 }}
                >
                  <View className="flex-row items-center">
                    <View className="flex-1">
                      <Text className="text-white font-bold text-base">
                        Sell Your Products
                      </Text>
                      <Text className="text-white/70 text-sm mt-1">
                        List items in minutes. Reach African communities worldwide.
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
                    <Text className="text-terracotta-500 font-bold mt-1">
                      ${listing.price}
                    </Text>
                    <View className="flex-row items-center mt-2">
                      <MapPin size={12} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs ml-1" numberOfLines={1}>
                        {listing.location}
                      </Text>
                    </View>
                    <View className="flex-row items-center mt-1">
                      <Eye size={12} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs ml-1">
                        {listing.views} views
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
              </View>

              <View className="h-8" />
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
                {/* Modal Header */}
                <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                  <Pressable
                    onPress={() => setSelectedListing(null)}
                    className="bg-gray-100 rounded-full p-2"
                  >
                    <X size={24} color="#2D1F1A" />
                  </Pressable>
                  <Pressable className="bg-gray-100 rounded-full p-2">
                    <Heart size={24} color="#D4673A" />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Image */}
                  <Image
                    source={{ uri: selectedListing.images[0] }}
                    style={{ width: '100%', height: 300 }}
                    contentFit="cover"
                  />

                  {/* Details */}
                  <View className="p-5">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-2xl font-bold text-warmBrown">
                          {selectedListing.title}
                        </Text>
                        <Text className="text-3xl font-bold text-terracotta-500 mt-2">
                          ${selectedListing.price}
                        </Text>
                      </View>
                      {selectedListing.isStoreBased && (
                        <View className="bg-forest-100 rounded-full px-3 py-1 flex-row items-center">
                          <Store size={14} color="#1B4D3E" />
                          <Text className="text-forest-700 text-sm font-medium ml-1">
                            Store
                          </Text>
                        </View>
                      )}
                    </View>

                    {selectedListing.storeName && (
                      <Text className="text-forest-700 font-medium mt-2">
                        {selectedListing.storeName}
                      </Text>
                    )}

                    <View className="flex-row items-center mt-3">
                      <MapPin size={16} color="#8B7355" />
                      <Text className="text-gray-600 ml-2">{selectedListing.location}</Text>
                    </View>

                    <View className="flex-row items-center mt-2">
                      <Eye size={16} color="#8B7355" />
                      <Text className="text-gray-500 ml-2">
                        {selectedListing.views} views
                      </Text>
                      <Text className="text-gray-400 mx-2">•</Text>
                      <Text className="text-gray-500">
                        Posted {formatDistanceToNow(new Date(selectedListing.createdAt), { addSuffix: true })}
                      </Text>
                    </View>

                    {/* Description */}
                    <View className="mt-6">
                      <Text className="text-lg font-semibold text-warmBrown mb-2">
                        Description
                      </Text>
                      <Text className="text-gray-600 leading-6">
                        {selectedListing.description}
                      </Text>
                    </View>

                    {/* Category & Condition */}
                    <View className="flex-row mt-6">
                      <View className="flex-1 mr-2">
                        <Text className="text-sm text-gray-500 mb-1">Category</Text>
                        <View className="bg-gray-100 rounded-full px-3 py-1.5 self-start">
                          <Text className="text-warmBrown font-medium">
                            {selectedListing.category}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm text-gray-500 mb-1">Condition</Text>
                        <View className="bg-gray-100 rounded-full px-3 py-1.5 self-start">
                          <Text className="text-warmBrown font-medium capitalize">
                            {selectedListing.condition}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Seller Info */}
                    <View className="mt-6 bg-white rounded-2xl p-4">
                      <Text className="text-lg font-semibold text-warmBrown mb-3">
                        Seller
                      </Text>
                      <View className="flex-row items-center">
                        <Image
                          source={{ uri: selectedListing.seller.avatar }}
                          style={{ width: 50, height: 50, borderRadius: 25 }}
                          contentFit="cover"
                        />
                        <View className="flex-1 ml-3">
                          <Text className="text-warmBrown font-semibold">
                            {selectedListing.seller.name}
                          </Text>
                          <Text className="text-gray-500 text-sm">
                            {selectedListing.seller.location}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </ScrollView>

                {/* Contact Button or Owner Actions */}
                <View className="px-5 py-4 border-t border-gray-100 bg-white">
                  {isOwnListing(selectedListing) ? (
                    <View>
                      {/* Show sold badge if already sold */}
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
                            <Text className="text-green-600 font-bold text-base ml-2">
                              Mark Sold
                            </Text>
                          </Pressable>
                        )}
                        <Pressable
                          onPress={handleOpenDeleteModal}
                          className={`flex-1 flex-row items-center justify-center py-4 rounded-2xl bg-red-50 ${!selectedListing.isSold ? 'mr-2' : ''}`}
                        >
                          <Trash2 size={20} color="#EF4444" />
                          <Text className="text-red-500 font-bold text-base ml-2">
                            Delete
                          </Text>
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
                      {/* Gem price display */}
                      <View className="flex-row items-center justify-center mb-3 bg-purple-50 rounded-xl py-2">
                        <Gem size={18} color="#8B5CF6" />
                        <Text className="text-purple-600 font-bold ml-2">
                          {priceToGems(parseFloat(selectedListing.price)).toLocaleString()} Gems
                        </Text>
                        <Text className="text-purple-400 text-sm ml-2">
                          (${selectedListing.price})
                        </Text>
                      </View>

                      <View className="flex-row">
                        {/* Buy Now Button */}
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
                            <Text className="text-white font-bold text-base ml-2">
                              Buy Now
                            </Text>
                          </LinearGradient>
                        </Pressable>

                        {/* Contact Seller Button */}
                        <Pressable onPress={handleContactSeller} className="flex-1 ml-2">
                          <View className="bg-terracotta-100 rounded-2xl py-4 flex-row items-center justify-center">
                            <MessageCircle size={20} color="#D4673A" />
                            <Text className="text-terracotta-500 font-bold text-base ml-2">
                              Message
                            </Text>
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

        {/* Delete Confirmation Modal */}
        <Modal visible={showDeleteModal} animationType="fade" transparent onRequestClose={() => setShowDeleteModal(false)}>
          <Pressable
            className="flex-1 bg-black/50 justify-center items-center px-6"
            onPress={() => {
              setShowDeleteModal(false);
              setListingToModify(null);
            }}
          >
            <Pressable
              className="bg-white rounded-3xl w-full max-w-sm p-6"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="items-center mb-4">
                <View className="bg-red-100 rounded-full p-4 mb-4">
                  <Trash2 size={32} color="#EF4444" />
                </View>
                <Text className="text-xl font-bold text-warmBrown text-center">
                  Delete Listing?
                </Text>
                <Text className="text-gray-500 text-center mt-2">
                  Are you sure you want to delete this listing? This action cannot be undone.
                </Text>
              </View>

              <View className="flex-row mt-4">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowDeleteModal(false);
                    setListingToModify(null);
                  }}
                  className="flex-1 py-4 rounded-xl bg-gray-100 mr-2 active:opacity-70"
                >
                  <Text className="text-warmBrown font-semibold text-center">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmDelete}
                  className="flex-1 py-4 rounded-xl bg-red-500 ml-2 active:opacity-70"
                >
                  <Text className="text-white font-semibold text-center">Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Mark as Sold Confirmation Modal */}
        <Modal visible={showSoldModal} animationType="fade" transparent onRequestClose={() => setShowSoldModal(false)}>
          <Pressable
            className="flex-1 bg-black/50 justify-center items-center px-6"
            onPress={() => {
              setShowSoldModal(false);
              setListingToModify(null);
            }}
          >
            <Pressable
              className="bg-white rounded-3xl w-full max-w-sm p-6"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="items-center mb-4">
                <View className="bg-green-100 rounded-full p-4 mb-4">
                  <CheckCircle size={32} color="#16a34a" />
                </View>
                <Text className="text-xl font-bold text-warmBrown text-center">
                  Mark as Sold?
                </Text>
                <Text className="text-gray-500 text-center mt-2">
                  This will mark your item as sold. It will still be visible but shown as sold.
                </Text>
              </View>

              <View className="flex-row mt-4">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowSoldModal(false);
                    setListingToModify(null);
                  }}
                  className="flex-1 py-4 rounded-xl bg-gray-100 mr-2 active:opacity-70"
                >
                  <Text className="text-warmBrown font-semibold text-center">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleConfirmSold}
                  className="flex-1 py-4 rounded-xl bg-green-500 ml-2 active:opacity-70"
                >
                  <Text className="text-white font-semibold text-center">Mark Sold</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Purchase Confirmation Modal */}
        <Modal visible={showPurchaseModal} animationType="fade" transparent onRequestClose={() => setShowPurchaseModal(false)}>
          <Pressable
            className="flex-1 bg-black/50 justify-center items-center px-6"
            onPress={() => {
              if (!isPurchasing) {
                setShowPurchaseModal(false);
              }
            }}
          >
            <Pressable
              className="bg-white rounded-3xl w-full max-w-sm p-6"
              onPress={(e) => e.stopPropagation()}
            >
              {purchaseSuccess ? (
                // Success State
                <View className="items-center">
                  <View className="bg-green-100 rounded-full p-4 mb-4">
                    <CheckCircle size={40} color="#16a34a" />
                  </View>
                  <Text className="text-2xl font-bold text-warmBrown text-center">
                    Purchase Complete!
                  </Text>
                  <Text className="text-gray-500 text-center mt-2">
                    You've successfully purchased this item. The seller has been notified.
                  </Text>
                  <View className="bg-purple-50 rounded-xl py-3 px-4 mt-4 w-full">
                    <View className="flex-row items-center justify-center">
                      <Gem size={18} color="#8B5CF6" />
                      <Text className="text-purple-600 font-bold ml-2">
                        New Balance: {gemBalance.toLocaleString()} gems
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowPurchaseModal(false);
                      setSelectedListing(null);
                    }}
                    className="w-full mt-6 py-4 rounded-xl bg-forest-600 active:opacity-70"
                  >
                    <Text className="text-white font-semibold text-center text-lg">Done</Text>
                  </Pressable>
                </View>
              ) : selectedListing ? (
                // Confirmation State
                <View>
                  <View className="items-center mb-4">
                    <View className="bg-purple-100 rounded-full p-4 mb-4">
                      <Gem size={32} color="#8B5CF6" />
                    </View>
                    <Text className="text-xl font-bold text-warmBrown text-center">
                      Confirm Purchase
                    </Text>
                  </View>

                  {/* Item Summary */}
                  <View className="bg-gray-50 rounded-xl p-4 mb-4">
                    <Text className="text-warmBrown font-semibold" numberOfLines={2}>
                      {selectedListing.title}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">
                      Sold by {selectedListing.seller.name}
                    </Text>
                  </View>

                  {/* Support Seller Toggle */}
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setBuyerPaysFee(!buyerPaysFee);
                    }}
                    className={`rounded-xl p-3 mb-4 flex-row items-center justify-between ${
                      buyerPaysFee ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <View className="flex-1 mr-3">
                      <Text className={`font-semibold ${buyerPaysFee ? 'text-green-700' : 'text-warmBrown'}`}>
                        Support the seller
                      </Text>
                      <Text className="text-xs text-gray-500 mt-0.5">
                        {buyerPaysFee
                          ? 'You pay the 5% fee - seller keeps 100%!'
                          : 'Tap to cover the 5% fee for the seller'}
                      </Text>
                    </View>
                    <View className={`w-12 h-7 rounded-full ${buyerPaysFee ? 'bg-green-500' : 'bg-gray-300'} justify-center`}>
                      <View className={`w-5 h-5 rounded-full bg-white shadow ${buyerPaysFee ? 'self-end mr-1' : 'self-start ml-1'}`} />
                    </View>
                  </Pressable>

                  {/* Price Breakdown */}
                  {(() => {
                    const gemPrice = priceToGems(parseFloat(selectedListing.price));
                    const feeBreakdown = calculateFeeBreakdown(gemPrice, buyerPaysFee);
                    return (
                      <View className="border-t border-gray-100 pt-4 mb-4">
                        <View className="flex-row justify-between mb-2">
                          <Text className="text-gray-500">Item Price</Text>
                          <View className="flex-row items-center">
                            <Gem size={14} color="#8B5CF6" />
                            <Text className="text-warmBrown font-semibold ml-1">
                              {feeBreakdown.itemPrice.toLocaleString()}
                            </Text>
                          </View>
                        </View>
                        {buyerPaysFee && (
                          <View className="flex-row justify-between mb-2">
                            <Text className="text-gray-500">Platform Fee (5%)</Text>
                            <View className="flex-row items-center">
                              <Gem size={14} color="#8B5CF6" />
                              <Text className="text-warmBrown font-semibold ml-1">
                                +{feeBreakdown.platformFee.toLocaleString()}
                              </Text>
                            </View>
                          </View>
                        )}
                        <View className="flex-row justify-between mb-2">
                          <Text className="text-gray-500 font-medium">You Pay</Text>
                          <View className="flex-row items-center">
                            <Gem size={14} color="#8B5CF6" />
                            <Text className="text-purple-600 font-bold ml-1">
                              {feeBreakdown.totalBuyerPays.toLocaleString()}
                            </Text>
                          </View>
                        </View>
                        <View className="h-px bg-gray-200 my-2" />
                        <View className="flex-row justify-between mb-2">
                          <Text className="text-gray-500">Your Balance</Text>
                          <View className="flex-row items-center">
                            <Gem size={14} color="#8B5CF6" />
                            <Text className={`font-semibold ml-1 ${
                              gemBalance >= feeBreakdown.totalBuyerPays
                                ? 'text-green-600'
                                : 'text-red-500'
                            }`}>
                              {gemBalance.toLocaleString()}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row justify-between">
                          <Text className="text-warmBrown font-semibold">After Purchase</Text>
                          <View className="flex-row items-center">
                            <Gem size={14} color="#8B5CF6" />
                            <Text className="text-warmBrown font-bold ml-1">
                              {Math.max(0, gemBalance - feeBreakdown.totalBuyerPays).toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })()}

                  {/* Seller Earnings Info */}
                  <View className={`rounded-xl p-3 mb-4 ${buyerPaysFee ? 'bg-green-50' : 'bg-blue-50'}`}>
                    <Text className={`text-sm text-center ${buyerPaysFee ? 'text-green-600' : 'text-blue-600'}`}>
                      {buyerPaysFee
                        ? '💚 The seller receives 100% of the item price!'
                        : 'The seller keeps 95% of the gems (only 5% fee!). Contact them to arrange delivery.'}
                    </Text>
                  </View>

                  {(() => {
                    const gemPrice = priceToGems(parseFloat(selectedListing.price));
                    const totalNeeded = calculateFeeBreakdown(gemPrice, buyerPaysFee).totalBuyerPays;
                    const hasEnough = gemBalance >= totalNeeded;

                    if (!hasEnough) {
                      return (
                        <View>
                          <View className="bg-red-50 rounded-xl p-3 mb-4">
                            <Text className="text-red-500 text-sm text-center font-medium">
                              You need {(totalNeeded - gemBalance).toLocaleString()} more gems
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              setShowPurchaseModal(false);
                              setSelectedListing(null);
                              router.push('/gem-store');
                            }}
                            className="w-full py-4 rounded-xl bg-purple-500 active:opacity-70"
                          >
                            <Text className="text-white font-semibold text-center text-lg">
                              Get More Gems
                            </Text>
                          </Pressable>
                        </View>
                      );
                    }
                    return (
                      // Purchase buttons
                      <View className="flex-row">
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowPurchaseModal(false);
                          }}
                          disabled={isPurchasing}
                          className="flex-1 py-4 rounded-xl bg-gray-100 mr-2 active:opacity-70"
                        >
                          <Text className="text-warmBrown font-semibold text-center">Cancel</Text>
                        </Pressable>
                        <Pressable
                          onPress={handleConfirmPurchase}
                          disabled={isPurchasing}
                          className="flex-1 py-4 rounded-xl bg-purple-500 ml-2 active:opacity-70"
                        >
                          {isPurchasing ? (
                            <ActivityIndicator color="white" size="small" />
                          ) : (
                            <Text className="text-white font-semibold text-center">Confirm</Text>
                          )}
                        </Pressable>
                      </View>
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
