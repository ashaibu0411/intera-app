import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Heart,
  Search,
  Plus,
  MapPin,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  ChevronRight,
  ChevronLeft,
  X,
  RefreshCw,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, FadeInRight } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  useStore,
  MOCK_FAITH_EVENTS,
  FAITH_TYPES,
  type FaithEvent,
} from '@/lib/store';

export default function FaithCommunityScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFaithType, setSelectedFaithType] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FaithEvent | null>(null);

  const isGuest = useStore((s) => s.isGuest);
  const currentUser = useStore((s) => s.currentUser);

  const filteredEvents = MOCK_FAITH_EVENTS.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFaith = !selectedFaithType || event.faithType === selectedFaithType;
    return matchesSearch && matchesFaith;
  });

  const handleFaithTypeSelect = (faithType: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedFaithType(faithType === selectedFaithType ? null : faithType);
  };

  const handleEventPress = (event: FaithEvent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEvent(event);
  };

  const handleRSVP = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isGuest || !currentUser) {
      router.push('/signup');
    } else {
      // In a real app, this would handle RSVP
      setSelectedEvent(null);
    }
  };

  const handleCall = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`mailto:${email}`);
  };

  const handleCreateEvent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isGuest || !currentUser) {
      router.push('/signup');
    } else {
      // In a real app, navigate to create event screen
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View className="flex-1 bg-cream">
      <SafeAreaView edges={['top']} className="flex-1">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                className="bg-white rounded-full p-2 mr-3 shadow-sm"
              >
                <ChevronLeft size={24} color="#2D1F1A" />
              </Pressable>
              <View className="bg-gold-100 rounded-full p-2 mr-3">
                <Heart size={24} color="#C9A227" />
              </View>
              <View>
                <Text className="text-2xl font-bold text-warmBrown">Faith & Community</Text>
                <Text className="text-sm text-gray-500">Services, Events & Gatherings</Text>
              </View>
            </View>

            <Pressable
              onPress={handleCreateEvent}
              className="bg-gold-500 rounded-full p-2.5"
            >
              <Plus size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          {/* Search */}
          <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm">
            <Search size={20} color="#8B7355" />
            <TextInput
              placeholder="Search services, events, organizations..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-3 text-warmBrown text-base"
            />
          </View>

          {/* Faith Type Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            style={{ flexGrow: 0 }}
          >
            <Pressable
              onPress={() => handleFaithTypeSelect(null)}
              className={`px-4 py-2 rounded-full mr-2 ${
                !selectedFaithType ? 'bg-gold-500' : 'bg-white'
              }`}
            >
              <Text
                className={`font-medium ${
                  !selectedFaithType ? 'text-white' : 'text-gray-600'
                }`}
              >
                All
              </Text>
            </Pressable>
            {FAITH_TYPES.map((faithType) => (
              <Pressable
                key={faithType}
                onPress={() => handleFaithTypeSelect(faithType)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedFaithType === faithType ? 'bg-gold-500' : 'bg-white'
                }`}
              >
                <Text
                  className={`font-medium ${
                    selectedFaithType === faithType ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {faithType}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Events List */}
        <ScrollView
          className="flex-1 px-5 pt-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Info Banner */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(100)}
            className="mb-4"
          >
            <LinearGradient
              colors={['#C9A227', '#A6841F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">
                    Share Your Faith Events
                  </Text>
                  <Text className="text-white/80 text-sm mt-1">
                    Post services, gatherings, and community events for all to see.
                  </Text>
                </View>
                <Pressable
                  onPress={handleCreateEvent}
                  className="bg-white/20 rounded-full px-4 py-2"
                >
                  <Text className="text-white font-medium">Post Event</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Upcoming Events Header */}
          <Animated.View
            entering={FadeInUp.duration(400).delay(150)}
            className="flex-row items-center justify-between mb-3"
          >
            <Text className="text-lg font-semibold text-warmBrown">
              Upcoming Events & Services
            </Text>
          </Animated.View>

          {/* Events */}
          {filteredEvents.map((event, index) => (
            <Animated.View
              key={event.id}
              entering={FadeInUp.duration(300).delay(200 + index * 50)}
            >
              <Pressable
                onPress={() => handleEventPress(event)}
                className="bg-white rounded-2xl mb-4 overflow-hidden shadow-sm"
              >
                <View className="p-4">
                  {/* Organization Header */}
                  <View className="flex-row items-center mb-3">
                    <Image
                      source={{ uri: event.organizationLogo }}
                      style={{ width: 50, height: 50, borderRadius: 25 }}
                      contentFit="cover"
                    />
                    <View className="flex-1 ml-3">
                      <Text className="text-warmBrown font-semibold">
                        {event.organizationName}
                      </Text>
                      <View className="flex-row items-center mt-0.5">
                        <View className="bg-gold-50 rounded-full px-2 py-0.5">
                          <Text className="text-gold-700 text-xs font-medium">
                            {event.faithType}
                          </Text>
                        </View>
                        {event.isRecurring && (
                          <View className="flex-row items-center ml-2">
                            <RefreshCw size={10} color="#9CA3AF" />
                            <Text className="text-gray-400 text-xs ml-1">
                              {event.recurringSchedule}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </View>

                  {/* Event Title */}
                  <Text className="text-lg font-bold text-warmBrown mb-2">
                    {event.title}
                  </Text>

                  {/* Event Details */}
                  <View className="flex-row items-center mb-2">
                    <Calendar size={14} color="#C9A227" />
                    <Text className="text-gray-600 text-sm ml-2">
                      {formatDate(event.date)}
                    </Text>
                  </View>

                  <View className="flex-row items-center mb-2">
                    <Clock size={14} color="#C9A227" />
                    <Text className="text-gray-600 text-sm ml-2">{event.time}</Text>
                  </View>

                  <View className="flex-row items-center mb-3">
                    <MapPin size={14} color="#C9A227" />
                    <Text className="text-gray-600 text-sm ml-2" numberOfLines={1}>
                      {event.address}
                    </Text>
                  </View>

                  {/* Footer */}
                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
                    <View className="flex-row items-center">
                      <Users size={14} color="#8B7355" />
                      <Text className="text-gray-500 text-sm ml-2">
                        {event.attendees} attending
                      </Text>
                    </View>
                    <View className="bg-gold-50 rounded-full px-4 py-1.5">
                      <Text className="text-gold-700 font-medium text-sm">RSVP</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))}

          <View className="h-8" />
        </ScrollView>

        {/* Event Detail Modal */}
        <Modal
          visible={!!selectedEvent}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedEvent(null)}
        >
          {selectedEvent && (
            <View className="flex-1 bg-cream">
              <SafeAreaView edges={['top']} className="flex-1">
                {/* Modal Header */}
                <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                  <Pressable
                    onPress={() => setSelectedEvent(null)}
                    className="bg-gray-100 rounded-full p-2"
                  >
                    <X size={24} color="#2D1F1A" />
                  </Pressable>
                  <View className="bg-gold-50 rounded-full px-3 py-1">
                    <Text className="text-gold-700 font-medium">
                      {selectedEvent.faithType}
                    </Text>
                  </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Organization Info */}
                  <View className="p-5">
                    <View className="flex-row items-center mb-4">
                      <Image
                        source={{ uri: selectedEvent.organizationLogo }}
                        style={{ width: 60, height: 60, borderRadius: 30 }}
                        contentFit="cover"
                      />
                      <View className="flex-1 ml-4">
                        <Text className="text-xl font-bold text-warmBrown">
                          {selectedEvent.organizationName}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <MapPin size={14} color="#8B7355" />
                          <Text className="text-gray-500 ml-1">
                            {selectedEvent.location}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Event Title */}
                    <Text className="text-2xl font-bold text-warmBrown mb-4">
                      {selectedEvent.title}
                    </Text>

                    {/* Date & Time Card */}
                    <LinearGradient
                      colors={['#C9A227', '#A6841F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ borderRadius: 16, padding: 16, marginBottom: 16 }}
                    >
                      <View className="flex-row items-center">
                        <Calendar size={24} color="#FFFFFF" />
                        <View className="ml-4">
                          <Text className="text-white font-bold text-lg">
                            {formatDate(selectedEvent.date)}
                          </Text>
                          <Text className="text-white/80">{selectedEvent.time}</Text>
                        </View>
                      </View>
                      {selectedEvent.isRecurring && (
                        <View className="flex-row items-center mt-3 pt-3 border-t border-white/20">
                          <RefreshCw size={16} color="#FFFFFF" />
                          <Text className="text-white ml-2">
                            {selectedEvent.recurringSchedule}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>

                    {/* Description */}
                    <View className="mb-6">
                      <Text className="text-lg font-semibold text-warmBrown mb-2">
                        About This Event
                      </Text>
                      <Text className="text-gray-600 leading-6">
                        {selectedEvent.description}
                      </Text>
                    </View>

                    {/* Location */}
                    <View className="bg-white rounded-2xl p-4 mb-6">
                      <Text className="text-lg font-semibold text-warmBrown mb-2">
                        Location
                      </Text>
                      <View className="flex-row items-start">
                        <MapPin size={20} color="#C9A227" />
                        <Text className="text-gray-600 ml-2 flex-1">
                          {selectedEvent.address}
                        </Text>
                      </View>
                    </View>

                    {/* Contact */}
                    <View className="bg-white rounded-2xl p-4 mb-6">
                      <Text className="text-lg font-semibold text-warmBrown mb-3">
                        Contact Information
                      </Text>
                      {selectedEvent.contactPhone && (
                        <Pressable
                          onPress={() => handleCall(selectedEvent.contactPhone!)}
                          className="flex-row items-center mb-3"
                        >
                          <View className="bg-forest-50 rounded-full p-2">
                            <Phone size={18} color="#1B4D3E" />
                          </View>
                          <Text className="text-forest-700 ml-3 font-medium">
                            {selectedEvent.contactPhone}
                          </Text>
                        </Pressable>
                      )}
                      {selectedEvent.contactEmail && (
                        <Pressable
                          onPress={() => handleEmail(selectedEvent.contactEmail!)}
                          className="flex-row items-center"
                        >
                          <View className="bg-terracotta-50 rounded-full p-2">
                            <Mail size={18} color="#D4673A" />
                          </View>
                          <Text className="text-terracotta-500 ml-3 font-medium">
                            {selectedEvent.contactEmail}
                          </Text>
                        </Pressable>
                      )}
                    </View>

                    {/* Attendees */}
                    <View className="flex-row items-center mb-6">
                      <Users size={20} color="#8B7355" />
                      <Text className="text-gray-600 ml-2">
                        {selectedEvent.attendees} people attending
                      </Text>
                    </View>
                  </View>
                </ScrollView>

                {/* RSVP Button */}
                <View className="px-5 py-4 border-t border-gray-100 bg-white">
                  <Pressable onPress={handleRSVP}>
                    <LinearGradient
                      colors={['#C9A227', '#A6841F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 16,
                        paddingVertical: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Calendar size={20} color="#FFFFFF" />
                      <Text className="text-white font-bold text-lg ml-2">
                        RSVP to This Event
                      </Text>
                    </LinearGradient>
                  </Pressable>
                </View>
              </SafeAreaView>
            </View>
          )}
        </Modal>
      </SafeAreaView>
    </View>
  );
}
