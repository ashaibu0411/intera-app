import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  ChevronLeft,
  Camera,
  Globe,
  Lock,
  UserPlus,
  CheckCircle,
  Church,
  Users,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { createGroup, updateGroup, updateGroupSettings, uploadGroupImageUri } from '@/lib/groups-api';
import type { DbGroup } from '@/lib/supabase';

const GROUP_CATEGORIES: { value: DbGroup['category']; label: string; icon: string }[] = [
  { value: 'church', label: 'Church', icon: '⛪' },
  { value: 'mosque', label: 'Mosque', icon: '🕌' },
  { value: 'temple', label: 'Temple', icon: '🛕' },
  { value: 'synagogue', label: 'Synagogue', icon: '✡️' },
  { value: 'association', label: 'Association', icon: '🏛️' },
  { value: 'community', label: 'Community', icon: '🤝' },
  { value: 'other', label: 'Other', icon: '📌' },
];

const VISIBILITY_OPTIONS = [
  { value: 'public' as const, label: 'Public', desc: 'Anyone can find and view your group', icon: Globe },
  { value: 'private' as const, label: 'Private', desc: 'Only members can see the group', icon: Lock },
];

const JOIN_MODE_OPTIONS = [
  { value: 'open' as const, label: 'Open', desc: 'Anyone can join immediately' },
  { value: 'request' as const, label: 'Request to Join', desc: 'Admin approval required' },
  { value: 'invite_only' as const, label: 'Invite Only', desc: 'Only invited users can join' },
];

export default function CreateGroupScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DbGroup['category']>('church');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [joinMode, setJoinMode] = useState<'open' | 'request' | 'invite_only'>('open');
  const [locationLabel, setLocationLabel] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);

  const city = selectedLocation?.city || '';
  const country = selectedLocation?.country || 'USA';
  const adminArea = selectedLocation?.state || null;

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser?.id) {
      Alert.alert('Sign In Required', 'Please sign in to create a group.');
      router.push('/signup');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a group name.');
      return;
    }
    if (!city) {
      Alert.alert('Location Required', 'Please set your location in app settings first.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      const locLabel = locationLabel.trim() || `${city}${adminArea ? `, ${adminArea}` : ''}, ${country}`;

      const groupData: Omit<DbGroup, 'id' | 'member_count' | 'created_at' | 'updated_at' | 'creator'> = {
        creator_id: currentUser.id,
        name: name.trim(),
        description: description.trim() || null,
        image_url: null,
        cover_url: null,
        category,
        faith_type: ['church', 'mosque', 'temple', 'synagogue'].includes(category) ? category : null,
        visibility,
        country,
        admin_area: adminArea,
        city,
        neighborhood: selectedLocation?.neighborhood || null,
        location_label: locLabel,
        contact_phone: contactPhone.trim() || null,
        contact_email: contactEmail.trim() || null,
        website: website.trim() || null,
      };

      const group = await createGroup(groupData);
      if (!group) {
        throw new Error('Failed to create group');
      }

      // Upload image if selected
      if (imageUri && group.id) {
        const url = await uploadGroupImageUri({
          userId: currentUser.id,
          groupId: group.id,
          uri: imageUri,
          kind: 'group_image',
        });
        if (url) {
          await updateGroup(group.id, { image_url: url });
        }
      }

      // Set group settings (join mode, etc.)
      await updateGroupSettings(group.id, {
        join_mode: joinMode,
        events_creation: 'members',
        media_upload: 'members',
        posts_creation: 'members',
        posts_media_allowed: true,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Group Created!', 'Your group is ready. Start by posting a welcome message.', [
        { text: 'OK', onPress: () => router.replace(`/group/${group.id}` as any) },
      ]);
    } catch (error) {
      console.error('Create group error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Could not create group. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <Animated.View entering={FadeIn.duration(300)} className="flex-row items-center px-5 py-4 border-b border-gray-100">
            <Pressable onPress={() => router.back()} className="mr-4 p-1" hitSlop={8}>
              <ChevronLeft size={24} color="#2D1F1A" />
            </Pressable>
            <Text className="text-xl font-bold text-warmBrown">Create Group</Text>
          </Animated.View>

          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Image */}
            <Animated.View entering={FadeInUp.duration(300).delay(50)} className="items-center mt-4">
              <Pressable onPress={handlePickImage} className="relative">
                <View className="w-24 h-24 rounded-2xl bg-gray-200 overflow-hidden items-center justify-center">
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <>
                      <Camera size={32} color="#9CA3AF" />
                      <Text className="text-gray-500 text-xs mt-1">Add photo</Text>
                    </>
                  )}
                </View>
              </Pressable>
            </Animated.View>

            {/* Name */}
            <Animated.View entering={FadeInUp.duration(300).delay(75)} className="mt-4">
              <Text className="text-sm font-semibold text-gray-600 mb-2">Group Name *</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Grace Community Church"
                placeholderTextColor="#9CA3AF"
                className="bg-white rounded-xl px-4 py-3 text-warmBrown border border-gray-200"
              />
            </Animated.View>

            {/* Description */}
            <Animated.View entering={FadeInUp.duration(300).delay(100)} className="mt-4">
              <Text className="text-sm font-semibold text-gray-600 mb-2">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="What is this group about?"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                className="bg-white rounded-xl px-4 py-3 text-warmBrown border border-gray-200 min-h-[80px]"
              />
            </Animated.View>

            {/* Category */}
            <Animated.View entering={FadeInUp.duration(300).delay(125)} className="mt-4">
              <Text className="text-sm font-semibold text-gray-600 mb-2">Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                <View className="flex-row gap-2">
                  {GROUP_CATEGORIES.map((c) => (
                    <Pressable
                      key={c.value}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCategory(c.value);
                      }}
                      className={`px-4 py-2 rounded-full flex-row items-center ${
                        category === c.value ? 'bg-forest-600' : 'bg-white border border-gray-200'
                      }`}
                    >
                      <Text className="text-lg mr-1">{c.icon}</Text>
                      <Text className={category === c.value ? 'text-white font-medium' : 'text-gray-600'}>
                        {c.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </Animated.View>

            {/* Visibility */}
            <Animated.View entering={FadeInUp.duration(300).delay(150)} className="mt-4">
              <Text className="text-sm font-semibold text-gray-600 mb-2">Visibility</Text>
              <View className="flex-row gap-3">
                {VISIBILITY_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setVisibility(opt.value);
                      }}
                      className={`flex-1 rounded-xl p-4 border-2 ${
                        visibility === opt.value ? 'border-forest-600 bg-forest-50' : 'border-gray-200 bg-white'
                      }`}
                    >
                      <Icon size={24} color={visibility === opt.value ? '#1B4D3E' : '#9CA3AF'} />
                      <Text className={`font-semibold mt-2 ${visibility === opt.value ? 'text-forest-700' : 'text-gray-600'}`}>
                        {opt.label}
                      </Text>
                      <Text className="text-gray-500 text-xs mt-0.5">{opt.desc}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* Join Mode */}
            <Animated.View entering={FadeInUp.duration(300).delay(175)} className="mt-4">
              <Text className="text-sm font-semibold text-gray-600 mb-2">Who can join?</Text>
              <View className="gap-2">
                {JOIN_MODE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setJoinMode(opt.value);
                    }}
                    className={`flex-row items-center p-4 rounded-xl border-2 ${
                      joinMode === opt.value ? 'border-forest-600 bg-forest-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <UserPlus size={20} color={joinMode === opt.value ? '#1B4D3E' : '#9CA3AF'} />
                    <View className="flex-1 ml-3">
                      <Text className={joinMode === opt.value ? 'font-semibold text-forest-700' : 'text-gray-600'}>
                        {opt.label}
                      </Text>
                      <Text className="text-gray-500 text-xs">{opt.desc}</Text>
                    </View>
                    {joinMode === opt.value && <CheckCircle size={20} color="#1B4D3E" />}
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Location */}
            <Animated.View entering={FadeInUp.duration(300).delay(200)} className="mt-4">
              <Text className="text-sm font-semibold text-gray-600 mb-2">Location</Text>
              <TextInput
                value={locationLabel}
                onChangeText={setLocationLabel}
                placeholder={`${city}, ${adminArea || ''} ${country}`.trim()}
                placeholderTextColor="#9CA3AF"
                className="bg-white rounded-xl px-4 py-3 text-warmBrown border border-gray-200"
              />
            </Animated.View>

            {/* Contact */}
            <Animated.View entering={FadeInUp.duration(300).delay(225)} className="mt-4">
              <Text className="text-sm font-semibold text-gray-600 mb-2">Contact (optional)</Text>
              <TextInput
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="Phone"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                className="bg-white rounded-xl px-4 py-3 text-warmBrown border border-gray-200 mb-2"
              />
              <TextInput
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                className="bg-white rounded-xl px-4 py-3 text-warmBrown border border-gray-200 mb-2"
              />
              <TextInput
                value={website}
                onChangeText={setWebsite}
                placeholder="Website"
                placeholderTextColor="#9CA3AF"
                keyboardType="url"
                className="bg-white rounded-xl px-4 py-3 text-warmBrown border border-gray-200"
              />
            </Animated.View>

            {/* Submit */}
            <Animated.View entering={FadeInUp.duration(300).delay(250)} className="mt-6 mb-8">
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                className="bg-forest-600 rounded-2xl py-4 flex-row items-center justify-center"
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Church size={20} color="#fff" />
                    <Text className="text-white font-bold text-base ml-2">Create Group</Text>
                  </>
                )}
              </Pressable>
              <Text className="text-gray-500 text-center text-sm mt-3">
                Your group can post, share photos, create events, and more.
              </Text>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
