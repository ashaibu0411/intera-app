import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import {
  Camera,
  User,
  Briefcase,
  MapPin,
  FileText,
  ChevronRight,
  Store,
  Phone,
  Mail,
  Globe,
  Loader2,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { updateProfile } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop',
];

const INTEREST_OPTIONS = [
  'Food & Cuisine',
  'Music & Arts',
  'Business & Networking',
  'Sports & Fitness',
  'Fashion & Beauty',
  'Technology',
  'Education',
  'Community Service',
  'Travel & Culture',
  'Family & Parenting',
];

export default function ProfileSetupScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);

  const [selectedAvatar, setSelectedAvatar] = useState(currentUser?.avatar || AVATAR_OPTIONS[0]);
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isBusiness, setIsBusiness] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessWebsite, setBusinessWebsite] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else if (selectedInterests.length < 5) {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedAvatar(result.assets[0].uri);
    }
  };

  const handleComplete = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Update profile in Supabase
      await updateProfile(currentUser.id, {
        avatar_url: selectedAvatar,
        bio: bio,
        interests: selectedInterests,
        location: selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : undefined,
      });

      // Update local state
      setCurrentUser({
        ...currentUser,
        avatar: selectedAvatar,
        bio: bio,
        interests: selectedInterests,
        location: selectedLocation ? `${selectedLocation.city}, ${selectedLocation.country}` : currentUser.location,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error updating profile:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Header */}
          <Animated.View
            entering={FadeIn.duration(400)}
            className="px-6 pt-4 pb-2"
          >
            <Text className="text-2xl font-bold text-warmBrown">
              Set Up Your Profile
            </Text>
            <Text className="text-gray-500 mt-1">
              Help the community get to know you
            </Text>
          </Animated.View>

          {/* Avatar Selection */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(100)}
            className="px-6 mt-6"
          >
            <Text className="text-warmBrown font-semibold mb-3">
              Profile Photo
            </Text>

            {/* Current Avatar */}
            <View className="items-center mb-4">
              <Pressable onPress={handlePickImage} className="relative">
                <Image
                  source={{ uri: selectedAvatar }}
                  style={{ width: 100, height: 100, borderRadius: 50 }}
                  contentFit="cover"
                />
                <View className="absolute bottom-0 right-0 bg-terracotta-500 rounded-full p-2">
                  <Camera size={18} color="#FFFFFF" />
                </View>
              </Pressable>
              <Text className="text-gray-400 text-xs mt-2">
                Tap to upload your photo
              </Text>
            </View>

            {/* Avatar Options */}
            <Text className="text-gray-500 text-sm mb-2">Or choose an avatar:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 20 }}
              style={{ flexGrow: 0 }}
            >
              {AVATAR_OPTIONS.map((avatar, index) => (
                <Pressable
                  key={index}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedAvatar(avatar);
                  }}
                  className={`mr-3 rounded-full ${
                    selectedAvatar === avatar ? 'border-2 border-terracotta-500' : ''
                  }`}
                >
                  <Image
                    source={{ uri: avatar }}
                    style={{ width: 56, height: 56, borderRadius: 28 }}
                    contentFit="cover"
                  />
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Bio */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(200)}
            className="px-6 mt-6"
          >
            <Text className="text-warmBrown font-semibold mb-2">
              About You <Text className="text-gray-400 font-normal">(optional)</Text>
            </Text>
            <View className="bg-white rounded-2xl px-4 py-3 border border-gray-200">
              <TextInput
                placeholder="Tell the community a bit about yourself..."
                placeholderTextColor="#9CA3AF"
                value={bio}
                onChangeText={setBio}
                className="text-warmBrown text-base"
                multiline
                numberOfLines={3}
                maxLength={200}
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>
            <Text className="text-gray-400 text-xs mt-1 text-right">
              {bio.length}/200
            </Text>
          </Animated.View>

          {/* Interests */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(300)}
            className="px-6 mt-4"
          >
            <Text className="text-warmBrown font-semibold mb-2">
              Interests <Text className="text-gray-400 font-normal">(select up to 5)</Text>
            </Text>
            <View className="flex-row flex-wrap">
              {INTEREST_OPTIONS.map((interest) => (
                <Pressable
                  key={interest}
                  onPress={() => toggleInterest(interest)}
                  className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                    selectedInterests.includes(interest)
                      ? 'bg-terracotta-500 border-terracotta-500'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      selectedInterests.includes(interest)
                        ? 'text-white font-medium'
                        : 'text-warmBrown'
                    }`}
                  >
                    {interest}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Business Profile Toggle */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(400)}
            className="px-6 mt-6"
          >
            <View className="bg-white rounded-2xl p-4 border border-gray-200">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-forest-50 rounded-full p-2 mr-3">
                    <Store size={20} color="#1B4D3E" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-warmBrown font-semibold">
                      I have a business
                    </Text>
                    <Text className="text-gray-500 text-xs">
                      Add your business to the marketplace
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isBusiness}
                  onValueChange={(value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setIsBusiness(value);
                  }}
                  trackColor={{ false: '#E5E7EB', true: '#D4673A' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </Animated.View>

          {/* Business Details */}
          {isBusiness && (
            <Animated.View
              entering={FadeInUp.duration(300)}
              className="px-6 mt-4"
            >
              <View className="bg-forest-50 rounded-2xl p-4 border border-forest-100">
                <Text className="text-forest-700 font-semibold mb-4">
                  Business Information
                </Text>

                {/* Business Name */}
                <View className="mb-3">
                  <Text className="text-warmBrown text-sm mb-1">Business Name *</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-3 py-2.5 border border-gray-200">
                    <Briefcase size={18} color="#8B7355" />
                    <TextInput
                      placeholder="Your business name"
                      placeholderTextColor="#9CA3AF"
                      value={businessName}
                      onChangeText={setBusinessName}
                      className="flex-1 ml-2 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Business Category */}
                <View className="mb-3">
                  <Text className="text-warmBrown text-sm mb-1">Category</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-3 py-2.5 border border-gray-200">
                    <Store size={18} color="#8B7355" />
                    <TextInput
                      placeholder="e.g., Restaurant, Fashion, Services"
                      placeholderTextColor="#9CA3AF"
                      value={businessCategory}
                      onChangeText={setBusinessCategory}
                      className="flex-1 ml-2 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Business Phone */}
                <View className="mb-3">
                  <Text className="text-warmBrown text-sm mb-1">Phone</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-3 py-2.5 border border-gray-200">
                    <Phone size={18} color="#8B7355" />
                    <TextInput
                      placeholder="Business phone number"
                      placeholderTextColor="#9CA3AF"
                      value={businessPhone}
                      onChangeText={setBusinessPhone}
                      keyboardType="phone-pad"
                      className="flex-1 ml-2 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Business Email */}
                <View className="mb-3">
                  <Text className="text-warmBrown text-sm mb-1">Email</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-3 py-2.5 border border-gray-200">
                    <Mail size={18} color="#8B7355" />
                    <TextInput
                      placeholder="Business email"
                      placeholderTextColor="#9CA3AF"
                      value={businessEmail}
                      onChangeText={setBusinessEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      className="flex-1 ml-2 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Business Website */}
                <View className="mb-3">
                  <Text className="text-warmBrown text-sm mb-1">Website (optional)</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-3 py-2.5 border border-gray-200">
                    <Globe size={18} color="#8B7355" />
                    <TextInput
                      placeholder="www.yourbusiness.com"
                      placeholderTextColor="#9CA3AF"
                      value={businessWebsite}
                      onChangeText={setBusinessWebsite}
                      keyboardType="url"
                      autoCapitalize="none"
                      className="flex-1 ml-2 text-warmBrown"
                    />
                  </View>
                </View>

                {/* Business Description */}
                <View>
                  <Text className="text-warmBrown text-sm mb-1">Description</Text>
                  <View className="bg-white rounded-xl px-3 py-2.5 border border-gray-200">
                    <TextInput
                      placeholder="What does your business offer?"
                      placeholderTextColor="#9CA3AF"
                      value={businessDescription}
                      onChangeText={setBusinessDescription}
                      multiline
                      numberOfLines={3}
                      maxLength={300}
                      className="text-warmBrown"
                      style={{ minHeight: 70, textAlignVertical: 'top' }}
                    />
                  </View>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Action Buttons */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(500)}
            className="px-6 mt-8"
          >
            <Pressable onPress={handleComplete} disabled={isLoading}>
              <LinearGradient
                colors={['#D4673A', '#B85430']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                {isLoading ? (
                  <Loader2 size={24} color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-bold text-lg">
                    Complete Setup
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable onPress={handleSkip} className="mt-4 items-center py-3">
              <Text className="text-gray-500">Skip for now</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
