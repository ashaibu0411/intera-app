import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Modal, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ChevronLeft,
  Camera,
  X,
  Check,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Clock,
  Heart,
  Users,
  RefreshCw,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useStore, FAITH_TYPES } from '@/lib/store';
import { createFaithEvent } from '@/lib/marketplace-api';
import { createPost as createDbPost } from '@/lib/posts';
import { uploadImages } from '@/lib/posts';
import { sendRemotePushAlert } from '@/lib/pushAlerts';
import { encodeEventMetadata, type EventReach } from '@/lib/eventMetadata';

const RECURRING_OPTIONS = [
  'Every Sunday',
  'Every Friday',
  'Every Saturday',
  'Weekly',
  'Bi-weekly',
  'Monthly',
  'First Sunday of Month',
  'Custom',
];

export default function CreateFaithEventScreen() {
  const [organizationLogo, setOrganizationLogo] = useState<string | null>(null);
  const [eventFlyer, setEventFlyer] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [faithType, setFaithType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reach, setReach] = useState<EventReach>('city');
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<Date>(new Date());
  const [address, setAddress] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringSchedule, setRecurringSchedule] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [showFaithModal, setShowFaithModal] = useState(false);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareToCommunityFeed, setShareToCommunityFeed] = useState(true);

  const currentUser = useStore((s) => s.currentUser);
  const selectedLocation = useStore((s) => s.selectedLocation);
  const currentCommunity = useStore((s) => s.currentCommunity);

  const userLocation = (() => {
    const city = selectedLocation?.city || currentCommunity?.city || 'Denver';
    const region = selectedLocation?.state || currentCommunity?.state || selectedLocation?.country || currentCommunity?.country || 'CO';
    const base = `${city}, ${region}`;
    const neighborhood = selectedLocation?.neighborhood?.trim();
    return neighborhood ? `${base} · ${neighborhood}` : base;
  })();

  const handlePickLogo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      setOrganizationLogo(result.assets[0].uri);
    }
  };

  const handlePickFlyer = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      setEventFlyer(result.assets[0].uri);
    }
  };

  const formatDisplayDate = (d: Date) => {
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDisplayTime = (t: Date) => {
    return t.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const canSubmit = organizationName.trim().length > 0 &&
    faithType.length > 0 &&
    title.trim().length > 0 &&
    description.trim().length >= 20 &&
    address.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Upload assets (so other users can see them)
      let logoUrl: string | undefined;
      if (organizationLogo) {
        const uploaded = await uploadImages([organizationLogo], currentUser.id);
        logoUrl = uploaded[0];
        if (!logoUrl) {
          throw new Error('Logo upload failed. Please try again.');
        }
      }

      let flyerUrl: string | undefined;
      if (eventFlyer) {
        const uploaded = await uploadImages([eventFlyer], currentUser.id);
        flyerUrl = uploaded[0];
        if (!flyerUrl) {
          throw new Error('Flyer upload failed. Please try again.');
        }
      }

      const encodedDescription = encodeEventMetadata(description.trim(), {
        reach,
        flyerUrl,
      });

      await createFaithEvent(currentUser.id, {
        organizationName: organizationName.trim(),
        // If they didn't upload a logo, fall back to flyer so listings still look great
        organizationLogo: logoUrl || flyerUrl || undefined,
        faithType,
        title: title.trim(),
        description: encodedDescription,
        date: date.toISOString(),
        time: formatDisplayTime(time),
        location: userLocation,
        address: address.trim(),
        isRecurring,
        recurringSchedule: isRecurring ? recurringSchedule : undefined,
        contactPhone: contactPhone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      });

      // Notify all app users in same city (faith events are public)
      const city = selectedLocation?.city || currentCommunity?.city || '';
      if (city) {
        sendRemotePushAlert({
          title: 'New faith event',
          body: `${organizationName.trim()} · ${title.trim()}${address ? ` at ${address.slice(0, 40)}` : ''}`,
          scope: 'city',
          city,
          neighborhood: null,
          excludeUserId: currentUser.id,
          type: 'new_faith_event',
          actorId: currentUser.id,
          data: { type: 'new_faith_event' },
        }).catch(() => {});
      }

      if (shareToCommunityFeed) {
        const faithEmoji =
          faithType.toLowerCase().includes('muslim') ? '🕌'
          : faithType.toLowerCase().includes('jew') ? '🕍'
          : faithType.toLowerCase().includes('hindu') ? '🛕'
          : faithType.toLowerCase().includes('christ') ? '⛪'
          : '🕊️';

        const feedContent =
          `${faithEmoji} ${organizationName.trim()}\n\n` +
          `📅 ${title.trim()}\n` +
          `🗓 ${formatDisplayDate(date)} · ${formatDisplayTime(time)}\n` +
          `📍 ${address.trim()}\n\n` +
          `${description.trim()}\n\n#FaithEvent`;

        await createDbPost(currentUser.id, feedContent, flyerUrl ? [flyerUrl] : [], userLocation);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Error creating faith event:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <View className="flex-1 bg-cream justify-center items-center px-6">
        <Text className="text-warmBrown text-lg text-center">Please sign in to create an event</Text>
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
            <Text className="text-lg font-bold text-warmBrown">Post Faith Event</Text>
            <View className="w-10" />
          </View>
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {/* Organization Info */}
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="mt-4">
              <Text className="text-lg font-bold text-warmBrown mb-4">Organization</Text>

              {/* Logo */}
              <View className="flex-row items-center mb-4">
                <Pressable onPress={handlePickLogo}>
                  {organizationLogo ? (
                    <Image
                      source={{ uri: organizationLogo }}
                      style={{ width: 70, height: 70, borderRadius: 35 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="w-[70px] h-[70px] rounded-full bg-gold-100 items-center justify-center">
                      <Heart size={28} color="#C9A227" />
                    </View>
                  )}
                </Pressable>
                <View className="ml-4 flex-1">
                  <Text className="text-warmBrown font-medium">Organization Logo</Text>
                  <Pressable onPress={handlePickLogo}>
                    <Text className="text-gold-600 text-sm">Tap to upload</Text>
                  </Pressable>
                </View>
              </View>

              {/* Organization Name */}
              <View className="mb-4">
                <Text className="text-warmBrown font-semibold mb-2">Organization Name *</Text>
                <TextInput
                  placeholder="e.g., African Christian Fellowship"
                  placeholderTextColor="#9CA3AF"
                  value={organizationName}
                  onChangeText={setOrganizationName}
                  className="bg-white rounded-xl px-4 py-3.5 text-warmBrown"
                />
              </View>

              {/* Faith Type */}
              <View className="mb-4">
                <Text className="text-warmBrown font-semibold mb-2">Faith Type *</Text>
                <Pressable onPress={() => setShowFaithModal(true)} className="flex-row items-center bg-white rounded-xl px-4 py-3.5">
                  <Heart size={20} color="#C9A227" />
                  <Text className={`flex-1 ml-3 ${faithType ? 'text-warmBrown' : 'text-gray-400'}`}>
                    {faithType || 'Select faith type'}
                  </Text>
                </Pressable>
              </View>
            </Animated.View>

            {/* Flyer */}
            <Animated.View entering={FadeInUp.duration(400).delay(150)} className="mt-4">
              <Text className="text-lg font-bold text-warmBrown mb-4">Event Flyer (optional)</Text>
              <Pressable onPress={handlePickFlyer}>
                {eventFlyer ? (
                  <View className="rounded-2xl overflow-hidden bg-gray-100" style={{ minHeight: 280 }}>
                    <Image
                      source={{ uri: eventFlyer }}
                      style={{ width: '100%', height: 320, borderRadius: 16 }}
                      contentFit="contain"
                    />
                    <Pressable
                      onPress={() => setEventFlyer(null)}
                      className="absolute top-3 right-3 bg-black/50 rounded-full p-2"
                    >
                      <X size={18} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ) : (
                  <View className="bg-white rounded-2xl h-[220px] items-center justify-center border-2 border-dashed border-gray-200">
                    <Camera size={34} color="#9CA3AF" />
                    <Text className="text-gray-500 font-medium mt-2">Add flyer image</Text>
                    <Text className="text-gray-400 text-sm mt-1">Recommended: 4:5 ratio</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>

            {/* Reach */}
            <Animated.View entering={FadeInUp.duration(400).delay(175)} className="mt-4">
              <Text className="text-lg font-bold text-warmBrown mb-4">Event Reach</Text>
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-gray-500 text-sm mb-3">
                  Choose where this event should appear in Events.
                </Text>
                <View className="flex-row">
                  {[
                    { key: 'city', label: 'This city' },
                    { key: 'nearby', label: 'Nearby cities' },
                    { key: 'global', label: 'Global' },
                  ].map((opt) => {
                    const active = reach === (opt.key as EventReach);
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setReach(opt.key as EventReach);
                        }}
                        className={`flex-1 py-3 rounded-xl ${active ? 'bg-forest-600' : 'bg-gray-100'} ${opt.key === 'city' ? 'mr-2' : opt.key === 'nearby' ? 'mx-2' : 'ml-2'}`}
                      >
                        <Text className={`text-center font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Animated.View>

            {/* Event Details */}
            <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mt-4">
              <Text className="text-lg font-bold text-warmBrown mb-4">Event Details</Text>

              {/* Title */}
              <View className="mb-4">
                <Text className="text-warmBrown font-semibold mb-2">Event Title *</Text>
                <TextInput
                  placeholder="e.g., Sunday Worship Service"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                  className="bg-white rounded-xl px-4 py-3.5 text-warmBrown"
                />
              </View>

              {/* Date Picker */}
              <View className="mb-4">
                <Text className="text-warmBrown font-semibold mb-2">Date *</Text>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowDatePicker(true);
                  }}
                  className="flex-row items-center bg-white rounded-xl px-4 py-3.5"
                >
                  <Calendar size={20} color="#C9A227" />
                  <Text className="flex-1 ml-3 text-warmBrown">
                    {formatDisplayDate(date)}
                  </Text>
                </Pressable>
              </View>

              {/* Time Picker */}
              <View className="mb-4">
                <Text className="text-warmBrown font-semibold mb-2">Time *</Text>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowTimePicker(true);
                  }}
                  className="flex-row items-center bg-white rounded-xl px-4 py-3.5"
                >
                  <Clock size={20} color="#C9A227" />
                  <Text className="flex-1 ml-3 text-warmBrown">
                    {formatDisplayTime(time)}
                  </Text>
                </Pressable>
              </View>

              {/* Address */}
              <View className="mb-4">
                <Text className="text-warmBrown font-semibold mb-2">Address *</Text>
                <View className="flex-row items-center bg-white rounded-xl px-4">
                  <MapPin size={20} color="#C9A227" />
                  <TextInput
                    placeholder="Full address of the venue"
                    placeholderTextColor="#9CA3AF"
                    value={address}
                    onChangeText={setAddress}
                    className="flex-1 py-3.5 ml-3 text-warmBrown"
                  />
                </View>
              </View>

              {/* Recurring Toggle */}
              <View className="bg-gold-50 rounded-2xl p-4 flex-row items-center justify-between mb-4">
                <View className="flex-row items-center flex-1 mr-4">
                  <RefreshCw size={20} color="#C9A227" />
                  <View className="ml-3">
                    <Text className="text-warmBrown font-semibold">Recurring Event</Text>
                    <Text className="text-gray-500 text-sm">This event happens regularly</Text>
                  </View>
                </View>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ false: '#D1D5DB', true: '#C9A227' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {isRecurring && (
                <Animated.View entering={FadeInUp.duration(300)} className="mb-4">
                  <Text className="text-warmBrown font-semibold mb-2">Schedule</Text>
                  <Pressable onPress={() => setShowRecurringModal(true)} className="flex-row items-center bg-white rounded-xl px-4 py-3.5">
                    <RefreshCw size={20} color="#8B7355" />
                    <Text className={`flex-1 ml-3 ${recurringSchedule ? 'text-warmBrown' : 'text-gray-400'}`}>
                      {recurringSchedule || 'Select schedule'}
                    </Text>
                  </Pressable>
                </Animated.View>
              )}

              {/* Description */}
              <View className="mb-4">
                <Text className="text-warmBrown font-semibold mb-2">Description * (min 20 characters)</Text>
                <TextInput
                  placeholder="Describe the event, what to expect, and any special notes for attendees..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  value={description}
                  onChangeText={setDescription}
                  className="bg-white rounded-xl px-4 py-3.5 text-warmBrown min-h-[120px]"
                  style={{ textAlignVertical: 'top' }}
                />
                <Text className="text-gray-400 text-sm mt-1">{description.length}/20 minimum</Text>
              </View>
            </Animated.View>

            {/* Contact Info */}
            <Animated.View entering={FadeInUp.duration(400).delay(300)} className="mt-4">
              <Text className="text-lg font-bold text-warmBrown mb-4">Contact Information</Text>

              {/* Phone */}
              <View className="mb-4">
                <Text className="text-warmBrown font-semibold mb-2">Phone</Text>
                <View className="flex-row items-center bg-white rounded-xl px-4">
                  <Phone size={20} color="#8B7355" />
                  <TextInput
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor="#9CA3AF"
                    value={contactPhone}
                    onChangeText={setContactPhone}
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
                    placeholder="contact@organization.org"
                    placeholderTextColor="#9CA3AF"
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="flex-1 py-3.5 ml-3 text-warmBrown"
                  />
                </View>
              </View>
            </Animated.View>

            {/* Share to Feed */}
            <Animated.View entering={FadeInUp.duration(400).delay(350)} className="mt-4">
              <Text className="text-lg font-bold text-warmBrown mb-4">Visibility</Text>
              <View className="bg-white rounded-2xl p-4 flex-row items-center justify-between">
                <View className="flex-row items-center flex-1 mr-4">
                  <Users size={20} color="#1B4D3E" />
                  <View className="ml-3">
                    <Text className="text-warmBrown font-semibold">Share to Community Feed</Text>
                    <Text className="text-gray-500 text-sm">Post this event as an announcement everyone can see</Text>
                  </View>
                </View>
                <Switch
                  value={shareToCommunityFeed}
                  onValueChange={setShareToCommunityFeed}
                  trackColor={{ false: '#D1D5DB', true: '#1B4D3E' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </Animated.View>

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Submit Button */}
        <View className="px-5 py-4 border-t border-gray-100 bg-cream">
          <Pressable onPress={handleSubmit} disabled={!canSubmit || isSubmitting}>
            <LinearGradient
              colors={canSubmit && !isSubmitting ? ['#C9A227', '#A6841F'] : ['#D1D5DB', '#9CA3AF']}
              style={{ borderRadius: 16, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-lg">Post Event</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* Date Picker Modal */}
        <Modal visible={showDatePicker} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">Select Date</Text>
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  className="bg-gold-500 rounded-full px-4 py-2"
                >
                  <Text className="text-white font-semibold">Done</Text>
                </Pressable>
              </View>
              <View className="px-5 py-4 items-center">
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  textColor="#2D1F1A"
                  style={{ width: '100%', height: 200 }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Time Picker Modal */}
        <Modal visible={showTimePicker} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">Select Time</Text>
                <Pressable
                  onPress={() => setShowTimePicker(false)}
                  className="bg-gold-500 rounded-full px-4 py-2"
                >
                  <Text className="text-white font-semibold">Done</Text>
                </Pressable>
              </View>
              <View className="px-5 py-4 items-center">
                <DateTimePicker
                  value={time}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                  textColor="#2D1F1A"
                  style={{ width: '100%', height: 200 }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Faith Type Modal */}
        <Modal visible={showFaithModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl max-h-[60%]">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">Select Faith Type</Text>
                <Pressable onPress={() => setShowFaithModal(false)}>
                  <X size={24} color="#2D1F1A" />
                </Pressable>
              </View>
              <ScrollView className="px-5 py-2">
                {FAITH_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFaithType(type); setShowFaithModal(false); }}
                    className="flex-row items-center py-4 border-b border-gray-100"
                  >
                    <Text className="flex-1 text-warmBrown">{type}</Text>
                    {faithType === type && <Check size={20} color="#C9A227" />}
                  </Pressable>
                ))}
                <View className="h-8" />
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Recurring Schedule Modal */}
        <Modal visible={showRecurringModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl max-h-[60%]">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">Select Schedule</Text>
                <Pressable onPress={() => setShowRecurringModal(false)}>
                  <X size={24} color="#2D1F1A" />
                </Pressable>
              </View>
              <ScrollView className="px-5 py-2">
                {RECURRING_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRecurringSchedule(option); setShowRecurringModal(false); }}
                    className="flex-row items-center py-4 border-b border-gray-100"
                  >
                    <Text className="flex-1 text-warmBrown">{option}</Text>
                    {recurringSchedule === option && <Check size={20} color="#C9A227" />}
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
