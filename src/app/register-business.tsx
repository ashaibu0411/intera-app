import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Modal, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Camera,
  X,
  Check,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Building2,
  Store,
  ShoppingBasket,
  CalendarCheck,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { createBusiness } from '@/lib/marketplace-api';

const BUSINESS_CATEGORIES = [
  'Food & Dining',
  'Beauty & Hair',
  'Retail',
  'Services',
  'Health',
  'Education',
  'Auto',
  'Real Estate',
  'African Market',
  'Grocery Store',
  'Fashion',
  'Entertainment',
  'Other',
];

export default function RegisterBusinessScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [logo, setLogo] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [hours, setHours] = useState('');
  const [isAfricanMarket, setIsAfricanMarket] = useState(false);
  const [acceptsBookings, setAcceptsBookings] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const currentCommunity = useStore((s) => s.currentCommunity);

  const userLocation = selectedLocation?.city
    ? `${selectedLocation.city}, ${selectedLocation.state || selectedLocation.country}`
    : currentCommunity?.city
      ? `${currentCommunity.city}, ${currentCommunity.state || currentCommunity.country}`
      : 'Denver, CO';

  const handlePickLogo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      setLogo(result.assets[0].uri);
    }
  };

  const handlePickCover = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (!result.canceled && result.assets.length > 0) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) return businessName.trim().length > 0 && category.length > 0 && coverImage;
    if (currentStep === 2) return address.trim().length > 0;
    if (currentStep === 3) return description.trim().length >= 50;
    return true;
  };

  const handleSubmit = async () => {
    if (!currentUser || !coverImage || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await createBusiness(currentUser.id, {
        name: businessName.trim(),
        category,
        description: description.trim(),
        image: coverImage,
        logo: logo || undefined,
        location: userLocation,
        address: address.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        hours: hours.trim() || 'Contact for hours',
        isAfricanMarket,
        acceptsBookings,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Error creating business:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <View className="flex-1 bg-cream justify-center items-center px-6">
        <Text className="text-warmBrown text-lg text-center">Please sign in to register your business</Text>
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
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); currentStep > 1 ? setCurrentStep(currentStep - 1) : router.back(); }} className="bg-white rounded-full p-2 shadow-sm">
              <ChevronLeft size={24} color="#2D1F1A" />
            </Pressable>
            <Text className="text-lg font-bold text-warmBrown">Register Business</Text>
            <View className="w-10" />
          </View>

          {/* Progress */}
          <View className="flex-row mt-4">
            {[1, 2, 3].map((step) => (
              <View
                key={step}
                className={`flex-1 h-1.5 rounded-full mx-1 ${step <= currentStep ? 'bg-forest-600' : 'bg-gray-200'}`}
              />
            ))}
          </View>
          <Text className="text-gray-500 text-sm mt-2">Step {currentStep} of 3</Text>
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {currentStep === 1 && (
              <Animated.View entering={FadeInUp.duration(400)}>
                <Text className="text-2xl font-bold text-warmBrown mt-4 mb-2">Business Info</Text>
                <Text className="text-gray-500 mb-6">Tell us about your business</Text>

                {/* Cover Image */}
                <Pressable onPress={handlePickCover} className="mb-4">
                  {coverImage ? (
                    <View className="relative">
                      <Image
                        source={{ uri: coverImage }}
                        style={{ width: '100%', height: 160, borderRadius: 16 }}
                        contentFit="cover"
                      />
                      <Pressable onPress={handlePickCover} className="absolute bottom-2 right-2 bg-black/50 rounded-full p-2">
                        <Camera size={20} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ) : (
                    <View className="w-full h-40 bg-gray-200 rounded-2xl items-center justify-center">
                      <Camera size={32} color="#9CA3AF" />
                      <Text className="text-gray-400 mt-2">Add Cover Photo *</Text>
                    </View>
                  )}
                </Pressable>

                {/* Logo */}
                <View className="flex-row items-center mb-6">
                  <Pressable onPress={handlePickLogo}>
                    {logo ? (
                      <Image
                        source={{ uri: logo }}
                        style={{ width: 80, height: 80, borderRadius: 16 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-20 h-20 rounded-2xl bg-gray-200 items-center justify-center">
                        <Store size={32} color="#9CA3AF" />
                      </View>
                    )}
                  </Pressable>
                  <View className="ml-4">
                    <Text className="text-warmBrown font-medium">Business Logo</Text>
                    <Text className="text-gray-400 text-sm">Optional but recommended</Text>
                  </View>
                </View>

                {/* Business Name */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Business Name *</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <Building2 size={20} color="#8B7355" />
                    <TextInput
                      placeholder="e.g., Mama's African Kitchen"
                      placeholderTextColor="#9CA3AF"
                      value={businessName}
                      onChangeText={setBusinessName}
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Category */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Category *</Text>
                  <Pressable onPress={() => setShowCategoryModal(true)} className="flex-row items-center bg-white rounded-xl px-4 py-3.5">
                    <ShoppingBasket size={20} color="#8B7355" />
                    <Text className={`flex-1 ml-3 ${category ? 'text-warmBrown' : 'text-gray-400'}`}>
                      {category || 'Select category'}
                    </Text>
                  </Pressable>
                </View>

                {/* African Market Toggle */}
                <View className="bg-forest-50 rounded-2xl p-4 flex-row items-center justify-between">
                  <View className="flex-1 mr-4">
                    <Text className="text-warmBrown font-semibold">African Market / Grocery</Text>
                    <Text className="text-gray-500 text-sm mt-1">Enable if you sell African groceries with real-time inventory</Text>
                  </View>
                  <Switch
                    value={isAfricanMarket}
                    onValueChange={setIsAfricanMarket}
                    trackColor={{ false: '#D1D5DB', true: '#1B4D3E' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </Animated.View>
            )}

            {currentStep === 2 && (
              <Animated.View entering={FadeInUp.duration(400)}>
                <Text className="text-2xl font-bold text-warmBrown mt-4 mb-2">Location & Contact</Text>
                <Text className="text-gray-500 mb-6">How can customers reach you?</Text>

                {/* Address */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Address *</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <MapPin size={20} color="#8B7355" />
                    <TextInput
                      placeholder="Full street address"
                      placeholderTextColor="#9CA3AF"
                      value={address}
                      onChangeText={setAddress}
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Location Display */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">City</Text>
                  <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3.5">
                    <MapPin size={20} color="#8B7355" />
                    <Text className="flex-1 ml-3 text-warmBrown">{userLocation}</Text>
                  </View>
                </View>

                {/* Phone */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Phone Number</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <Phone size={20} color="#8B7355" />
                    <TextInput
                      placeholder="+1 (555) 000-0000"
                      placeholderTextColor="#9CA3AF"
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Email */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Email</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <Mail size={20} color="#8B7355" />
                    <TextInput
                      placeholder="business@example.com"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Website */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Website</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <Globe size={20} color="#8B7355" />
                    <TextInput
                      placeholder="www.yourbusiness.com"
                      placeholderTextColor="#9CA3AF"
                      value={website}
                      onChangeText={setWebsite}
                      keyboardType="url"
                      autoCapitalize="none"
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Hours */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Business Hours</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-4">
                    <Clock size={20} color="#8B7355" />
                    <TextInput
                      placeholder="e.g., Mon-Sat: 9AM-6PM"
                      placeholderTextColor="#9CA3AF"
                      value={hours}
                      onChangeText={setHours}
                      className="flex-1 py-3.5 ml-3 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Accept Bookings Toggle */}
                <View className="bg-emerald-50 rounded-2xl p-4 flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1 mr-4">
                    <View className="bg-emerald-100 rounded-full p-2 mr-3">
                      <CalendarCheck size={20} color="#10B981" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-warmBrown font-semibold">Accept Appointments</Text>
                      <Text className="text-gray-500 text-sm mt-0.5">Let customers book appointments online (great for salons, barbershops, etc.)</Text>
                    </View>
                  </View>
                  <Switch
                    value={acceptsBookings}
                    onValueChange={setAcceptsBookings}
                    trackColor={{ false: '#D1D5DB', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {acceptsBookings && (
                  <View className="bg-blue-50 rounded-xl p-3 mt-3">
                    <Text className="text-blue-700 text-sm">
                      After registering, go to My Businesses → tap your business → Calendar to set up your services, hours, and availability.
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}

            {currentStep === 3 && (
              <Animated.View entering={FadeInUp.duration(400)}>
                <Text className="text-2xl font-bold text-warmBrown mt-4 mb-2">Description</Text>
                <Text className="text-gray-500 mb-6">Tell customers what makes your business special</Text>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">About Your Business * (min 50 characters)</Text>
                  <TextInput
                    placeholder="Describe your business, products/services, and what makes you unique..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={description}
                    onChangeText={setDescription}
                    className="bg-white rounded-xl px-4 py-3.5 text-warmBrown min-h-[160px]"
                    style={{ textAlignVertical: 'top' }}
                  />
                  <Text className="text-gray-400 text-sm mt-1">{description.length}/50 minimum</Text>
                </View>

                {/* Tips */}
                <View className="bg-gold-50 rounded-xl p-4">
                  <Text className="text-gold-800 font-semibold mb-2">Tips for a great listing:</Text>
                  <Text className="text-gold-700 text-sm leading-5">
                    • Mention your specialty or unique offerings{'\n'}
                    • Include any cultural background or authenticity{'\n'}
                    • Highlight what makes you different from competitors{'\n'}
                    • Mention any awards or recognition
                  </Text>
                </View>

                {isAfricanMarket && (
                  <View className="bg-forest-50 rounded-xl p-4 mt-4">
                    <Text className="text-forest-800 font-semibold mb-2">African Market Features</Text>
                    <Text className="text-forest-700 text-sm leading-5">
                      After registering, you'll be able to:{'\n'}
                      • Add your inventory with photos and prices{'\n'}
                      • Update stock levels in real-time{'\n'}
                      • Let customers message you directly
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Button */}
        <View className="px-5 py-4 border-t border-gray-100 bg-cream">
          <Pressable onPress={() => currentStep < 3 ? setCurrentStep(currentStep + 1) : handleSubmit()} disabled={!canProceed() || isSubmitting}>
            <LinearGradient
              colors={canProceed() && !isSubmitting ? ['#1B4D3E', '#153D31'] : ['#D1D5DB', '#9CA3AF']}
              style={{ borderRadius: 16, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-lg">
                  {currentStep < 3 ? 'Continue' : 'Register Business'}
                </Text>
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
                {BUSINESS_CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategory(cat); setShowCategoryModal(false); }}
                    className="flex-row items-center py-4 border-b border-gray-100"
                  >
                    <Text className="flex-1 text-warmBrown">{cat}</Text>
                    {category === cat && <Check size={20} color="#1B4D3E" />}
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
