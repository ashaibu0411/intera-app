import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Camera,
  X,
  Check,
  DollarSign,
  MapPin,
  Tag,
  FileText,
  Store,
  Home,
  Plus,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useStore, MARKETPLACE_CATEGORIES, type MarketplaceListing } from '@/lib/store';
import { createMarketplaceListing } from '@/lib/marketplace-api';

const CONDITIONS = [
  { id: 'new', label: 'New', description: 'Brand new, unused' },
  { id: 'used', label: 'Used', description: 'Pre-owned, good condition' },
  { id: 'refurbished', label: 'Refurbished', description: 'Restored to working condition' },
];

export default function CreateListingScreen() {
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<'new' | 'used' | 'refurbished'>('new');
  const [isStoreBased, setIsStoreBased] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = useStore((s) => s.currentUser);
  const addMarketplaceListing = useStore((s) => s.addMarketplaceListing);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const currentCommunity = useStore((s) => s.currentCommunity);

  const userLocation = selectedLocation?.city
    ? `${selectedLocation.city}, ${selectedLocation.state || selectedLocation.country}`
    : currentCommunity?.city
      ? `${currentCommunity.city}, ${currentCommunity.state || currentCommunity.country}`
      : 'Denver, CO';

  const handlePickImages = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImages([...images, ...result.assets.map(a => a.uri)].slice(0, 5));
    }
  };

  const handleRemoveImage = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImages(images.filter((_, i) => i !== index));
  };

  const canSubmit = title.trim().length > 0 &&
    description.trim().length > 0 &&
    price.trim().length > 0 &&
    category.length > 0 &&
    images.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || !currentUser || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Create the listing object for local store
      const newListing: MarketplaceListing = {
        id: `local-${Date.now()}`,
        seller: currentUser,
        title: title.trim(),
        description: description.trim(),
        price: price,
        currency: 'USD',
        images,
        category,
        condition,
        location: userLocation,
        isStoreBased,
        storeName: isStoreBased ? storeName.trim() : undefined,
        createdAt: new Date().toISOString(),
        views: 0,
      };

      // Save to local store first (this always works)
      addMarketplaceListing(newListing);

      // Try to save to database as well
      try {
        await createMarketplaceListing(currentUser.id, {
          title: title.trim(),
          description: description.trim(),
          price: parseFloat(price),
          currency: 'USD',
          images,
          category,
          condition,
          location: userLocation,
          isStoreBased,
          storeName: isStoreBased ? storeName.trim() : undefined,
        });
      } catch (dbError) {
        console.log('Database save failed, but local save succeeded:', dbError);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Error creating listing:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <View className="flex-1 bg-cream justify-center items-center px-6">
        <Text className="text-warmBrown text-lg text-center">Please sign in to list an item</Text>
        <Pressable onPress={() => router.push('/signup')} className="mt-4">
          <Text className="text-terracotta-500 font-semibold">Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} className="bg-white rounded-full p-2 shadow-sm">
              <ChevronLeft size={24} color="#2D1F1A" />
            </Pressable>
            <Text className="text-lg font-bold text-warmBrown">List an Item</Text>
            <View className="w-10" />
          </View>
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {/* Images */}
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="mt-4">
              <Text className="text-warmBrown font-semibold mb-2">Photos *</Text>
              <Text className="text-gray-500 text-sm mb-3">Add up to 5 photos. First photo will be the cover.</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {images.map((uri, index) => (
                  <View key={index} className="relative mr-3">
                    <Image
                      source={{ uri }}
                      style={{ width: 100, height: 100, borderRadius: 12 }}
                      contentFit="cover"
                    />
                    <Pressable
                      onPress={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                    >
                      <X size={14} color="#FFFFFF" />
                    </Pressable>
                    {index === 0 && (
                      <View className="absolute bottom-1 left-1 bg-black/60 rounded px-1.5 py-0.5">
                        <Text className="text-white text-xs">Cover</Text>
                      </View>
                    )}
                  </View>
                ))}

                {images.length < 5 && (
                  <Pressable onPress={handlePickImages} className="w-[100px] h-[100px] bg-gray-100 rounded-xl items-center justify-center border-2 border-dashed border-gray-300">
                    <Camera size={28} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs mt-1">{images.length}/5</Text>
                  </Pressable>
                )}
              </ScrollView>
            </Animated.View>

            {/* Title */}
            <Animated.View entering={FadeInUp.duration(400).delay(150)} className="mt-6">
              <Text className="text-warmBrown font-semibold mb-2">Title *</Text>
              <View className="bg-white rounded-xl px-4">
                <TextInput
                  placeholder="What are you selling?"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                  className="py-3.5 text-warmBrown"
                  maxLength={100}
                />
              </View>
              <Text className="text-gray-400 text-xs mt-1 text-right">{title.length}/100</Text>
            </Animated.View>

            {/* Price */}
            <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mt-4">
              <Text className="text-warmBrown font-semibold mb-2">Price *</Text>
              <View className="flex-row items-center bg-white rounded-xl px-4">
                <DollarSign size={20} color="#8B7355" />
                <TextInput
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  className="flex-1 py-3.5 ml-2 text-warmBrown"
                />
              </View>
            </Animated.View>

            {/* Category */}
            <Animated.View entering={FadeInUp.duration(400).delay(250)} className="mt-4">
              <Text className="text-warmBrown font-semibold mb-2">Category *</Text>
              <Pressable onPress={() => setShowCategoryModal(true)} className="flex-row items-center bg-white rounded-xl px-4 py-3.5">
                <Tag size={20} color="#8B7355" />
                <Text className={`flex-1 ml-3 ${category ? 'text-warmBrown' : 'text-gray-400'}`}>
                  {category || 'Select a category'}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Condition */}
            <Animated.View entering={FadeInUp.duration(400).delay(300)} className="mt-4">
              <Text className="text-warmBrown font-semibold mb-2">Condition *</Text>
              <View className="flex-row">
                {CONDITIONS.map((cond) => (
                  <Pressable
                    key={cond.id}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCondition(cond.id as any); }}
                    className={`flex-1 py-3 rounded-xl mr-2 last:mr-0 ${condition === cond.id ? 'bg-terracotta-500' : 'bg-white'}`}
                  >
                    <Text className={`text-center font-medium ${condition === cond.id ? 'text-white' : 'text-warmBrown'}`}>{cond.label}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Description */}
            <Animated.View entering={FadeInUp.duration(400).delay(350)} className="mt-4">
              <Text className="text-warmBrown font-semibold mb-2">Description *</Text>
              <TextInput
                placeholder="Describe your item in detail. Include size, color, material, and any other relevant information..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={description}
                onChangeText={setDescription}
                className="bg-white rounded-xl px-4 py-3.5 text-warmBrown min-h-[120px]"
                style={{ textAlignVertical: 'top' }}
                maxLength={1000}
              />
              <Text className="text-gray-400 text-xs mt-1 text-right">{description.length}/1000</Text>
            </Animated.View>

            {/* Location */}
            <Animated.View entering={FadeInUp.duration(400).delay(400)} className="mt-4">
              <Text className="text-warmBrown font-semibold mb-2">Location</Text>
              <View className="flex-row items-center bg-white rounded-xl px-4 py-3.5">
                <MapPin size={20} color="#8B7355" />
                <Text className="flex-1 ml-3 text-warmBrown">{userLocation}</Text>
              </View>
            </Animated.View>

            {/* Seller Type */}
            <Animated.View entering={FadeInUp.duration(400).delay(450)} className="mt-4">
              <Text className="text-warmBrown font-semibold mb-2">Seller Type</Text>
              <View className="flex-row">
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsStoreBased(false); }}
                  className={`flex-1 flex-row items-center justify-center py-3.5 rounded-xl mr-2 ${!isStoreBased ? 'bg-terracotta-500' : 'bg-white'}`}
                >
                  <Home size={18} color={!isStoreBased ? '#FFFFFF' : '#8B7355'} />
                  <Text className={`ml-2 font-medium ${!isStoreBased ? 'text-white' : 'text-warmBrown'}`}>Individual</Text>
                </Pressable>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsStoreBased(true); }}
                  className={`flex-1 flex-row items-center justify-center py-3.5 rounded-xl ${isStoreBased ? 'bg-terracotta-500' : 'bg-white'}`}
                >
                  <Store size={18} color={isStoreBased ? '#FFFFFF' : '#8B7355'} />
                  <Text className={`ml-2 font-medium ${isStoreBased ? 'text-white' : 'text-warmBrown'}`}>Business</Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* Store Name (if business) */}
            {isStoreBased && (
              <Animated.View entering={FadeInUp.duration(300)} className="mt-4">
                <Text className="text-warmBrown font-semibold mb-2">Business Name</Text>
                <View className="flex-row items-center bg-white rounded-xl px-4">
                  <Store size={20} color="#8B7355" />
                  <TextInput
                    placeholder="Your business name"
                    placeholderTextColor="#9CA3AF"
                    value={storeName}
                    onChangeText={setStoreName}
                    className="flex-1 py-3.5 ml-3 text-warmBrown"
                  />
                </View>
              </Animated.View>
            )}

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Submit Button */}
        <View className="px-5 py-4 border-t border-gray-100 bg-cream">
          <Pressable onPress={handleSubmit} disabled={!canSubmit || isSubmitting}>
            <LinearGradient
              colors={canSubmit && !isSubmitting ? ['#D4673A', '#B85430'] : ['#D1D5DB', '#9CA3AF']}
              style={{ borderRadius: 16, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-lg">List Item</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* Category Modal */}
        <Modal visible={showCategoryModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl max-h-[70%]">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">Select Category</Text>
                <Pressable onPress={() => setShowCategoryModal(false)}>
                  <X size={24} color="#2D1F1A" />
                </Pressable>
              </View>
              <ScrollView className="px-5 py-2">
                {MARKETPLACE_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategory(cat); setShowCategoryModal(false); }}
                    className="flex-row items-center py-4 border-b border-gray-100"
                  >
                    <Text className="flex-1 text-warmBrown">{cat}</Text>
                    {category === cat && <Check size={20} color="#D4673A" />}
                  </Pressable>
                ))}
                <View className="h-8" />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
