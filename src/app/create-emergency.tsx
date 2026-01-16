import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  AlertTriangle,
  Heart,
  Home,
  Car,
  DollarSign,
  Users,
  Check,
  Camera,
  MapPin,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import * as ImagePicker from 'expo-image-picker';
import { uploadImages } from '@/lib/posts';
import { createIncident } from '@/lib/marketplace-api';
import { sendRemotePushAlert } from '@/lib/pushAlerts';

// Emergency types
const EMERGENCY_TYPES = [
  { id: 'medical', label: 'Medical Emergency', icon: Heart, color: '#EF4444' },
  { id: 'housing', label: 'Housing Crisis', icon: Home, color: '#F59E0B' },
  { id: 'transport', label: 'Transportation Need', icon: Car, color: '#3B82F6' },
  { id: 'financial', label: 'Financial Emergency', icon: DollarSign, color: '#10B981' },
  { id: 'family', label: 'Family Emergency', icon: Users, color: '#8B5CF6' },
  { id: 'other', label: 'Other Emergency', icon: AlertTriangle, color: '#6B7280' },
];

export default function CreateEmergencyScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [location, setLocation] = useState(selectedLocation?.city || '');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loc = useMemo(() => {
    const city = selectedLocation?.city || location || 'Unknown';
    const country = selectedLocation?.country || 'Unknown';
    const adminArea = selectedLocation?.state || null;
    const neighborhood = selectedLocation?.neighborhood?.trim() || null;
    const locationLabel = neighborhood ? `${city}, ${adminArea || country} · ${neighborhood}` : `${city}, ${adminArea || country}`;
    const scope = selectedLocation?.neighborhood ? 'neighborhood' : 'city';
    return { city, country, adminArea, neighborhood, locationLabel, scope };
  }, [selectedLocation, location]);

  const handlePickPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets?.length) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !title.trim() || !description.trim() || !currentUser?.id || isSubmitting) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let imageUrl: string | null = null;
      if (photo) {
        const uploaded = await uploadImages([photo], currentUser.id);
        imageUrl = uploaded[0] || null;
      }

      const extra =
        selectedType === 'financial' && amount.trim()
          ? `\n\nAmount needed: ${amount.trim()}`
          : '';

      await createIncident(currentUser.id, {
        type: selectedType,
        title: title.trim(),
        description: `${description.trim()}${extra}${isAnonymous ? '\n\nPosted anonymously' : ''}`,
        image: imageUrl,
        country: loc.country,
        admin_area: loc.adminArea,
        city: loc.city,
        neighborhood: loc.neighborhood,
        location_label: loc.locationLabel,
        scope: loc.scope as any,
      });

      // True remote push alert to neighborhood/city (best-effort; non-blocking)
      sendRemotePushAlert({
        title: `Emergency: ${EMERGENCY_TYPES.find((t) => t.id === selectedType)?.label || selectedType}`,
        body: title.trim(),
        scope: loc.scope as any,
        city: loc.city,
        neighborhood: loc.neighborhood,
        excludeUserId: currentUser.id,
        data: { type: 'emergency', screen: '/safety-alerts' },
      }).catch(() => {});

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSuccess(true);

      setTimeout(() => {
        router.back();
      }, 1200);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <View className="flex-1 bg-cream items-center justify-center px-5">
        <Animated.View entering={FadeIn.duration(400)} className="items-center">
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={40} color="#FFFFFF" />
          </LinearGradient>
          <Text className="text-warmBrown text-2xl font-bold mt-6">
            Request Submitted
          </Text>
          <Text className="text-gray-500 text-center mt-2 px-8">
            Your emergency has been shared with the community. Help is on the way.
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center px-5 pt-4 pb-4 border-b border-gray-100"
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="mr-4 p-1"
            hitSlop={8}
          >
            <ArrowLeft size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="text-xl font-bold text-warmBrown">Request Help</Text>
        </Animated.View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Alert Banner */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 pt-5">
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <View className="flex-row items-center">
                <AlertTriangle size={24} color="#FFFFFF" />
                <View className="flex-1 ml-3">
                  <Text className="text-white font-bold text-lg">Community Emergency Request</Text>
                  <Text className="text-white/80 text-sm mt-1">
                    Our community is here to help you in times of need
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Emergency Type */}
          <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-4">
              What type of emergency?
            </Text>

            <View className="flex-row flex-wrap gap-3">
              {EMERGENCY_TYPES.map((type) => {
                const isSelected = selectedType === type.id;
                const Icon = type.icon;

                return (
                  <Pressable
                    key={type.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedType(type.id);
                    }}
                    className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                      isSelected
                        ? 'bg-red-50 border-red-500'
                        : 'bg-white border-gray-200'
                    }`}
                    style={{ minWidth: '45%' }}
                  >
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center"
                      style={{ backgroundColor: isSelected ? type.color : '#F3F4F6' }}
                    >
                      <Icon size={16} color={isSelected ? '#FFFFFF' : type.color} />
                    </View>
                    <Text
                      className={`ml-2 font-medium text-sm ${
                        isSelected ? 'text-red-700' : 'text-warmBrown'
                      }`}
                    >
                      {type.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Details */}
          <Animated.View entering={FadeInUp.duration(400).delay(300)} className="px-5 mt-6">
            <Text className="text-lg font-bold text-warmBrown mb-4">Details</Text>

            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-gray-500 text-sm mb-2">Title *</Text>
              <TextInput
                placeholder="Brief title for your request"
                placeholderTextColor="#9CA3AF"
                value={title}
                onChangeText={setTitle}
                className="text-warmBrown text-base"
              />
            </View>

            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-gray-500 text-sm mb-2">Description *</Text>
              <TextInput
                placeholder="Explain your situation and what help you need..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                className="text-warmBrown text-base"
                style={{ minHeight: 120, textAlignVertical: 'top' }}
              />
            </View>

            {/* Financial Amount (if applicable) */}
            {selectedType === 'financial' && (
              <View className="bg-white rounded-xl p-4 mb-4">
                <Text className="text-gray-500 text-sm mb-2">Amount Needed</Text>
                <View className="flex-row items-center">
                  <DollarSign size={20} color="#6B7280" />
                  <TextInput
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="number-pad"
                    className="flex-1 ml-2 text-warmBrown text-lg"
                  />
                </View>
              </View>
            )}

            {/* Location */}
            <View className="bg-white rounded-xl p-4 mb-4">
              <Text className="text-gray-500 text-sm mb-2">Location</Text>
              <View className="flex-row items-center">
                <MapPin size={20} color="#6B7280" />
                <TextInput
                  placeholder="Your city or area"
                  placeholderTextColor="#9CA3AF"
                  value={location}
                  onChangeText={setLocation}
                  className="flex-1 ml-2 text-warmBrown text-base"
                />
              </View>
            </View>

            {/* Add Photo */}
            <Pressable
              onPress={handlePickPhoto}
              className="bg-white rounded-xl p-4 flex-row items-center"
            >
              <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
                <Camera size={20} color="#6B7280" />
              </View>
              <Text className="text-gray-600 ml-3">
                {photo ? 'Photo added (tap to change)' : 'Add supporting photo (optional)'}
              </Text>
            </Pressable>
          </Animated.View>

          {/* Privacy Option */}
          <Animated.View entering={FadeInUp.duration(400).delay(400)} className="px-5 mt-6">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsAnonymous(!isAnonymous);
              }}
              className="flex-row items-center bg-white rounded-xl p-4"
            >
              <View
                className={`w-6 h-6 rounded-md border-2 items-center justify-center ${
                  isAnonymous ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                }`}
              >
                {isAnonymous && <Check size={16} color="#FFFFFF" />}
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-warmBrown font-medium">Post anonymously</Text>
                <Text className="text-gray-500 text-sm">
                  Your name won't be shown publicly
                </Text>
              </View>
            </Pressable>
          </Animated.View>

          {/* Submit Button */}
          <Animated.View entering={FadeInUp.duration(400).delay(500)} className="px-5 mt-8">
            <Pressable
              onPress={handleSubmit}
              disabled={!selectedType || !title.trim() || !description.trim()}
              style={{ opacity: selectedType && title.trim() && description.trim() ? 1 : 0.5 }}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                style={{ borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                <View className="flex-row items-center">
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <AlertTriangle size={20} color="#FFFFFF" />
                      <Text className="text-white font-bold text-lg ml-2">
                        Submit Emergency Request
                      </Text>
                    </>
                  )}
                </View>
              </LinearGradient>
            </Pressable>

            <Text className="text-gray-500 text-center text-sm mt-3">
              Your request will be shared with the community immediately
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
