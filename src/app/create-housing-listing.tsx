import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Home, ImagePlus, Check, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { uploadImages } from '@/lib/posts';
import { createHousingListing } from '@/lib/marketplace-api';

type ListingType = 'room' | 'apartment' | 'house' | 'sublet';
type PriceType = 'month' | 'week' | 'day';
type Scope = 'neighborhood' | 'city' | 'global';

export default function CreateHousingListingScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);

  const [type, setType] = useState<ListingType>('room');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<PriceType>('month');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [address, setAddress] = useState('');
  const [scope, setScope] = useState<Scope>(selectedLocation?.neighborhood ? 'neighborhood' : 'city');
  const [isFurnished, setIsFurnished] = useState(false);
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [petFriendly, setPetFriendly] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loc = useMemo(() => {
    const city = selectedLocation?.city || 'Denver';
    const country = selectedLocation?.country || 'Unknown';
    const adminArea = selectedLocation?.state || null;
    const neighborhood = selectedLocation?.neighborhood?.trim() || null;
    const base = `${city}, ${adminArea || country}`;
    const locationLabel = neighborhood ? `${base} · ${neighborhood}` : base;
    return { city, country, adminArea, neighborhood, locationLabel };
  }, [selectedLocation]);

  const canSubmit =
    !!currentUser?.id &&
    title.trim().length > 0 &&
    description.trim().length >= 20 &&
    !!price.trim();

  const pickPhotos = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length) {
      const uris = result.assets.map((a) => a.uri).filter(Boolean) as string[];
      setPhotos((prev) => [...prev, ...uris].slice(0, 6));
    }
  };

  const removePhoto = (idx: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    if (!canSubmit || !currentUser?.id || isSubmitting) return;
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const uploaded = photos.length > 0 ? await uploadImages(photos, currentUser.id) : [];

      const priceNum = Number(price);
      const beds = Number(bedrooms) || 0;
      const baths = Number(bathrooms) || 0;

      await createHousingListing(currentUser.id, {
        type,
        title: title.trim(),
        description: description.trim(),
        price: isNaN(priceNum) ? 0 : priceNum,
        currency: 'USD',
        price_type: priceType,
        bedrooms: beds,
        bathrooms: baths,
        is_furnished: isFurnished,
        utilities_included: utilitiesIncluded,
        pet_friendly: petFriendly,
        images: uploaded,
        country: loc.country,
        admin_area: loc.adminArea,
        city: loc.city,
        neighborhood: loc.neighborhood,
        location_label: loc.locationLabel,
        address: address.trim() || null,
        scope,
      } as any);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-6">
        <Text className="text-warmBrown text-lg text-center">Please sign in to post housing.</Text>
        <Pressable onPress={() => router.push('/signup')} className="mt-4">
          <Text className="text-terracotta-500 font-semibold">Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <View className="px-5 pt-4 pb-3">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="bg-white rounded-full p-2 shadow-sm"
            >
              <ChevronLeft size={22} color="#2D1F1A" />
            </Pressable>
            <Text className="text-lg font-bold text-warmBrown">Post Housing</Text>
            <View className="w-10" />
          </View>
          <View className="flex-row items-center mt-2">
            <MapPin size={14} color="#D4673A" />
            <Text className="text-gray-500 ml-1">{loc.locationLabel}</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-3">Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
              <Pressable
                onPress={pickPhotos}
                className="w-24 h-24 bg-terracotta-50 rounded-xl items-center justify-center mr-3 border-2 border-dashed border-terracotta-200"
              >
                <ImagePlus size={26} color="#D4673A" />
                <Text className="text-terracotta-500 text-xs mt-1">Add</Text>
              </Pressable>
              {photos.map((uri, idx) => (
                <Pressable key={`${uri}-${idx}`} onPress={() => removePhoto(idx)} className="mr-3">
                  <Image source={{ uri }} style={{ width: 96, height: 96, borderRadius: 12 }} contentFit="cover" />
                </Pressable>
              ))}
            </ScrollView>
            <Text className="text-gray-400 text-xs mt-2">Tap a photo to remove it.</Text>
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-2">Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {(['room', 'apartment', 'house', 'sublet'] as const).map((t) => {
                const active = type === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setType(t);
                    }}
                    className={`px-3 py-2 rounded-full flex-row items-center ${active ? 'bg-forest-600' : 'bg-gray-100'}`}
                  >
                    <Home size={14} color={active ? '#fff' : '#1B4D3E'} />
                    <Text className={`ml-2 font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-2">Reach</Text>
            <View className="flex-row gap-2">
              {([
                { key: 'neighborhood', label: 'Neighborhood' },
                { key: 'city', label: 'City' },
                { key: 'global', label: 'Global' },
              ] as const).map((opt) => {
                const active = scope === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setScope(opt.key)}
                    className={`flex-1 py-3 rounded-xl items-center ${active ? 'bg-terracotta-500' : 'bg-gray-100'}`}
                  >
                    <Text className={`font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-2">Title</Text>
            <TextInput
              placeholder="e.g. Room in Southshore"
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              className="text-warmBrown"
            />
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-2">Price</Text>
            <View className="flex-row items-center">
              <TextInput
                placeholder="e.g. 1200"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
                className="flex-1 text-warmBrown"
              />
              <View className="flex-row gap-2 ml-3">
                {(['month', 'week', 'day'] as const).map((p) => {
                  const active = priceType === p;
                  return (
                    <Pressable key={p} onPress={() => setPriceType(p)} className={`px-3 py-2 rounded-full ${active ? 'bg-forest-600' : 'bg-gray-100'}`}>
                      <Text className={`${active ? 'text-white' : 'text-gray-700'} font-semibold`}>/{p}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-2">Beds / Baths</Text>
            <View className="flex-row gap-2">
              <TextInput
                placeholder="Beds"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={bedrooms}
                onChangeText={setBedrooms}
                className="flex-1 text-warmBrown bg-gray-50 rounded-xl px-3 py-2"
              />
              <TextInput
                placeholder="Baths"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                value={bathrooms}
                onChangeText={setBathrooms}
                className="flex-1 text-warmBrown bg-gray-50 rounded-xl px-3 py-2"
              />
            </View>
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-2">Address (optional)</Text>
            <TextInput
              placeholder="Street or area"
              placeholderTextColor="#9CA3AF"
              value={address}
              onChangeText={setAddress}
              className="text-warmBrown"
            />
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-warmBrown font-semibold mb-2">Details</Text>
            <TextInput
              placeholder="Add details (min 20 chars)…"
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              className="text-warmBrown"
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />
            <Text className="text-gray-400 text-xs mt-1">{description.length}/20 minimum</Text>
          </View>

          <View className="mt-3 bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-warmBrown font-semibold">Furnished</Text>
              <Switch value={isFurnished} onValueChange={setIsFurnished} trackColor={{ false: '#D1D5DB', true: '#1B4D3E' }} thumbColor="#fff" />
            </View>
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-warmBrown font-semibold">Utilities included</Text>
              <Switch value={utilitiesIncluded} onValueChange={setUtilitiesIncluded} trackColor={{ false: '#D1D5DB', true: '#1B4D3E' }} thumbColor="#fff" />
            </View>
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-warmBrown font-semibold">Pet friendly</Text>
              <Switch value={petFriendly} onValueChange={setPetFriendly} trackColor={{ false: '#D1D5DB', true: '#1B4D3E' }} thumbColor="#fff" />
            </View>
          </View>

          <Pressable
            onPress={submit}
            disabled={!canSubmit || isSubmitting}
            className={`mt-4 rounded-2xl py-4 items-center ${canSubmit && !isSubmitting ? 'bg-forest-700' : 'bg-gray-300'}`}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center">
                <Check size={18} color="#fff" />
                <Text className="text-white font-bold ml-2">Post Listing</Text>
              </View>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

