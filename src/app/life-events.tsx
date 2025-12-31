import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft,
  Plus,
  X,
  Heart,
  GraduationCap,
  Cake,
  Baby,
  Trophy,
  Plane,
  Calendar,
  Star,
  ImagePlus,
  Video as VideoIcon,
  MapPin,
  Play,
  Trash2,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useStore, LIFE_EVENT_CATEGORIES, LifeEvent } from '@/lib/store';

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  wedding: Heart,
  graduation: GraduationCap,
  birthday: Cake,
  newborn: Baby,
  achievement: Trophy,
  travel: Plane,
  anniversary: Calendar,
  other: Star,
};

const CATEGORY_COLORS: Record<string, [string, string]> = {
  wedding: ['#E91E63', '#C2185B'],
  graduation: ['#9C27B0', '#7B1FA2'],
  birthday: ['#FF9800', '#F57C00'],
  newborn: ['#4CAF50', '#388E3C'],
  achievement: ['#FFC107', '#FFA000'],
  travel: ['#2196F3', '#1976D2'],
  anniversary: ['#D4673A', '#B85430'],
  other: ['#607D8B', '#455A64'],
};

export default function LifeEventsScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LifeEvent | null>(null);
  const currentUser = useStore((s) => s.currentUser);
  const lifeEvents = useStore((s) => s.lifeEvents);

  const userEvents = lifeEvents.filter((e) => e.userId === currentUser?.id);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100"
        >
          <Pressable onPress={handleBack} className="p-2 -ml-2">
            <ArrowLeft size={24} color="#2D1F1A" />
          </Pressable>
          <Text className="text-lg font-bold text-warmBrown">Life Events</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowAddModal(true);
            }}
            className="bg-terracotta-500 rounded-full p-2"
          >
            <Plus size={20} color="#FFFFFF" />
          </Pressable>
        </Animated.View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Intro Section */}
          <Animated.View entering={FadeInUp.duration(400).delay(100)} className="px-5 py-4">
            <LinearGradient
              colors={['#D4673A', '#B85430']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 20 }}
            >
              <Text className="text-white text-lg font-bold">Share Your Milestones</Text>
              <Text className="text-white/80 mt-2">
                Document your life's special moments - weddings, graduations, new babies, and more. These stay on your profile forever.
              </Text>
            </LinearGradient>
          </Animated.View>

          {/* Events Grid */}
          {userEvents.length > 0 ? (
            <View className="px-5 pb-6">
              <Text className="text-warmBrown font-semibold text-lg mb-4">Your Moments</Text>
              {userEvents.map((event, index) => (
                <Animated.View key={event.id} entering={FadeInUp.duration(400).delay(200 + index * 50)}>
                  <LifeEventCard event={event} onPress={() => setSelectedEvent(event)} />
                </Animated.View>
              ))}
            </View>
          ) : (
            <Animated.View entering={FadeInUp.duration(400).delay(200)} className="px-5 py-12 items-center">
              <View className="bg-gray-100 rounded-full p-6 mb-4">
                <Star size={40} color="#9CA3AF" />
              </View>
              <Text className="text-warmBrown font-semibold text-lg text-center">No life events yet</Text>
              <Text className="text-gray-500 text-center mt-2 px-8">
                Start documenting your special moments by tapping the + button above
              </Text>
            </Animated.View>
          )}
        </ScrollView>

        {/* Add Event Modal */}
        <AddLifeEventModal visible={showAddModal} onClose={() => setShowAddModal(false)} />

        {/* View Event Modal */}
        {selectedEvent && (
          <ViewLifeEventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}
      </SafeAreaView>
    </View>
  );
}

function LifeEventCard({ event, onPress }: { event: LifeEvent; onPress: () => void }) {
  const IconComponent = CATEGORY_ICONS[event.category] || Star;
  const colors = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other;
  const hasMedia = event.images.length > 0 || event.video;

  return (
    <Pressable onPress={onPress} className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm">
      {hasMedia && (
        <View className="h-48 bg-gray-100">
          {event.video ? (
            <View className="flex-1 bg-black items-center justify-center">
              <Video
                source={{ uri: event.video }}
                style={{ width: '100%', height: '100%' }}
                resizeMode={ResizeMode.COVER}
              />
              <View className="absolute inset-0 items-center justify-center">
                <View className="bg-black/50 rounded-full p-3">
                  <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              </View>
            </View>
          ) : event.images.length > 0 ? (
            <Image
              source={{ uri: event.images[0] }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : null}
        </View>
      )}
      <View className="p-4">
        <View className="flex-row items-center mb-2">
          <LinearGradient
            colors={colors}
            style={{ borderRadius: 20, padding: 8 }}
          >
            <IconComponent size={16} color="#FFFFFF" />
          </LinearGradient>
          <Text className="text-gray-500 text-sm ml-2 capitalize">{event.category}</Text>
          <View className="flex-1" />
          <Text className="text-gray-400 text-xs">
            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>
        <Text className="text-warmBrown font-bold text-lg">{event.title}</Text>
        {event.description && (
          <Text className="text-gray-600 mt-1" numberOfLines={2}>{event.description}</Text>
        )}
        {event.location && (
          <View className="flex-row items-center mt-2">
            <MapPin size={14} color="#8B7355" />
            <Text className="text-gray-500 text-sm ml-1">{event.location}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function AddLifeEventModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<LifeEvent['category']>('other');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [video, setVideo] = useState<string | null>(null);
  const [step, setStep] = useState<'category' | 'details'>('category');

  const currentUser = useStore((s) => s.currentUser);
  const addLifeEvent = useStore((s) => s.addLifeEvent);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('other');
    setDate('');
    setLocation('');
    setImages([]);
    setVideo(null);
    setStep('category');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handlePickImages = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 6,
    });

    if (!result.canceled && result.assets.length > 0) {
      const newImages = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...newImages].slice(0, 6));
      setVideo(null);
    }
  };

  const handlePickVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setVideo(result.assets[0].uri);
      setImages([]);
    }
  };

  const handleSubmit = () => {
    if (!title.trim() || !currentUser) return;

    const newEvent: LifeEvent = {
      id: `life_event_${Date.now()}`,
      userId: currentUser.id,
      title: title.trim(),
      description: description.trim(),
      category,
      date: date || new Date().toISOString(),
      images,
      video: video ?? undefined,
      location: location.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    addLifeEvent(newEvent);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleClose();
  };

  const canSubmit = title.trim().length > 0;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className="bg-cream rounded-t-3xl max-h-[90%]">
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <Pressable
                onPress={step === 'details' ? () => setStep('category') : handleClose}
                className="p-2 -ml-2"
              >
                {step === 'details' ? (
                  <ArrowLeft size={24} color="#2D1F1A" />
                ) : (
                  <X size={24} color="#2D1F1A" />
                )}
              </Pressable>
              <Text className="text-lg font-bold text-warmBrown">
                {step === 'category' ? 'Choose Category' : 'Add Details'}
              </Text>
              {step === 'details' ? (
                <Pressable onPress={handleSubmit} disabled={!canSubmit}>
                  <LinearGradient
                    colors={canSubmit ? ['#D4673A', '#B85430'] : ['#D1D5DB', '#9CA3AF']}
                    style={{ borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 }}
                  >
                    <Text className="text-white font-semibold">Save</Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                <View style={{ width: 60 }} />
              )}
            </View>

            <ScrollView className="px-5 py-4" keyboardShouldPersistTaps="handled">
              {step === 'category' ? (
                /* Category Selection */
                <View className="flex-row flex-wrap">
                  {LIFE_EVENT_CATEGORIES.map((cat) => {
                    const IconComponent = CATEGORY_ICONS[cat.id] || Star;
                    const colors = CATEGORY_COLORS[cat.id] || CATEGORY_COLORS.other;
                    const isSelected = category === cat.id;

                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setCategory(cat.id as LifeEvent['category']);
                          setStep('details');
                        }}
                        className="w-1/2 p-2"
                      >
                        <LinearGradient
                          colors={isSelected ? colors : ['#FFFFFF', '#FFFFFF']}
                          style={{
                            borderRadius: 16,
                            padding: 20,
                            borderWidth: isSelected ? 0 : 1,
                            borderColor: '#E5E7EB',
                          }}
                        >
                          <View className={`rounded-full p-3 self-start ${isSelected ? 'bg-white/20' : 'bg-gray-100'}`}>
                            <IconComponent size={24} color={isSelected ? '#FFFFFF' : colors[0]} />
                          </View>
                          <Text className={`font-semibold mt-3 ${isSelected ? 'text-white' : 'text-warmBrown'}`}>
                            {cat.label}
                          </Text>
                        </LinearGradient>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                /* Details Form */
                <View>
                  {/* Media */}
                  <Text className="text-warmBrown font-semibold mb-3">Photos or Video</Text>
                  <View className="flex-row mb-4">
                    <Pressable
                      onPress={handlePickImages}
                      disabled={!!video}
                      className={`flex-1 mr-2 rounded-xl p-4 items-center ${video ? 'bg-gray-100' : 'bg-terracotta-50'}`}
                    >
                      <ImagePlus size={24} color={video ? '#9CA3AF' : '#D4673A'} />
                      <Text className={`mt-2 font-medium ${video ? 'text-gray-400' : 'text-terracotta-500'}`}>
                        Photos
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={handlePickVideo}
                      disabled={images.length > 0}
                      className={`flex-1 ml-2 rounded-xl p-4 items-center ${images.length > 0 ? 'bg-gray-100' : 'bg-forest-50'}`}
                    >
                      <VideoIcon size={24} color={images.length > 0 ? '#9CA3AF' : '#1B4D3E'} />
                      <Text className={`mt-2 font-medium ${images.length > 0 ? 'text-gray-400' : 'text-forest-700'}`}>
                        Video
                      </Text>
                    </Pressable>
                  </View>

                  {/* Preview */}
                  {images.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4" style={{ flexGrow: 0 }}>
                      {images.map((uri, index) => (
                        <View key={index} className="mr-2 relative">
                          <Image source={{ uri }} style={{ width: 80, height: 80, borderRadius: 12 }} contentFit="cover" />
                          <Pressable
                            onPress={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                            className="absolute -top-2 -right-2 bg-warmBrown rounded-full p-1"
                          >
                            <X size={12} color="#FFFFFF" />
                          </Pressable>
                        </View>
                      ))}
                    </ScrollView>
                  )}

                  {video && (
                    <View className="mb-4 relative">
                      <View className="bg-gray-900 rounded-xl h-32 items-center justify-center">
                        <VideoIcon size={32} color="#FFFFFF" />
                        <Text className="text-white/80 mt-2 text-sm">Video selected</Text>
                      </View>
                      <Pressable
                        onPress={() => setVideo(null)}
                        className="absolute top-2 right-2 bg-warmBrown rounded-full p-1.5"
                      >
                        <X size={14} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  )}

                  {/* Title */}
                  <Text className="text-warmBrown font-semibold mb-2">Title *</Text>
                  <TextInput
                    placeholder="e.g., My Wedding Day"
                    placeholderTextColor="#9CA3AF"
                    value={title}
                    onChangeText={setTitle}
                    className="bg-white rounded-xl px-4 py-3.5 text-warmBrown mb-4"
                  />

                  {/* Description */}
                  <Text className="text-warmBrown font-semibold mb-2">Description</Text>
                  <TextInput
                    placeholder="Tell the story behind this moment..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    value={description}
                    onChangeText={setDescription}
                    className="bg-white rounded-xl px-4 py-3.5 text-warmBrown mb-4 min-h-[100px]"
                    style={{ textAlignVertical: 'top' }}
                  />

                  {/* Date */}
                  <Text className="text-warmBrown font-semibold mb-2">Date</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-4 mb-4">
                    <Calendar size={20} color="#8B7355" />
                    <TextInput
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9CA3AF"
                      value={date}
                      onChangeText={setDate}
                      className="flex-1 py-3.5 ml-2 text-warmBrown"
                    />
                  </View>

                  {/* Location */}
                  <Text className="text-warmBrown font-semibold mb-2">Location</Text>
                  <View className="flex-row items-center bg-white rounded-xl px-4 mb-6">
                    <MapPin size={20} color="#8B7355" />
                    <TextInput
                      placeholder="Where did this happen?"
                      placeholderTextColor="#9CA3AF"
                      value={location}
                      onChangeText={setLocation}
                      className="flex-1 py-3.5 ml-2 text-warmBrown"
                    />
                  </View>

                  <View className="h-8" />
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function ViewLifeEventModal({ event, onClose }: { event: LifeEvent; onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const videoRef = useRef<Video>(null);
  const deleteLifeEvent = useStore((s) => s.deleteLifeEvent);

  const IconComponent = CATEGORY_ICONS[event.category] || Star;
  const colors = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other;

  const handleDelete = () => {
    deleteLifeEvent(event.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible animationType="slide" transparent>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-cream rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
            <Pressable onPress={onClose} className="p-2 -ml-2">
              <X size={24} color="#2D1F1A" />
            </Pressable>
            <Text className="text-lg font-bold text-warmBrown">Life Event</Text>
            <Pressable
              onPress={() => setShowDeleteConfirm(true)}
              className="p-2 -mr-2"
            >
              <Trash2 size={20} color="#EF4444" />
            </Pressable>
          </View>

          <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
            {/* Media */}
            {event.video ? (
              <Pressable
                onPress={async () => {
                  if (videoRef.current) {
                    if (isPlaying) {
                      await videoRef.current.pauseAsync();
                    } else {
                      await videoRef.current.playAsync();
                    }
                    setIsPlaying(!isPlaying);
                  }
                }}
                className="mb-4 relative"
              >
                <Video
                  ref={videoRef}
                  source={{ uri: event.video }}
                  style={{ width: '100%', height: 250, borderRadius: 16, backgroundColor: '#000' }}
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping
                  onPlaybackStatusUpdate={(status) => {
                    if (status.isLoaded) {
                      setIsPlaying(status.isPlaying);
                    }
                  }}
                />
                {!isPlaying && (
                  <View className="absolute inset-0 items-center justify-center">
                    <View className="bg-black/50 rounded-full p-4">
                      <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
                    </View>
                  </View>
                )}
              </Pressable>
            ) : event.images.length > 0 ? (
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} className="mb-4" style={{ flexGrow: 0 }}>
                {event.images.map((uri, index) => (
                  <Image
                    key={index}
                    source={{ uri }}
                    style={{ width: 320, height: 250, borderRadius: 16, marginRight: 12 }}
                    contentFit="cover"
                  />
                ))}
              </ScrollView>
            ) : null}

            {/* Category Badge */}
            <View className="flex-row items-center mb-4">
              <LinearGradient colors={colors} style={{ borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' }}>
                <IconComponent size={16} color="#FFFFFF" />
                <Text className="text-white font-medium ml-2 capitalize">{event.category}</Text>
              </LinearGradient>
              <View className="flex-1" />
              <Text className="text-gray-500">
                {new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </Text>
            </View>

            {/* Title */}
            <Text className="text-warmBrown font-bold text-2xl mb-2">{event.title}</Text>

            {/* Description */}
            {event.description && (
              <Text className="text-gray-600 text-base leading-6 mb-4">{event.description}</Text>
            )}

            {/* Location */}
            {event.location && (
              <View className="flex-row items-center mb-4">
                <MapPin size={18} color="#8B7355" />
                <Text className="text-gray-500 ml-2">{event.location}</Text>
              </View>
            )}

            <View className="h-8" />
          </ScrollView>

          {/* Delete Confirmation Modal */}
          <Modal visible={showDeleteConfirm} transparent animationType="fade">
            <View className="flex-1 bg-black/50 items-center justify-center px-8">
              <View className="bg-white rounded-2xl p-6 w-full">
                <Text className="text-warmBrown font-bold text-lg text-center mb-2">Delete Life Event?</Text>
                <Text className="text-gray-500 text-center mb-6">
                  This will permanently remove this memory from your profile.
                </Text>
                <View className="flex-row">
                  <Pressable
                    onPress={() => setShowDeleteConfirm(false)}
                    className="flex-1 bg-gray-100 rounded-xl py-3 mr-2"
                  >
                    <Text className="text-warmBrown font-semibold text-center">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleDelete}
                    className="flex-1 bg-red-500 rounded-xl py-3 ml-2"
                  >
                    <Text className="text-white font-semibold text-center">Delete</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
}
