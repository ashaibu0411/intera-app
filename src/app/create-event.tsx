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
  Calendar,
  Clock,
  Users,
  Globe,
  Sparkles,
  Heart,
  Utensils,
  Music,
  Briefcase,
  GraduationCap,
  ImagePlus,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useStore } from '@/lib/store';
import { type EventReach } from '@/lib/eventMetadata';
import { uploadImages } from '@/lib/posts';
import { createEvent } from '@/lib/marketplace-api';
import { notifyCommunityAboutNewEvent } from '@/lib/communityNotifications';
import { sendRemotePushAlert } from '@/lib/pushAlerts';

const EVENT_CATEGORIES = [
  { key: 'Social Gathering', label: 'Social Gathering', icon: Users },
  { key: 'Cultural Celebration', label: 'Cultural Celebration', icon: Heart },
  { key: 'Food & Dining', label: 'Food & Dining', icon: Utensils },
  { key: 'Music & Entertainment', label: 'Music & Entertainment', icon: Music },
  { key: 'Networking', label: 'Networking', icon: Briefcase },
  { key: 'Education & Workshop', label: 'Education & Workshop', icon: GraduationCap },
];

export default function CreateEventScreen() {
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [reach, setReach] = useState<EventReach>('city');
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return d;
  });
  const [address, setAddress] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handlePickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (!result.canceled && result.assets.length > 0) {
      setEventImage(result.assets[0].uri);
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

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(false);
    }
    if (selectedTime) {
      setStartTime(selectedTime);
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(false);
    }
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  const canSubmit =
    title.trim().length > 0 &&
    category.length > 0 &&
    description.trim().length >= 20 &&
    address.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let flyerUrl: string | undefined;
      if (eventImage) {
        const uploaded = await uploadImages([eventImage], currentUser.id);
        flyerUrl = uploaded[0];
        if (!flyerUrl) {
          throw new Error('Flyer upload failed. Please try again.');
        }
      }

      const created = await createEvent(currentUser.id, {
        title: title.trim(),
        description: description.trim(),
        date: date.toISOString(),
        time: formatDisplayTime(startTime),
        endTime: formatDisplayTime(endTime),
        location: userLocation,
        address: address.trim(),
        image: flyerUrl,
        category,
        isPublic,
        scope: reach,
      });

      // Notify neighbors about the new event (remote push + realtime broadcast/in-app)
      try {
        const communityIdForDb =
          typeof currentCommunity?.id === 'string' && currentCommunity.id !== 'custom' ? currentCommunity.id : null;
        const city = selectedLocation?.city || currentCommunity?.city || null;
        const country = selectedLocation?.country || currentCommunity?.country || null;
        const neighborhood = selectedLocation?.neighborhood?.trim() || null;

        const eventId = (created as any)?.id ? String((created as any).id) : 'event';
        await notifyCommunityAboutNewEvent(
          eventId,
          currentUser.id,
          title.trim(),
          userLocation,
          communityIdForDb,
          city,
          country
        );

        const scopeForPush =
          reach === 'global' ? 'global' : neighborhood ? 'neighborhood' : 'city';
        sendRemotePushAlert({
          title: 'New event near you',
          body: `${currentUser.name ?? 'Someone'} created "${title.trim()}"`,
          scope: scopeForPush as any,
          city,
          neighborhood,
          excludeUserId: currentUser.id,
          data: { type: 'event', eventId },
        }).catch(() => {});
      } catch (e) {
        // best-effort
        console.log('[CreateEvent] notify failed:', String((e as any)?.message ?? e));
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.error('Error creating event:', error);
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

  const CategoryIcon = category ? EVENT_CATEGORIES.find((c) => c.key === category)?.icon || Sparkles : Sparkles;

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              className="bg-white rounded-full p-2 shadow-sm"
            >
              <ChevronLeft size={24} color="#2D1F1A" />
            </Pressable>
            <Text className="text-lg font-bold text-warmBrown">Create Event</Text>
            <View className="w-10" />
          </View>
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
            {/* Event Image */}
            <Animated.View entering={FadeInUp.duration(400).delay(100)} className="mt-4">
              <Text className="text-lg font-bold text-warmBrown mb-4">Event Flyer / Cover</Text>
              <Pressable onPress={handlePickImage}>
                {eventImage ? (
                  <View className="rounded-2xl overflow-hidden">
                    <Image
                      source={{ uri: eventImage }}
                      style={{ width: '100%', height: 180, borderRadius: 16 }}
                      contentFit="cover"
                    />
                    <View className="absolute bottom-3 right-3 bg-black/50 rounded-full p-2">
                      <Camera size={20} color="#FFFFFF" />
                    </View>
                  </View>
                ) : (
                  <View className="bg-terracotta-50 rounded-2xl h-[180px] items-center justify-center border-2 border-dashed border-terracotta-200">
                    <ImagePlus size={40} color="#D4673A" />
                    <Text className="text-terracotta-500 font-medium mt-2">Add flyer image</Text>
                    <Text className="text-gray-400 text-sm mt-1">Recommended: 16:9 ratio</Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>

            {/* Reach */}
            <Animated.View entering={FadeInUp.duration(400).delay(150)} className="mt-6">
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
                        className={`flex-1 py-3 rounded-xl ${active ? 'bg-terracotta-500' : 'bg-gray-100'} ${opt.key === 'city' ? 'mr-2' : opt.key === 'nearby' ? 'mx-2' : 'ml-2'}`}
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
            <Animated.View entering={FadeInUp.duration(400).delay(200)} className="mt-6">
              <Text className="text-lg font-bold text-warmBrown mb-4">Event Details</Text>

              {/* Title */}
              <View className="mb-4">
                <Text className="text-warmBrown font-semibold mb-2">Event Title *</Text>
                <TextInput
                  placeholder="e.g., African Heritage Night"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                  className="bg-white rounded-xl px-4 py-3.5 text-warmBrown"
                />
              </View>

              {/* Category */}
              <View className="mb-4">
                <Text className="text-warmBrown font-semibold mb-2">Category *</Text>
                <Pressable
                  onPress={() => setShowCategoryModal(true)}
                  className="flex-row items-center bg-white rounded-xl px-4 py-3.5"
                >
                  <CategoryIcon size={20} color="#D4673A" />
                  <Text className={`flex-1 ml-3 ${category ? 'text-warmBrown' : 'text-gray-400'}`}>
                    {category || 'Select category'}
                  </Text>
                </Pressable>
              </View>

              {/* Date */}
              <View className="mb-4">
                <Text className="text-warmBrown font-semibold mb-2">Date *</Text>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowDatePicker(true);
                  }}
                  className="flex-row items-center bg-white rounded-xl px-4 py-3.5"
                >
                  <Calendar size={20} color="#D4673A" />
                  <Text className="flex-1 ml-3 text-warmBrown">{formatDisplayDate(date)}</Text>
                </Pressable>
              </View>

              {/* Time Row */}
              <View className="flex-row mb-4" style={{ gap: 12 }}>
                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold mb-2">Start Time *</Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowStartTimePicker(true);
                    }}
                    className="flex-row items-center bg-white rounded-xl px-4 py-3.5"
                  >
                    <Clock size={18} color="#D4673A" />
                    <Text className="flex-1 ml-2 text-warmBrown text-sm">{formatDisplayTime(startTime)}</Text>
                  </Pressable>
                </View>

                <View className="flex-1">
                  <Text className="text-warmBrown font-semibold mb-2">End Time</Text>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowEndTimePicker(true);
                    }}
                    className="flex-row items-center bg-white rounded-xl px-4 py-3.5"
                  >
                    <Clock size={18} color="#8B7355" />
                    <Text className="flex-1 ml-2 text-warmBrown text-sm">{formatDisplayTime(endTime)}</Text>
                  </Pressable>
                </View>
              </View>

              {/* Location */}
              <View className="mb-4">
                <Text className="text-warmBrown font-semibold mb-2">Location</Text>
                <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3.5">
                  <MapPin size={20} color="#D4673A" />
                  <Text className="flex-1 ml-3 text-warmBrown">{userLocation}</Text>
                </View>
              </View>

              {/* Address */}
              <View className="mb-4">
                <Text className="text-warmBrown font-semibold mb-2">Venue Address *</Text>
                <View className="flex-row items-center bg-white rounded-xl px-4">
                  <MapPin size={20} color="#8B7355" />
                  <TextInput
                    placeholder="Full address of the venue"
                    placeholderTextColor="#9CA3AF"
                    value={address}
                    onChangeText={setAddress}
                    className="flex-1 py-3.5 ml-3 text-warmBrown"
                  />
                </View>
              </View>

              {/* Public/Private Toggle */}
              <View className="bg-terracotta-50 rounded-2xl p-4 flex-row items-center justify-between mb-4">
                <View className="flex-row items-center flex-1 mr-4">
                  <Globe size={20} color="#D4673A" />
                  <View className="ml-3">
                    <Text className="text-warmBrown font-semibold">Public Event</Text>
                    <Text className="text-gray-500 text-sm">
                      {isPublic ? 'Anyone can see and join' : 'Invite only'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isPublic}
                  onValueChange={setIsPublic}
                  trackColor={{ false: '#D1D5DB', true: '#D4673A' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Description */}
              <View className="mb-4">
                <Text className="text-warmBrown font-semibold mb-2">Description * (min 20 characters)</Text>
                <TextInput
                  placeholder="Describe your event, what to expect, and any special details..."
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

            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Submit Button */}
        <View className="px-5 py-4 border-t border-gray-100 bg-cream">
          <Pressable onPress={handleSubmit} disabled={!canSubmit || isSubmitting}>
            <LinearGradient
              colors={canSubmit && !isSubmitting ? ['#D4673A', '#B85530'] : ['#D1D5DB', '#9CA3AF']}
              style={{
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-lg">Create Event</Text>
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
                <Pressable onPress={() => setShowDatePicker(false)} className="bg-terracotta-500 rounded-full px-4 py-2">
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

        {/* Start Time Picker Modal */}
        <Modal visible={showStartTimePicker} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">Start Time</Text>
                <Pressable
                  onPress={() => setShowStartTimePicker(false)}
                  className="bg-terracotta-500 rounded-full px-4 py-2"
                >
                  <Text className="text-white font-semibold">Done</Text>
                </Pressable>
              </View>
              <View className="px-5 py-4 items-center">
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display="spinner"
                  onChange={handleStartTimeChange}
                  textColor="#2D1F1A"
                  style={{ width: '100%', height: 200 }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* End Time Picker Modal */}
        <Modal visible={showEndTimePicker} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">End Time</Text>
                <Pressable
                  onPress={() => setShowEndTimePicker(false)}
                  className="bg-terracotta-500 rounded-full px-4 py-2"
                >
                  <Text className="text-white font-semibold">Done</Text>
                </Pressable>
              </View>
              <View className="px-5 py-4 items-center">
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  display="spinner"
                  onChange={handleEndTimeChange}
                  textColor="#2D1F1A"
                  style={{ width: '100%', height: 200 }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Category Modal */}
        <Modal visible={showCategoryModal} animationType="slide" transparent>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-cream rounded-t-3xl max-h-[60%]">
              <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                <Text className="text-lg font-bold text-warmBrown">Select Category</Text>
                <Pressable onPress={() => setShowCategoryModal(false)}>
                  <X size={24} color="#2D1F1A" />
                </Pressable>
              </View>
              <ScrollView className="px-5 py-2">
                {EVENT_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setCategory(cat.key);
                        setShowCategoryModal(false);
                      }}
                      className="flex-row items-center py-4 border-b border-gray-100"
                    >
                      <Icon size={22} color="#D4673A" />
                      <Text className="flex-1 ml-3 text-warmBrown">{cat.label}</Text>
                      {category === cat.key && <Check size={20} color="#D4673A" />}
                    </Pressable>
                  );
                })}
                <View className="h-8" />
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
