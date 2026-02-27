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
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  ChevronLeft,
  Camera,
  Globe,
  Lock,
  MapPin,
  Phone,
  Mail,
  Link as LinkIcon,
  Users,
  Church,
  Building2,
  Heart,
} from 'lucide-react-native';
import { useStore } from '@/lib/store';
import { createGroup, updateGroup, uploadGroupImageUri } from '@/lib/groups-api';

type GroupCategory = 'church' | 'mosque' | 'temple' | 'synagogue' | 'community' | 'association' | 'other';
type GroupVisibility = 'public' | 'private';

const CATEGORIES: { id: GroupCategory; label: string; icon: typeof Church }[] = [
  { id: 'church', label: 'Church', icon: Church },
  { id: 'mosque', label: 'Mosque', icon: Building2 },
  { id: 'temple', label: 'Temple', icon: Building2 },
  { id: 'synagogue', label: 'Synagogue', icon: Building2 },
  { id: 'community', label: 'Community', icon: Users },
  { id: 'association', label: 'Association', icon: Heart },
  { id: 'other', label: 'Other', icon: Building2 },
];

const FAITH_TYPES = [
  'Christian',
  'Muslim',
  'Jewish',
  'Hindu',
  'Buddhist',
  'Sikh',
  'Non-denominational',
  'Interfaith',
  'Other',
];

export default function CreateGroupScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GroupCategory>('church');
  const [faithType, setFaithType] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<GroupVisibility>('public');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const currentUser = useStore((s) => s.currentUser);
  const isGuest = useStore((s) => s.isGuest);
  const selectedLocation = useStore((s) => s.selectedLocation);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || isCreating) return;

    if (isGuest || !currentUser) {
      router.push('/signup');
      return;
    }

    if (!selectedLocation?.city) {
      Alert.alert('Select location', 'Please select a city for your group first.');
      return;
    }

    setIsCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const locationLabel = `${selectedLocation.city}, ${selectedLocation.state || selectedLocation.country}`;

      const created = await createGroup({
        creator_id: currentUser.id,
        name: name.trim(),
        description: description.trim() || null,
        image_url: null, // upload after create so we can use real groupId
        cover_url: null,
        category,
        faith_type: faithType,
        visibility,
        country: selectedLocation.country || 'USA',
        admin_area: selectedLocation.state || null,
        city: selectedLocation.city,
        neighborhood: selectedLocation.neighborhood || null,
        location_label: locationLabel,
        contact_phone: contactPhone.trim() || null,
        contact_email: contactEmail.trim() || null,
        website: website.trim() || null,
      });

      if (!created?.id) throw new Error('Failed to create group');

      // Upload group image (best-effort). Never store a local file:// uri in DB.
      if (imageUri) {
        const uploadedImageUrl = await uploadGroupImageUri({
          userId: currentUser.id,
          groupId: created.id,
          uri: imageUri,
          kind: 'group_image',
        });
        if (uploadedImageUrl) {
          await updateGroup(created.id, { image_url: uploadedImageUrl });
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to the new group
      router.replace(`/group/${created.id}` as never);
    } catch (error) {
      console.error('Error creating group:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsCreating(false);
    }
  };

  const canCreate = name.trim().length >= 3 && !!selectedLocation?.city;

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="w-10 h-10 items-center justify-center"
          >
            <ChevronLeft size={28} color="#2D1F1A" />
          </Pressable>
          <Text className="text-lg font-bold text-warmBrown">Create Group</Text>
          <Pressable
            onPress={handleCreate}
            disabled={!canCreate || isCreating}
            className={`px-4 py-2 rounded-full ${canCreate ? 'bg-forest-600' : 'bg-gray-200'}`}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className={`font-semibold ${canCreate ? 'text-white' : 'text-gray-400'}`}>
                Create
              </Text>
            )}
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Group Image */}
            <Animated.View entering={FadeInUp.duration(300).delay(50)} className="items-center py-6">
              <Pressable
                onPress={handlePickImage}
                className="w-28 h-28 rounded-2xl bg-gray-100 items-center justify-center overflow-hidden border-2 border-dashed border-gray-300"
              >
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <View className="items-center">
                    <Camera size={32} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs mt-1">Add Photo</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>

            {/* Group Name */}
            <Animated.View entering={FadeInUp.duration(300).delay(100)} className="px-4 mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Group Name *</Text>
              <TextInput
                placeholder="e.g., New Life Church, Aurora Community Circle"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                className="bg-white rounded-xl px-4 py-3.5 text-warmBrown"
              />
            </Animated.View>

            {/* Description */}
            <Animated.View entering={FadeInUp.duration(300).delay(150)} className="px-4 mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Description</Text>
              <TextInput
                placeholder="Tell people what your group is about..."
                placeholderTextColor="#9CA3AF"
                value={description}
                onChangeText={setDescription}
                multiline
                className="bg-white rounded-xl px-4 py-3.5 text-warmBrown min-h-[100px]"
                style={{ textAlignVertical: 'top' }}
              />
            </Animated.View>

            {/* Category */}
            <Animated.View entering={FadeInUp.duration(300).delay(200)} className="px-4 mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCategory(cat.id);
                      }}
                      className={`mr-2 px-4 py-3 rounded-xl flex-row items-center ${
                        category === cat.id ? 'bg-forest-600' : 'bg-white'
                      }`}
                    >
                      <Icon size={18} color={category === cat.id ? '#FFFFFF' : '#6B7280'} />
                      <Text
                        className={`ml-2 font-medium ${
                          category === cat.id ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Animated.View>

            {/* Faith Type */}
            {['church', 'mosque', 'temple', 'synagogue'].includes(category) && (
              <Animated.View entering={FadeInUp.duration(300).delay(250)} className="px-4 mb-4">
                <Text className="text-warmBrown font-semibold mb-2">Faith Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                  {FAITH_TYPES.map((faith) => (
                    <Pressable
                      key={faith}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setFaithType(faithType === faith ? null : faith);
                      }}
                      className={`mr-2 px-4 py-2.5 rounded-full ${
                        faithType === faith ? 'bg-gold-500' : 'bg-white'
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          faithType === faith ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {faith}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </Animated.View>
            )}

            {/* Visibility */}
            <Animated.View entering={FadeInUp.duration(300).delay(300)} className="px-4 mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Visibility</Text>
              <View className="flex-row" style={{ gap: 12 }}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setVisibility('public');
                  }}
                  className={`flex-1 p-4 rounded-xl ${
                    visibility === 'public' ? 'bg-forest-600' : 'bg-white'
                  }`}
                >
                  <Globe size={24} color={visibility === 'public' ? '#FFFFFF' : '#6B7280'} />
                  <Text
                    className={`font-semibold mt-2 ${
                      visibility === 'public' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    Public
                  </Text>
                  <Text
                    className={`text-sm mt-1 ${
                      visibility === 'public' ? 'text-white/80' : 'text-gray-500'
                    }`}
                  >
                    Anyone can find and join
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setVisibility('private');
                  }}
                  className={`flex-1 p-4 rounded-xl ${
                    visibility === 'private' ? 'bg-forest-600' : 'bg-white'
                  }`}
                >
                  <Lock size={24} color={visibility === 'private' ? '#FFFFFF' : '#6B7280'} />
                  <Text
                    className={`font-semibold mt-2 ${
                      visibility === 'private' ? 'text-white' : 'text-gray-900'
                    }`}
                  >
                    Private
                  </Text>
                  <Text
                    className={`text-sm mt-1 ${
                      visibility === 'private' ? 'text-white/80' : 'text-gray-500'
                    }`}
                  >
                    Invite only
                  </Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* Location */}
            <Animated.View entering={FadeInUp.duration(300).delay(350)} className="px-4 mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Location</Text>
              <Pressable
                onPress={() => router.push('/location-select')}
                className="bg-white rounded-xl px-4 py-3.5 flex-row items-center"
              >
                <MapPin size={20} color="#C9A227" />
                <Text className="text-gray-700 ml-3 flex-1">
                  {selectedLocation?.city
                    ? `${selectedLocation.city}, ${selectedLocation.state || selectedLocation.country}`
                    : 'Select location'}
                </Text>
              </Pressable>
            </Animated.View>

            {/* Contact Info */}
            <Animated.View entering={FadeInUp.duration(300).delay(400)} className="px-4 mb-4">
              <Text className="text-warmBrown font-semibold mb-2">Contact Info (Optional)</Text>

              <View className="bg-white rounded-xl px-4 py-3.5 flex-row items-center mb-3">
                <Phone size={20} color="#6B7280" />
                <TextInput
                  placeholder="Phone number"
                  placeholderTextColor="#9CA3AF"
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                  className="flex-1 ml-3 text-warmBrown"
                />
              </View>

              <View className="bg-white rounded-xl px-4 py-3.5 flex-row items-center mb-3">
                <Mail size={20} color="#6B7280" />
                <TextInput
                  placeholder="Email address"
                  placeholderTextColor="#9CA3AF"
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 ml-3 text-warmBrown"
                />
              </View>

              <View className="bg-white rounded-xl px-4 py-3.5 flex-row items-center">
                <LinkIcon size={20} color="#6B7280" />
                <TextInput
                  placeholder="Website URL"
                  placeholderTextColor="#9CA3AF"
                  value={website}
                  onChangeText={setWebsite}
                  keyboardType="url"
                  autoCapitalize="none"
                  className="flex-1 ml-3 text-warmBrown"
                />
              </View>
            </Animated.View>

            {/* Info */}
            <Animated.View entering={FadeInUp.duration(300).delay(450)} className="px-4">
              <View className="bg-gold-50 rounded-xl p-4">
                <Text className="text-gold-800 font-semibold">What happens next?</Text>
                <Text className="text-gold-700 text-sm mt-1">
                  After creating your group, you'll be able to:
                </Text>
                <Text className="text-gold-700 text-sm mt-2">• Post announcements and updates</Text>
                <Text className="text-gold-700 text-sm">• Create events and manage RSVPs</Text>
                <Text className="text-gold-700 text-sm">• Share photos in albums</Text>
                <Text className="text-gold-700 text-sm">• Invite members to join</Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
